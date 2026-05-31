const hre = require("hardhat");

async function main() {
  console.log("Deploying BlueCarbonRegistry Smart Contract to Polygon Amoy Testnet...");

  const BlueCarbonRegistry = await hre.ethers.getContractFactory("BlueCarbonRegistry");
  const registry = await BlueCarbonRegistry.deploy();

  await registry.waitForDeployment();

  const contractAddress = await registry.getAddress();
  console.log(`=============================================`);
  console.log(`🎉 BlueCarbonRegistry deployed successfully!`);
  console.log(`Contract Address: ${contractAddress}`);
  console.log(`=============================================`);
  console.log(`Add this address to your backend/.env under:`);
  console.log(`CONTRACT_ADDRESS=${contractAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
