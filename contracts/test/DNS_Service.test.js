const DNS_Service   = artifacts.require('DNS_Service');
const truffleAssert = require('truffle-assertions');
const BigNumber     = require('bignumber.js');

const constants         = require('./utils/constants');
const increaseTime      = require('./utils/increaseTime');
const getBlockTimestamp = require('./utils/getBlockTimestamp');


contract('DNS_Service', ([owner, wallet, anotherAccount]) => {
	let contractInstance;

	before(() => {
		web3.eth.defaultAccount = owner;
	});

	beforeEach(async () => {
		contractInstance = await DNS_Service.new();
	});


	describe('Testing constants:', () => {
		it('DOMAIN_NAME_MIN_LENGTH constant Should have exact value', async () => {
			// Arrange

			// Act
			const result = await contractInstance.DOMAIN_NAME_MIN_LENGTH();

			// Assert
			assert.equal(result, 5);
		});

		it('DOMAIN_NAME_EXPENSIVE_LENGTH constant Should have exact value', async () => {
			// Arrange

			// Act
			const result = await contractInstance.DOMAIN_NAME_EXPENSIVE_LENGTH();

			// Assert
			assert.equal(result, 8);
		});

		it('TOP_LEVEL_DOMAIN_MIN_LENGTH constant Should have exact value', async () => {
			// Arrange

			// Act
			const result = await contractInstance.TOP_LEVEL_DOMAIN_MIN_LENGTH();

			// Assert
			assert.equal(result, 1);
		});

		it('BYTES_DEFAULT_VALUE constant Should have exact value', async () => {
			// Arrange

			// Act
			const result = await contractInstance.BYTES_DEFAULT_VALUE();

			// Assert
			assert.equal(result, '0x00');
		});
	});

	describe('Testing getPrice:', () => {
		it('getPrice Should return regular price, when passed domain with 8 symbols or more', async () => {
			// Arrange
			const domainName = 'big_regular_domain';
			const cost = await contractInstance.DOMAIN_NAME_COST();

			// Act
			const result = await contractInstance.getPrice(domainName);

			// Assert
			assert.ok(BigNumber(cost).isEqualTo(result));
		});

		it('getPrice Should return higher price, when passed domain with 5, 6 or 7 symbols', async () => {
			// Arrange
			const domainName = 'short';
			const cost = await contractInstance.DOMAIN_NAME_COST();
			const extraCost = await contractInstance.DOMAIN_NAME_COST_SHORT_ADDITION();

			// Act
			const result = await contractInstance.getPrice(domainName);

			// Assert
			assert.ok(BigNumber(cost).plus(extraCost).isEqualTo(result));
		});
	});

	describe('Testing register:', () => {
		it('register Should throw if the domain name is shorter than or equal to DOMAIN_NAME_MIN_LENGTH', async () => {
			// Arrange
			const shortDomainName = 'eth';
			const topLevelDomain = '.com';
			const ip = '127.0.0.1';
			const currentPrice = await contractInstance.getPrice(shortDomainName);

			// Act
			const result = contractInstance.register(
				shortDomainName,
				topLevelDomain,
				ip,
				{ from: anotherAccount, value: currentPrice }
			);

			// Assert
			await truffleAssert.reverts(result);
		});

		it('register Should throw when the sent funds are insufficient', async () => {
			// Arrange
			const domainName = 'big_regular_domain';
			const topLevelDomain = '.com';
			const ip = '127.0.0.1';
			const currentPrice = await contractInstance.getPrice(domainName);

			// Act
			const result = contractInstance.register(domainName, topLevelDomain, ip, {
				from: anotherAccount,
				value: BigNumber(currentPrice).minus(1) }
			);

			// Assert
			await truffleAssert.reverts(result);
		});

		it('register Should throw when domain with such name is registered and still valid', async () => {
			// Arrange
			const domainName = 'domain';
			const topLevelDomain = '.com';
			const ip = '127.0.0.1';
			const currentPrice = await contractInstance.getPrice(domainName);

			// Act
			await contractInstance.register(domainName, topLevelDomain, ip, {
				from: owner,
				value: currentPrice
			});
			const result = contractInstance.register(domainName, topLevelDomain, ip, {
				from: anotherAccount,
				value: currentPrice
			});

			// Assert
			await truffleAssert.reverts(result);
		});

		it('register Should raise LogDomainNameRegistered event when domain with such name has not been registered before', async () => {
			// Arrange
			const domainName = 'domain';
			const topLevelDomain = '.com';
			const ip = '127.0.0.1';
			const currentPrice = await contractInstance.getPrice(domainName);

			// Act
			const result = await contractInstance.register(domainName, topLevelDomain, ip, {
				from: anotherAccount,
				value: currentPrice
			});

			const timestamp = await getBlockTimestamp(result);

			// Assert
			truffleAssert.eventEmitted(result, 'LogDomainNameRegistered', (event) => {
				return event.timestamp  == timestamp &&
					   event.domainName == domainName &&
					   event.topLevel   == topLevelDomain;
    		});
		});

		it('register Should raise LogReceipt event when successfully registering a domain', async () => {
			// Arrange
			const domainName = 'domain';
			const topLevelDomain = '.com';
			const ip = '127.0.0.1';
			const currentPrice = await contractInstance.getPrice(domainName);

			// Act
			const result = await contractInstance.register(domainName, topLevelDomain, ip, {
				from: anotherAccount,
				value: currentPrice
			});

			const timestamp = await getBlockTimestamp(result);
			const expires = timestamp + constants.year;

			// Assert
			truffleAssert.eventEmitted(result, 'LogReceipt', (event) => {
				return event.timestamp   == timestamp &&
					   event.domainName  == domainName &&
					   BigNumber(event.amountInWei).isEqualTo(currentPrice) &&
					   event.expires     == expires;
    		});
		});

		it('register Should throw when trying to register short-named domain on a regular price', async () => {
			// Arrange
			const regularDomain = 'big_regular_domain';
			const domainName = 'short';
			const topLevelDomain = '.com';
			const ip = '127.0.0.1';
			const currentPrice = await contractInstance.getPrice(regularDomain);

			// Act
			const result = contractInstance.register(domainName, topLevelDomain, ip, {
				from: anotherAccount,
				value: currentPrice
			});

			// Assert
			await truffleAssert.reverts(result);
		});

		it('register Should register existing, but expired domain, to another owner', async () => {
			// Arrange
			const domainName = 'domain';
			const topLevelDomain = '.com';
			const ip = '127.0.0.1';
			const currentPrice = await contractInstance.getPrice(domainName);

			// Act
			await contractInstance.register(domainName, topLevelDomain, ip, {
				from: owner,
				value: currentPrice
			});

			await increaseTime(constants.year + 1);

			await contractInstance.register(domainName, topLevelDomain, ip, {
				from: anotherAccount,
				value: currentPrice
			});

			const domainHash = await contractInstance.getDomainHash(
				domainName,
				topLevelDomain
			);
			const result = await contractInstance.domainNames(domainHash);

			// Assert
			assert.equal(result.owner, anotherAccount);
		});
	});

	describe('Testing renewDomainName:', () => {
		it('renewDomainName Should throw when the sent funds are insufficient', async () => {
			// Arrange
			const domainName = 'domain';
			const topLevelDomain = '.com';
			const ip = '127.0.0.1';
			const currentPrice = await contractInstance.getPrice(domainName);

			await contractInstance.register(domainName, topLevelDomain, ip, {
				from: anotherAccount,
				value: currentPrice
			});

			// Act
			const result = contractInstance.renewDomainName(domainName, topLevelDomain, {
				from: anotherAccount,
				value: BigNumber(currentPrice).minus(1) }
			);

			// Assert
			await truffleAssert.reverts(result);
		});

		it('renewDomainName Should throw when the invoker is not the domain owner', async () => {
			// Arrange
			const domainName = 'domain';
			const topLevelDomain = '.com';
			const ip = '127.0.0.1';
			const currentPrice = await contractInstance.getPrice(domainName);

			await contractInstance.register(domainName, topLevelDomain, ip, {
				from: owner,
				value: currentPrice
			});

			// Act
			const result = contractInstance.renewDomainName(domainName, topLevelDomain, {
				from: anotherAccount,
				value: BigNumber(currentPrice).minus(1) }
			);

			// Assert
			await truffleAssert.reverts(result);
		});
	});

	describe('Testing edit:', () => {
		it('editIP Should throw when the invoker is not the domain owner', async () => {
			// Arrange
			const domainName = 'domain';
			const topLevelDomain = '.com';
			const ip = '127.0.0.1';
			const currentPrice = await contractInstance.getPrice(domainName);

			await contractInstance.register(domainName, topLevelDomain, ip, {
				from: owner,
				value: currentPrice
			});

			// Act
			const anotherIp = '123.123.123.123';
			const result = contractInstance.editIP(
				domainName,
				topLevelDomain,
				anotherIp,
				{ from: anotherAccount }
			);

			// Assert
			await truffleAssert.reverts(result);
		});

		it('editIP Should edit the domain ip', async () => {
			// Arrange
			const domainName = 'domain';
			const topLevelDomain = '.com';
			const ip = '127.0.0.1';
			const currentPrice = await contractInstance.getPrice(domainName);

			await contractInstance.register(domainName, topLevelDomain, ip, {
				from: owner,
				value: currentPrice,
			});

			// Act
			const anotherIp = '123.123.123.123';
			await contractInstance.editIP(domainName, topLevelDomain, anotherIp, {
				from: owner,
			});

			const domainHash = await contractInstance.getDomainHash(
				domainName,
				topLevelDomain,
			);
			const domainDetails = await contractInstance.domainNames(domainHash);

			// Assert
			assert.equal(domainDetails.ip, anotherIp);
		});

		it('editIP Should raise LogDomainNameIpEdited event when called with valid arguments', async () => {
			// Arrange
			const domainName = 'domain';
			const topLevelDomain = '.com';
			const ip = '127.0.0.1';
			const currentPrice = await contractInstance.getPrice(domainName);

			await contractInstance.register(domainName, topLevelDomain, ip, {
				from: owner,
				value: currentPrice
			});

			// Act
			const anotherIp = '123.123.123.123';
			result = await contractInstance.editIP(domainName, topLevelDomain, anotherIp, {
				from: owner
			});

			const timestamp = await getBlockTimestamp(result);

			// Assert
			truffleAssert.eventEmitted(result, 'LogDomainNameIpEdited', (event) => {
				return event.timestamp  == timestamp &&
					   event.domainName == domainName &&
					   event.topLevel   == topLevelDomain &&
					   event.newIp      == anotherIp;
    		});
		});

		it('editCID Should throw when the invoker is not the domain owner', async () => {
			// Arrange
			const domainName = 'domain';
			const topLevelDomain = '.com';
			const ip = '127.0.0.1';
			const cid = 'Qm00000000000000000000000000000000000000000000';
			const currentPrice = await contractInstance.getPrice(domainName);

			await contractInstance.register(domainName, topLevelDomain, ip, {
				from: owner,
				value: currentPrice
			});

			// Act
			const anotherCid = 'Qm11111111111111111111111111111111111111111111';
			const result = contractInstance.editCID(
				domainName,
				topLevelDomain,
				anotherCid,
				{ from: anotherAccount }
			);

			// Assert
			await truffleAssert.reverts(result);
		});

		it('editCID Should edit the domain cid', async () => {
			// Arrange
			const domainName = 'domain';
			const topLevelDomain = '.com';
			const ip = '127.0.0.1';
			const cid = 'Qm00000000000000000000000000000000000000000000';
			const currentPrice = await contractInstance.getPrice(domainName);

			await contractInstance.register(domainName, topLevelDomain, ip, {
				from: owner,
				value: currentPrice,
			});

			// Act
			const anotherCid = 'Qm11111111111111111111111111111111111111111111';
			await contractInstance.editCID(domainName, topLevelDomain, anotherCid, {
				from: owner,
			});

			const domainHash = await contractInstance.getDomainHash(
				domainName,
				topLevelDomain,
			);
			const domainDetails = await contractInstance.domainNames(domainHash);

			// Assert
			assert.equal(domainDetails.cid, anotherCid);
		});

		it('editCID Should raise LogDomainNameCidEdited event when called with valid arguments', async () => {
			// Arrange
			const domainName = 'domain';
			const topLevelDomain = '.com';
			const ip = '127.0.0.1';
			const cid = 'Qm00000000000000000000000000000000000000000000';
			const currentPrice = await contractInstance.getPrice(domainName);

			await contractInstance.register(domainName, topLevelDomain, ip, {
				from: owner,
				value: currentPrice
			});

			// Act
			const anotherCid = 'Qm11111111111111111111111111111111111111111111';
			result = await contractInstance.editCID(domainName, topLevelDomain, anotherCid, {
				from: owner
			});

			const timestamp = await getBlockTimestamp(result);

			// Assert
			truffleAssert.eventEmitted(result, 'LogDomainNameCidEdited', (event) => {
				return event.timestamp  == timestamp &&
					   event.domainName == domainName &&
					   event.topLevel   == topLevelDomain &&
					   event.newCid     == anotherCid;
    		});
		});
	});

	describe('Testing transferDomain:', () => {
		it('transferDomain Should throw when the invoker is not the domain owner', async () => {
			// Arrange
			const domainName = 'domain';
			const topLevelDomain = '.com';
			const ip = '127.0.0.1';
			const currentPrice = await contractInstance.getPrice(domainName);

			await contractInstance.register(domainName, topLevelDomain, ip, {
				from: owner,
				value: currentPrice
			});

			// Act
			const result = contractInstance.transferDomain(domainName, topLevelDomain, anotherAccount,
				{ from: anotherAccount },
			);

			// Assert
			await truffleAssert.reverts(result);
		});

		it('transferDomain Should throw when passed invalid new owner argument', async () => {
			// Arrange
			const domainName = 'domain';
			const topLevelDomain = '.com';
			const ip = '127.0.0.1';
			const currentPrice = await contractInstance.getPrice(domainName);

			await contractInstance.register(domainName, topLevelDomain, ip, {
				from: owner,
				value: currentPrice
			});

			// Act
			const result = contractInstance.transferDomain(domainName, topLevelDomain,
				constants.nullAddress,
				{ from: owner },
			);

			// Assert
			await truffleAssert.reverts(result);
		});

		it('transferDomain Should transfer the ownership when called with valid arguments', async () => {
			// Arrange
			const domainName = 'domain';
			const topLevelDomain = '.com';
			const ip = '127.0.0.1';
			const currentPrice = await contractInstance.getPrice(domainName);

			await contractInstance.register(domainName, topLevelDomain, ip, {
				from: owner,
				value: currentPrice
			});

			// Act
			await contractInstance.transferDomain(domainName, topLevelDomain, anotherAccount,
				{ from: owner },
			);

			const domainHash = await contractInstance.getDomainHash(
				domainName,
				topLevelDomain,
			);
			const domainDetails = await contractInstance.domainNames(domainHash);

			// Assert
			assert.equal(domainDetails.owner, anotherAccount);
		});

		it('transferDomain Should raise LogDomainNameTransferred event when called with valid arguments', async () => {
			// Arrange
			const domainName = 'domain';
			const topLevelDomain = '.com';
			const ip = '127.0.0.1';
			const currentPrice = await contractInstance.getPrice(domainName);

			await contractInstance.register(domainName, topLevelDomain, ip, {
				from: owner,
				value: currentPrice
			});

			// Act
			const result = await contractInstance.transferDomain(domainName, topLevelDomain, anotherAccount,
				{ from: owner },
			);

			const timestamp = await getBlockTimestamp(result);

			// Assert
			truffleAssert.eventEmitted(result, 'LogDomainNameTransferred', (event) => {
				return event.timestamp  == timestamp &&
					   event.domainName == domainName &&
					   event.topLevel   == topLevelDomain &&
					   event.owner      == owner &&
					   event.newOwner   == anotherAccount;
    		});
		});
	});

});
