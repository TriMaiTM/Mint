# TicketNFT — Kế hoạch triển khai & Trạng thái Dự án

Tài liệu này tổng hợp toàn bộ các tính năng đã hoàn thiện của dự án **TicketNFT** và danh sách những điểm cần phát triển tiếp theo.

---

## 1. Tech Stack Hiện Tại

| Tầng | Công nghệ sử dụng |
|---|---|
| **Smart Contracts** | Solidity 0.8.26, Hardhat, OpenZeppelin v5 |
| **Blockchain Network** | Sepolia Testnet (Ethereum / L2 Rollups) |
| **Frontend Web** | Next.js 15+, React 19, TypeScript |
| **Web3 Client** | Wagmi v2, Viem v2, RainbowKit v2 |
| **Cơ sở dữ liệu** | Supabase PostgreSQL, Prisma 6 |
| **Xác thực (Auth)** | Ký ví điện tử offline (chuẩn EIP-191) + Token phiên lưu ở Cookie |
| **Hệ thống Email** | Resend API |
| **Thiết kế & Giao diện** | Giao diện Dark Mode cao cấp, Glassmorphism, CSS nguyên bản (Vanilla CSS) |

---

## 2. Bảng Theo Dõi Tiến Độ Chi Tiết

### ✅ Phase 1: Smart Contracts (100%)
*   [x] **EventTicketNFT.sol:** Hỗ trợ bán vé nhiều hạng (multi-tier), kiểm soát quyền chuyển nhượng (`setTransferable`), cơ chế soát vé (`useTicket`), rút doanh thu (`withdraw`). Tích hợp chuẩn ERC-2981 để cấu hình tiền bản quyền (royalty).
*   [x] **EventFactory.sol:** Hợp đồng nhà máy giúp deploy tự động các hợp đồng vé riêng biệt cho từng sự kiện.
*   [x] **TicketMarketplace.sol:** Thị trường mua bán vé thứ cấp. Thu phí nền tảng (Platform fee) 2.5%, chia phí tác quyền (Royalty) 5.0% cho organizer. Khống chế giá bán lại tối đa bằng 3 lần giá mua gốc.
*   [x] **Unit Tests:** Viết và chạy thành công bộ 20 tests kiểm tra đầy đủ logic nghiệp vụ của các hợp đồng.
*   [x] **Deploy Scripts:** Hoàn thành script deploy tự động lên Sepolia testnet.

### ✅ Phase 2: Hệ thống Xác thực & Quyền hạn (100%)
*   [x] **Auth Nonce:** Tạo thử thách chữ ký số (`/api/auth/nonce`) để chống tấn công phát lại (Replay attack).
*   [x] **Verify Signature:** Xác minh chữ ký ví phía server (`/api/auth/verify`), tạo JWT/session token lưu trữ qua HTTP-only cookie.
*   [x] **Phân quyền Server-side:** Bảo vệ các tuyến đường `/organizer/*` (yêu cầu role `ORGANIZER` hoặc `ADMIN`) và `/admin/*` (chỉ dành cho `ADMIN`) ngay tại Server Layout của Next.js.
*   [x] **Quản lý Profile:** Cho phép cập nhật tên hiển thị, ảnh đại diện và địa chỉ email nhận thông báo.

### ✅ Phase 3: Luồng Nghiệp Vụ Bán Vé & Soát Vé (100%)
*   [x] **Luồng mua vé thông thường:** Người dùng mint trực tiếp qua MetaMask và đồng bộ cơ sở dữ liệu sau khi nhận được sự kiện on-chain thành công.
*   [x] **Hệ thống Coupon:**
    *   Giảm giá 100% (Vé miễn phí): Xử lý Server-side minting hoàn toàn (gasless cho người dùng), không yêu cầu ví thanh toán gas.
    *   Giảm giá dưới 100%: Người dùng thanh toán trực tiếp số tiền đã giảm sang **Ví của Organizer** qua MetaMask. Server kiểm tra giao dịch on-chain (txHash) để đối soát số tiền và người nhận trước khi gọi ví hệ thống mint vé.
*   [x] **Chuyển nhượng & Tặng vé:** Người dùng gọi hàm `safeTransferFrom` trực tiếp trên MetaMask, API đồng bộ và chuyển quyền sở hữu trên cơ sở dữ liệu, đồng thời hủy bỏ bài đăng bán của vé đó trên Marketplace (nếu có).
*   [x] **Mã QR Động Bảo Mật:**
    *   Client yêu cầu người dùng dùng ví ký offline xác nhận quyền sở hữu kèm mốc thời gian thực hiện.
    *   Mã QR tự động hết hạn sau 60 giây và yêu cầu ký lại.
    *   API check-in giải mã chữ ký, so sánh địa chỉ ví chủ sở hữu hiện tại và kiểm tra thời gian hết hạn (chống chụp màn hình chia sẻ vé).
*   [x] **Giao diện Soát vé Premium:**
    *   Thiết kế Dark Mode, hiệu ứng kính mờ (Glassmorphism).
    *   Tích hợp âm thanh phản hồi Web Audio API (beep thành công, buzz trầm cảnh báo lỗi) mà không cần tải file tĩnh.
    *   Hiển thị chi tiết thông tin người tham dự và phân loại lỗi rõ ràng.

### ✅ Phase 4: Tích Hợp IPFS & Tìm Kiếm Tối Ưu (100%)
*   [x] **IPFS Pinata Integration:** Upload metadata JSON tự động lên IPFS trước khi mint vé. File JSON chứa đầy đủ thuộc tính chuẩn hiển thị trên OpenSea (Events, Tiers, Venue, Date).
*   [x] **Đồng bộ Token URI:** Cả hai luồng thanh toán (MetaMask mint trực tiếp và Server-side mint) đều sử dụng IPFS URI thực tế làm tokenURI trên blockchain.
*   [x] **Tìm kiếm mờ (Fuzzy Search):** Kích hoạt extension `pg_trgm` và xây dựng chỉ mục GIN trgm trên PostgreSQL để tìm kiếm sự kiện nhanh chóng theo Tiêu đề và Địa điểm (hỗ trợ viết sai chính tả nhẹ hoặc không dấu).
*   [x] **Category Filter:** Lọc danh mục sự kiện trực tiếp bằng câu lệnh Prisma ở database level để tối ưu hiệu năng.

### ✅ Phase 5: Email Notifications & Xuất Dữ Liệu (100%)
*   [x] **Email qua Resend:** Tích hợp SDK Resend để tự động gửi các email: Xác nhận mua vé, Thông báo đăng bán vé, Thông báo vé đã bán (gửi cho người bán), Xác nhận mua vé thành công từ chợ thứ cấp (gửi cho người mua).
*   [x] **BOM UTF-8 CSV Exporter:** Xuất danh sách người tham dự sự kiện ra file CSV, hỗ trợ ký tự tiếng Việt có dấu hiển thị chính xác trong Excel.

### ✅ Phase 6: Quản Trị Hệ Thống & Bảng Điều Khiển (100%)
*   [x] **Organizer Sidebar Layout:** Tái cấu trúc toàn bộ giao diện quản lý của Organizer tại `/organizer` sử dụng Sidebar, loại bỏ các thanh điều hướng lặp lại và gộp analytics thành Dashboard chính.
*   [x] **Admin Panel (`/admin`):**
    *   Trang chủ: Xem tổng quan thống kê số lượng người dùng, doanh số Primary, Secondary, phí hệ thống thu được và biểu đồ giao dịch.
    *   Quản lý Users: Tìm kiếm, phân trang và thay đổi vai trò người dùng (`USER`, `ORGANIZER`, `ADMIN`).
    *   Quản lý Events: Kiểm duyệt và thay đổi trạng thái hoạt động của sự kiện.
    *   Cấu hình hợp đồng (`/admin/settings`): Đọc và thay đổi phí nền tảng (`platformFeeBps`), địa chỉ nhận phí (`feeRecipient`) trực tiếp on-chain. Khóa/mở chức năng chuyển nhượng vé cho từng contract sự kiện.

---

## 3. Những Việc Chưa Làm (Future Improvements / Backlog)

### Ưu tiên Cao
- [ ] **Etherscan Verification:** Viết cấu hình và chạy script tự động verify mã nguồn các hợp đồng thông minh đã deploy trên Etherscan để người dùng có thể dễ dàng kiểm tra code trực tiếp.
- [ ] **Production Deployment:** Cấu hình deploy dự án frontend Next.js lên Vercel và database PostgreSQL lên môi trường Production.

### Ưu tiên Trung bình
- [ ] **Framer Motion Animations:** Thêm các hiệu ứng chuyển cảnh mượt mà cho sidebar, card hover và loading modal bằng Framer Motion để tăng trải nghiệm người dùng cao cấp.
- [ ] **Email Reminders:** Xây dựng hệ thống Cron Job gửi email nhắc nhở tự động cho khách tham dự trước khi sự kiện diễn ra 1 ngày.

### Ưu tiên Thấp
- [ ] **E2E Tests:** Viết kịch bản kiểm thử tự động toàn bộ luồng từ tạo sự kiện, mua vé đến check-in bằng Playwright hoặc Cypress.
- [ ] **Zoom / Online Event Integration:** Tích hợp tạo phòng họp Zoom tự động khi tạo sự kiện trực tuyến.
- [ ] **Mobile App App:** Xây dựng ứng dụng di động đơn giản bằng React Native hoặc Flutter cho nhân viên soát vé quét QR nhanh hơn.