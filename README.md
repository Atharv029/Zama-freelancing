# Private Freelance Bidding Platform

A production-grade **decentralized freelance marketplace** where bid amounts remain **completely private** using **Zama FHE (Fully Homomorphic Encryption)** until the project deadline passes.

##  Key Features

- **Encrypted Bids**: All bid amounts are encrypted using Zama FHE technology
- **Fair Competition**: No one can see bid amounts until the deadline
- **Smart Escrow**: Client funds are automatically held and distributed
- **Trustless**: Everything handled by smart contracts
- **Beautiful UI**: Modern, responsive design
- **Web3 Wallet Integration**: Connect with MetaMask and other wallets

## How It Works

### For Clients (Posting Projects):

1. **Post a Project**: Create a project with title, description, budget range, and deadline
3. **Receive Bids**: Freelancers submit encrypted bids (amounts are hidden)
4. **Deadline Passes**: No more bids allowed
5. **Bids Revealed**: Oracle decrypts all bids using Zama FHE
6. **Select Winner**: Choose the best freelancer
7. **Auto Payment**: Winner paid, platform fee deducted, unused escrow refunded

### For Freelancers (Bidding):

1. **Browse Projects**: View all open projects
2. **Submit Encrypted Bid**: Your bid amount is encrypted and hidden
3. **Write Proposal**: Explain why you're the best fit
4. **Wait for Reveal**: After deadline, your bid becomes visible to client
5. **Get Hired**: If selected, payment is automatic!


### Example:
```
Project Budget: 2-5 ETH
Winning person Bid: 3.5 ETH ( person will be selected by project creator only based on skill and bid )

Distribution:
✅ Winner: 3.4125 ETH (3.5 - 2.5%)
✅ Platform: 0.0875 ETH (2.5%)
```

## Quick Start

### Prerequisites

- Node.js 18+
- MetaMask or Web3 wallet
- Sepolia ETH (for testing)

### Installation

```bash
# Clone the repository
git clone https://github.com/Atharv029/Zama-freelancing.git
cd Zama-freelancing

# Install dependencies
npm install

```

### Run Development Server

```bash
npm run dev
```

Visit `http://localhost:8080`

## 📝 Smart Contract Deployment

The smart contract is in `contracts/FreelanceBidding.sol`

### Deploy with Remix (Easiest):

1. Open [Remix IDE](https://remix.ethereum.org)
2. Copy contract from `contracts/FreelanceBidding.sol`
3. Compile with Solidity 0.8.20+
4. Connect MetaMask (Sepolia network)
5. Deploy with constructor parameters:
   - `_oracle`: Your wallet address
   - `_feeCollector`: Your wallet address
6. Copy deployed contract address

##  Zama FHE Integration

This platform uses **Zama's Fully Homomorphic Encryption** to keep bids private.

### How it works:

1. **Frontend**: Encrypts bid amount using Zama public key
2. **Smart Contract**: Stores encrypted bid on-chain
3. **After Deadline**: Oracle decrypts using Zama gateway
4. **Result**: All bids revealed simultaneously

### Development vs Production:

- **Development**: Uses mock encryption (placeholder)
- **Production**: Replace with actual Zama FHE library

See `src/lib/fheEncryption.ts` for implementation details.

## Project Structure

```
private-bidding-platform/
├── contracts/
│   └── FreelanceBidding.sol       # Smart contract
├── src/
│   ├── components/
│   │   ├── ui/                    # Shadcn components
│   │   ├── Layout.tsx             # Navigation & footer
│   │   ├── ProjectCard.tsx        # Project display
│   │   └── StatusBadge.tsx        # Status indicators
│   ├── lib/
│   │   ├── web3Config.ts          # Web3 setup
│   │   ├── fheEncryption.ts       # FHE encryption
│   │   └── utils.ts               # Utilities
│   ├── pages/
│   │   ├── Index.tsx              # Homepage
│   │   ├── PostProject.tsx        # Create project
│   │   ├── MyProjects.tsx         # Client dashboard
│   │   ├── MyBids.tsx             # Freelancer dashboard
│   │   └── ProjectDetail.tsx      # Project details
│   ├── types/
│   │   └── project.ts             # TypeScript types
│   └── App.tsx                    # Main app
├── SETUP.md                       # Complete setup guide
├── CONTRACT_DEPLOYMENT.md         # Deployment guide
└── README.md                      # This file
```


## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Shadcn UI
- **Web3**: Wagmi + RainbowKit
- **Smart Contract**: Solidity 0.8.20
- **Encryption**: Zama FHE
- **Network**: Ethereum Sepolia Testnet

## Testing

### Test Workflow:

1. **Get Sepolia ETH**: https://sepoliafaucet.com/
2. **Deploy Contract**: Follow CONTRACT_DEPLOYMENT.md
3. **Test as Client**:
   - Post a project
   - Verify escrow
   - Select winner after reveal
4. **Test as Freelancer**:
   - Submit encrypted bid
   - Verify bid is hidden
   - Check payment after win


## 📄 License

MIT License - see LICENSE file
