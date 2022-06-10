const fs = require('fs');
const { network } = require('hardhat');


function readData() {
	let data = JSON.parse(fs.readFileSync('./cache/deployed.json'));

	return data;
}

async function main() {
	const deployedData = readData();
	const provider = new ethers.providers.Web3Provider(network.provider);
	
	const DNS_ServiceFactory = await ethers.getContractFactory('DNS_Service');
	const contract = new ethers.Contract(
		deployedData.address,
		DNS_ServiceFactory.interface,
		provider
	);

	const domain  = 'domain'; // alias for 'en.wikipedia-on-ipfs.org'
	const tld     = '.io';
	const ip      = '127.0.0.1';
	const cid     = '/ipfs/bafybeiaysi4s6lnjev27ln5icwm6tueaw2vdykrtjkwiphwekaywqhcjze';
	const price   = await contract.getPrice(domain);
	const [owner] = await ethers.getSigners();

	const contractWithSigner = new ethers.Contract(
		deployedData.address,
		DNS_ServiceFactory.interface,
		owner
	);

	await contractWithSigner.register(
		domain,
		tld,
		ip,
		{ from: owner.address, value: price }
	);

	console.log(`Registered ${domain + tld} with ip: ${await contract.getIP(domain, tld)}`);

	await contractWithSigner.editCID(
		domain,
		tld,
		cid
	);

	console.log(`Edited ${domain + tld} with cid: ${await contract.getCID(domain, tld)}`);
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});