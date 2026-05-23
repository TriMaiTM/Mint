# TicketNFT — Hướng dẫn cài đặt & Vận hành (Run Guide)

Tài liệu này hướng dẫn chi tiết các bước để thiết lập dự án, chạy thử nghiệm trên máy local và triển khai môi trường thử nghiệm Sepolia.

---

## 1. Chuẩn bị Môi trường

Đảm bảo máy tính của bạn đã được cài đặt sẵn:
- **Node.js 20+** và **npm**.
- **MetaMask** (tiện ích mở rộng trình duyệt).
- **Sepolia ETH** (lấy từ các vòi Faucet như: https://sepolia-faucet.pk910.de hoặc https://www.alchemy.com/faucets/ethereum-sepolia).

---

## 2. Thiết lập Dự án

Dự án được chia thành 2 thư mục chính: `contracts/` (quản lý mã nguồn Web3 / Smart Contract) và `web/` (quản lý ứng dụng frontend Next.js).

### Bước 2.1: Cấu hình Smart Contracts
1.  Truy cập thư mục `contracts/`:
    ```powershell
    cd D:\HK8\TicketNFT\contracts
    npm install
    ```
2.  Tạo file `.env` tại thư mục này với nội dung:
    ```env
    SEPOLIA_RPC_URL=https://sepolia.drpc.org
    PRIVATE_KEY=your_private_key_here
    ETHERSCAN_API_KEY=your_etherscan_key_here
    ```
    *(Thay `your_private_key_here` bằng khóa bí mật của ví deployer).*
3.  Biên dịch hợp đồng:
    ```powershell
    npm run compile
    ```
4.  Chạy bộ kiểm thử tự động (Unit Tests):
    ```powershell
    npm run test
    ```
5.  Deploy lên mạng Sepolia:
    ```powershell
    npm run deploy:sepolia
    ```
    *Ghi lại địa chỉ của hai hợp đồng **EventFactory** và **TicketMarketplace** sau khi deploy thành công.*

### Bước 2.2: Cấu hình Web App Next.js
1.  Truy cập thư mục `web/`:
    ```powershell
    cd D:\HK8\TicketNFT\web
    npm install
    ```
2.  Tạo file `.env.local` với các nội dung sau:
    ```env
    # Cơ sở dữ liệu Supabase PostgreSQL
    DATABASE_URL="postgresql://postgres:password@db.supabase.co:5432/postgres"

    # Chuỗi bảo mật ngẫu nhiên cho Auth Session
    AUTH_SECRET="your_random_auth_secret_here"

    # Mã Project ID lấy từ WalletConnect Cloud
    NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="your_walletconnect_project_id"

    # Địa chỉ RPC kết nối Sepolia
    NEXT_PUBLIC_SEPOLIA_RPC_URL="https://eth-sepolia.g.alchemy.com/v2/your_alchemy_key"
    SEPOLIA_RPC_URL="https://eth-sepolia.g.alchemy.com/v2/your_alchemy_key"

    # Địa chỉ Smart Contract vừa deploy ở Bước 2.1
    NEXT_PUBLIC_EVENT_FACTORY_ADDRESS="0x316654424537D288670070454f87bf3547341f6C"
    NEXT_PUBLIC_MARKETPLACE_ADDRESS="0xFda7d0bA678F72BFCD25cF4082D541bc1C7Da7AA"

    # Khóa bí mật ví hệ thống (thực hiện Gasless Mint & Publish)
    PRIVATE_KEY="your_private_key_here"

    # Thiết lập IPFS (Pinata)
    PINATA_JWT="your_pinata_jwt_here"
    # Hoặc cặp Key/Secret:
    PINATA_API_KEY="your_pinata_api_key"
    PINATA_API_SECRET="your_pinata_api_secret"

    # Thiết lập Email qua Resend (Tùy chọn)
    RESEND_API_KEY="re_your_resend_api_key"
    NEXT_PUBLIC_APP_URL="http://localhost:3000"
    ```
3.  Cấu hình cơ sở dữ liệu và Prisma:
    *   Tạo các bảng trong DB:
        ```powershell
        npx prisma db push
        ```
    *   Tạo Prisma Client:
        ```powershell
        npx prisma generate
        ```
    *   Chạy script kích hoạt extension `pg_trgm` và tạo GIN indexes:
        ```powershell
        node prisma/enable_trgm.mjs
        ```
    *   Nạp dữ liệu mẫu ban đầu (Seed Data):
        ```powershell
        npx prisma db seed
        ```

---

## 3. Chạy Thử nghiệm Local

1.  Khởi động server phát triển tại thư mục `web/`:
    ```powershell
    npm run dev
    ```
2.  Mở trình duyệt truy cập `http://localhost:3000`.

---

## 4. Các Lệnh Hỗ trợ Thường Dùng (Scripts)

### Tại thư mục `web/`
- `npm run dev`: Chạy môi trường phát triển local.
- `npm run build`: Biên dịch dự án Next.js (kiểm tra lỗi TypeScript/Eslint).
- `npm run lint`: Chạy công cụ kiểm tra lỗi cú pháp code.
- `npm run prisma:studio`: Mở giao diện web trực quan quản lý dữ liệu database.
- `node prisma/enable_trgm.mjs`: Chạy script cập nhật chỉ mục tìm kiếm mờ cho DB.

### Tại thư mục `contracts/`
- `npm run compile`: Biên dịch mã nguồn Solidity.
- `npm run test`: Chạy bộ unit tests.
- `npm run deploy:sepolia`: Deploy smart contract lên Sepolia testnet.