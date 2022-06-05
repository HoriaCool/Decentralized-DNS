// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "./common/Ownable.sol";
import "./common/Destructible.sol";
import "./libs/SafeMath.sol";


contract DNS_Service is Destructible
{
	/** USINGS */
	using SafeMath for uint256;

	/** STRUCTS */
	struct DomainDetails {
		string  name;
		string  topLevel;
		address owner;
		string  ip;
		string  cid;
		uint    expires;
	}

	struct Receipt {
		uint amountPaidWei;
		uint timestamp;
		uint expires;
	}

	/** CONSTANTS */
	uint constant public   DOMAIN_NAME_COST                = 0.01 ether;
	uint constant public   DOMAIN_NAME_COST_SHORT_ADDITION = 0.01 ether;
	uint constant public   DOMAIN_EXPIRATION_DATE          = 365 days;
	uint8 constant public  DOMAIN_NAME_MIN_LENGTH          = 5;
	uint8 constant public  DOMAIN_NAME_EXPENSIVE_LENGTH    = 8;
	uint8 constant public  TOP_LEVEL_DOMAIN_MIN_LENGTH     = 1;
	bytes1 constant public BYTES_DEFAULT_VALUE             = bytes1(0x00);

	/** STATE VARIABLES */
	// @dev - storing the DomainHash (bytes32) to its details
	mapping (bytes32 => DomainDetails) public domainNames;

	// @dev - all the receipt hashes/keys/ids for certain address
	mapping (address => bytes32[]) public paymentReceipts;

	// @dev - the details for a receipt by its hash/key/id
	mapping (bytes32 => Receipt) public receiptDetails;

	/**
	 * MODIFIERS
	 */
	modifier isAvailable(string memory domain, string memory topLevel)
	{
		// @dev - get the domain hash by the domain name and the TLD
		bytes32 domainHash = getDomainHash(domain, topLevel);

		// @dev - check whether the domain name is available by checking
		// if is expired or if it was not registered at all the `expires`
		// property will be default: 0x00
		require(
			domainNames[domainHash].expires < block.timestamp,
			"Domain name is not available."
		);

		// continue with execution
		_;
	}

	modifier collectDomainNamePayment(string memory domain)
	{
		// @dev - get the price for the provided domain
		uint domainPrice = getPrice(domain);

		// @dev - require the payment sent to be enough for
		// the current domain cost
		require(
			msg.value >= domainPrice, 
			"Insufficient amount."
		);

		// continue execution
		_;
	}

	modifier isDomainOwner(string memory domain, string memory topLevel)
	{
		// @dev - get the hash of the domain with the provided TLD.
		bytes32 domainHash = getDomainHash(domain, topLevel);

		// @dev - check whether the msg.sender is the owner of the domain name
		require(
			domainNames[domainHash].owner == msg.sender,
			"You are not the owner of this domain."
		);

		// continue with execution
		_;
	}

	modifier isDomainNameLengthAllowed(string memory domain)
	{
		// @dev - check if the provided domain is with allowed length
		require(
			bytes(domain).length >= DOMAIN_NAME_MIN_LENGTH,
			"Domain name is too short."
		);

		// continue with execution
		_;
	}

	modifier isTopLevelLengthAllowed(string memory topLevel)
	{
		// @dev - require the TLD lenght to be equal or greater
		// than `TOP_LEVEL_DOMAIN_MIN_LENGTH` constant
		require(
			bytes(topLevel).length >= TOP_LEVEL_DOMAIN_MIN_LENGTH,
			"The provided TLD is too short."
		);

		// continue with execution
		_;
	}

	/**
	 *  EVENTS
	 */
	event LogDomainNameRegistered(
		uint indexed timestamp,
		string domainName,
		string topLevel
	);

	event LogDomainNameRenewed(
		uint indexed timestamp,
		string domainName,
		string topLevel,
		address indexed owner
	);

	event LogDomainNameIpEdited(
		uint indexed timestamp,
		string domainName,
		string topLevel,
		string newIp
	);

	event LogDomainNameCidEdited(
		uint indexed timestamp,
		string domainName,
		string topLevel,
		string newCid
	);

	event LogDomainNameTransferred(
		uint indexed timestamp,
		string domainName,
		string topLevel,
		address indexed owner,
		address newOwner
	);

	event LogReceipt(
		uint indexed timestamp,
		string domainName,
		uint amountInWei,
		uint expires
	);

	/**
	 * @dev - Constructor of the contract
	 */
	constructor()
	{
	}

	/**
	 * @dev - function to register domain name
	 * @param domain - domain name to be registered
	 * @param topLevel - domain top level (TLD)
	 * @param ip - the ip of the host
	 */
	function register(
		string memory domain,
		string memory topLevel,
		string memory ip
	)
		public
		payable
		isDomainNameLengthAllowed(domain)
		isTopLevelLengthAllowed(topLevel)
		isAvailable(domain, topLevel)
		collectDomainNamePayment(domain)
	{
		// calculate the domain hash
		bytes32 domainHash = getDomainHash(domain, topLevel);

		// get the price for the provided domain
		uint domainPrice = getPrice(domain);

		// add block to solve the error: Stack too deep
		{
			// create a new domain entry with the provided fn parameters
			DomainDetails memory newDomain = DomainDetails(
				{
					name: domain,
					topLevel: topLevel,
					owner: msg.sender,
					ip: ip,
					cid: "",
					expires: block.timestamp + DOMAIN_EXPIRATION_DATE
				}
			);

			// save the domain to the storage
			domainNames[domainHash] = newDomain;
		}

		// add block to solve the error: Stack too deep
		{
			// create an receipt entry for this domain purchase
			Receipt memory newReceipt = Receipt(
				{
					amountPaidWei: domainPrice,
					timestamp: block.timestamp,
					expires: block.timestamp + DOMAIN_EXPIRATION_DATE
				}
			);

			// calculate the receipt hash/key
			bytes32 receiptKey = getReceiptKey(domain, topLevel);

			// save the receipt key for this `msg.sender` in storage
			paymentReceipts[msg.sender].push(receiptKey);

			// save the receipt entry/details in storage
			receiptDetails[receiptKey] = newReceipt;
		}

		// log domain name registered
		emit LogDomainNameRegistered(
			block.timestamp,
			domain,
			topLevel
		);

		// log receipt issuance
		emit LogReceipt(
			block.timestamp,
			domain,
			domainPrice,
			block.timestamp + DOMAIN_EXPIRATION_DATE
		);
	}

	/**
	 * @dev - function to extend domain expiration date
	 * @param domain - domain name to be registered
	 * @param topLevel - top level
	 */
	function renewDomainName(
		string memory domain,
		string memory topLevel
	)
		public
		payable
		isDomainOwner(domain, topLevel)
		collectDomainNamePayment(domain)
	{
		// calculate the domain hash
		bytes32 domainHash = getDomainHash(domain, topLevel);

		// get the price for the provided domain
		uint domainPrice = getPrice(domain);

		// add 365 days (1 year) to the domain expiration date
		domainNames[domainHash].expires += DOMAIN_EXPIRATION_DATE;

		// create a receipt entity
		Receipt memory newReceipt = Receipt(
			{
				amountPaidWei: domainPrice,
				timestamp: block.timestamp,
				expires: domainNames[domainHash].expires
			}
		);

		// calculate the receipt key for this domain
		bytes32 receiptKey = getReceiptKey(domain, topLevel);
		
		// save the receipt id for this msg.sender
		paymentReceipts[msg.sender].push(receiptKey);

		// store the receipt details in storage
		receiptDetails[receiptKey] = newReceipt;

		// log domain name Renewed
		emit LogDomainNameRenewed(
			block.timestamp,
			domain,
			topLevel,
			msg.sender
		);

		// log receipt issuance
		emit LogReceipt(
			block.timestamp,
			domain,
			domainPrice,
			domainNames[domainHash].expires
		);
	}

	/**
	 * @dev - function to edit domain name IP
	 * @param domain - the domain name to be editted
	 * @param topLevel - tld of the domain
	 * @param newIp - the new ip for the domain
	 */
	function editIP(
		string memory domain,
		string memory topLevel,
		string memory newIp
	)
		public
		isDomainOwner(domain, topLevel)
	{
		// calculate the domain hash - unique id
		bytes32 domainHash = getDomainHash(domain, topLevel);

		// update the new ip
		domainNames[domainHash].ip = newIp;

		// log change
		emit LogDomainNameIpEdited(block.timestamp, domain, topLevel, newIp);
	}

	/**
	 * @dev - function to edit domain name CID
	 * @param domain - the domain name to be editted
	 * @param topLevel - tld of the domain
	 * @param newCid - the new cid for the domain
	 */
	function editCID(
		string memory domain,
		string memory topLevel,
		string memory newCid
	)
		public
		isDomainOwner(domain, topLevel)
	{
		// calculate the domain hash - unique id
		bytes32 domainHash = getDomainHash(domain, topLevel);

		// update the new cid
		domainNames[domainHash].cid = newCid;

		// log change
		emit LogDomainNameCidEdited(block.timestamp, domain, topLevel, newCid);
	}

	/**
	 * @dev - Transfer domain ownership
	 * @param domain - name of the domain
	 * @param topLevel - tld of the domain
	 * @param newOwner - address of the new owner
	 */
	function transferDomain(
		string memory domain,
		string memory topLevel,
		address newOwner
	)
		public
		isDomainOwner(domain, topLevel)
	{
		// prevent assigning domain ownership to the 0x0 address
		require(
			newOwner != address(0),
			"Provided new owner address is null (0x0 address)."
		);

		// calculate the hash of the current domain
		bytes32 domainHash = getDomainHash(domain, topLevel);

		// assign the new owner of the domain
		domainNames[domainHash].owner = newOwner;

		// log the transfer of ownership
		emit LogDomainNameTransferred(
			block.timestamp,
			domain, topLevel,
			msg.sender,
			newOwner
		);
	}

	/**
	 * @dev - Get ip of domain
	 * @param domain -
	 * @param topLevel -
	 */
	function getIP(
		string memory domain,
		string memory topLevel
	)
		public
		view
		returns (string memory)
	{
		// calculate the hash of the domain
		bytes32 domainHash = getDomainHash(domain, topLevel);

		// return the ip property of the domain from storage
		return domainNames[domainHash].ip;
	}

	/**
	 * @dev - Get cid of domain
	 * @param domain -
	 * @param topLevel -
	 */
	function getCID(
		string memory domain,
		string memory topLevel
	)
		public
		view
		returns (string memory)
	{
		// calculate the hash of the domain
		bytes32 domainHash = getDomainHash(domain, topLevel);

		// return the cid property of the domain from storage
		return domainNames[domainHash].cid;
	}

	/**
	 * @dev - Get price of domain
	 * @param domain -
	 */
	function getPrice(
		string memory domain
	)
		public
		pure
		returns (uint)
	{
		// check if the domain name fits in the expensive or cheap categroy
		if (bytes(domain).length < DOMAIN_NAME_EXPENSIVE_LENGTH) {
			// if the domain is too short - its more expensive
			return DOMAIN_NAME_COST + DOMAIN_NAME_COST_SHORT_ADDITION;
		}

		// otherwise return the regular price
		return DOMAIN_NAME_COST;
	}

	/**
	 * @dev - Get receipt list for the msg.sender
	 */
	function getReceiptList() public view returns (bytes32[] memory) {
		return paymentReceipts[msg.sender];
	}

	/**
	 * @dev - Get single receipt
	 * @param receiptKey -
	 */
	function getReceipt(bytes32 receiptKey) public view returns (uint, uint, uint) {
		return (receiptDetails[receiptKey].amountPaidWei,
				receiptDetails[receiptKey].timestamp,
				receiptDetails[receiptKey].expires);
	}

	/**
	 * @dev - Get (domain name and top level) hash used for unique identifier
	 * @param domain -
	 * @param topLevel -
	 * @return domainHash -
	 */
	function getDomainHash(string memory domain, string memory topLevel) public pure returns(bytes32) {
		// @dev - tightly pack parameters in struct for keccak256
		return keccak256(abi.encodePacked(domain, topLevel));
	}

	/**
	 * @dev - Get recepit key hash - unique identifier
	 * @param domain -
	 * @param topLevel -
	 * @return receiptKey -
	 */
	function getReceiptKey(string memory domain, string memory topLevel) public view returns(bytes32) {
		// @dev - tightly pack parameters in struct for keccak256
		return keccak256(abi.encodePacked(domain, topLevel, msg.sender, block.timestamp));
	}

	/**
	 * @dev - Withdraw function
	 */
	function withdraw() public onlyOwner {
		payable(msg.sender).transfer(address(this).balance);
	}
}
