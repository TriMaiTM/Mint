# TicketNFT — Run Guide

## Prerequisites

- Node.js 20+
- npm
- MetaMask browser extension
- Sepolia testnet ETH (from faucet)
- Resend API Key (for email notifications) — optional

## Project Structure

```
TicketNFT/
├── contracts/          # Smart contracts (Hardhat)
│   ├── contracts/      # Solidity files
│   ├── scripts/        # Deploy & utility scripts
│   └── test/           # Unit tests
├── web/                # Next.js web app
│   ├── app/            # Pages & API routes
│   ├── components/     # React components
│   ├── lib/            # Utilities (wagmi, prisma, contracts ABI, email)
│   └── prisma/         # Database schema & seed
└── docs/               # Documentation
```

## Quick Start

### 1. Setup Smart Contracts

```powershell
cd D:\HK8\TicketNFT\contracts
npm install
```

Create `.env`:
```env
SEPOLIA_RPC_URL=https://sepolia.drpc.org
PRIVATE_KEY=your_private_key_here
```

Compile & test:
```powershell
npm run compile
npm run test
```

Deploy to Sepolia:
```powershell
npm run deploy:sepolia
```

### 2. Setup Web App

```powershell
cd D:\HK8\TicketNFT\web
npm install
```

Create `.env.local`:
```env
# Database
DATABASE_URL=postgresql://...

# Auth
AUTH_SECRET=random_secret_here

# WalletConnect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

# Blockchain RPC
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your_key
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your_key

# Smart Contract Addresses
NEXT_PUBLIC_EVENT_FACTORY_ADDRESS=0x316654424537D288670070454f87bf3547341f6C
NEXT_PUBLIC_MARKETPLACE_ADDRESS=0xFda7d0bA678F72BFCD25cF4082D541bc1C7Da7AA

# Server-side wallet private key
PRIVATE_KEY=your_private_key_here

# Email (Optional - for notifications)
RESEND_API_KEY=re_xxxxxxxxxxxxx

# App URL (for email links)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Setup database:
```powershell
npm run prisma:generate
npm run prisma:push
npm run prisma:seed
```

Run dev server:
```powershell
npm run dev
```

Open http://localhost:3000

### 3. MetaMask Setup

Add Sepolia network:
- Network Name: `Sepolia`
- RPC URL: `https://eth-sepolia.g.alchemy.com/v2/your_key`
- Chain ID: `11155111`
- Currency: `ETH`
- Explorer: `https://sepolia.etherscan.io`

### 4. Email Setup (Optional)

To enable email notifications:

1. Create account at https://resend.com
2. Get your API key from the dashboard
3. Add `RESEND_API_KEY=re_xxxxxxxxxxxxx` to `.env.local`
4. Emails will be sent from `TicketNFT <onboarding@resend.dev>`

**Note:** Without `RESEND_API_KEY`, the app will work normally but won't send emails.

## Available Scripts

### Web App
```powershell
npm run dev              # Dev server
npm run build            # Production build
npm run start            # Production server
npm run lint             # Lint check
npm run prisma:generate  # Generate Prisma client
npm run prisma:push      # Push schema to DB
npm run prisma:seed      # Seed demo data
npm run prisma:studio    # Open Prisma Studio
npm run reset:chain      # Reset blockchain links (preserve users/events)
npm run demo:setup       # Setup demo with 3 wallets
```

### Contracts
```powershell
npm run compile          # Compile contracts
npm run test             # Run tests
npm run deploy:sepolia   # Deploy to Sepolia
```

## Environment Variables

### web/.env.local

| Variable | Description | Required |
|---|---|---|
| `DATABASE_URL` | Supabase PostgreSQL URL | Yes |
| `AUTH_SECRET` | Random string for session signing | Yes |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect project ID | Yes |
| `NEXT_PUBLIC_SEPOLIA_RPC_URL` | Sepolia RPC for browser (Alchemy) | Yes |
| `NEXT_PUBLIC_EVENT_FACTORY_ADDRESS` | EventFactory contract address | Yes |
| `NEXT_PUBLIC_MARKETPLACE_ADDRESS` | TicketMarketplace contract address | Yes |
| `PRIVATE_KEY` | Organizer deployer key (server-side) | Yes |
| `SEPOLIA_RPC_URL` | Sepolia RPC for server (Alchemy) | Yes |
| `RESEND_API_KEY` | Resend API key for email notifications | Optional |
| `NEXT_PUBLIC_APP_URL` | App URL for email links | Optional |

### contracts/.env

| Variable | Description | Required |
|---|---|---|
| `SEPOLIA_RPC_URL` | Sepolia RPC URL | Yes |
| `PRIVATE_KEY` | Deployer private key | Yes |
| `ETHERSCAN_API_KEY` | For contract verification | Optional |

## Troubleshooting

### "Failed to create sign-in nonce"
- Check `DATABASE_URL` in `.env.local`
- Run `npm run prisma:push`
- Verify Supabase project is active

### "RPC endpoint returned too many errors"
- Use Alchemy RPC instead of public RPC
- Set `NEXT_PUBLIC_SEPOLIA_RPC_URL` to Alchemy URL

### MetaMask transaction fails
- Ensure you're on Sepolia network (Chain ID 11155111)
- Check wallet has enough ETH
- Try resetting MetaMask account (Settings → Advanced → Clear activity)

### Build crashes
- Increase Node memory: `NODE_OPTIONS="--max-old-space-size=4096" npm run build`
- Clear `.next` folder and rebuild

### Emails not sending
- Check if `RESEND_API_KEY` is set in `.env.local`
- Verify API key is valid at https://resend.com
- Check console logs for email errors
- App works normally without email - it's optional