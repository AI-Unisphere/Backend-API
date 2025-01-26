import { ethers } from 'ethers';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config();

async function main() {
    // Connect to the network
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_URL);
    const wallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY!, provider);
    console.log('Deploying contracts with the account:', wallet.address);

    // Get contract bytecode and ABI
    const contractArtifact = JSON.parse(readFileSync('./artifacts/contracts/ProcurementLog.sol/ProcurementLog.json', 'utf8'));
    
    // Create contract factory
    const factory = new ethers.ContractFactory(contractArtifact.abi, contractArtifact.bytecode, wallet);
    console.log('Deploying ProcurementLog...');

    // Deploy the contract
    const procurementLog = await factory.deploy();
    await procurementLog.waitForDeployment();

    const address = await procurementLog.getAddress();
    console.log('ProcurementLog deployed to:', address);

    // Wait for a few block confirmations
    console.log('Waiting for block confirmations...');
    await provider.waitForTransaction(procurementLog.deploymentTransaction()!.hash, 5);

    // Get the Etherscan URL
    const etherscanUrl = `https://sepolia.etherscan.io/address/${address}`;
    console.log('Etherscan URL:', etherscanUrl);

    // Verify the deployment
    console.log('\nTo verify the contract on Etherscan, run:');
    console.log(`npx hardhat verify --network sepolia ${address}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });