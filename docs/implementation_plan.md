# TicketNFT — Implementation Plan

## Tổng quan

Hệ thống bán vé sự kiện NFT trên Sepolia testnet. Organizer tạo event, publish on-chain, user mua vé NFT, bán lại trên marketplace, check-in bằng QR.

## Kiến trúc

```
┌─────────────────────────────────────────────────┐
│                 Frontend (Next.js)               │
│  Pages: Landing, Events, Detail, Marketplace,    │
│  My Tickets, Profile, Organizer pages            │
│  Design: Pinterest-inspired (Inter font)         │
└────────────────────┬────────────────────────────┘
                     │ API Routes (17 endpoints)
┌────────────────────▼────────────────────────────┐
│              Backend (Prisma + Supabase)         │
│  Auth: Wallet signature (EIP-191)                │
│  DB: PostgreSQL (User, Event, Ticket, Order)     │
└────────────────────┬────────────────────────────┘
                     │ Server-side wallet + MetaMask
┌────────────────────▼────────────────────────────┐
│            Blockchain (Sepolia Testnet)          │
│  EventFactory → EventTicketNFT (per event)       │
│  TicketMarketplace (secondary market)            │
└─────────────────────────────────────────────────┘
```

## Smart Contracts

### EventTicketNFT (ERC-721 + ERC-2981)
- Multi-tier ticket support (General, VIP, VVIP)
- `mint()` — user mua vé (payable, requires exact price)
- `organizerMint()` — organizer airdrop (không trừ maxPerWallet)
- `useTicket()` — đánh dấu vé đã dùng (check-in)
- `setTransferable()` — khóa/chuyển nhượng
- `setEventEnded()` — kết thúc event
- `withdraw()` — rút doanh thu
- `getTierPrice()` / `getTokenTierId()` — getters cho marketplace

### EventFactory
- Factory pattern — mỗi event = 1 contract riêng
- `createEvent()` — deploy EventTicketNFT mới
- `getEventsByOrganizer()` — danh sách event theo organizer

### TicketMarketplace
- Secondary market với platform fee (2.5%) + royalty (5%)
- `listTicket()` — đăng bán (kiểm giá max 3x)
- `buyTicket()` — mua lại (tự động chia tiền)
- `cancelListing()` — huỷ đăng bán
- `updatePrice()` — cập nhật giá
- `setFeeRecipient()` / `setPlatformFee()` — owner settings

## Database Schema

```
User (id, walletAddress, role, name, avatar)
  └── Event (id, organizerId, contractAddress, title, category, venue, status)
       └── TicketTier (id, eventId, name, price, maxQuantity, soldCount, onchainTierId)
       └── Ticket (id, eventId, tierId, ownerId, tokenId, txHash, status, isUsed)
       └── Order (id, userId, eventId, totalAmount, txHash, status)
       └── Listing (id, ticketId, sellerId, price, status)
AuthNonce (id, walletAddress, nonce, message, expiresAt)
```

## Pages

| Page | URL | Type | Description |
|---|---|---|---|
| Landing | `/` | Server | Hero + Search + Featured + Categories |
| Events | `/events` | Server | Search + Filter + Grid + Pagination |
| Event Detail | `/events/[id]` | Server | Banner + Info + Map + Tiers + Share |
| Category | `/events/category/[name]` | Server | Banner + Filtered events |
| Marketplace | `/marketplace` | Server | Listed tickets + Buy |
| My Tickets | `/my-tickets` | Server | Ticket grid + QR + Resale |
| Profile | `/profile` | Server | Purchase history + Stats |
| My Events | `/organizer/events` | Server | Event list + Manage |
| Create Event | `/organizer/events/new` | Client | Multi-tier form + Category |
| Manage Event | `/organizer/events/[id]` | Server | Edit + Publish + Withdraw + Settings |
| Attendees | `/organizer/events/[id]/attendees` | Server | Attendee list + Check-in |
| Check-in | `/organizer/check-in` | Client | QR Scanner |

## API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/nonce` | No | Create sign-in challenge |
| POST | `/api/auth/verify` | No | Verify signature, set session |
| GET | `/api/auth/me` | Yes | Get current user |
| POST | `/api/auth/logout` | Yes | Clear session |
| GET | `/api/events` | No | List published events |
| POST | `/api/organizer/events` | Yes | Create event |
| POST | `/api/organizer/publish` | Yes | Publish on-chain (server-side) |
| POST | `/api/events/[id]/go-live` | Yes | Link contract to event |
| POST | `/api/events/[id]/status` | Yes | Update event status |
| POST | `/api/events/[id]/edit` | Yes | Edit event details |
| POST | `/api/tickets/mint` | Yes | Mint ticket (server-side) |
| POST | `/api/tickets/buy` | Yes | Sync ticket purchase |
| POST | `/api/tickets/check-in` | Yes | Check-in (on-chain + DB) |
| POST | `/api/marketplace/list` | Yes | List ticket for sale |
| POST | `/api/marketplace/buy` | Yes | Buy listed ticket |
| POST | `/api/marketplace/cancel` | Yes | Cancel listing (on-chain + DB) |

## Design System

- **Font**: Inter (400/500/600/700)
- **Primary color**: `#e60023` (Pinterest Red — CTA only)
- **Surfaces**: Warm cream (`#f6f6f3`, `#fbfbf9`, `#ffffff`)
- **Radius**: 16px (cards), 32px (modals), pill (circular)
- **Grid**: 4→3→2→1 columns responsive
- **Spacing**: 8px base, 64px section

## Environment Variables

### web/.env.local
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

### contracts/.env
```
SEPOLIA_RPC_URL=https://sepolia.drpc.org
PRIVATE_KEY=0x...
```
