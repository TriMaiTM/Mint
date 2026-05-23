# TicketNFT — Tài liệu Kiến trúc & Thiết kế Chi tiết (Implementation Plan)

Tài liệu này cung cấp cái nhìn chi tiết về kiến trúc hệ thống, cấu trúc cơ sở dữ liệu, luồng dữ liệu nghiệp vụ nâng cao và các mẫu thiết kế của dự án **TicketNFT**.

---

## 1. Sơ đồ Kiến trúc Hệ thống

```
┌────────────────────────────────────────────────────────┐
│                   Giao diện (Frontend)                 │
│  - Trang Công khai: Landing, Events (Fuzzy Search),    │
│    Event Detail (Timeline Agenda, Accordion FAQs)      │
│  - Trang Cá nhân: My Tickets (Signed QR), Profile      │
│  - Chợ thứ cấp: Marketplace                            │
│  - Bảng điều khiển:                                    │
│    + /organizer (Sidebar, Analytics, Check-in Premium) │
│    + /admin (Sidebar, Stats, User Roles, Settings)     │
└──────────────────────────┬─────────────────────────────┘
                           │ API Requests (JSON / HTTP)
┌──────────────────────────▼─────────────────────────────┐
│                    Máy chủ (API Routes)                │
│  - Xác thực: Wallet signature EIP-191, session cookie  │
│  - IPFS: Pinata SDK upload JSON metadata              │
│  - Email: Resend SDK gửi thư tự động không đồng bộ     │
│  - Nghiệp vụ: Cập nhật DB, đối soát giao dịch on-chain │
└──────────────────────────┬─────────────────────────────┘
                           │ Prisma / Private Key
┌──────────────────────────▼─────────────────────────────┐
│               Tầng Dữ liệu & Chuỗi Khối                │
│  - Database: PostgreSQL (Supabase) với GIN Indexes      │
│  - Smart Contracts (Sepolia):                          │
│    + EventFactory -> Deploy EventTicketNFT             │
│    + TicketMarketplace (Secondary Market, Royalty)     │
└────────────────────────────────────────────────────────┘
```

---

## 2. Thiết kế Cơ sở Dữ liệu (Prisma Schema)

Cấu trúc cơ sở dữ liệu được mở rộng để lưu trữ thông tin coupon, lịch trình sự kiện (agenda), câu hỏi thường gặp (FAQs), và ghi nhận chi tiết giao dịch.

```prisma
model User {
  id            String    @id @default(cuid())
  walletAddress String    @unique
  email         String?   @unique
  name          String?
  avatar        String?
  role          Role      @default(USER)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  events        Event[]   @relation("OrganizerEvents")
  tickets       Ticket[]  @relation("OwnerTickets")
  orders        Order[]
  listings      Listing[] @relation("SellerListings")
}

model Event {
  id              String       @id @default(cuid())
  organizerId     String
  contractAddress String?      @unique
  title           String
  description     String
  bannerUrl       String
  category        String
  venue           String
  startDate       DateTime
  endDate         DateTime
  status          EventStatus  @default(DRAFT)
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
  organizer       User         @relation("OrganizerEvents", fields: [organizerId], references: [id])
  tiers           TicketTier[]
  tickets         Ticket[]
  orders          Order[]
  coupons         Coupon[]
  agenda          AgendaItem[]
  faqs            FAQ[]
}

model TicketTier {
  id             String   @id @default(cuid())
  eventId        String
  name           String
  price          String // Lưu dưới dạng ETH/POL string
  maxQuantity    Int
  soldCount      Int      @default(0)
  onchainTierId  Int
  event          Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  tickets        Ticket[]
}

model Ticket {
  id        String       @id @default(cuid())
  eventId   String
  tierId    String
  ownerId   String
  tokenId   Int?
  txHash    String?      @unique
  tokenURI  String?
  status    TicketStatus @default(MINTING)
  isUsed    Boolean      @default(false)
  createdAt DateTime     @default(now())
  event     Event        @relation(fields: [eventId], references: [id])
  tier      TicketTier   @relation(fields: [tierId], references: [id])
  owner     User         @relation("OwnerTickets", fields: [ownerId], references: [id])
}

model Order {
  id          String      @id @default(cuid())
  userId      String
  eventId     String
  couponId    String?
  totalAmount String // Số tiền thanh toán thực tế
  txHash      String?     @unique
  status      OrderStatus @default(PENDING)
  createdAt   DateTime    @default(now())
  user        User        @relation(fields: [userId], references: [id])
  event       Event       @relation(fields: [eventId], references: [id])
  coupon      Coupon?     @relation(fields: [couponId], references: [id])
}

model Coupon {
  id          String     @id @default(cuid())
  eventId     String
  code        String     // Mã coupon viết hoa
  type        CouponType @default(PERCENTAGE)
  value       Float      // Phần trăm (0-100) hoặc số tiền cố định
  maxUses     Int        // Số lượt sử dụng tối đa
  usedCount   Int        @default(0)
  createdAt   DateTime   @default(now())
  event       Event      @relation(fields: [eventId], references: [id], onDelete: Cascade)
  orders      Order[]
}

model AgendaItem {
  id          String   @id @default(cuid())
  eventId     String
  time        String   // Ví dụ "09:00 - 10:00"
  title       String
  description String?
  speaker     String?
  createdAt   DateTime @default(now())
  event       Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
}

model FAQ {
  id        String   @id @default(cuid())
  eventId   String
  question  String
  answer    String
  createdAt DateTime @default(now())
  event     Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
}

model Listing {
  id        String        @id @default(cuid())
  ticketId  String
  sellerId  String
  price     String        // Giá bán lại (Wei)
  status    ListingStatus @default(ACTIVE)
  createdAt DateTime      @default(now())
  seller    User          @relation("SellerListings", fields: [sellerId], references: [id])
}
```

---

## 3. Thiết kế Luồng Nghiệp Vụ Chính (Core Flow Design)

### 3.1. Luồng Mua Vé Bằng Coupon Giảm Giá < 100% (Direct Transfer)
Để giảm chi phí gas cho hợp đồng và tối ưu hóa việc phân chia doanh thu trực tiếp cho Organizer:
1.  **Client:**
    *   Người dùng áp dụng coupon giảm giá (Ví dụ: Giảm 50% từ `0.02 POL` còn `0.01 POL`).
    *   Client gọi MetaMask yêu cầu chuyển khoản trực tiếp `0.01 POL` từ ví người mua tới địa chỉ **Ví của Organizer** (đã cấu hình trong DB).
    *   Giao dịch chuyển khoản thành công on-chain, client nhận được `txHash`.
    *   Client gửi request gồm `txHash`, `eventId`, `tierId`, và `couponCode` sang `/api/tickets/mint`.
2.  **Server API:**
    *   Server truy vấn RPC Sepolia để lấy thông tin giao dịch của `txHash` vừa gửi.
    *   Xác thực: Trạng thái giao dịch phải thành công (`status === "success"`), địa chỉ nhận tiền phải trùng với ví của Organizer sự kiện đó, và số tiền gửi phải lớn hơn hoặc bằng mức giá sau giảm giá.
    *   Kiểm tra cơ sở dữ liệu: Đảm bảo `txHash` chưa từng được sử dụng để tránh lỗi tấn công phát lại (Replay attack).
    *   Server dùng ví hệ thống gọi hàm `organizerMint()` trên hợp đồng thông minh để tạo vé NFT không tốn gas cho người mua.
    *   Ghi nhận `Order` và `Ticket` vào Database.

### 3.2. Soát Vé Bằng QR Code Động (Secure QR Code Flow)
Ngăn chặn hành vi gian lận sao chép ảnh chụp màn hình QR code:
1.  **Client (Người dùng hiển thị vé):**
    *   Yêu cầu ví cá nhân ký thông điệp offline (EIP-191): `Verify ownership of Ticket #[tokenId] at timestamp: [timestamp]`.
    *   Sinh mã QR chứa JSON gồm: `ticketId`, `tokenId`, `owner`, `timestamp`, `signature`.
    *   Vòng lặp client tự động đếm ngược 60 giây, sau 60 giây bắt đầu mờ đi và yêu cầu người dùng bấm "Tải lại mã mới" để ký lại.
2.  **Client Soát vé (Organizer):**
    *   Quét mã QR, phân tích cú pháp chuỗi JSON.
    *   Kiểm tra mốc thời gian `timestamp` trong payload so với thời gian hiện tại của thiết bị soát vé. Nếu chênh lệch quá 60 giây, từ chối check-in ngay tại client (Hiện thông báo lỗi màu đỏ kèm âm thanh **buzz** cảnh báo).
    *   Nếu thời gian hợp lệ, gửi dữ liệu payload lên `/api/tickets/check-in`.
3.  **Server API:**
    *   Xác minh lại mốc thời gian.
    *   Dùng thư viện `viem` (`recoverAddress`) để giải mã khôi phục lại địa chỉ ví từ chữ ký số `signature` và thông điệp tương ứng.
    *   So sánh địa chỉ ví khôi phục được với địa chỉ ví sở hữu thực tế của NFT vé đó trên blockchain hoặc DB. Nếu khớp, tiến hành đánh dấu vé đã dùng và gọi `useTicket()` on-chain.

---

## 4. Tích hợp Lưu trữ IPFS Metadata (Pinata)
Để đảm bảo vé NFT hiển thị đúng hình ảnh và thông tin chi tiết trên các chợ NFT công cộng như OpenSea:
*   Module [pinata.ts](file:///D:/HK8/TicketNFT/web/lib/pinata.ts) thiết lập kết nối REST API tới hệ thống lưu trữ Pinata IPFS.
*   **Cấu trúc Metadata JSON chuẩn OpenSea:**
    ```json
    {
      "name": "Đại hội Công nghệ Web3 2026 - Vé VIP #1",
      "description": "Vé tham dự sự kiện Đại hội Công nghệ Web3 2026. Hạng vé: VIP.",
      "image": "ipfs://QmBannerImageCID...",
      "external_url": "http://localhost:3000/events/cuid_event...",
      "attributes": [
        { "trait_type": "Event", "value": "Đại hội Công nghệ Web3 2026" },
        { "trait_type": "Tier", "value": "VIP" },
        { "trait_type": "Venue", "value": "Convention Center, District 1, HCMC" },
        { "trait_type": "Date", "value": "2026-06-01" }
      ]
    }
    ```
*   **Luồng chuẩn bị (Client-side Mint):** Trước khi người dùng mint vé qua MetaMask thông thường, client gọi API `/api/tickets/prepare-metadata` để server sinh JSON metadata, upload lên Pinata và trả về chuỗi `tokenURI` (Ví dụ: `ipfs://Qm...`). Client sau đó truyền trực tiếp URI này vào giao dịch mint của MetaMask.

---

## 5. Tối ưu hóa Tìm kiếm Cơ sở Dữ liệu (Fuzzy Search pg_trgm)
Nâng cao trải nghiệm tìm kiếm sự kiện:
*   Kích hoạt extension `pg_trgm` trong PostgreSQL để hỗ trợ tính toán độ tương đồng của chuỗi văn bản.
*   Xây dựng chỉ mục GIN trgm trên các cột dữ liệu hay tìm kiếm:
    ```sql
    CREATE INDEX IF NOT EXISTS event_title_trgm_idx ON "Event" USING gin (title gin_trgm_ops);
    CREATE INDEX IF NOT EXISTS event_venue_trgm_idx ON "Event" USING gin (venue gin_trgm_ops);
    ```
*   Trong Prisma, các câu lệnh tìm kiếm sử dụng `contains` hoặc `mode: 'insensitive'` sẽ tự động tận dụng index này, giúp tăng tốc độ tìm kiếm văn bản lên nhiều lần và hỗ trợ tìm kiếm không dấu/gõ sai ký tự nhẹ.