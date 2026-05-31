// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract BlueCarbonRegistry {
    address public owner;

    struct VerificationRecord {
        string projectId;
        uint256 creditsIssued;
        string verificationStatus;
        uint256 timestamp;
        address auditor;
    }

    mapping(string => VerificationRecord) private _registry;
    string[] private _projectIds;

    event ProjectVerified(
        string indexed projectId,
        uint256 creditsIssued,
        string verificationStatus,
        uint256 timestamp,
        address indexed auditor
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function verifyProject(
        string memory projectId,
        uint256 creditsIssued,
        string memory verificationStatus
    ) public onlyOwner {
        require(bytes(projectId).length > 0, "Project ID cannot be empty");
        
        // If it's a new project, track the ID
        if (_registry[projectId].timestamp == 0) {
            _projectIds.push(projectId);
        }

        _registry[projectId] = VerificationRecord({
            projectId: projectId,
            creditsIssued: creditsIssued,
            verificationStatus: verificationStatus,
            timestamp: block.timestamp,
            auditor: msg.sender
        });

        emit ProjectVerified(
            projectId,
            creditsIssued,
            verificationStatus,
            block.timestamp,
            msg.sender
        );
    }

    function getVerificationRecord(string memory projectId) 
        public 
        view 
        returns (
            string memory,
            uint256,
            string memory,
            uint256,
            address
        ) 
    {
        VerificationRecord memory record = _registry[projectId];
        require(record.timestamp > 0, "Project record not found in registry");
        return (
            record.projectId,
            record.creditsIssued,
            record.verificationStatus,
            record.timestamp,
            record.auditor
        );
    }

    function getAllProjects() public view returns (string[] memory) {
        return _projectIds;
    }
}
