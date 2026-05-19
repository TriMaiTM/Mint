# TicketNFT — AI Agent Handoff Prompt

You are taking over a completed Web3 fullstack NFT ticketing project at `D:\HK8\TicketNFT`.

## Read First

Before doing anything, read these files in order:
1. `docs/execution_plan.md` — Current status, all features, contract addresses
2. `docs/run_guide.md` — How to set up and run the project
3. `docs/DEMO.md` — Demo script with 3 wallets
4. `README.md` — Full project documentation

## Project Summary

A decentralized event ticketing platform on Sepolia testnet where:
- Organizers create events with multiple ticket tiers and categories
- Events are published on-chain (each event = 1 ERC-721 NFT contract)
- Users buy NFT tickets via MetaMask
- Secondary marketplace with 3x price limit and automatic royalty distribution
- QR-based check-in with on-chain verification
- Revenue withdrawal from smart contracts

## Tech Stack

| Layer | Technology |
|---|---|
| Smart Contracts | Solidity 0.8.26, Hardhat, OpenZeppelin v5 |
| Blockchain | Sepolia Testnet (Ethereum) |
| Frontend | Next.js 16, React 19, TypeScript |
| Web3 | Wagmi v2, Viem v2, RainbowKit v2 |
| Database | Supabase PostgreSQL, Prisma 6 |
| Auth | Wallet signature (EIP-191) |
| Design | Pinterest-inspired (Inter font, CSS variables) |

## Contract Addresses (Sepolia)

- EventFactory: `0x316654424537D288670070454f87bf3547341f6C`
- TicketMarketplace: `0xFda7d0bA678F72BFCD25cF4082D541bc1C7Da7AA`

## Architecture

```
Frontend (Next.js)
    ↓ API Routes
Backend (Prisma + Supabase)
    ↓ Server-side wallet
Blockchain (Sepolia)
```

### Key Design Decisions

1. **Server-side blockchain operations**: Publish, mint, check-in, and cancel operations use server-side wallet (private key in `.env`) to bypass MetaMask RPC issues. Only buy operations go through MetaMask directly.

2. **MetaMask direct calls**: Buy operations use `window.ethereum.request({ method: "eth_sendTransaction" })` instead of viem's `writeContract` to avoid RPC gas estimation issues.

3. **Strict on-chain enforcement**: Ticket purchases must succeed on-chain first, then sync to DB. No fake DB records.

4. **Price limit in smart contract**: Marketplace enforces max 3x original price via `getTierPrice()` and `getTokenTierId()` getters.

5. **Category system**: Events have a `category` field (Music, Tech, Food, Sports, Art, Business, General) with dedicated category pages.

## Non-Negotiable Rules

1. **Draft events are off-chain only** — hidden from public until published
2. **Published events must have real on-chain contract** — deployed through EventFactory
3. **Ticket purchase = mint first, then DB record** — never create DB record before on-chain success
4. **On-chain check-in** — `useTicket()` must be called on the contract, not just DB update
5. **On-chain cancel** — `cancelListing()` must be called on the marketplace contract

## Current Status: COMPLETE

All planned features are implemented:
- 3 smart contracts with 20 passing tests
- 12 pages (landing, events, event detail, category, marketplace, my tickets, profile, organizer pages)
- 17 API endpoints
- Pinterest-inspired design system
- Loading modals, toast notifications, wallet dropdown
- Google Maps embed, QR codes, search/filter/pagination
- Event edit form, attendee list, category system

## What Could Be Improved (Optional)

These are NOT bugs — they're potential enhancements:

1. **IPFS metadata upload**: Currently uses placeholder URIs. Could integrate Pinata for real NFT metadata.
2. **Email notifications**: Send confirmation emails after purchase.
3. **Framer Motion animations**: Add page transitions and micro-interactions.
4. **Admin panel**: Platform overview, user management, fee settings.
5. **E2E tests**: Playwright/Cypress tests for critical flows.
6. **Vercel deployment**: Deploy to production.
7. **Contract verification**: Verify source code on Etherscan.
8. **Event images upload**: Currently uses URL input, could add file upload to IPFS.

## Environment Setup

### web/.env.local (required)
```
DATABASE_URL=postgresql://...
AUTH_SECRET=random_secret
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=...
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/KEY
NEXT_PUBLIC_EVENT_FACTORY_ADDRESS=0x316654424537D288670070454f87bf3547341f6C
NEXT_PUBLIC_MARKETPLACE_ADDRESS=0xFda7d0bA678F72BFCD25cF4082D541bc1C7Da7AA
PRIVATE_KEY=0x...
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/KEY
```

### contracts/.env (required)
```
SEPOLIA_RPC_URL=https://sepolia.drpc.org
PRIVATE_KEY=0x...
```

## Quick Commands

```powershell
# Web
cd D:\HK8\TicketNFT\web
npm run dev          # Start dev server
npm run build        # Production build
npm run prisma:push  # Sync schema to DB

# Contracts
cd D:\HK8\TicketNFT\contracts
npm run test         # Run 20 tests
npm run deploy:sepolia  # Deploy to Sepolia
```

## File Structure

```
TicketNFT/
├── contracts/
│   ├── contracts/
│   │   ├── EventTicketNFT.sol      # ERC-721 + ERC-2981 ticket contract
│   │   ├── EventFactory.sol        # Factory for creating event contracts
│   │   └── TicketMarketplace.sol   # Secondary market with royalty
│   ├── scripts/
│   │   ├── deploy.ts               # Deploy script
│   │   ├── createEvent.ts          # Create event script
│   │   └── split-funds.ts          # Split ETH between wallets
│   └── test/                       # 20 unit tests
├── web/
│   ├── app/
│   │   ├── page.tsx                # Landing page
│   │   ├── events/
│   │   │   ├── page.tsx            # Events listing + search + filter
│   │   │   ├── [id]/page.tsx       # Event detail + map + share
│   │   │   └── category/[name]/    # Category pages
│   │   ├── marketplace/page.tsx    # Secondary market
│   │   ├── my-tickets/page.tsx     # Ticket inventory + QR
│   │   ├── profile/page.tsx        # User profile
│   │   ├── organizer/
│   │   │   ├── events/page.tsx     # My events list
│   │   │   ├── events/new/         # Create event form
│   │   │   ├── events/[id]/        # Manage event + edit
│   │   │   ├── events/[id]/attendees/ # Attendee list
│   │   │   └── check-in/           # QR scanner
│   │   └── api/                    # 17 API routes
│   ├── components/
│   │   ├── layout/nav.tsx          # Shared navigation
│   │   ├── wallet/                 # Wallet connection + dropdown
│   │   ├── tickets/                # Buy, list, QR components
│   │   ├── marketplace/            # Buy listed ticket
│   │   ├── organizer/              # Publish, withdraw, settings
│   │   └── ui/                     # Toast, loading modal, skeleton
│   ├── lib/
│   │   ├── wagmi.ts                # Wagmi config (Sepolia only)
│   │   ├── prisma.ts               # Prisma client singleton
│   │   ├── contracts.ts            # ABI definitions
│   │   └── auth.ts                 # Session management
│   └── prisma/
│       ├── schema.prisma           # Database schema
│       └── seed.mjs                # Seed script
└── docs/                           # Documentation
```

## Key Patterns

### Server-side blockchain operations
```typescript
// Example: Publish event on-chain
const account = privateKeyToAccount(process.env.PRIVATE_KEY);
const walletClient = createWalletClient({ account, chain: sepolia, transport: http(rpcUrl) });
const txHash = await walletClient.sendTransaction({ to: factoryAddress, data: callData, gas: 4_000_000n });
```

### MetaMask direct calls (for user operations)
```typescript
// Example: Buy ticket
const ethereum = window.ethereum;
const txHash = await ethereum.request({
  method: "eth_sendTransaction",
  params: [{ from: address, to: contractAddress, data: callData, value: priceHex, gas: "0x493E0" }],
});
```

### Design system
```css
/* All styles use CSS variables */
--color-primary: #e60023;  /* Pinterest Red — CTA only */
--color-canvas: #ffffff;
--color-surface-card: #f6f6f3;
--radius-md: 16px;
--font-family: Inter, system-ui, sans-serif;
```
