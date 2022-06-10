const fs = require('fs');


async function main() {
	fs.copyFileSync("./cache/deployed.json",
		"../frontend/public/artifacts/deployed.json");
	fs.copyFileSync("./artifacts/contracts/DNS_Service.sol/DNS_Service.json",
		"../frontend/public/artifacts/DNS_Service.json");

	fs.copyFileSync("./cache/deployed.json",
		"../doh-server/artifacts/deployed.json");
	fs.copyFileSync("./artifacts/contracts/DNS_Service.sol/DNS_Service.json",
		"../doh-server/artifacts/DNS_Service.json");
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});