export enum ProjectStatus {
  Active = 0,
  Closed = 1,
  Revealing = 2,
  Selecting = 3,
  InProgress = 4,
  Completed = 5,
  Disputed = 6,
  Cancelled = 7,
}

export enum BidStatus {
  Submitted = 0,
  Revealed = 1,
  Selected = 2,
  Rejected = 3,
  Withdrawn = 4,
}

export interface Project {
  id: number;
  client: string;
  title: string;
  descHash: string;
  description: string;
  category: string;
  budget: bigint;
  minBudget: bigint;
  maxBudget: string;
  deadline: bigint;
  escrow: bigint;
  winner: string;
  winnerBid: string;
  status: ProjectStatus;
  createdAt: bigint;
  bidCount: bigint;
  revealed: boolean;
}

export interface Bid {
  freelancer: string;
  commitment: string;
  proposalHash: string;
  submittedAt: bigint;
  amount: bigint;
  stake: bigint;
  secret: string;
  revealed: boolean;
  status: BidStatus;
}

export interface CreateProjectForm {
  title: string;
  description: string;
  category: string;
  minBudget: number;
  maxBudget: number;
  deadline: Date;
}

export interface SubmitBidForm {
  amount: number;
  proposal: string;
  secret: string;
}
