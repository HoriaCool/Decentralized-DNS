const fs = require('fs');


function writeData(DNS_Service_data) {
	const data = JSON.stringify(DNS_Service_data, null, 2);

	fs.writeFileSync('./artifacts/deployed.json', data, (err) => {
    	if (err)
			throw err;
	});
}

async function main() {
	const DNS_ServiceFactory = await ethers.getContractFactory("DNS_Service");
	const DNS_Service        = await DNS_ServiceFactory.deploy();

	await DNS_Service.deployed();

	console.log("DNS_Service deployed to:", DNS_Service.address);

	writeData({
		"address": DNS_Service.address
	})
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});