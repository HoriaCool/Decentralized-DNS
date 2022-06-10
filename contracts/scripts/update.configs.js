const fs = require('fs');


async function main() {
	fs.mkdirSync('../frontend/public/artifacts', { "recursive": true });
	fs.copyFileSync("./cache/deployed.json",
		"../frontend/public/artifacts/deployed.json");
	fs.copyFileSync("./artifacts/contracts/DNS_Service.sol/DNS_Service.json",
		"../frontend/public/artifacts/DNS_Service.json");

	fs.mkdirSync('../doh-proxy/artifacts', { "recursive": true });
	fs.copyFileSync("./cache/deployed.json",
		"../doh-proxy/artifacts/deployed.json");
	fs.copyFileSync("./artifacts/contracts/DNS_Service.sol/DNS_Service.json",
		"../doh-proxy/artifacts/DNS_Service.json");
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});