require("@nomiclabs/hardhat-truffle5");
require("@nomiclabs/hardhat-ethers");


/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
	solidity: "0.8.0",
	networks: {
		hardhat: { // https://hardhat.org/metamask-issue#metamask-chainid-issue
			chainId: 1337
		},
		localnode: {
			url: "http://127.0.0.1:8545/",
			network_id: "*",
			chainId: 1337
		},
		ganache: {
			url: "http://172.26.32.1:7545/",
			network_id: "5777",
		}
	}
};
