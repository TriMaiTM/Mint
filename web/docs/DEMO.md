# TicketNFT — Demo Script

## Chuẩn bị

### Yêu cầu
- MetaMask với 3 ví (Organizer, User 1, User 2)
- Network Sepolia (Chain ID 11155111)
- Mỗi ví có ít nhất 0.05 ETH Sepolia
- (Optional) Resend API Key để demo email notifications

### Lấy Sepolia ETH
- Faucet: https://www.alchemy.com/faucets/ethereum-sepolia
- Hoặc: https://sepolia-faucet.pk910.de (PoW faucet, miễn phí)

---

## Demo Flow (~20 phút)

### Phần 1: Organizer tạo Event

**Ví: Organizer**

1. Mở http://localhost:3000
2. Connect Wallet → chọn ví Organizer
3. Sign In Wallet → ký message
4. Nhấn **Create Event**
5. Điền thông tin:
   - Title: `Tech Conference 2026`
   - Category: `Tech`
   - Venue: `Convention Center, HCMC`
   - Description: `Annual technology conference`
   - Start/End date
   - Tiers: General (0.01 ETH), VIP (0.05 ETH)
6. Submit → redirect sang event detail

**Giải thích:** "Event được tạo trong database ở trạng thái DRAFT. Chưa có trên blockchain."

### Phần 2: Organizer Publish On-chain

**Ví: Organizer**

1. Vào **My Events** → thấy event vừa tạo
2. Nhấn **Manage Event**
3. Nhấn **Publish On-chain** trong mục Actions
4. Loading modal hiện: "Publishing to blockchain..."
5. Toast hiện: "Publish thành công!"

**Giải thích:** "Smart contract EventTicketNFT đã được deploy lên Sepolia thông qua EventFactory. Mỗi event = 1 contract NFT riêng biệt."

### Phần 3: User 1 mua vé

**Ví: User 1**

1. Connect Wallet → chọn ví User 1 → Sign In
2. Vào **Profile** → thêm email để nhận thông báo
3. Vào **Events** → thấy "Tech Conference 2026"
4. Nhấn vào event → xem chi tiết + bản đồ Google Maps
5. Nhấn **Mua vé** ở tier VIP (0.05 ETH)
6. MetaMask popup → Confirm
7. Loading modal: "Waiting for blockchain confirmation..."
8. Toast: "Mua vé thành công! Token #1"

**Giải thích:** "User vừa mint 1 NFT vé trên blockchain. Token ID unique, metadata URI chứa thông tin vé. Nếu User đã thêm email, sẽ nhận email xác nhận mua vé."

### Phần 4: User 1 xem vé + QR

**Ví: User 1**

1. Vào **My Tickets**
2. Thấy vé VIP vừa mua
3. Nhấn **Hiện QR** → thấy mã QR

**Giải thích:** "QR code chứa cryptographic proof. Chỉ owner ví này mới generate được."

### Phần 5: User 1 bán vé trên Marketplace

**Ví: User 1**

1. Ở trang **My Tickets**, nhấn **Resale Ticket**
2. Modal hiện: giá gốc 0.05 ETH, max 0.15 ETH (3x)
3. Nhập giá 0.10 ETH → Confirm
4. MetaMask popup 2 lần (Approve + List)
5. Toast: "Ticket listed successfully"

**Giải thích:** "User approve marketplace contract quản lý NFT, rồi gọi listTicket() trên smart contract. Giá bị giới hạn tối đa 3x giá gốc. Email thông báo đăng bán sẽ được gửi (nếu có email)."

### Phần 6: User 2 mua vé từ Marketplace

**Ví: User 2**

1. Connect Wallet → chọn ví User 2 → Sign In
2. (Optional) Vào **Profile** → thêm email
3. Vào **Marketplace** → thấy vé VIP đang bán
4. Nhấn **Buy this ticket**
5. MetaMask popup → Confirm (0.10 ETH)
6. Toast: "Purchase successful"

**Giải thích:** "Giao dịch marketplace: User 2 trả 0.10 ETH. Platform fee 2.5% → platform. Royalty 5% → organizer. Còn lại → User 1. Email thông báo sẽ được gửi cho cả người bán và người mua (nếu có email)."

### Phần 7: Organizer Check-in

**Ví: Organizer**

1. Vào **My Events** → **Attendees**
2. Thấy User 2 đã mua vé, trạng thái "Not checked in"
3. Nhấn **Check In**
4. Loading modal: "Checking in..."
5. Toast: "Attendee checked in successfully"

**Giải thích:** "Check-in gọi useTicket() trên blockchain + update DB. Vé đã dùng không thể transfer hay dùng lại."

### Phần 8: Organizer Withdraw

**Ví: Organizer**

1. Vào **Manage Event**
2. Trong mục Actions → thấy Contract Balance
3. Nhấn **Withdraw**
4. Loading modal: "Withdrawing funds..."
5. Toast: "Withdrawal successful!"

**Giải thích:** "Organizer rút toàn bộ doanh thu từ smart contract (bao gồm cả primary sale và secondary market royalty)."

### Phần 9: Organizer xem Analytics

**Ví: Organizer**

1. Nhấn **Analytics** trong navigation
2. Xem dashboard:
   - Overview: 1 event, 2 vé đã bán, doanh thu
   - Biểu đồ doanh thu 7 ngày
   - Bảng doanh thu theo sự kiện
   - Thống kê vé theo tier

**Giải thích:** "Dashboard giúp organizer theo dõi hiệu suất sự kiện, doanh thu, và tỷ lệ check-in real-time."

---

## Tóm tắt Demo (nói theo flow)

```
1. Organizer tạo sự kiện với nhiều tier vé
2. Publish lên blockchain — mỗi event = 1 smart contract
3. User 1 thêm email và mua vé VIP — mint NFT + nhận email xác nhận
4. User 1 bán lại vé trên marketplace — nhận email thông báo
5. User 2 mua lại vé — cả 2 đều nhận email thông báo
6. Organizer check-in User 2 — on-chain verification
7. Organizer withdraw doanh thu từ smart contract
8. Organizer xem analytics dashboard
```

## Thời gian ước tính

| Phần | Thời gian |
|---|---|
| Setup (connect wallet, sign in) | 2 phút |
| Organizer tạo event + publish | 3 phút |
| User 1 mua vé + xem QR | 2 phút |
| User 1 bán marketplace | 2 phút |
| User 2 mua từ marketplace | 2 phút |
| Organizer check-in | 1 phút |
| Organizer withdraw | 1 phút |
| Organizer analytics | 2 phút |
| **Tổng** | **~15 phút** |

## Email Notifications Demo (Optional)

Nếu đã cấu hình `RESEND_API_KEY`:

1. **Purchase Email**: Sau khi User 1 mua vé → check email inbox
2. **Listing Email**: Sau khi User 1 đăng bán → check email
3. **Sale Email**: Sau khi User 2 mua từ marketplace → User 1 nhận email
4. **Buyer Email**: User 2 cũng nhận email xác nhận mua

**Lưu ý:** Trong development, Resend chỉ gửi email đến email đã verify. Sử dụng email của bạn khi đăng ký Resend.