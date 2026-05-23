# TicketNFT — AI Agent Handoff & Instructions

Tài liệu này đóng vai trò là chỉ dẫn chi tiết để chuyển giao dự án **TicketNFT** cho một AI coding agent tiếp theo tiếp tục phát triển.

---

## 1. Yêu Cầu Cho Agent Nhận Dự Án (Read First)

Trước khi thực hiện bất kỳ thay đổi nào vào mã nguồn, bạn **bắt buộc** phải đọc qua các tài liệu thiết kế và hướng dẫn nằm trong thư mục `web/docs/` theo thứ tự sau:
1.  `web/docs/execution_plan.md` — Trạng thái dự án, các tính năng đã làm và chưa làm.
2.  `web/docs/implementation_plan.md` — Kiến trúc hệ thống, sơ đồ DB, luồng giao dịch nâng cao (Coupon checkout, QR security).
3.  `web/docs/DEMO.md` — Kịch bản chạy thử toàn bộ luồng hệ thống với 3 tài khoản/ví.
4.  `web/docs/run_guide.md` — Hướng dẫn cài đặt, cấu hình và chạy thử local.
5.  `README.md` — Tài liệu tổng quan dự án ở thư mục gốc.

---

## 2. Tổng Quan Dự Án & Tiến Độ Hiện Tại

Dự án **TicketNFT** là một nền tảng bán vé sự kiện phi tập trung ứng dụng NFT (chuẩn ERC-721 và phí tác quyền ERC-2981) chạy trên Sepolia testnet. Hệ thống kết hợp sự bảo mật, minh bạch của blockchain và trải nghiệm mượt mà của Web2.

**Tiến độ hiện tại: Hoàn thành 100% các Phase Core từ 1 đến 6 và các nâng cấp bảo mật UX.**

### Các tính năng lớn đã hoàn thiện:
1.  **Hệ thống Coupon:** Giảm giá 100% (gasless minting qua server) và dưới 100% (gửi token trực tiếp cho ví organizer, server đối soát `txHash` on-chain để chống replay attack trước khi mint).
2.  **Chuyển nhượng/Tặng vé:** Cho phép người dùng chuyển nhượng vé on-chain qua hàm `safeTransferFrom`, đồng thời cập nhật DB và huỷ đăng bán trên Marketplace.
3.  **QR Code Động Bảo Mật:** Yêu cầu người dùng ký thông điệp offline (tiết kiệm gas) bằng MetaMask. Mã QR chứa chữ ký số và mốc thời gian thực hiện, tự động hết hạn sau 60 giây để chống chụp ảnh màn hình gian lận.
4.  **Check-in Dashboard Cao Cấp:** Giao diện soát vé Dark Mode sang trọng, tích hợp âm thanh Web Audio API (beep thành công, buzz lỗi) và hiển thị chi tiết thông tin người tham dự cùng lý do lỗi cụ thể.
5.  **Xuất danh sách Attendees:** Cho phép xuất file CSV lưu thông tin người tham dự có mã BOM UTF-8 hỗ trợ tiếng Việt có dấu.
6.  **Tải Metadata IPFS thực tế:** Tích hợp Pinata API để tải file JSON mô tả vé NFT lên IPFS trước khi mint, tuân thủ định dạng thuộc tính hiển thị chuẩn của OpenSea.
7.  **Tìm kiếm mờ (Fuzzy Search):** Tích hợp extension `pg_trgm` của PostgreSQL và tạo chỉ mục GIN trgm hỗ trợ tìm kiếm không dấu/sai chính tả nhẹ trên tiêu đề và địa điểm.
8.  **Bảng điều khiển gộp Ban tổ chức & Admin:**
    *   Tuyến đường `/organizer` và `/admin` được bảo vệ bằng cơ chế kiểm tra quyền truy cập server-side layout.
    *   Thanh Sidebar điều hướng thống nhất tại cả hai khu vực.
    *   Admin Panel `/admin` cho phép theo dõi chỉ số hệ thống, nâng hạ vai trò người dùng, duyệt/hủy sự kiện và sửa đổi phí giao dịch Marketplace trực tiếp on-chain qua MetaMask.

---

## 3. Bản Đồ Thư Mục Quan Trọng

```
TicketNFT/
├── contracts/
│   ├── contracts/
│   │   ├── EventTicketNFT.sol      # ERC-721 ticket contract
│   │   ├── EventFactory.sol        # Factory deploy event contract
│   │   └── TicketMarketplace.sol   # Secondary market contract
│   └── test/                       # Bộ 20 unit tests chạy bằng Hardhat
├── web/
│   ├── app/
│   │   ├── page.tsx                # Trang chủ (Pinterest-inspired)
│   │   ├── events/
│   │   │   ├── page.tsx            # Tìm kiếm mờ & Lọc category
│   │   │   └── [id]/page.tsx       # Xem chi tiết event, Agenda & FAQs
│   │   ├── organizer/
│   │   │   ├── page.tsx            # Dashboard phân tích chính
│   │   │   ├── layout.tsx          # Sidebar layout & Server-side auth check
│   │   │   ├── check-in/page.tsx   # Quét check-in QR có âm thanh Web Audio
│   │   │   └── events/[id]/page.tsx# Quản lý sự kiện, Coupons, Agenda, FAQs
│   │   ├── admin/
│   │   │   ├── page.tsx            # Thống kê hệ thống
│   │   │   ├── layout.tsx          # Admin layout & Server-side admin check
│   │   │   ├── users/page.tsx      # Quản lý người dùng, đổi role
│   │   │   ├── events/page.tsx     # Duyệt/hủy sự kiện
│   │   │   └── settings/page.tsx   # Cấu hình phí on-chain & transfer toggle
│   │   └── api/                    # Hệ thống 22 API endpoints
│   ├── components/
│   │   ├── tickets/
│   │   │   ├── buy-ticket-button.tsx # Xử lý mua thường & áp dụng coupon
│   │   │   └── ticket-qr.tsx       # Sinh QR động kèm MetaMask sign & đếm ngược
│   │   └── organizer/
│   │       ├── coupons-manager.tsx # Quản lý coupon
│   │       ├── agenda-manager.tsx  # Quản lý agenda
│   │       └── faq-manager.tsx     # Quản lý FAQ
│   ├── lib/
│   │   ├── pinata.ts               # Kết nối Pinata SDK upload IPFS
│   │   └── contracts.ts            # Chứa địa chỉ và ABI các hợp đồng
│   └── prisma/
│       ├── schema.prisma           # Cấu trúc cơ sở dữ liệu
│       └── enable_trgm.mjs         # Script khởi tạo pg_trgm index
```

---

## 4. Các Quy Tắc Phát Triển Bắt Buộc

1.  **Draft vs Published:** Sự kiện ở trạng thái `DRAFT` chỉ hiển thị với organizer tạo ra nó. Sự kiện chỉ công khai khi đã chạy **Publish On-chain** thành công và có địa chỉ contract.
2.  **Ràng buộc giao dịch:** Tất cả các hành động liên quan đến tiền bạc/vé phải được thực hiện thành công trên blockchain trước, sau đó mới gọi API đồng bộ cơ sở dữ liệu. Không tạo bản ghi DB trước khi giao dịch blockchain thành công.
3.  **Bảo vệ tài khoản server-side:** Không để lộ khóa `PRIVATE_KEY` hệ thống ở client. Các hành động gọi hàm `organizerMint` hoặc deploy từ Factory phải được thực hiện hoàn toàn từ Server-side API.
4.  **Giao diện & Styling:** Dự án sử dụng hệ thống biến CSS nguyên bản (Vanilla CSS). **Không sử dụng Tailwind CSS** trừ khi có yêu cầu đặc biệt. Giữ phong cách Pinterest: bảng màu ấm (warm cream), góc bo tròn mềm mại (radius 16px/32px), hiệu ứng kính mờ (glassmorphism) và tương tác phản hồi hover mượt mà.

---

## 5. Danh Sách Nhiệm Vụ Tiếp Theo (Backlog)

Dưới đây là các tác vụ được đề xuất để bạn tiếp tục triển khai:

1.  **Verify Contract trên Etherscan:** Viết script tự động verify mã nguồn các hợp đồng `EventTicketNFT`, `EventFactory` và `TicketMarketplace` sau khi deploy lên Sepolia để hiển thị code trực quan trên Etherscan.
2.  **Đưa dự án lên Vercel:** Cấu hình các biến môi trường và chạy thử quá trình build production trên Vercel.
3.  **Tích hợp Framer Motion:** Thêm các hiệu ứng animation mượt mà khi mở sidebar, chuyển đổi giữa các tab quản lý sự kiện và hover trên các thẻ sự kiện.
4.  **Tự động gửi mail nhắc nhở:** Xây dựng một API endpoint hoặc Cron Job tự động quét database để gửi email qua Resend nhắc nhở người dùng tham gia sự kiện trước ngày diễn ra 1 ngày.