require("@nomiclabs/hardhat-truffle5");
require("@nomiclabs/hardhat-ethers");
require("dotenv").config();


/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
	solidity: "0.8.0",
	networks: {
		hardhat: { // https://hardhat.org/metamask-issue#metamask-chainid-issue
			chainId: 1337
		},
		development: {
			chainId: 1337,
			network_id: "*",
			url: "http://127.0.0.1:8545/"
		},
		ropsten: {
			chainId: 3,
			network_id: "3",
			url: process.env.ROPSTEN_URL,
			accounts: [process.env.ROPSTEN_KEY]
		}
	}
};
