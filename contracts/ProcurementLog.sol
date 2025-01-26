// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract ProcurementLog is Ownable, Pausable {
    // Event structs
    struct RfpData {
        string rfpId;
        string title;
        uint256 budget;
        uint256 submissionDeadline;
        string createdBy;
    }

    struct BidData {
        string bidId;
        string rfpId;
        string vendorId;
        uint256 submissionDate;
        bytes32 proposalHash;
    }

    struct ContractData {
        string contractId;
        string rfpId;
        string vendorId;
        string bidId;
        uint256 awardDate;
        uint256 totalValue;
        uint256 startDate;
        uint256 endDate;
    }

    struct MilestoneData {
        string milestoneId;
        string contractId;
        string title;
        uint256 dueDate;
        string status;
        string updatedBy;
        bytes32 detailsHash;
    }

    // Events
    event RfpCreated(RfpData data);
    event RfpPublished(string rfpId, uint256 publishDate, uint256 numberOfBidsAllowed);
    event BidSubmitted(BidData data);
    event BidEvaluated(string bidId, string rfpId, uint256 evaluationScore, uint256 evaluationDate, bytes32 evaluationHash);
    event ContractAwarded(ContractData data);
    event MilestoneCreated(MilestoneData data);
    event MilestoneUpdated(MilestoneData data);

    constructor() Ownable(msg.sender) {}

    // RFP Functions
    function logRfpCreation(
        string memory rfpId,
        string memory title,
        uint256 budget,
        uint256 submissionDeadline,
        string memory createdBy
    ) public onlyOwner whenNotPaused {
        emit RfpCreated(RfpData(
            rfpId,
            title,
            budget,
            submissionDeadline,
            createdBy
        ));
    }

    function logRfpPublication(
        string memory rfpId,
        uint256 numberOfBidsAllowed
    ) public onlyOwner whenNotPaused {
        emit RfpPublished(rfpId, block.timestamp, numberOfBidsAllowed);
    }

    // Bid Functions
    function logBidSubmission(
        string memory bidId,
        string memory rfpId,
        string memory vendorId,
        bytes32 proposalHash
    ) public onlyOwner whenNotPaused {
        emit BidSubmitted(BidData(
            bidId,
            rfpId,
            vendorId,
            block.timestamp,
            proposalHash
        ));
    }

    function logBidEvaluation(
        string memory bidId,
        string memory rfpId,
        uint256 evaluationScore,
        bytes32 evaluationHash
    ) public onlyOwner whenNotPaused {
        emit BidEvaluated(
            bidId,
            rfpId,
            evaluationScore,
            block.timestamp,
            evaluationHash
        );
    }

    // Contract Functions
    function logContractAward(
        string memory contractId,
        string memory rfpId,
        string memory vendorId,
        string memory bidId,
        uint256 totalValue,
        uint256 startDate,
        uint256 endDate
    ) public onlyOwner whenNotPaused {
        emit ContractAwarded(ContractData(
            contractId,
            rfpId,
            vendorId,
            bidId,
            block.timestamp,
            totalValue,
            startDate,
            endDate
        ));
    }

    // Milestone Functions
    function logMilestoneCreation(
        string memory milestoneId,
        string memory contractId,
        string memory title,
        uint256 dueDate,
        string memory status,
        string memory updatedBy,
        bytes32 detailsHash
    ) public onlyOwner whenNotPaused {
        emit MilestoneCreated(MilestoneData(
            milestoneId,
            contractId,
            title,
            dueDate,
            status,
            updatedBy,
            detailsHash
        ));
    }

    function logMilestoneUpdate(
        string memory milestoneId,
        string memory contractId,
        string memory title,
        uint256 dueDate,
        string memory status,
        string memory updatedBy,
        bytes32 detailsHash
    ) public onlyOwner whenNotPaused {
        emit MilestoneUpdated(MilestoneData(
            milestoneId,
            contractId,
            title,
            dueDate,
            status,
            updatedBy,
            detailsHash
        ));
    }

    // Admin Functions
    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }
} 