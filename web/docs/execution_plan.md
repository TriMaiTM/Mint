# TicketNFT — Execution Plan & Status

## Dự án

Hệ thống bán vé sự kiện NFT — Organizer tạo event, publish on-chain, user mua vé NFT, bán lại trên marketplace, check-in bằng QR.

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
| Design | Pinterest-inspired (Inter font, warm cream palette) |

## Trạng thái hiện tại

### ✅ Phase 1: Smart Contracts (100%)

- [x] EventTicketNFT.sol — ERC-721 + ERC-2981, multi-tier, useTicket, transfer control, withdraw
- [x] EventFactory.sol — Factory pattern, tạo event contract riêng biệt
- [x] TicketMarketplace.sol — Secondary market, platform fee, royalty enforcement, max price limit (3x)
- [x] Unit tests — 20 tests pass
- [x] Deploy script — Sepolia testnet
- [x] getTierPrice(), getTokenTierId() getters

### ✅ Phase 2: Web Core (100%)

- [x] Next.js 16 + TypeScript + App Router
- [x] Wagmi + Viem + RainbowKit + TanStack Query
- [x] Prisma schema + Supabase PostgreSQL
- [x] Wallet auth (nonce → verify → session cookie)
- [x] Role-based access (USER / ORGANIZER / ADMIN)

### ✅ Phase 3: Core Product Flows (100%)

- [x] Create event (multi-tier, category, venue, banner)
- [x] Publish on-chain (server-side, bypass MetaMask RPC issues)
- [x] Buy ticket (MetaMask direct `eth_sendTransaction`)
- [x] My Tickets + QR code generation
- [x] Marketplace (list, buy, cancel — all on-chain + DB sync)
- [x] Check-in (on-chain `useTicket()` + DB update)
- [x] Withdraw funds from contract
- [x] Resale with price limit (max 3x original, enforced in smart contract)

### ✅ Phase 4: UI/UX (100%)

- [x] Pinterest-inspired design system (CSS variables, Inter font)
- [x] Landing page (Hero + Search + Featured Events + Categories + How It Works)
- [x] Events page (Search + Filter chips + Masonry grid + Pagination)
- [x] Event detail (Banner + Info + Organizer + Tiers + Location Map + Share)
- [x] Marketplace (Listed tickets + Buy button)
- [x] My Tickets (Ticket grid + QR + Resale modal)
- [x] Profile page (Purchase history + Stats + Email settings)
- [x] Organizer pages (My Events, Create Event, Manage Event, Attendees, Check-in)
- [x] Wallet dropdown (Address copy, Role badge, Network, Profile link, Sign out)
- [x] Loading modal (Spinner + message for all blockchain operations)
- [x] Toast notifications (Success/Error/Info)
- [x] Skeleton components
- [x] Responsive design (4→3→2→1 columns)
- [x] Category system (Music, Tech, Food, Sports, Art, Business, General)
- [x] Category pages with banner + filtered events
- [x] Google Maps embed on event detail
- [x] Event edit form
- [x] Equal-height cards with aligned buttons

### ✅ Phase 5: Email Notifications (100%)

- [x] Resend integration (`lib/email/index.ts`)
- [x] Ticket purchase confirmation email
- [x] Ticket listing notification email
- [x] Ticket sold notification (to seller)
- [x] Marketplace purchase notification (to buyer)
- [x] Email settings component in profile page
- [x] Profile API for email management (`/api/profile`)

### ✅ Phase 6: Analytics Dashboard (100%)

- [x] Analytics API endpoint (`/api/organizer/analytics`)
- [x] Overview cards (Events, Tickets, Revenue, Marketplace)
- [x] Daily revenue chart (last 7 days)
- [x] Revenue by event table
- [x] Ticket inventory by tier (progress bars)
- [x] Quick actions navigation
- [x] Analytics link in navigation

### ⬜ Phase 7: Documentation (Chưa hoàn thành)

- [ ] Update execution plan với features mới
- [ ] Update run guide với env variables mới
- [ ] Update demo script với email notifications
- [ ] Update AI agent handoff prompt

## Smart Contracts (Sepolia)

| Contract | Address |
|---|---|
| EventFactory | `0x316654424537D288670070454f87bf3547341f6C` |
| TicketMarketplace | `0xFda7d0bA678F72BFCD25cF4082D541bc1C7Da7AA` |

## Pages

| Page | URL | Status |
|---|---|---|
| Landing | `/` | ✅ |
| Events | `/events` | ✅ |
| Event Detail | `/events/[id]` | ✅ |
| Category | `/events/category/[name]` | ✅ |
| Marketplace | `/marketplace` | ✅ |
| My Tickets | `/my-tickets` | ✅ |
| Profile | `/profile` | ✅ |
| My Events | `/organizer/events` | ✅ |
| Analytics | `/organizer/analytics` | ✅ |
| Create Event | `/organizer/events/new` | ✅ |
| Manage Event | `/organizer/events/[id]` | ✅ |
| Attendees | `/organizer/events/[id]/attendees` | ✅ |
| Check-in | `/organizer/check-in` | ✅ |

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/nonce` | Create sign-in challenge |
| POST | `/api/auth/verify` | Verify signature, set session |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/logout` | Clear session |
| GET | `/api/events` | List published events |
| POST | `/api/organizer/events` | Create event |
| POST | `/api/organizer/publish` | Publish event on-chain (server-side) |
| POST | `/api/events/[id]/go-live` | Link contract to event |
| POST | `/api/events/[id]/status` | Update event status |
| POST | `/api/events/[id]/edit` | Edit event details |
| POST | `/api/tickets/mint` | Mint ticket (server-side) |
| POST | `/api/tickets/buy` | Sync ticket purchase to DB + send email |
| POST | `/api/tickets/check-in` | Check-in attendee (on-chain + DB) |
| POST | `/api/marketplace/list` | List ticket for sale + send email |
| POST | `/api/marketplace/buy` | Buy listed ticket + send emails |
| POST | `/api/marketplace/cancel` | Cancel listing (on-chain + DB) |
| GET | `/api/profile` | Get user profile with email |
| PUT | `/api/profile` | Update user email/name/avatar |
| GET | `/api/organizer/analytics` | Get organizer analytics data |

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
└── docs/                           # Documentation
```

## Những gì chưa hoàn thành (Future Improvements)

### Ưu tiên cao
- [ ] IPFS metadata upload (Pinata) — NFT metadata thực tế
- [ ] Contract verification trên Etherscan
- [ ] Deploy lên Vercel (production)

### Ưu tiên trung bình
- [ ] Full-text search (pg_trgm) — Tìm kiếm tốt hơn
- [ ] Coupon system — Mã giảm giá
- [ ] Event edit form nâng cao (video banner, FAQ, lịch trình)
- [ ] Export CSV — Xuất danh sách attendees
- [ ] Framer Motion animations

### Ưu tiên thấp
- [ ] E2E tests (Playwright/Cypress)
- [ ] Admin panel — Platform overview
- [ ] Ticket transfer — Chuyển vé cho người khác
- [ ] Email reminders — Nhắc nhở trước sự kiện
- [ ] Sự kiện trực tuyến (Zoom integration)
- [ ] Mobile app (React Native)