import detectEthereumProvider from '@metamask/detect-provider'
import { ethers } from 'ethers';

// https://sweetalert2.github.io/
import Swal from 'sweetalert2';


let DNS_Service;
const buttonsHandlers = {};

function ContractInteraction() {
	// detect provider, on any platform or browser.
	detectEthereumProvider()
		.then(provider => initInteraction(provider))
		.catch(err => {
			console.error(err);

			// This error code indicates that the user rejected
			// the request or a request is already in progress.
			if (err.code !== 4001) {
				alertError('Wallet not found!', 'Please install Metamask or other wallet extension');
			}

			alertError('Wallet connetion refused by user!', err.message);
		});
}

async function initInteraction(detectedEthereumProvider) {
	// A Web3Provider wraps a standard Web3 provider, which is
	// what MetaMask injects as window.ethereum into each page
	// provider = await detectEthereumProvider();
	// provider = new ethers.providers.Web3Provider(window.ethereum);
	const provider = new ethers.providers.Web3Provider(detectedEthereumProvider);

	// MetaMask requires requesting permission to connect users accounts
	await provider.send('eth_requestAccounts', []);

	// The MetaMask plugin also allows signing transactions to
	// send ether and pay to change state within the blockchain.
	// For this, you need the account signer...
	const signer = provider.getSigner();

	try {
		await provider.send('wallet_switchEthereumChain', [{
			chainId: window.env.NETWORK_CHAIN_ID
		}]);
	} catch (switchError) {
		// This error code indicates that the chain has not been added to MetaMask.
		if (switchError.code === 4902) {
			try {
				await provider.send('wallet_addEthereumChain', [{
					chainId:   window.env.NETWORK_CHAIN_ID,
					chainName: window.env.NETWORK_NAME,
					rpcUrls:  [window.env.NETWORK_RPC_URL],
				}]);
			} catch (addError) {
				// handle "add" error
				console.error(addError);
			}
		}
		// handle other "switch" errors
		console.error(switchError);
	}

	const DNS_Service_address  = window.env.DNS_SERVICE_ADDRESS;
	const DNS_Service_abi      = (await (await fetch(window.env.DNS_SERVICE_ABI_PATH)).json()).abi;
	const DNS_Service_contract = new ethers.Contract(DNS_Service_address, DNS_Service_abi, provider);
	
	DNS_Service = DNS_Service_contract.connect(signer);

	buttonsHandlers.getPrice    = getPriceHandler;
	buttonsHandlers.getIP       = getIPHandler;
	buttonsHandlers.getCID      = getCIDHandler;
	buttonsHandlers.register    = registerHandler;
	buttonsHandlers.renewDomain = renewDomainHandler;
	buttonsHandlers.transfer    = transferHandler;
	buttonsHandlers.editDomain = {
		'A':       editDomainIPHandler,
		'DNSLink': editDomainCIDHandler
	};
}


async function getPriceHandler(domainName, domainTopLevel) {
	const price = ethers.utils.formatEther(await DNS_Service.getPrice(domainName));

	alertInfo(`Price for the domain ${domainName + domainTopLevel}<br>${price} ETH`);
}

async function getIPHandler(domainName, domainTopLevel) {
	const ip = await DNS_Service.getIP(domainName, domainTopLevel);

	alertInfo(`IP for the domain ${domainName + domainTopLevel}<br>${ip}`);
}

async function getCIDHandler(domainName, domainTopLevel) {
	const cid = await DNS_Service.getCID(domainName, domainTopLevel);

	alertInfo(`CID for the domain ${domainName + domainTopLevel}<br>${cid}`);
}

async function registerHandler(domainName, domainTopLevel, ip) {
	let price, tx;

	try {
		price = await DNS_Service.getPrice(domainName);
		tx = await DNS_Service.register(domainName, domainTopLevel, ip, { value: price });
	} catch (error) {
		return errorHandler(error);
	}

	// Wait until the tx has been confirmed (default is 1 confirmation)
	const receipt = await tx.wait();
	// Receipt should now contain the events
	const expires = getEventByName(receipt.events, 'LogReceipt').args.expires.toNumber();

	const formattedDate = new Date(expires * 1000).toLocaleString("en-GB", {
		day: "numeric",
		month: "short",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit"
	});

	alertInfo(`Domain ${domainName + domainTopLevel} successfully register<br><br>` +
		`Expires at ${formattedDate}`);
}

async function renewDomainHandler(domainName, domainTopLevel) {
	let price, tx;

	try {
		price = await DNS_Service.getPrice(domainName);
		tx = await DNS_Service.renewDomainName(domainName, domainTopLevel, { value: price });
	} catch (error) {
		return errorHandler(error);
	}

	// Wait until the tx has been confirmed (default is 1 confirmation)
	const receipt = await tx.wait();
	// Receipt should now contain the events
	const expires = getEventByName(receipt.events, 'LogReceipt').args.expires.toNumber();

	const formattedDate = new Date(expires * 1000).toLocaleString("en-GB", {
		day: "numeric",
		month: "short",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit"
	});

	alertInfo(`Domain ${domainName + domainTopLevel} successfully renewed<br><br>` +
		`Expires at ${formattedDate}`);
}

async function editDomainIPHandler(domainName, domainTopLevel, ip) {
	try {
		await DNS_Service.editIP(domainName, domainTopLevel, ip);
	} catch (error) {
		return errorHandler(error);
	}

	alertInfo(`Domain ${domainName + domainTopLevel} successfully modified<br><br>` +
		`New IP ${ip}`);
}

async function editDomainCIDHandler(domainName, domainTopLevel, cid) {
	try {
		await DNS_Service.editCID(domainName, domainTopLevel, cid);
	} catch (error) {
		return errorHandler(error);
	}

	alertInfo(`Domain ${domainName + domainTopLevel} successfully modified<br><br>` +
		`New CID ${cid}`);
}

async function transferHandler(domainName, domainTopLevel, newOwner) {
	try {
		await DNS_Service.transferDomain(domainName, domainTopLevel, newOwner);
	} catch (error) {
		return errorHandler(error);
	}

	alertInfo(`Domain ${domainName + domainTopLevel} successfully transfered to<br>` +
		`${newOwner}`);
}


function getEventByName(events, eventName) {
	// Filter to get the event needed
	return events.filter(event => {
		return event.event === eventName;
	})[0];
}

function alertInfo(html) {
	Swal.fire({
		icon: 'info',
		width: 570,
		color: 'white',
		background: 'rgba(0, 0, 7, 0.85)',
		backdrop:   'rgba(0, 0, 0, 0)',
		showClass: {
			popup: 'animate__animated animate__fadeInDown'
		},
		hideClass: {
			popup: 'animate__animated animate__fadeOutUp'
		},
		html: html
	});
}

function alertError(title, text) {
	Swal.fire({
		icon: 'error',
		color: 'white',
		background: 'rgba(0, 0, 7, 0.85)',
		backdrop:   'rgba(0, 0, 0, 0)',
		hideClass: {
			popup: 'animate__animated animate__fadeOutUp'
		},
		title: title,
		text:  text,
	});
}

function errorHandler(error) {
	console.error(error);

	if (!error.code) {
		alertError("Transaction failed !", error);
		return;
	}

	switch (error.code) {
	// This error code indicates that the user rejected the request.
	case 4001:
		alertError("Transaction failed !", error.message);
		break;

	// Brave Wallet: Internal JSON-RPC error.
	case -32000:
		alertError("Transaction failed !", error.message);
		break;

	// Metamask:     Internal JSON-RPC error.
	case -32603:
		const error_msg = (error.data)? error.data.message: 'Internal JSON-RPC error';

		alertError("Transaction failed !", error_msg);
		break;

	default:
		alertError("Transaction failed !", error);
		break;
	}
}


export { ContractInteraction, buttonsHandlers };