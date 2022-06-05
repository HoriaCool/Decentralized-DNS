module.exports = async (transaction) => {
	return (await web3.eth.getBlock(transaction.receipt.blockNumber))
		.timestamp
}