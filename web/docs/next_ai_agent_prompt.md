# TicketNFT — AI Agent Handoff Prompt

You are taking over a Web3 fullstack NFT ticketing project at `D:\HK8\TicketNFT`.

## Read First

Before doing anything, read these files in order:
1. `web/docs/execution_plan.md` — Current status, all features, contract addresses
2. `web/docs/run_guide.md` — How to set up and run the project
3. `web/docs/DEMO.md` — Demo script with 3 wallets
4. `web/docs/implementation_plan.md` — Technical architecture details
5. `README.md` — Full project documentation

## Project Summary

A decentralized event ticketing platform on Sepolia testnet where:
- Organizers create events with multiple ticket tiers and categories
- Events are published on-chain (each event = 1 ERC-721 NFT contract)
- Users buy NFT tickets via MetaMask
- Secondary marketplace with 3x price limit and automatic royalty distribution
- QR-based check-in with on-chain verification
- Revenue withdrawal from smart contracts
- Email notifications for purchases and marketplace activities
- Analytics dashboard for organizers

## Tech Stack

| Layer | Technology |
|---|---|
| Smart Contracts | Solidity 0.8.26, Hardhat, OpenZeppelin v5 |
| Blockchain | Sepolia Testnet (Ethereum) |
| Frontend | Next.js 16, React 19, TypeScript |
| Web3 | Wagmi v2, Viem v2, RainbowKit v2 |
| Database | Supabase PostgreSQL, Prisma 6 |
| Auth | Wallet signature (EIP-191) |
| Email | Resend |
| Design | Pinterest-inspired (Inter font, CSS variables) |

## Contract Addresses (Sepolia)

- EventFactory: `0x316654424537D288670070454f87bf3547341f6C`
- TicketMarketplace: `0xFda7d0bA678F72BFCD25cF4082D541bc1C7Da7AA`

## Architecture

```
Frontend (Next.js)
    ↓ API Routes (19 endpoints)
Backend (Prisma + Supabase + Resend)
    ↓ Server-side wallet
Blockchain (Sepolia)
```

### Key Design Decisions

1. **Server-side blockchain operations**: Publish, mint, check-in, and cancel operations use server-side wallet (private key in `.env`) to bypass MetaMask RPC issues. Only buy operations go through MetaMask directly.

2. **MetaMask direct calls**: Buy operations use `window.ethereum.request({ method: "eth_sendTransaction" })` instead of viem's `writeContract` to avoid RPC gas estimation issues.

3. **Strict on-chain enforcement**: Ticket purchases must succeed on-chain first, then sync to DB. No fake DB records.

4. **Price limit in smart contract**: Marketplace enforces max 3x original price via `getTierPrice()` and `getTokenTierId()` getters.

5. **Category system**: Events have a `category` field (Music, Tech, Food, Sports, Art, Business, General) with dedicated category pages.

6. **Email notifications**: Non-blocking email sends via Resend. App works without email configuration.

7. **Analytics dashboard**: Real-time analytics for organizers with revenue charts and ticket stats.

## Non-Negotiable Rules

1. **Draft events are off-chain only** — hidden from public until published
2. **Published events must have real on-chain contract** — deployed through EventFactory
3. **Ticket purchase = mint first, then DB record** — never create DB record before on-chain success
4. **On-chain check-in** — `useTicket()` must be called on the contract, not just DB update
5. **On-chain cancel** — `cancelListing()` must be called on the marketplace contract

## Current Status: Phase 6 Complete

### ✅ Completed Features

**Smart Contracts (Phase 1)**
- 3 smart contracts with 20 passing tests
- EventTicketNFT (ERC-721 + ERC-2981)
- EventFactory (factory pattern)
- TicketMarketplace (secondary market with 3x price limit)

**Web Core (Phase 2)**
- Next.js 16 + TypeScript + App Router
- Wagmi + Viem + RainbowKit + TanStack Query
- Prisma schema + Supabase PostgreSQL
- Wallet auth (nonce → verify → session cookie)
- Role-based access (USER / ORGANIZER / ADMIN)

**Core Product Flows (Phase 3)**
- Create event (multi-tier, category, venue, banner)
- Publish on-chain (server-side)
- Buy ticket (MetaMask direct)
- My Tickets + QR code generation
- Marketplace (list, buy, cancel)
- Check-in (on-chain + DB)
- Withdraw funds
- Resale with 3x price limit

**UI/UX (Phase 4)**
- Pinterest-inspired design system
- 13 pages (Landing, Events, Detail, Category, Marketplace, My Tickets, Profile, My Events, Analytics, Create Event, Manage Event, Attendees, Check-in)
- Loading modals, toast notifications, wallet dropdown
- Google Maps embed, QR codes, search/filter/pagination
- Responsive design (4→3→2→1 columns)

**Email Notifications (Phase 5)**
- Resend integration (`lib/email/index.ts`)
- 4 email templates (purchase, listing, sold, buyer)
- Email settings in profile page
- Profile API for email management

**Analytics Dashboard (Phase 6)**
- Analytics API endpoint (`/api/organizer/analytics`)
- Overview cards, revenue charts, ticket inventory
- Analytics page with dashboard UI

### ⬜ Not Yet Implemented

**High Priority**
- IPFS metadata upload (Pinata) — Real NFT metadata
- Contract verification on Etherscan
- Deploy to Vercel (production)

**Medium Priority**
- Full-text search (pg_trgm)
- Coupon system — Discount codes
- Enhanced event edit form (video banner, FAQ, schedule)
- Export CSV — Attendee list export
- Framer Motion animations

**Low Priority**
- E2E tests (Playwright/Cypress)
- Admin panel — Platform overview
- Ticket transfer — Gift tickets
- Email reminders — Pre-event reminders
- Online events (Zoom integration)
- Mobile app (React Native)

## Environment Setup

### web/.env.local (required)
```
DATABASE_URL=postgresql://...
AUTH_SECRET=random_secret
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=...
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/KEY
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/KEY
NEXT_PUBLIC_EVENT_FACTORY_ADDRESS=0x316654424537D288670070454f87bf3547341f6C
NEXT_PUBLIC_MARKETPLACE_ADDRESS=0xFda7d0bA678F72BFCD25cF4082D541bc1C7Da7AA
PRIVATE_KEY=0x...
```

### web/.env.local (optional - for email)
```
RESEND_API_KEY=re_xxxxxxxxxxxxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
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
│   │   ├── profile/page.tsx        # User profile + email settings
│   │   ├── organizer/
│   │   │   ├── events/page.tsx     # My events list
│   │   │   ├── events/new/         # Create event form
│   │   │   ├── events/[id]/        # Manage event + edit
│   │   │   ├── events/[id]/attendees/ # Attendee list
│   │   │   ├── analytics/          # Analytics dashboard
│   │   │   └── check-in/           # QR scanner
│   │   └── api/                    # 19 API routes
│   ├── components/
│   │   ├── layout/nav.tsx          # Shared navigation
│   │   ├── wallet/                 # Wallet connection + dropdown
│   │   ├── tickets/                # Buy, list, QR components
│   │   ├── marketplace/            # Buy listed ticket
│   │   ├── organizer/              # Publish, withdraw, settings
│   │   ├── profile/                # Email settings component
│   │   └── ui/                     # Toast, loading modal, skeleton
│   ├── lib/
│   │   ├── wagmi.ts                # Wagmi config (Sepolia only)
│   │   ├── prisma.ts               # Prisma client singleton
│   │   ├── contracts.ts            # ABI definitions
│   │   ├── auth.ts                 # Session management
│   │   └── email/                  # Email templates & sender
│   │       └── index.ts            # Resend integration
│   └── prisma/
│       ├── schema.prisma           # Database schema
│       └── seed.mjs                # Seed script
└── docs/                           # Documentation (in web/docs/)
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

### Email notifications (non-blocking)
```typescript
// Example: Send email after purchase
if (user.email) {
  sendEmail({
    to: user.email,
    subject: `🎫 Ticket Confirmed - ${event.title}`,
    html: generateTicketPurchaseEmail({ ... }),
  }).catch((err) => console.error('Failed to send email:', err));
}
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

## Suggested Next Steps

If you want to continue improving this project, here are the recommended tasks:

### 1. IPFS Metadata Upload (High Impact)
- Integrate Pinata for real NFT metadata
- Upload event images to IPFS
- Generate proper metadata JSON for OpenSea display

### 2. Full-text Search (Medium Impact)
- Enable `pg_trgm` extension in Supabase
- Implement fuzzy search for events
- Add search by location

### 3. Coupon System (Medium Impact)
- Add Coupon model to Prisma schema
- Create coupon management UI for organizers
- Apply discounts during ticket purchase

### 4. Contract Verification (Quick Win)
- Verify contracts on Etherscan
- Increases project credibility

### 5. Deploy to Vercel (Quick Win)
- Set up Vercel deployment
- Configure environment variables
- Set up custom domain