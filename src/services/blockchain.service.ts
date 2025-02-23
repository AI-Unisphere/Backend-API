import { ethers } from 'ethers';
import * as dotenv from 'dotenv';

dotenv.config();

// Simplified ABI without role checks
const PROCUREMENT_LOG_ABI = [
    // Events
    "event RfpCreated(tuple(string rfpId, string title, uint256 budget, uint256 submissionDeadline, string createdBy) data)",
    "event RfpPublished(string rfpId, uint256 publishDate, uint256 numberOfBidsAllowed)",
    "event BidSubmitted(tuple(string bidId, string rfpId, string vendorId, uint256 submissionDate, bytes32 proposalHash) data)",
    "event BidEvaluated(string bidId, string rfpId, uint256 evaluationScore, uint256 evaluationDate, bytes32 evaluationHash)",
    "event ContractAwarded(tuple(string contractId, string rfpId, string vendorId, string bidId, uint256 awardDate, uint256 totalValue, uint256 startDate, uint256 endDate) data)",
    "event MilestoneCreated(tuple(string milestoneId, string contractId, string title, uint256 dueDate, string status, string updatedBy, bytes32 detailsHash) data)",
    "event MilestoneUpdated(tuple(string milestoneId, string contractId, string title, uint256 dueDate, string status, string updatedBy, bytes32 detailsHash) data)",
    
    // Functions - removed role modifiers
    "function logEvent(string eventType, bytes eventData)",
    "function logRfpCreation(string rfpId, string title, uint256 budget, uint256 submissionDeadline, string createdBy)",
    "function logRfpPublication(string rfpId, uint256 numberOfBidsAllowed)",
    "function logBidSubmission(string bidId, string rfpId, string vendorId, bytes32 proposalHash)",
    "function logBidEvaluation(string bidId, string rfpId, uint256 evaluationScore, bytes32 evaluationHash)",
    "function logContractAward(string contractId, string rfpId, string vendorId, string bidId, uint256 totalValue, uint256 startDate, uint256 endDate)",
    "function logMilestoneCreation(string milestoneId, string contractId, string title, uint256 dueDate, string status, string updatedBy, bytes32 detailsHash)",
    "function logMilestoneUpdate(string milestoneId, string contractId, string title, uint256 dueDate, string status, string updatedBy, bytes32 detailsHash)"
];

class BlockchainService {
    private provider: ethers.JsonRpcProvider;
    private wallet: ethers.Wallet;
    private contract: ethers.Contract;
    private readonly MAX_RETRIES = 3;
    private readonly RETRY_DELAY = 2000; // 2 seconds

    constructor() {
        // Initialize provider but don't connect immediately
        this.provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_URL);
        this.wallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY!, this.provider);
        this.contract = new ethers.Contract(
            process.env.PROCUREMENT_LOG_ADDRESS!,
            PROCUREMENT_LOG_ABI,
            this.wallet
        );
    }

    private async ensureConnection(): Promise<void> {
        let retries = 0;
        while (retries < this.MAX_RETRIES) {
            try {
                await this.provider.getNetwork();
                return; // Connection successful
            } catch (error) {
                retries++;
                if (retries === this.MAX_RETRIES) {
                    throw new Error('Failed to connect to Ethereum network after multiple attempts');
                }
                console.log(`Connection attempt ${retries} failed, retrying in ${this.RETRY_DELAY}ms...`);
                await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
            }
        }
    }

    private getEtherscanUrl(txHash: string): string {
        // Use Sepolia explorer for testnet
        return `https://sepolia.etherscan.io/tx/${txHash}`;
    }

    private async handleTransaction(tx: Promise<ethers.ContractTransactionResponse>): Promise<string> {
        try {
            // Ensure we're connected before attempting transaction
            await this.ensureConnection();

            const transaction = await tx;
            await transaction.wait(1); // Wait for 1 confirmation
            return this.getEtherscanUrl(transaction.hash);
        } catch (error: any) {
            console.error('Blockchain transaction failed:', error);
            if (error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT') {
                throw new Error('Network connection failed. Please try again.');
            } else if (error.code === 'INSUFFICIENT_FUNDS') {
                throw new Error('Insufficient funds for blockchain transaction');
            } else {
                throw new Error('Failed to record on blockchain: ' + (error.message || 'Unknown error'));
            }
        }
    }

    // RFP Functions
    async logRfpCreation(
        rfpId: string,
        title: string,
        budget: number,
        submissionDeadline: Date,
        createdBy: string
    ): Promise<string> {
        return this.handleTransaction(
            this.contract.logRfpCreation(
                rfpId,
                title,
                ethers.parseEther(budget.toString()),
                Math.floor(submissionDeadline.getTime() / 1000),
                createdBy
            )
        );
    }

    async logRfpPublication(
        rfpId: string,
        numberOfBidsAllowed: number
    ): Promise<string> {
        return this.handleTransaction(
            this.contract.logRfpPublication(rfpId, numberOfBidsAllowed)
        );
    }

    // Bid Functions
    async logBidSubmission(
        bidId: string,
        rfpId: string,
        vendorId: string,
        proposalContent: string
    ): Promise<string> {
        try {
            console.log('Debug - Input parameters:', {
                bidId,
                rfpId,
                vendorId,
                contentLength: proposalContent?.length || 0
            });

            // Convert the base64 content to bytes and hash it
            const proposalHash = ethers.keccak256(
                ethers.toUtf8Bytes(proposalContent)
            );

            console.log('Debug - Generated hash:', proposalHash);

            // Use handleTransaction helper like other functions
            return this.handleTransaction(
                this.contract.logBidSubmission(
                    bidId,
                    rfpId,
                    vendorId,
                    proposalHash
                )
            );
        } catch (error: any) {
            console.error('Error in logBidSubmission:', {
                error,
                code: error?.code,
                message: error?.message,
                stack: error?.stack
            });
            if (error?.code === 'INSUFFICIENT_FUNDS') {
                throw new Error('Insufficient funds for blockchain transaction');
            }
            throw new Error('Failed to record bid submission on blockchain: ' + (error?.message || 'Unknown error'));
        }
    }

    async logBidEvaluation(
        bidId: string,
        rfpId: string,
        evaluationScore: number,
        evaluationDetails: string
    ): Promise<string> {
        const evaluationHash = ethers.keccak256(ethers.toUtf8Bytes(evaluationDetails));
        return this.handleTransaction(
            this.contract.logBidEvaluation(bidId, rfpId, evaluationScore, evaluationHash)
        );
    }

    // Contract Functions
    async logContractAward(
        contractId: string,
        rfpId: string,
        vendorId: string,
        bidId: string,
        totalValue: number,
        startDate: Date,
        endDate: Date
    ): Promise<string> {
        return this.handleTransaction(
            this.contract.logContractAward(
                contractId,
                rfpId,
                vendorId,
                bidId,
                ethers.parseEther(totalValue.toString()),
                Math.floor(startDate.getTime() / 1000),
                Math.floor(endDate.getTime() / 1000)
            )
        );
    }

    // Milestone Functions
    async logMilestoneCreation(
        milestoneId: string,
        contractId: string,
        title: string,
        dueDate: Date,
        status: string,
        updatedBy: string,
        details: string
    ): Promise<string> {
        const detailsHash = ethers.keccak256(ethers.toUtf8Bytes(details));
        return this.handleTransaction(
            this.contract.logMilestoneCreation(
                milestoneId,
                contractId,
                title,
                Math.floor(dueDate.getTime() / 1000),
                status,
                updatedBy,
                detailsHash
            )
        );
    }

    async logMilestoneUpdate(
        milestoneId: string,
        contractId: string,
        title: string,
        dueDate: Date,
        status: string,
        updatedBy: string,
        details: string
    ): Promise<string> {
        const detailsHash = ethers.keccak256(ethers.toUtf8Bytes(details));
        return this.handleTransaction(
            this.contract.logMilestoneUpdate(
                milestoneId,
                contractId,
                title,
                Math.floor(dueDate.getTime() / 1000),
                status,
                updatedBy,
                detailsHash
            )
        );
    }
}

export const blockchainService = new BlockchainService(); 