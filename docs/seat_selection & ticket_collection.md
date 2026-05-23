# Kế hoạch triển khai: Chọn Ghế ngồi (Seat Selection) & Bộ Sưu Tập Vé (Premium Ticket Collection)

Kế hoạch này trình bày giải pháp chi tiết để bổ sung chức năng chọn vị trí ghế ngồi tương tác (Seat Selection) và nâng cấp giao diện "My Tickets" thành một bộ sưu tập vé cao cấp (Ticket Collection) theo phong cách thiết kế của Pinterest & Glassmorphism.

---

## User Review Required

> [!IMPORTANT]
> **Phương pháp quản lý ghế ngồi (Off-chain DB + On-chain Metadata):** 
> Để tiết kiệm phí Gas và tối ưu tính linh hoạt cho nhiều loại sơ đồ sự kiện khác nhau, chúng tôi đề xuất quản lý sơ đồ ghế trống/bận thông qua cơ sở dữ liệu PostgreSQL (Prisma). Thông tin số ghế sau khi mua sẽ được ghi nhận trực tiếp vào **attributes của NFT metadata (tokenURI)** trên IPFS tại thời điểm mint. Cách này đảm bảo thông tin ghế ngồi là phi tập trung và di chuyển theo NFT nếu vé được bán lại trên Marketplace.
>
> **Tạo dữ liệu thử nghiệm (Seating Layout Seed):**
> Do cơ sở dữ liệu hiện tại chưa có cấu hình sơ đồ ghế, chúng tôi sẽ cập nhật API trả về chi tiết Tier vé để tự động tạo sơ đồ ghế ảo (ví dụ: các hàng A, B, C từ ghế 1-10 cho các vé thuộc hạng có sơ đồ) để thuận tiện cho việc kiểm thử ngay lập tức mà không cần tạo lại toàn bộ sự kiện từ đầu.

---

## Proposed Changes

### 1. Database & Prisma Schema

#### [MODIFY] [schema.prisma](file:///d:/HK8/TicketNFT/web/prisma/schema.prisma)
- **Bảng `Ticket`:** Bổ sung trường `seatCode String?` để lưu trữ số ghế của vé đã được đặt (ví dụ: `"A-05"`).
- **Bảng `TicketTier`:** Bổ sung trường `seatingLayout Json?` để lưu trữ cấu hình sơ đồ ghế ngồi của hạng vé đó. Nếu là `null` hoặc không có thì coi như vé đứng tự do (General Admission).
  * Ví dụ cấu hình: `{"rows": ["A", "B", "C"], "seatsPerRow": 10}`.

---

### 2. Backend API Routes

#### [MODIFY] [route.ts (Mint API)](file:///d:/HK8/TicketNFT/web/app/api/tickets/mint/route.ts)
- Nhận thêm tham số `seatCode?: string` từ request body.
- Kiểm tra xem ghế đó đã được mua chưa trong database:
  ```typescript
  if (body.seatCode) {
    const existingTicket = await prisma.ticket.findFirst({
      where: {
        eventId: tier.eventId,
        seatCode: body.seatCode,
        status: { not: "EXPIRED" }
      }
    });
    if (existingTicket) {
      return NextResponse.json({ error: "Ghế này đã có người đặt mua." }, { status: 409 });
    }
  }
  ```
- Khi chuẩn bị metadata tải lên IPFS (hàm `uploadMetadataToIPFS`), tự động đưa thuộc tính ghế vào mảng `attributes`:
  ```typescript
  if (body.seatCode) {
    attributes.push({ trait_type: "Seat", value: body.seatCode });
  }
  ```
- Lưu thông tin `seatCode` vào bản ghi `Ticket` mới tạo trong Database.

#### [MODIFY] [route.ts (Event Details API)](file:///d:/HK8/TicketNFT/web/app/api/events/[id]/route.ts) (hoặc Server Component tương ứng)
- Trả thêm danh sách các ghế đã được đặt (`bookedSeats`) của sự kiện đó bằng cách tìm tất cả `Ticket` đã bán có `seatCode != null`.
- Trả thêm trường `seatingLayout` của từng Tier vé.

---

### 3. Frontend Components & Pages

#### [NEW] [seating-chart.tsx](file:///d:/HK8/TicketNFT/web/components/tickets/seating-chart.tsx)
- Tạo component hiển thị sơ đồ ghế ngồi tương tác dưới dạng lưới (Grid).
- Cho phép người dùng trực quan hóa các ghế trống (màu xanh lá/trong suốt), ghế đã có người mua (màu xám tối và disabled), và ghế đang chọn (màu đỏ thương hiệu).
- Quản lý trạng thái ghế đang được chọn để truyền ngược lại cho trang chi tiết sự kiện.

#### [MODIFY] [page.tsx (Event Details)](file:///d:/HK8/TicketNFT/web/app/events/[id]/page.tsx)
- Tích hợp component chọn ghế khi người dùng chọn một hạng vé có hỗ trợ cấu hình chỗ ngồi.
- Gửi thông tin `seatCode` đã chọn qua API khi bấm Mua/Mint vé.

#### [MODIFY] [page.tsx (My Tickets)](file:///d:/HK8/TicketNFT/web/app/my-tickets/page.tsx)
- **Nâng cấp thiết kế visual vé:** Thiết kế lại giao diện thẻ vé thành cuống vé chân thực (Skeuomorphic Ticket Stub) với viền nét đứt răng cưa giả lập chỗ xé vé, dập nổi hiệu ứng kính mờ (Glassmorphism).
- Hiển thị rõ ràng vị trí ghế ngồi (`Seat: A-05`) trên thân vé nếu có.
- Thêm hiệu ứng lắc góc nghiêng 3D tinh tế (holographic tilt effect) bằng CSS hover để tôn vinh tính chất NFT sưu tầm.
- Phân nhóm vé khoa học: **Upcoming** (Vé sắp diễn ra), **Past** (Vé đã sử dụng làm kỷ niệm), và **Listed** (Vé đang được bán lại).

---

## Verification Plan

### Automated Verification
- Chạy cập nhật database và phát sinh Client code của Prisma:
  ```powershell
  npx prisma db push
  ```
- Kiểm tra tính đúng đắn của kiểu dữ liệu TypeScript sau khi sửa đổi Schema và Component:
  ```powershell
  npx tsc --noEmit
  ```

### Manual Verification
1. Truy cập trang chi tiết sự kiện hỗ trợ chọn ghế. Xác nhận sơ đồ ghế hiển thị trực quan và cập nhật chính xác các ghế đã bị đặt.
2. Thực hiện đặt mua vé kèm chọn ghế cụ thể. Xác nhận API kiểm tra trùng lặp ghế hoạt động đúng và ghi nhận ghế đã chọn vào cơ sở dữ liệu + NFT metadata.
3. Vào trang `/my-tickets` để chiêm ngưỡng bộ sưu tập vé mới với giao diện giả lập cuống vé cao cấp, hỗ trợ hover 3D tilt và hiển thị đầy đủ số ghế.
