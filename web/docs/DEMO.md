# TicketNFT — Kịch bản Demo Hệ thống

Tài liệu này cung cấp kịch bản chạy demo toàn bộ các tính năng hiện tại của dự án **TicketNFT** (bao gồm cả các tính năng nâng cao vừa được hoàn thiện).

---

## 1. Chuẩn bị Trước khi Demo

### Yêu cầu Tài khoản & Ví (MetaMask)
Để demo đầy đủ luồng, cần chuẩn bị **3 ví MetaMask khác nhau** trên trình duyệt:
1. **Ví Admin (ví Deployer / Owner):**
   - Ví deploy các hợp đồng thông minh.
   - Có quyền truy cập Admin Panel (`/admin`) và quản lý thiết lập phí hệ thống on-chain.
2. **Ví Organizer (Ban tổ chức):**
   - Dùng để tạo sự kiện, thiết lập coupon, agenda, FAQ, duyệt check-in, rút tiền doanh thu.
3. **Ví User (Người mua vé):**
   - Dùng để tìm kiếm sự kiện, mua vé (mua thường hoặc áp dụng coupon), tặng/chuyển nhượng vé và lấy mã QR bảo mật để check-in.

### Yêu cầu Môi trường & Token
*   **Network:** Sepolia Testnet (Chain ID `11155111`).
*   **Số dư ví:** Mỗi ví nên có tối thiểu `0.05 Sepolia ETH` (hoặc POL testnet tùy thuộc vào cấu hình RPC của mạng đang chạy).
*   **Môi trường `.env.local` ở thư mục `web/`:**
    *   Đã thiết lập đầy đủ khóa API Pinata (`PINATA_JWT` hoặc cặp `PINATA_API_KEY`/`PINATA_API_SECRET`) để upload metadata lên IPFS thực tế.
    *   Đã thiết lập `RESEND_API_KEY` để kiểm tra việc gửi email xác nhận.
    *   Đã điền khóa `PRIVATE_KEY` của hệ thống để thực hiện các giao dịch server-side minting & publishing.

---

## 2. Kịch bản Trình diễn (Demo Flow — 20 Phút)

### Phần 1: Đăng nhập & Vai trò người dùng (User Roles)
1.  Truy cập `http://localhost:3000`.
2.  Bấm **Connect Wallet** và chọn **Ví User**. Thực hiện **Sign In** để ký thông điệp EIP-191.
3.  Vào trang **Profile**, cập nhật email cá nhân để nhận thông báo.
4.  Truy cập thử `/admin` hoặc `/organizer`. Hệ thống sẽ chặn và hiển thị màn hình từ chối truy cập (Access Denied / Unauthorized) vì ví hiện tại chỉ có role `USER`.
5.  Ngắt kết nối, chuyển sang kết nối **Ví Admin**. Truy cập `/admin`. Xác nhận giao diện Admin Panel hiển thị đầy đủ.
6.  Tại trang `/admin/users`, tìm kiếm ví của **Ví Organizer** (nếu đã có trong DB) hoặc nâng quyền trực tiếp từ `USER` thành `ORGANIZER` bằng dropdown để cấp quyền tổ chức sự kiện.

---

### Phần 2: Organizer Thiết lập Sự kiện (Draft, Agenda & FAQs)
**Sử dụng: Ví Organizer**

1.  Connect Wallet bằng **Ví Organizer** và truy cập `/organizer`.
2.  Nhấn **Create Event** và điền thông tin sự kiện:
    *   **Tên:** `Đại hội Công nghệ Web3 2026`
    *   **Danh mục:** `Tech`
    *   **Địa điểm:** `Convention Center, District 1, HCMC`
    *   **Mô tả:** `Sự kiện công nghệ thường niên về blockchain và AI.`
    *   **Ảnh Banner:** Chọn file ảnh bất kỳ.
    *   **Hạng vé (Tiers):**
        *   Vé General: `0.01 POL` (Số lượng: 100)
        *   Vé VIP: `0.03 POL` (Số lượng: 50)
3.  Bấm **Submit**. Sự kiện được tạo thành công ở trạng thái **DRAFT** (Chỉ organizer nhìn thấy, ẩn khỏi danh sách sự kiện công khai).
4.  Tại trang **Manage Event** của sự kiện này, cuộn xuống phần quản lý nội dung bổ sung:
    *   **Quản lý Agenda (Lịch trình):**
        *   Thêm mục: `08:30` - `Đón khách & Check-in` (Speaker: Ban tổ chức)
        *   Thêm mục: `09:30` - `Tương lai của NFT Ticketing` (Speaker: Chuyên gia Blockchain)
    *   **Quản lý FAQs (Câu hỏi thường gặp):**
        *   Thêm câu hỏi: `Vé NFT có chuyển nhượng được không?` -> Trả lời: `Có, bạn có thể tặng vé cho ví khác trực tiếp trên hệ thống.`
        *   Thêm câu hỏi: `Tôi có thể check-in bằng ảnh chụp màn hình QR không?` -> Trả lời: `Không, mã QR được cập nhật 60 giây một lần và yêu cầu chữ ký số thời gian thực.`

---

### Phần 3: Thiết lập Mã Giảm Giá (Coupon System)
**Sử dụng: Ví Organizer**

1.  Vẫn ở trang **Manage Event**, truy cập tab hoặc phần **Coupons Manager**.
2.  Tạo mã giảm giá 100% (Vé miễn phí):
    *   Code: `FREE100`
    *   Loại: `PERCENTAGE` | Giá trị: `100%`
    *   Giới hạn: `10` lượt sử dụng.
3.  Tạo mã giảm giá dưới 100% (Ví dụ giảm 50%):
    *   Code: `SAVE50`
    *   Loại: `PERCENTAGE` | Giá trị: `50%`
    *   Giới hạn: `20` lượt sử dụng.

---

### Phần 4: Phát hành Sự kiện lên Blockchain (Publish On-chain)
**Sử dụng: Ví Organizer**

1.  Tại trang **Manage Event**, nhấn **Publish On-chain**.
2.  Popup hiển thị thông báo tiến trình hệ thống đang deploy Smart Contract NFT cho sự kiện thông qua Factory Contract (xử lý server-side gasless cho organizer).
3.  Sau khi hoàn tất, trạng thái sự kiện chuyển thành **PUBLISHED** và hiển thị địa chỉ Smart Contract NFT tương ứng.

---

### Phần 5: Tìm kiếm & Khám phá Sự kiện (Fuzzy Search & Category Filters)
**Sử dụng: Ví User**

1.  Kết nối lại **Ví User**. Truy cập trang Khám phá `/events`.
2.  Kiểm tra bộ lọc: Nhấn vào các danh mục (Music, Tech, Food...) để xem danh sách sự kiện được lọc trực tiếp từ Database.
3.  Kiểm tra tìm kiếm mờ (Fuzzy Search):
    *   Gõ `dai hoi cong nghe web3` hoặc gõ không dấu `dai hoi web3`.
    *   Thử gõ sai chính tả nhẹ `Đại họi`.
    *   Xác nhận sự kiện "Đại hội Công nghệ Web3 2026" vẫn xuất hiện chính xác nhờ cơ chế pg_trgm.

---

### Phần 6: Mua vé áp dụng Coupon (100% vs <100%)
**Sử dụng: Ví User**

#### Luồng 1: Mua vé miễn phí với Coupon 100%
1.  Vào trang chi tiết sự kiện Web3.
2.  Chọn mua **Vé General** (`0.01 POL`).
3.  Tại form thanh toán, nhập mã `FREE100` và bấm **Apply**.
4.  Giá vé hiển thị giảm về `0 POL`.
5.  Bấm **Pay & Mint**. Hệ thống sẽ tự động gọi luồng Server-side Minting. Người dùng **không cần ký giao dịch chuyển tiền** trên MetaMask. Vé sẽ được mint và chuyển thẳng vào ví người dùng chỉ sau vài giây.
6.  Xác nhận email gửi về thông báo mua vé thành công.

#### Luồng 2: Mua vé giảm giá dưới 100% (Direct Transfer + Proof Verify)
1.  Chọn mua **Vé VIP** (`0.03 POL`).
2.  Nhập mã `SAVE50` và bấm **Apply**.
3.  Giá vé hiển thị giảm còn `0.015 POL`. Hộp thoại hướng dẫn UX xuất hiện giải thích về tỷ giá ước lượng của MetaMask.
4.  Bấm **Pay**. MetaMask xuất hiện yêu cầu chuyển tiền. Người mua sẽ gửi trực tiếp `0.015 POL` sang **Ví của Organizer** (chứ không phải gửi vào smart contract).
5.  Sau khi giao dịch chuyển khoản thành công, client gửi mã Hash giao dịch (`txHash`) lên API. Server tiến hành kiểm tra giao dịch on-chain (kiểm tra status, người nhận có đúng là organizer, số tiền có đủ không) và chống replay attack.
6.  Xác nhận server-side minting NFT vé VIP thành công cho người dùng.

---

### Phần 7: Tặng/Chuyển nhượng vé (Ticket Gifting & Transfer)
**Sử dụng: Ví User**

1.  Truy cập trang **My Tickets**. Người dùng sẽ thấy 2 vé: General (mint qua mã 100%) và VIP (mint qua mã 50%).
2.  Tại vé General, nhấn nút **Transfer Ticket** (Tặng vé).
3.  Nhập địa chỉ ví nhận (ví dụ **Ví Admin** hoặc một ví phụ khác).
4.  MetaMask popup xuất hiện để thực hiện hàm `safeTransferFrom` on-chain.
5.  Xác nhận giao dịch thành công. Vé biến mất khỏi danh sách của User và cơ sở dữ liệu được đồng bộ chủ sở hữu mới.

---

### Phần 8: Mã QR Động Bảo Mật & Kiểm soát Check-in Cao Cấp
**Sử dụng: Ví User & Ví Organizer**

1.  Tại trang **My Tickets** của **Ví User**, chọn vé VIP, bấm **Show Secure QR**.
2.  MetaMask hiện popup yêu cầu ký xác thực offline (Ví dụ: `Verify ownership of Ticket #2 at timestamp: ...`). Đây là bước ký không tốn gas.
3.  Mã QR xuất hiện kèm vòng tròn đếm ngược 60 giây.
4.  **Kiểm thử vé lỗi:**
    *   Chụp ảnh màn hình mã QR này. Đợi hết 60 giây để mã QR trên màn hình hết hạn và mờ đi.
    *   Mở điện thoại hoặc thiết bị khác kết nối **Ví Organizer**, truy cập mục **Check-in QR** (`/organizer/check-in`).
    *   Đưa ảnh chụp màn hình đã hết hạn ra trước camera để quét.
    *   Hệ thống báo lỗi màu đỏ nổi bật `Mã QR đã hết hạn` và phát ra âm thanh **buzz** cảnh báo.
5.  **Kiểm thử check-in thành công:**
    *   Nhấn **Tải lại mã mới** trên trang vé của User và ký lại thông điệp mới.
    *   Quét mã QR mới này trên giao diện soát vé của Organizer.
    *   Hệ thống hiển thị bảng thông tin chi tiết: tên khách hàng, email, hạng vé VIP, kèm theo âm thanh **beep** thành công vui tai. Trạng thái vé trong DB chuyển thành đã sử dụng (`isUsed: true`) và on-chain gọi `useTicket()`.
6.  **Kiểm thử quét lại (Replay check-in):**
    *   Quét lại mã QR đó một lần nữa.
    *   Hệ thống báo lỗi `Vé đã được sử dụng` và phát ra âm thanh **buzz** cảnh báo.

---

### Phần 9: Xuất Danh Sách Người Tham Dự (Export CSV)
**Sử dụng: Ví Organizer**

1.  Organizer truy cập quản lý sự kiện, chọn mục **Attendees** (Người tham dự).
2.  Danh sách người tham dự hiển thị đầy đủ Tên, Email (lấy từ Profile), Ví sở hữu, Token ID, Trạng thái Check-in.
3.  Nhấn nút **Export Attendees CSV**.
4.  Mở file CSV vừa tải xuống bằng Microsoft Excel.
5.  Xác nhận các ký tự tiếng Việt hiển thị chính xác hoàn toàn không bị lỗi font nhờ có tiền tố BOM `\uFEFF`.

---

### Phần 10: Xem Analytics & Withdraw Doanh Thu
**Sử dụng: Ví Organizer**

1.  Organizer truy cập `/organizer` (Dashboard).
2.  Xem các biểu đồ doanh thu, số lượng vé bán ra, và tổng quan tài chính (Marketplace Volume hiển thị đúng đơn vị POL thay vì Wei).
3.  Vào trang **Manage Event** của sự kiện, xem số dư quỹ của contract.
4.  Nhấn **Withdraw** để rút tiền doanh thu (bao gồm tiền Primary Sale của các vé mua không dùng coupon, và tiền Royalty fee từ các giao dịch mua đi bán lại trên Marketplace).
5.  Xác nhận ví của Organizer nhận được tiền.

---

### Phần 11: Cấu hình Platform của Admin (Admin settings)
**Sử dụng: Ví Admin**

1.  Kết nối **Ví Admin** và truy cập `/admin`.
2.  Xem biểu đồ thống kê tổng hệ thống: số lượng user, organizer, sự kiện, tổng giao dịch sơ cấp và thứ cấp.
3.  Truy cập `/admin/settings`.
4.  Xem thông số phí hiện tại của Marketplace (Ví dụ: `platformFeeBps = 250` nghĩa là 2.5%).
5.  Thay đổi mức phí thành `300` (3.0%) hoặc thay đổi ví nhận phí hệ thống (`feeRecipient`).
6.  Ký giao dịch thay đổi cấu hình trực tiếp trên ví MetaMask của Admin. Mức phí mới sẽ được áp dụng on-chain ngay lập tức.
7.  Nhập địa chỉ contract vé sự kiện bất kỳ và nhấn **Khóa chuyển nhượng (Lock transfer)** để vô hiệu hóa chức năng giao dịch tự do của vé đó (tính năng bảo mật khi có sự cố).