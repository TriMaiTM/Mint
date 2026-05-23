# Kế hoạch khắc phục lỗ hổng kiểm soát giá bán lại (Resale Price Cap Validation)

Tài liệu này đề xuất phương án vá lỗ hổng bảo mật và điều chỉnh hệ số giá bán lại tối đa trên hợp đồng thông minh [TicketMarketplace.sol](file:///d:/HK8/TicketNFT/contracts/contracts/TicketMarketplace.sol).

---

## Ý kiến & Đánh giá về Hệ số bán lại tối đa (3x)

> [!NOTE]
> Hệ số bán lại mặc định hiện tại là **3x (300%)** là quá cao cho mục tiêu chống đầu cơ vé (scalping). 
> - Với mức 3x, một chiếc vé giá gốc $100 có thể được bán lại với giá $300, tạo kẽ hở lớn cho phe vé kiếm lời 200%.
> - Để đảm bảo tính công bằng cho người hâm mộ nhưng vẫn cho phép người bán bù đắp được chi phí giao dịch (phí hệ thống 2.5% + phí tác quyền 5% = 7.5% tổng phí), mức đề xuất hợp lý hơn là **1.2x (120%)** hoặc tối đa **1.5x (150%)**. Mức **1.2x** cho phép người bán thu hồi phí giao dịch và nhận một khoản bù đắp nhỏ, trong khi triệt tiêu hoàn toàn động lực đầu cơ quy mô lớn.

Hợp đồng [TicketMarketplace.sol](file:///d:/HK8/TicketNFT/contracts/contracts/TicketMarketplace.sol) cho phép Admin điều chỉnh thông số này bất kỳ lúc nào qua hàm `setMaxPriceMultiplier(uint16 bps)`. Kế hoạch này sẽ thay đổi giá trị mặc định lúc khởi tạo thành **1.2x (12000 BPS)**.

---

## Chi tiết các thay đổi đề xuất

### 1. Smart Contracts

#### [MODIFY] [TicketMarketplace.sol](file:///d:/HK8/TicketNFT/contracts/contracts/TicketMarketplace.sol)

- **Thay đổi mặc định trong Constructor:** Thay đổi `maxPriceMultiplierBps = 30000;` (3x) thành `12000;` (1.2x).
- **Loại bỏ try-catch nuốt lỗi trong `listTicket`:** Hiện tại, nếu có lỗi xảy ra khi gọi `getTokenTierId` hoặc `getTierPrice`, hợp đồng sẽ tự động bỏ qua kiểm tra giới hạn giá. Chúng ta sẽ chuyển sang kiểm tra bắt buộc (không try-catch) để đảm bảo mọi sự kiện của hệ thống đều được kiểm tra giá cứng:
  ```solidity
  uint8 tierId = IEventTicketNFT(nft).getTokenTierId(tokenId);
  uint256 originalPrice = IEventTicketNFT(nft).getTierPrice(tierId);
  uint256 maxPrice = (originalPrice * maxPriceMultiplierBps) / 10000;
  require(price <= maxPrice, "Price exceeds maximum");
  ```
- **Thêm kiểm tra giới hạn giá vào hàm `updatePrice`:** Hàm này hiện tại hoàn toàn không kiểm tra giới hạn giá, cho phép người bán list vé giá thấp rồi update lên giá rất cao để bypass. Chúng ta sẽ bổ sung logic kiểm tra giới hạn tương tự:
  ```solidity
  uint8 tierId = IEventTicketNFT(nft).getTokenTierId(tokenId);
  uint256 originalPrice = IEventTicketNFT(nft).getTierPrice(tierId);
  uint256 maxPrice = (originalPrice * maxPriceMultiplierBps) / 10000;
  require(newPrice <= maxPrice, "Price exceeds maximum");
  ```

---

### 2. Unit Tests

#### [MODIFY] [TicketMarketplace.test.ts](file:///d:/HK8/TicketNFT/contracts/test/TicketMarketplace.test.ts)

- **Cập nhật Test Case sửa giá cũ:**
  - Test case `"should allow seller to update price"` đang cập nhật giá lên `3.0 ETH` (3x so với giá gốc 1.0 ETH). Chúng ta sẽ đổi giá trị update mới thành `1.2 ETH` (1.2x) để phù hợp với giới hạn mới.
- **Thêm các Test Case kiểm thử bảo mật mới:**
  - `should reject listing if price exceeds the maximum limit`: Kiểm tra việc list vé giá quá 1.2x sẽ bị revert.
  - `should reject price update if new price exceeds the maximum limit`: Kiểm tra việc update giá quá 1.2x sẽ bị revert.

---

## Kế hoạch Xác minh & Chạy thử (Verification Plan)

### Chạy các bài kiểm tra tự động (Automated Tests)
1. Di chuyển vào thư mục `contracts/`:
   ```powershell
   npm run compile
   ```
2. Chạy bộ unit test để đảm bảo tất cả 20 tests hiện tại và các test mới đều pass:
   ```powershell
   npm run test
   ```
