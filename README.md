# 🎫 TicketNFT — NFT Event Ticketing Platform

> A decentralized event ticketing platform where event organizers can create events and sell NFT tickets, attendees can purchase and trade tickets on a secondary marketplace, and check-in is verified via blockchain.

### ✨ New Features (v1.1)
- **Email Notifications** — Purchase confirmations, listing alerts, sale notifications via Resend
- **Analytics Dashboard** — Revenue charts, ticket stats, event performance for organizers
- **Profile Email Settings** — Users can add email to receive notifications

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Smart Contracts](#smart-contracts)
- [Features](#features)
- [Quick Start](#quick-start)
- [API Endpoints](#api-endpoints)
- [Project Structure](#project-structure)
- [Smart Contract Addresses (Sepolia)](#smart-contract-addresses-sepolia)
- [Demo Script](#demo-script)
- [Known Limitations](#known-limitations)
- [Future Improvements](#future-improvements)

---

## Overview

TicketNFT reimagines event ticketing by minting each ticket as an ERC-721 NFT. This eliminates counterfeits, enables transparent resale with enforced royalties, and gives attendees true ownership of their tickets.

### Key Problems Solved

| Problem | Traditional Ticketing | TicketNFT |
|---------|----------------------|-----------|
| Counterfeits | Rampant paper/fake tickets | NFT on-chain proof of authenticity |
| Scalping | Uncontrolled resale at 10x | Price capped at 3x original |
| Royalties | Organizers get nothing from resale | ERC-2981 royalty enforcement |
| Check-in | QR codes can be duplicated | On-chain `useTicket` verification |
| Ownership | Ticket is "rented" from platform | NFT lives in your wallet |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Smart Contracts | Solidity 0.8.26, Hardhat, OpenZeppelin v5 |
| Blockchain | Sepolia Testnet (Ethereum L2) |
| Frontend | Next.js 16, TypeScript, Wagmi, Viem, RainbowKit |
| Database | PostgreSQL (Supabase), Prisma ORM |
| Auth | Wallet-based (EIP-191 signature) |
| Email | Resend |
| Design | Pinterest-inspired design system (Inter font) |

---

## Architecture

TicketNFT follows a 3-layer architecture:

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js)                         │
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │  Events   │  │  Tickets │  │  Market  │  │  Organizer       │   │
│  │  Browser  │  │  Wallet  │  │  Place   │  │  Dashboard       │   │
│  └────┬──────┘  └────┬─────┘  └────┬─────┘  └────────┬─────────┘   │
│       │              │              │                  │             │
│       └──────────────┴──────┬───────┴──────────────────┘             │
│                             │                                       │
│                    ┌────────▼────────┐                               │
│                    │  Wagmi + Viem   │  ← Wallet connection         │
│                    │  RainbowKit     │  ← Transaction signing       │
│                    └────────┬────────┘                               │
│                             │                                       │
├─────────────────────────────┼───────────────────────────────────────┤
│                             │                                       │
│                      ┌──────▼──────┐                                │
│                      │  API Routes │  ← Next.js API layer           │
│                      │  (Prisma)   │  ← PostgreSQL via Supabase     │
│                      └──────┬──────┘                                │
│                             │                                       │
├─────────────────────────────┼───────────────────────────────────────┤
│                             │                                       │
│                     ┌───────▼────────┐                               │
│                     │  Smart         │                               │
│                     │  Contracts     │  ← Deployed on Sepolia       │
│                     │  (Solidity)    │                               │
│                     └───────┬────────┘                               │
│                             │                                       │
│  ┌──────────────────┐  ┌────▼─────────────┐  ┌──────────────────┐  │
│  │  EventTicketNFT  │  │  EventFactory    │  │ TicketMarketplace│  │
│  │  (ERC-721)       │  │  (Factory)       │  │ (Secondary Mkt)  │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
│                                                                     │
│                         BLOCKCHAIN                                  │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Event Creation**: Organizer creates event in DB → publishes on-chain via `EventFactory.createEvent()`
2. **Ticket Purchase**: User connects wallet → API creates order → smart contract mints NFT → DB records ticket
3. **Resale**: Owner lists ticket → `TicketMarketplace.listTicket()` → buyer calls `buyTicket()` → ownership transfers
4. **Check-in**: Organizer scans QR → API calls `EventTicketNFT.useTicket()` → ticket marked as used on-chain

---

## Smart Contracts

### EventTicketNFT (`ERC-721 + ERC-2981`)

Each event deploys its own NFT contract. Each ticket is a unique token with:

- Metadata URI (IPFS) for rich ticket info
- Royalty info (ERC-2981) — enforced on secondary sales
- `useTicket()` — marks a ticket as used (check-in)
- Tier-based pricing and supply limits

```solidity
// Key functions
function mintTicket(address to, uint256 tierId, string memory tokenURI) external returns (uint256);
function useTicket(uint256 tokenId) external;
function getTicketTier(uint256 tokenId) external view returns (uint256);
function royaltyInfo(uint256 tokenId, uint256 salePrice) external view returns (address, uint256);
```

### EventFactory

Factory pattern for deploying new `EventTicketNFT` contracts:

```solidity
// Key functions
function createEvent(
    string memory name,
    string memory symbol,
    address royaltyReceiver,
    uint96 royaltyFeeNumerator
) external returns (address);

function getEvent(uint256 index) external view returns (address);
function eventCount() external view returns (uint256);
```

### TicketMarketplace

Secondary marketplace with platform fee + royalty enforcement:

```solidity
// Key functions
function listTicket(address nftContract, uint256 tokenId, uint256 price) external;
function buyTicket(address nftContract, uint256 tokenId) external payable;
function cancelListing(address nftContract, uint256 tokenId) external;
function getListing(address nftContract, uint256 tokenId) external view returns (Listing memory);
```

- **Platform fee**: 2.5% of sale price
- **Royalty**: Enforced via ERC-2981 `royaltyInfo()`
- **Price cap**: Resale limited to 3x original price (enforced off-chain)

---

## Features

### For Organizers

- 🎯 **Create Events** — Define title, description, venue, dates, and multiple ticket tiers
- 📦 **Publish On-Chain** — Deploy NFT contract via `EventFactory` with one click
- 📊 **Monitor Sales** — Real-time dashboard showing tickets sold per tier
- 👥 **Attendee List** — View all ticket holders with wallet addresses
- ✅ **Check-In** — Scan QR codes and verify on-chain ownership via `useTicket()`
- 💰 **Withdraw Revenue** — Pull funds from smart contract to organizer wallet

### For Users

- 🔍 **Browse Events** — Search and filter events by category
- 🎟️ **Buy NFT Tickets** — Purchase with MetaMask on Sepolia testnet
- 📱 **View Tickets** — See all owned tickets with QR codes
- 🔄 **Resale** — List tickets on marketplace (price capped at 3x original)
- 🛒 **Secondary Market** — Buy listed tickets from other users
- 👤 **Profile** — View wallet info, stats, and purchase history

### Shared

- 🔐 **Wallet Auth** — Sign in with MetaMask (EIP-191)
- 🌙 **Dark Mode** — Full dark theme support
- 📱 **Responsive** — Works on desktop and mobile
- 🔔 **Toast Notifications** — Real-time feedback on actions
- 🔗 **Share Events** — Copy link + social sharing (Twitter/X, Facebook)

---

## Quick Start

### Prerequisites

- **Node.js** 20+
- **MetaMask** browser extension
- **Sepolia testnet ETH** — get from [Sepolia Faucet](https://sepoliafaucet.com/)
- **Supabase** account (for PostgreSQL) or local PostgreSQL

### 1. Clone & Install

```bash
git clone https://github.com/your-username/TicketNFT.git
cd TicketNFT

# Install contract dependencies
cd contracts
npm install

# Install web app dependencies
cd ../web
npm install
```

### 2. Environment Setup

**Contracts** (`contracts/.env`):

```env
SEPOLIA_RPC_URL=https://rpc.sepolia.org
DEPLOYER_PRIVATE_KEY=your_private_key_here
```

**Web App** (`web/.env.local`):

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/ticketnft

# Auth
AUTH_SECRET=your-random-secret-min-32-chars

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Blockchain
NEXT_PUBLIC_EVENT_FACTORY_ADDRESS=0x316654424537D288670070454f87bf3547341f6C
NEXT_PUBLIC_MARKETPLACE_ADDRESS=0xFda7d0bA678F72BFCD25cF4082D541bc1C7Da7AA
NEXT_PUBLIC_CHAIN_ID=11155111
```

### 3. Database Setup

```bash
cd web

# Generate Prisma client
npm run prisma:generate

# Push schema to database
npm run prisma:push

# (Optional) Open Prisma Studio to inspect data
npm run prisma:studio
```

### 4. Deploy Contracts (Optional — Already Deployed)

```bash
cd contracts

# Deploy all contracts to Sepolia
npx hardhat run scripts/deploy.ts --network sepolia
```

### 5. Run Development Server

```bash
cd web
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/auth/nonce` | Generate a sign-in nonce for a wallet address |
| `POST` | `/api/auth/verify` | Verify EIP-191 signature and create session |
| `POST` | `/api/auth/logout` | Clear session cookie |
| `GET` | `/api/auth/me` | Get current authenticated user info |

### Events

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/events` | List all published events (with pagination) |
| `GET` | `/api/events/[id]` | Get event details by ID |
| `PUT` | `/api/events/[id]/edit` | Update event details (organizer only) |
| `POST` | `/api/events/[id]/status` | Update event status (DRAFT/PUBLISHED/ENDED) |
| `POST` | `/api/events/[id]/go-live` | Publish event on-chain (deploy NFT contract) |

### Organizer

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/organizer/events` | List events for current organizer |
| `POST` | `/api/organizer/events` | Create a new event with ticket tiers |
| `POST` | `/api/organizer/publish` | Publish event to blockchain |

### Tickets

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/tickets/buy` | Purchase a ticket (creates order + mints NFT) |
| `POST` | `/api/tickets/mint` | Mint NFT ticket on-chain |
| `POST` | `/api/tickets/check-in` | Verify and mark ticket as used |

### Marketplace

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/marketplace/list` | List a ticket for resale |
| `POST` | `/api/marketplace/buy` | Buy a listed ticket from marketplace |
| `POST` | `/api/marketplace/cancel` | Cancel a marketplace listing |

### Utility

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check endpoint |
| `POST` | `/api/ipfs` | Upload metadata to IPFS |

---

## Project Structure

```
TicketNFT/
├── contracts/                          # Smart contracts (Hardhat)
│   ├── contracts/
│   │   ├── EventTicketNFT.sol          # ERC-721 + ERC-2981 ticket NFT
│   │   ├── EventFactory.sol            # Factory for creating event contracts
│   │   └── TicketMarketplace.sol       # Secondary marketplace
│   ├── scripts/
│   │   ├── deploy.ts                   # Deploy all contracts
│   │   ├── createEvent.ts              # Create event via factory
│   │   └── split-funds.ts              # Fund splitting utility
│   ├── test/                           # Contract tests
│   ├── artifacts/                      # Compiled contract artifacts
│   ├── typechain-types/                # TypeScript bindings
│   ├── hardhat.config.ts               # Hardhat configuration
│   └── package.json
│
├── web/                                # Next.js frontend + API
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── nonce/              # Generate sign-in nonce
│   │   │   │   ├── verify/             # Verify wallet signature
│   │   │   │   ├── logout/             # Clear session
│   │   │   │   └── me/                 # Current user info
│   │   │   ├── events/
│   │   │   │   ├── route.ts            # List events
│   │   │   │   └── [id]/
│   │   │   │       ├── edit/           # Edit event
│   │   │   │       ├── go-live/        # Publish on-chain
│   │   │   │       └── status/         # Update status
│   │   │   ├── organizer/
│   │   │   │   ├── events/             # CRUD for organizer events
│   │   │   │   └── publish/            # On-chain publishing
│   │   │   ├── tickets/
│   │   │   │   ├── buy/                # Purchase ticket
│   │   │   │   ├── mint/               # Mint NFT
│   │   │   │   └── check-in/           # Verify ticket
│   │   │   ├── marketplace/
│   │   │   │   ├── list/               # List for resale
│   │   │   │   ├── buy/                # Buy from marketplace
│   │   │   │   └── cancel/             # Cancel listing
│   │   │   ├── ipfs/                   # IPFS metadata upload
│   │   │   └── health/                 # Health check
│   │   ├── events/
│   │   │   ├── page.tsx                # Browse events
│   │   │   └── [id]/page.tsx           # Event detail
│   │   ├── marketplace/page.tsx        # Secondary marketplace
│   │   ├── my-tickets/page.tsx         # User's tickets
│   │   ├── profile/page.tsx            # User profile & stats
│   │   ├── organizer/
│   │   │   ├── events/
│   │   │   │   ├── page.tsx            # Organizer events list
│   │   │   │   ├── new/page.tsx        # Create event form
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx        # Event management
│   │   │   │       └── attendees/      # Attendee list
│   │   │   └── check-in/page.tsx       # QR check-in scanner
│   │   ├── layout.tsx                  # Root layout
│   │   ├── page.tsx                    # Homepage
│   │   ├── providers.tsx               # RainbowKit + Wagmi providers
│   │   └── globals.css                 # Design system CSS
│   ├── components/
│   │   ├── events/
│   │   │   ├── event-card.tsx          # Event card component
│   │   │   └── share-button.tsx        # Share event (copy + social)
│   │   ├── layout/
│   │   │   └── nav.tsx                 # Navigation bar
│   │   ├── tickets/
│   │   │   ├── buy-ticket-button.tsx   # Buy ticket flow
│   │   │   ├── list-ticket-button.tsx  # List on marketplace
│   │   │   └── ticket-qr.tsx           # QR code display
│   │   ├── marketplace/               # Marketplace components
│   │   ├── organizer/                 # Organizer components
│   │   ├── wallet/
│   │   │   └── connect-wallet-button.tsx
│   │   └── ui/
│   │       ├── toast.tsx               # Toast notification system
│   │       ├── skeleton.tsx            # Loading skeletons
│   │       └── loading-modal.tsx       # Transaction loading modal
│   ├── hooks/
│   │   └── use-wallet-auth.ts          # Wallet authentication hook
│   ├── lib/
│   │   ├── auth.ts                     # Session token management
│   │   ├── prisma.ts                   # Prisma client singleton
│   │   ├── contracts.ts                # Contract ABIs & addresses
│   │   └── wagmi.ts                    # Wagmi configuration
│   ├── prisma/
│   │   └── schema.prisma               # Database schema
│   ├── scripts/
│   │   ├── demo-setup.mjs              # Demo data seeder
│   │   ├── link-event-contract.mjs     # Link DB event to contract
│   │   └── reset-blockchain-link.mjs   # Reset contract links
│   └── package.json
│
├── docs/                               # Documentation
├── DESIGN.md                           # Pinterest design system spec
└── README.md                           # This file
```

---

## Smart Contract Addresses (Sepolia)

| Contract | Address |
|----------|---------|
| EventFactory | `0x316654424537D288670070454f87bf3547341f6C` |
| TicketMarketplace | `0xFda7d0bA678F72BFCD25cF4082D541bc1C7Da7AA` |

> **Note**: Each event gets its own `EventTicketNFT` contract deployed via the factory. Check the `Event.contractAddress` field in the database or the event detail page for specific event contract addresses.

### Block Explorer

- [EventFactory on Etherscan](https://sepolia.etherscan.io/address/0x316654424537D288670070454f87bf3547341f6C)
- [TicketMarketplace on Etherscan](https://sepolia.etherscan.io/address/0xFda7d0bA678F72BFCD25cF4082D541bc1C7Da7AA)

---

## Demo Script

This demo uses 3 wallets to showcase the full ticket lifecycle.

### Prerequisites

- 3 MetaMask wallets on Sepolia testnet
- Wallet 1 (Organizer): Has Sepolia ETH for gas
- Wallet 2 (User A): Has Sepolia ETH for ticket purchase
- Wallet 3 (User B): Has Sepolia ETH for marketplace purchase

### Step 1: Organizer Creates an Event

```
Wallet: Organizer (Wallet 1)

1. Connect Wallet 1 → Sign in
2. Navigate to /organizer/events/new
3. Fill in event details:
   - Title: "Web3 Music Festival 2025"
   - Venue: "Decentraland Arena"
   - Date: [future date]
   - Description: "A music festival celebrating Web3 culture"
4. Add ticket tiers:
   - General Admission: 0.01 ETH, 100 tickets
   - VIP: 0.05 ETH, 20 tickets
5. Click "Create Event"
6. On the event management page, click "Publish On-Chain"
7. Confirm the MetaMask transaction
8. Wait for contract deployment → Event is now LIVE
```

### Step 2: User A Buys a Ticket

```
Wallet: User A (Wallet 2)

1. Connect Wallet 2 → Sign in
2. Navigate to /events
3. Click on "Web3 Music Festival 2025"
4. Select "General Admission" tier
5. Click "Buy Ticket"
6. Confirm MetaMask transaction (0.01 ETH + gas)
7. Wait for minting → Ticket appears in /my-tickets
8. Click ticket to view QR code
```

### Step 3: User A Lists Ticket on Marketplace

```
Wallet: User A (Wallet 2)

1. Navigate to /my-tickets
2. Find the General Admission ticket
3. Click "List on Marketplace"
4. Set resale price: 0.02 ETH (within 3x limit)
5. Confirm MetaMask transaction
6. Ticket is now listed on /marketplace
```

### Step 4: User B Buys from Marketplace

```
Wallet: User B (Wallet 3)

1. Connect Wallet 3 → Sign in
2. Navigate to /marketplace
3. Find the listed General Admission ticket
4. Click "Buy"
5. Confirm MetaMask transaction (0.02 ETH + gas)
6. Ticket transfers to Wallet 3
7. User A receives payment minus platform fee + royalty
```

### Step 5: Check-In at Event

```
Wallet: Organizer (Wallet 1)

1. Navigate to /organizer/check-in
2. User B shows QR code from /my-tickets
3. Organizer scans QR code
4. System verifies on-chain ownership
5. Click "Check In" → `useTicket()` is called
6. Ticket status: "Used ✅"
```

---

## Database Schema

```prisma
enum UserRole   { USER  ORGANIZER  ADMIN }
enum EventStatus { DRAFT  PUBLISHED  ONGOING  ENDED  CANCELLED }
enum TicketStatus { MINTED  LISTED  SOLD  USED  EXPIRED }
enum OrderStatus  { PENDING  CONFIRMED  FAILED  REFUNDED }
enum ListingStatus { ACTIVE  SOLD  CANCELLED }

model User        { id, walletAddress, email, name, avatar, role }
model Event       { id, organizerId, contractAddress, title, description, category, venue, startDate, endDate, status, chainId }
model TicketTier  { id, eventId, onchainTierId, name, price, maxQuantity, soldCount }
model Ticket      { id, eventId, tierId, ownerId, tokenId, txHash, status, isUsed, qrCode }
model Order       { id, userId, eventId, totalAmount, txHash, paymentMethod, status }
model Listing     { id, ticketId, eventId, sellerId, price, status }
model AuthNonce   { id, walletAddress, nonce, message, expiresAt }
```

---

## Design System

TicketNFT uses a Pinterest-inspired design system defined in `DESIGN.md` and implemented in `globals.css`.

### Typography

| Token | Size | Weight | Use |
|-------|------|--------|-----|
| `text-display-xl` | 70px | 700 | Hero headlines |
| `text-display-lg` | 44px | 700 | Page titles |
| `text-heading-xl` | 28px | 700 | Section headers |
| `text-heading-lg` | 22px | 600 | Subsection headers |
| `text-body-md` | 16px | 400 | Body text |
| `text-body-sm` | 14px | 400 | Secondary text |
| `text-caption-md` | 12px | 500 | Labels, captions |

### Components

- `.btn-primary` — Filled button (red background)
- `.btn-secondary` — Outlined button
- `.btn-tertiary` — Text-only button
- `.card` — Elevated card with border radius
- `.chip` — Filter/status chip
- `.card-feature-soft` — Soft background feature card
- `.event-card-*` — Event card elements

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `AUTH_SECRET` | ✅ | Secret for session token signing (min 32 chars) |
| `NEXT_PUBLIC_APP_URL` | ✅ | App base URL (e.g., `http://localhost:3000`) |
| `NEXT_PUBLIC_EVENT_FACTORY_ADDRESS` | ✅ | EventFactory contract address |
| `NEXT_PUBLIC_MARKETPLACE_ADDRESS` | ✅ | TicketMarketplace contract address |
| `NEXT_PUBLIC_CHAIN_ID` | ✅ | Chain ID (`11155111` for Sepolia) |
| `SEPOLIA_RPC_URL` | ✅ | Sepolia RPC endpoint (contracts only) |
| `DEPLOYER_PRIVATE_KEY` | ✅ | Deployer wallet private key (contracts only) |

---

## Available Scripts

### Web App (`web/`)

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:push` | Push schema to database |
| `npm run prisma:migrate` | Run Prisma migrations |
| `npm run prisma:studio` | Open Prisma Studio |
| `npm run prisma:seed` | Seed demo data |
| `npm run demo:setup` | Full demo setup (seed + link contracts) |
| `npm run event:link:contract` | Link event to deployed contract |
| `npm run reset:chain` | Reset blockchain links |

### Contracts (`contracts/`)

| Script | Description |
|--------|-------------|
| `npx hardhat compile` | Compile contracts |
| `npx hardhat test` | Run contract tests |
| `npx hardhat run scripts/deploy.ts --network sepolia` | Deploy to Sepolia |

---

## Known Limitations

1. **Single Chain** — Currently deployed only on Sepolia testnet. Mainnet deployment requires gas cost considerations.

2. **IPFS Metadata** — Metadata upload to IPFS is stubbed. In production, use Pinata or NFT.Storage for persistent storage.

3. **Fiat Payments** — Only crypto payments (POL/ETH) are supported. Stripe or other fiat on-ramps are not integrated.

4. **No Email Notifications** — Users are not notified of purchases, listings, or event updates via email.

5. **QR Code Security** — QR codes encode ticket data but don't include cryptographic signatures. A determined attacker could screenshot and share QR codes.

6. **Price Cap Enforcement** — The 3x resale price cap is enforced at the API level, not on-chain. A malicious user could interact directly with the marketplace contract to bypass this.

7. **No Multi-Sig** — Organizer revenue withdrawal is single-signature. No multi-sig or timelock for large withdrawals.

8. **Limited Search** — Event search is basic text matching on title. No full-text search, geolocation, or date range filtering.

9. **No Mobile App** — Web-only responsive design. No native iOS/Android app.

10. **Gas Estimation** — Transaction gas estimates may be inaccurate on congested networks.

---

## Future Improvements

### Short Term

- [ ] Add IPFS metadata upload (Pinata integration)
- [ ] Implement event categories DB filtering
- [ ] Add email notifications for purchases
- [ ] Improve search with full-text search (pg_trgm)
- [ ] Add ticket transfer functionality (gift a ticket)

### Medium Term

- [ ] Deploy to Polygon mainnet
- [ ] Add ERC-4337 account abstraction (gasless transactions)
- [ ] Implement ticket bundles (buy multiple at once)
- [ ] Add event analytics dashboard for organizers
- [ ] Stripe fiat on-ramp via MoonPay/Transak

### Long Term

- [ ] Mobile app (React Native)
- [ ] DAO governance for platform fees
- [ ] Cross-chain ticket bridging
- [ ] Dynamic NFTs (ticket art changes after check-in)
- [ ] Loyalty rewards for frequent attendees
- [ ] Integration with decentralized identity (ENS, Lens)

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License.

---

## Acknowledgments

- [OpenZeppelin](https://www.openzeppelin.com/) — Secure smart contract libraries
- [RainbowKit](https://rainbowkit.com/) — Wallet connection UI
- [Wagmi](https://wagmi.sh/) — React hooks for Ethereum
- [Viem](https://viem.sh/) — TypeScript interface for Ethereum
- [Prisma](https://www.prisma.io/) — Next-generation ORM
- [Next.js](https://nextjs.org/) — React framework
