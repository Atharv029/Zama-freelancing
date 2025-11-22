// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title FreelanceBiddingV2
 * @notice Improved payment model:
 * - Clients pay ONLY 0.001 ETH platform fee to create projects
 * - Bidders stake their bid amount when submitting bids
 * - Winner gets paid by client after selection (stake returned + payment)
 * - Non-winners get their stakes refunded automatically
 */
contract FreelanceBiddingV2 {
    uint256 private locked;

    enum Status { Active, Closed, Revealing, Selecting, InProgress, Completed, Disputed, Cancelled }
    enum BidStatus { Submitted, Revealed, Selected, Rejected, Withdrawn }

    struct Project {
        address client;
        string title;
        string descHash;
        uint256 budget;
        uint256 minBudget;
        uint256 deadline;
        address winner;
        Status status;
        uint256 createdAt;
        uint256 bidCount;
        bool revealed;
    }

    struct Bid {
        address freelancer;
        bytes32 commitment;
        bytes32 proposalHash;
        uint256 submittedAt;
        uint256 amount;
        uint256 stake;
        bytes32 secret;
        bool revealed;
        BidStatus status;
    }

    Project[] public projects;
    mapping(uint256 => mapping(address => Bid)) public bids;
    mapping(uint256 => address[]) public projectBidders;

    uint256 public feeBps = 250; // 2.5%
    uint256 public constant MAX_FEE = 1000; // 10%
    uint256 public constant DENOMINATOR = 10000;
    uint256 public minProjectFee = 0.001 ether;

    address public owner;
    uint256 public fees;

    modifier nonReentrant() {
        require(locked == 1, "Reentrant");
        locked = 2;
        _;
        locked = 1;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier validProject(uint256 pid) {
        require(pid < projects.length, "Invalid project");
        _;
    }

    modifier isClient(uint256 pid) {
        require(projects[pid].client == msg.sender, "Not client");
        _;
    }

    constructor() {
        owner = msg.sender;
        locked = 1;
    }

    // Events
    event ProjectCreated(uint256 indexed pid, address indexed client, string title, uint256 budget, uint256 deadline);
    event BidSubmitted(uint256 indexed pid, address indexed freelancer, bytes32 commitment, uint256 stake);
    event BidRevealed(uint256 indexed pid, address indexed freelancer, uint256 amount);
    event BidsRevealed(uint256 indexed pid, uint256 count);
    event WinnerSelected(uint256 indexed pid, address indexed winner, uint256 amount);
    event PaymentReleased(uint256 indexed pid, address indexed freelancer, uint256 amount, uint256 fee);
    event StakeRefunded(uint256 indexed pid, address indexed freelancer, uint256 amount);
    event ProjectCancelled(uint256 indexed pid, address indexed client);
    event DisputeRaised(uint256 indexed pid, address indexed by);
    event BidWithdrawn(uint256 indexed pid, address indexed freelancer);

    /**
     * @notice Create project - Client pays ONLY platform fee (0.001 ETH)
     */
    function createProject(
        string memory title,
        string memory descHash,
        uint256 budget,
        uint256 minBudget,
        uint256 durationDays
    ) external payable returns (uint256) {
        require(bytes(title).length > 0, "Title required");
        require(budget > 0 && minBudget > 0 && minBudget <= budget, "Invalid budget");
        require(durationDays > 0 && durationDays <= 90, "Invalid duration");
        require(msg.value >= minProjectFee, "Insufficient platform fee");

        projects.push(Project({
            client: msg.sender,
            title: title,
            descHash: descHash,
            budget: budget,
            minBudget: minBudget,
            deadline: block.timestamp + durationDays * 1 days,
            winner: address(0),
            status: Status.Active,
            createdAt: block.timestamp,
            bidCount: 0,
            revealed: false
        }));

        fees += minProjectFee;
        uint256 pid = projects.length - 1;
        emit ProjectCreated(pid, msg.sender, title, budget, block.timestamp + durationDays * 1 days);
        return pid;
    }

    /**
     * @notice Submit bid - Bidder stakes their bid amount
     */
    function submitBid(
        uint256 pid,
        bytes32 commitment,
        bytes32 proposalHash
    ) external payable validProject(pid) {
        Project storage project = projects[pid];
        require(project.status == Status.Active, "Not active");
        require(block.timestamp < project.deadline, "Deadline passed");
        require(msg.sender != project.client, "Client can't bid");
        require(bids[pid][msg.sender].freelancer == address(0), "Already bid");
        require(msg.value > 0, "Stake required");

        bids[pid][msg.sender] = Bid({
            freelancer: msg.sender,
            commitment: commitment,
            proposalHash: proposalHash,
            submittedAt: block.timestamp,
            amount: 0,
            stake: msg.value,
            secret: bytes32(0),
            revealed: false,
            status: BidStatus.Submitted
        });

        projectBidders[pid].push(msg.sender);
        project.bidCount++;
        emit BidSubmitted(pid, msg.sender, commitment, msg.value);
    }

    /**
     * @notice Reveal bid amount and secret
     */
    function revealBid(
        uint256 pid,
        uint256 amount,
        bytes32 secret
    ) external validProject(pid) {
        Project storage project = projects[pid];
        Bid storage bid = bids[pid][msg.sender];

        require(block.timestamp >= project.deadline, "Too early");
        require(bid.freelancer == msg.sender, "No bid");
        require(!bid.revealed, "Already revealed");
        require(bid.status == BidStatus.Submitted, "Invalid status");

        bytes32 computed = keccak256(abi.encodePacked(amount, secret));
        require(computed == bid.commitment, "Bad reveal");
        require(amount >= project.minBudget && amount <= project.budget, "Invalid amount");
        require(bid.stake >= amount, "Insufficient stake");

        bid.amount = amount;
        bid.secret = secret;
        bid.revealed = true;
        bid.status = BidStatus.Revealed;

        _checkAllRevealed(pid);
        emit BidRevealed(pid, msg.sender, amount);
    }

    function _checkAllRevealed(uint256 pid) private {
        Project storage project = projects[pid];
        address[] memory bidders = projectBidders[pid];
        bool allRevealed = true;

        for (uint256 i = 0; i < bidders.length; i++) {
            if (bids[pid][bidders[i]].status == BidStatus.Submitted) {
                allRevealed = false;
                break;
            }
        }

        if (allRevealed && bidders.length > 0) {
            project.revealed = true;
            project.status = Status.Selecting;
            emit BidsRevealed(pid, bidders.length);
        }
    }

    /**
     * @notice Select winner - Refunds non-winners automatically
     */
    function selectWinner(uint256 pid, address winner) external nonReentrant validProject(pid) isClient(pid) {
        Project storage project = projects[pid];
        require(project.status == Status.Selecting, "Wrong status");
        require(project.revealed, "Not revealed");
        require(project.winner == address(0), "Winner exists");

        Bid storage winningBid = bids[pid][winner];
        require(winningBid.revealed, "Not revealed");
        require(winningBid.status == BidStatus.Revealed, "Invalid status");
        require(winningBid.amount >= project.minBudget && winningBid.amount <= project.budget, "Invalid amount");

        project.winner = winner;
        project.status = Status.InProgress;
        winningBid.status = BidStatus.Selected;

        // Refund non-winners
        address[] memory bidders = projectBidders[pid];
        for (uint256 i = 0; i < bidders.length; i++) {
            if (bidders[i] != winner) {
                Bid storage bid = bids[pid][bidders[i]];
                if (bid.status == BidStatus.Revealed && bid.stake > 0) {
                    bid.status = BidStatus.Rejected;
                    uint256 refundAmount = bid.stake;
                    bid.stake = 0;
                    payable(bidders[i]).transfer(refundAmount);
                    emit StakeRefunded(pid, bidders[i], refundAmount);
                }
            }
        }

        emit WinnerSelected(pid, winner, winningBid.amount);
    }

    /**
     * @notice Release payment - Client pays winner (winner's stake returned + payment)
     */
    function releasePayment(uint256 pid) external payable nonReentrant validProject(pid) isClient(pid) {
        Project storage project = projects[pid];
        require(project.status == Status.InProgress, "Wrong status");
        require(project.winner != address(0), "No winner");

        Bid storage winningBid = bids[pid][project.winner];
        uint256 amount = winningBid.amount;
        
        require(msg.value >= amount, "Insufficient payment");

        uint256 platformFee = (amount * feeBps) / DENOMINATOR;
        uint256 payment = amount - platformFee + winningBid.stake; // Return stake + payment
        
        project.status = Status.Completed;
        fees += platformFee;
        winningBid.stake = 0;

        payable(project.winner).transfer(payment);
        
        // Refund excess
        if (msg.value > amount) {
            payable(msg.sender).transfer(msg.value - amount);
        }

        emit PaymentReleased(pid, project.winner, payment, platformFee);
    }

    /**
     * @notice Cancel project before any bids
     */
    function cancelProject(uint256 pid) external validProject(pid) isClient(pid) {
        Project storage project = projects[pid];
        require(project.status == Status.Active, "Not active");
        require(project.bidCount == 0, "Has bids");
        
        project.status = Status.Cancelled;
        emit ProjectCancelled(pid, msg.sender);
    }

    // Helper functions
    function createCommitment(uint256 amount, bytes32 secret) external pure returns (bytes32) {
        return keccak256(abi.encodePacked(amount, secret));
    }

    function getProjectCount() external view returns (uint256) {
        return projects.length;
    }

    function getProjectBidders(uint256 pid) external view validProject(pid) returns (address[] memory) {
        return projectBidders[pid];
    }

    function hasBid(uint256 pid, address freelancer) external view validProject(pid) returns (bool) {
        return bids[pid][freelancer].freelancer != address(0);
    }

    function withdrawFees() external onlyOwner {
        uint256 amount = fees;
        fees = 0;
        payable(owner).transfer(amount);
    }
}
