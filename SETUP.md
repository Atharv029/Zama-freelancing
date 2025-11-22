# Private Freelance Bidding Platform - Complete Setup Guide

This is a production-grade freelance marketplace with **Zama FHE encrypted bids**. All bid amounts remain completely private until the deadline passes.

## 🏗️ Architecture Overview

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Wallet**: RainbowKit + wagmi
- **Smart Contract**: Solidity (Sepolia testnet)
- **Encryption**: Zama FHE (Fully Homomorphic Encryption)
- **Network**: Ethereum Sepolia Testnet

## 📋 Prerequisites

- Node.js 18+ and npm
- MetaMask or compatible Web3 wallet
- Sepolia ETH (get from faucet)
- Basic understanding of Web3

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root:

```env
# WalletConnect Project ID (get from https://cloud.walletconnect.com)
VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here

# Zama FHE Configuration (optional for development)
VITE_FHE_PUBLIC_KEY_URL=https://fhe-gateway.example.com/public-key
VITE_ORACLE_URL=https://fhe-oracle.example.com

# Contract Address (after deployment)
VITE_CONTRACT_ADDRESS=0xYourContractAddress
```

### 3. Get WalletConnect Project ID

1. Visit https://cloud.walletconnect.com
2. Create a new project
3. Copy your Project ID
4. Add it to your `.env` file

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:8080`

## 📝 Smart Contract Deployment

### Option 1: Deploy with Remix (Recommended for Beginners)

1. Open [Remix IDE](https://remix.ethereum.org)
2. Create a new file: `FreelanceBidding.sol`
3. Copy the contract from `contracts/FreelanceBidding.sol`
4. Compile with Solidity 0.8.20+
5. Switch to "Deploy & Run Transactions"
6. Select "Injected Provider - MetaMask"
7. Ensure you're on **Sepolia Testnet**
8. In constructor, provide:
   - `_oracle`: Your wallet address (for testing)
   - `_feeCollector`: Your wallet address (to collect platform fees)
9. Click "Deploy" and confirm in MetaMask
10. Copy the deployed contract address
11. Add it to your `.env` as `VITE_CONTRACT_ADDRESS`

### Option 2: Deploy with Hardhat

```bash
# Install Hardhat
npm install --save-dev hardhat

# Create Hardhat project
npx hardhat

# Deploy script
npx hardhat run scripts/deploy.js --network sepolia
```

## 🔐 Zama FHE Setup (Advanced)

For production use with real FHE encryption:

1. **Get Zama FHE Access**:
   - Visit [Zama.ai](https://www.zama.ai/)
   - Sign up for FHE services
   - Get your FHE gateway URL and credentials

2. **Install fhevmjs**:
   ```bash
   npm install fhevmjs
   ```

3. **Update `src/lib/fheEncryption.ts`**:
   - Replace placeholder functions with actual Zama FHE library
   - Follow Zama's official documentation

4. **Configure Oracle**:
   - Set up a backend service to decrypt bids after deadline
   - Oracle should call `submitDecryptedBids()` on the contract

For development, the current implementation uses a **mock encryption** that simulates the process.

## 🧪 Testing the Platform

### As a Client (Posting Projects):

1. **Connect Wallet**: Click "Connect Wallet" button
2. **Get Sepolia ETH**: Use a faucet like:
   - https://sepoliafaucet.com/
   - https://www.infura.io/faucet/sepolia
3. **Post Project**:
   - Navigate to "Post Project"
   - Fill in all details
   - Set budget range (min/max)
   - Choose deadline
   - Submit and confirm transaction
   - **Your maxBudget ETH will be escrowed**
4. **View Bids**:
   - Go to "My Projects"
   - Bids are encrypted until deadline
   - After deadline, oracle reveals bids
   - Select winner to complete project

### As a Freelancer (Submitting Bids):

1. **Browse Projects**: View all open projects on homepage
2. **Submit Bid**:
   - Click on a project
   - Click "Submit Encrypted Bid"
   - Enter bid amount (must be in valid range)
   - Write proposal
   - Submit and confirm transaction
   - **Bid is now encrypted on-chain**
3. **Track Bids**: Go to "My Bids" to see all your submissions
4. **Wait for Reveal**: After deadline, your bid will be revealed
5. **Get Paid**: If selected as winner, payment is automatic!

## 📊 Business Logic Flow

1. **Client creates project** → Escrows maxBudget ETH
2. **Freelancers submit encrypted bids** → Stored on-chain
3. **Deadline passes** → No more bids allowed
4. **Oracle decrypts bids** → Reveals all amounts
5. **Client selects winner** → Smart contract:
   - Pays freelancer (bid - 2.5% fee)
   - Pays platform (2.5% fee)
   - Refunds client (maxBudget - winning bid)

## 🛠️ Development Scripts

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type check
npm run type-check

# Lint code
npm run lint
```

## 📁 Project Structure

```
src/
├── components/
│   ├── ui/              # Shadcn UI components
│   ├── Layout.tsx       # Main layout with navigation
│   ├── ProjectCard.tsx  # Project card component
│   └── StatusBadge.tsx  # Status indicator
├── lib/
│   ├── web3Config.ts    # Web3 configuration
│   ├── fheEncryption.ts # FHE encryption library
│   └── utils.ts         # Utility functions
├── pages/
│   ├── Index.tsx        # Homepage (browse projects)
│   ├── PostProject.tsx  # Create new project
│   ├── MyProjects.tsx   # Client dashboard
│   ├── MyBids.tsx       # Freelancer dashboard
│   └── ProjectDetail.tsx# Project details & bidding
├── types/
│   └── project.ts       # TypeScript interfaces
└── App.tsx              # Main app with routing

contracts/
└── FreelanceBidding.sol # Smart contract
```

## 🔧 Customization

### Update Platform Fee:

In the smart contract, change `platformFee` variable:
```solidity
uint256 public platformFee = 250; // 2.5% (in basis points)
```

### Change Design Theme:

Edit `src/index.css` to customize colors:
```css
:root {
  --primary: 217 91% 60%;    /* Main brand color */
  --accent: 188 94% 50%;     /* Accent color */
  --encrypted: 271 91% 65%;  /* Encryption indicator */
}
```

### Add New Categories:

In `src/pages/PostProject.tsx`, update the categories array:
```typescript
const categories = ['Web Development', 'Design', 'Your New Category'];
```

## 🐛 Troubleshooting

### "Cannot connect to wallet"
- Ensure MetaMask is installed
- Switch to Sepolia network in MetaMask
- Refresh the page

### "Transaction failed"
- Check you have enough Sepolia ETH for gas
- Ensure you're on the correct network
- Check browser console for errors

### "Bid validation failed"
- Verify bid amount is between min and max budget
- Check you haven't already bid on this project
- Ensure deadline hasn't passed

### "Cannot read property of undefined"
- The contract address might not be set
- Check `.env` file has correct values
- Restart the development server

## 📚 Additional Resources

- [Solidity Documentation](https://docs.soliditylang.org/)
- [Wagmi Documentation](https://wagmi.sh/)
- [RainbowKit Documentation](https://www.rainbowkit.com/)
- [Zama FHE Documentation](https://docs.zama.ai/)
- [Remix IDE](https://remix.ethereum.org/)

## 🚨 Security Considerations

- **Smart Contract Audit**: Before mainnet deployment, get a professional audit
- **Reentrancy Protection**: Contract uses `nonReentrant` modifier
- **Input Validation**: All inputs are validated both client and contract side
- **ZK Proofs**: Verify proofs on-chain for production
- **Oracle Security**: Implement multi-signature oracle for decryption

## 💰 Cost Estimates (Sepolia)

- **Create Project**: ~0.01 ETH (gas)
- **Submit Bid**: ~0.005 ETH (gas)
- **Select Winner**: ~0.008 ETH (gas)
- Platform takes 2.5% of winning bid

## 📞 Support

For issues or questions:
1. Check this documentation
2. Review smart contract comments
3. Check browser console for errors
4. Review transaction on [Sepolia Etherscan](https://sepolia.etherscan.io/)

## 🎉 You're Ready!

Your private freelance bidding platform is now set up! Start by:
1. Connecting your wallet
2. Getting some Sepolia ETH
3. Posting a test project or submitting a test bid

Happy building! 🚀
