# Implementation Plan: Category Section & Detail Page Upgrade (Eventbrite-style)

This plan details the upgrade of the **Explore by Category** section on the homepage and the enhancement of the **Category Detail Page** (`/events/category/[name]`). It outlines the new visual tokens, responsive designs, elegant inline SVG icons, dynamic hover micro-animations, and the creation of beautiful hero banners for each category.

---

## User Review Required

> [!IMPORTANT]
> **Category Mappings and Styling:**
> We will support the 7 core categories matching our application and database: **Music, Tech, Food, Sports, Art, Business, and General**.
> Each category will feature:
> 1. A custom, premium inline SVG vector icon (line art) in a circular button wrapper.
> 2. A distinct color scheme / gradient for its detail page banner (e.g., Pink/Orange for Music, Purple/Blue for Tech, Yellow/Red for Food, Teal/Green for Sports, Magenta/Violet for Art, Indigo/Navy for Business, and Charcoal/Slate for General).
> 3. Dynamic hover micro-animations: circular item scaling, stroke color changes, and subtle label movement.

---

## Proposed Changes

### 1. Styles & CSS Configuration

#### [MODIFY] [globals.css](file:///d:/HK8/TicketNFT/web/app/globals.css)
- Add styling classes for the homepage category circles section:
  - `.categories-section-container`: Flex container centering the category list.
  - `.category-circle-link`: Link wrapper with smooth scaling transitions.
  - `.category-circle-inner`: Circle element (`width: 96px; height: 96px`) with thin borders (`1px solid var(--color-hairline)`), centered icon content, and scale/shadow transitions.
  - `.category-circle-icon`: Styling for the inline SVG strokes and fills.
  - `.category-circle-label`: Semi-bold text label below the circle.
- Add styling classes for the Category detail page:
  - `.category-detail-header`: Top breadcrumbs section.
  - `.category-banner`: A long, wide hero banner (`min-height: 280px`) with category-specific gradients (CSS gradients) and dynamic dark mode compatibility.
  - `.category-banner-content`: Content overlay layout (text on the left, decorative illustration/image container on the right).
  - `.category-banner-title`: Large bold heading (`font-size: 40px` or more).
  - `.category-banner-subtitle`: Supporting text description.

### 2. Homepage Upgrade

#### [MODIFY] [page.tsx (Homepage)](file:///d:/HK8/TicketNFT/web/app/page.tsx)
- Upgrade the **Explore by Category** section.
- Define a list of categories containing `name`, `slug`, `icon` (inline SVG returning function/element), and `color`.
- Render the categories as a responsive row of circles instead of rectangular boxes.
- Implement SVGs:
  - **Music**: Microphone/Music Note line art.
  - **Tech**: Chip/CPU or Laptop/Code line art.
  - **Food**: Plate/Fork/Spoon line art.
  - **Sports**: Trophy or Basketball line art.
  - **Art**: Paint palette & brush line art.
  - **Business**: Briefcase or Chart line art.
  - **General**: Ticket line art.

### 3. Category Detail Page Upgrade

#### [MODIFY] [[name]/page.tsx](file:///d:/HK8/TicketNFT/web/app/events/category/[name]/page.tsx)
- Upgrade the banner and listing UI:
  - Add a **Breadcrumb** navigation (e.g. `Home` / `Events` / `Category` / `[Name]`).
  - Upgrade the simple title/subtitle to the new full-width responsive banner (`.category-banner`) using dynamic gradients matching the category:
    - **Music**: Deep rose to orange gradient (`linear-gradient(135deg, #f43f5e 0%, #f97316 100%)`).
    - **Tech**: Violet to blue electric gradient (`linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)`).
    - **Food**: Amber to red-orange gradient (`linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)`).
    - **Sports**: Teal to emerald active gradient (`linear-gradient(135deg, #0d9488 0%, #10b981 100%)`).
    - **Art**: Pink to deep purple artistic gradient (`linear-gradient(135deg, #ec4899 0%, #7c3aed 100%)`).
    - **Business**: Indigo to dark navy corporate gradient (`linear-gradient(135deg, #4f46e5 0%, #1e1b4b 100%)`).
    - **General**: Slate/cool grey gradient (`linear-gradient(135deg, #64748b 0%, #1e293b 100%)`).
  - Embed a corresponding high-quality illustration or generated banner graphic on the right side of the banner for a professional, high-end look.
  - Render the list of events matching the category under the banner.
  - Provide filters/links to navigate to all events or clean filters.
  - Fix prices formatting (e.g., standard `$`, `ETH`, or `POL` based on current app currency tokens).

---

## Verification Plan

### Automated Tests
- Check TypeScript compiles without issues:
  ```powershell
  npx tsc --noEmit
  ```

### Manual Verification
1. Open the homepage, verify the circular categories look visually spectacular, fit properly on mobile and desktop, and scale up smoothly on hover.
2. Click on the "Music" category. Verify it redirects to `/events/category/music`.
3. Verify that `/events/category/music` shows:
   - A beautiful breadcrumb path.
   - A wide, colorful pink-to-orange gradient banner with text and illustrations.
   - The correct list of events categorized under "Music".
4. Check other categories like "Tech", "Food", and "General" to verify their color schemes, icons, and layout details.
5. Check dark mode toggle compatibility.
