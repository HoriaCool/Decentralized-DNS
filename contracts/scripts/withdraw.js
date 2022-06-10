const fs = require('fs');


function readData() {
	let data = JSON.parse(fs.readFileSync('./cache/deployed.json'));

	return data;
}

async function main() {
	const deployedData = readData();
	const [owner] = await ethers.getSigners();

	const DNS_ServiceFactory = await ethers.getContractFactory('DNS_Service');
	const contract = new ethers.Contract(
		deployedData.address,
		DNS_ServiceFactory.interface,
		owner
	);

	await contract.withdraw();
	await contract.destroy();
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});