# Prompt: Build the CusBox360 (CB360) web app UI

You are a senior front-end engineer and product designer. Build a clickable, production-quality front-end for **CusBox360** (short logo: **CB360**), a Customer Data Platform (CDP) with plug-in activity modules for Thai businesses. Follow the design system and screen specs below exactly. Use mock data only — no backend.

---

## 1. Product concept (read first)

- The app has two menu groups that must stay visually separate in the sidebar:
  - **CDP · ข้อมูลลูกค้า** — who the customer is: Customer 360, Segments, Tier & Loyalty, Consent.
  - **ACTIVITY** — daily work modules that plug into the CDP: Sales Pipeline, Omnichannel Inbox (LINE + Facebook, Chatwoot-style), Service / Case, Voice (3CX), Credit Sales.
- Customer master data (name, phone, address, consent) is edited only in the CDP. Activity modules show a read-only customer card pulled from the CDP and link back to Customer 360.
- Every activity record links to one `customerId`. The Customer 360 timeline shows activity summaries with a "เปิดใน <module>" link to the source module.
- UI language: **Thai** (keep product/feature names like Pipeline, Segment, Ticket, SLA in English as shown below). Currency: Thai Baht, format `฿1,284,500`.

## 2. Tech stack

- React 18 + TypeScript + Vite
- Tailwind CSS (map the tokens below into `tailwind.config`) + shadcn/ui primitives where useful
- React Router for pages; lucide-react for icons (stroke icons, no emoji)
- Mock data in `/src/data/*.ts` with typed interfaces; no API calls
- Desktop-first at 1440×900; must not break at 1280 wide

## 3. Design system ("Light Blue" theme)

### Colors

| Token | Hex | Use |
|---|---|---|
| `bg.app` | `#F2F6FB` | Page background |
| `bg.surface` | `#FFFFFF` | Cards, header, panels |
| `bg.subtle` | `#F4F8FD` | KPI tiles, stat boxes |
| `bg.muted` | `#F7FAFE` | Table header rows, rule builder box |
| `sidebar.bg` | `#EAF2FC` | Left navigation |
| `sidebar.border` | `#D5E3F4` | Sidebar right border, dividers |
| `sidebar.text` | `#1E3A5F` | Nav items |
| `sidebar.label` | `#50698A` | Section labels, role text |
| `brand` | `#1F6FD1` | Primary buttons, active tab underline, logo tile, links |
| `brand.hover` | `#1558B0` | Hover, active nav text |
| `brand.deep` | `#174E8C` | Text on light-blue chips, IDs |
| `brand.tint` | `#E3EEFB` | Selected chips, avatar backgrounds |
| `brand.selected` | `#EAF2FC` | Selected list row background (+ 3px left border `brand`) |
| `border` | `#DCE5F0` | Card borders, inputs |
| `divider` | `#E6ECF4` | Inner dividers, progress track |
| `text.primary` | `#1D2125` | Body text |
| `text.secondary` | `#5E636B` | Captions, meta |
| `text.body2` | `#3F444B` | Secondary body copy |
| `warn.bg / warn.border / warn.text` | `#FDF6E9` / `#F0DDB5` / `#7A4F00` | SLA warning, "จะลง Tier", Next best action card |
| `danger.bg / danger.border / danger.text` | `#FDF1EE` / `#F1CFC5` / `#8A2E1C` | Over SLA, overdue |
| `success.text` | `#1F6B35` on `#E3F1E6` | Consent ✓, Grade A, tier up |
| `badge.orange` | `#B4480A` | Unread count in sidebar |

Tier badges (text / background / accent line):
- MEMBER `#4A5058` / `#EEF1F5` / `#9AA3AD`
- SILVER `#4A5058` / `#ECEEF0` / `#8C959F`
- GOLD `#7A4F00` / `#FBEBC8` / `#C9962E`
- PLATINUM `#4A3F8C` / `#E9E7F5` / `#6A5CB8`

Credit grade badges: A `#1F6B35`/`#E3F1E6` · B `#1146A8`/`#E6EEFF` · C `#7A4F00`/`#FCEFD9` · D `#8A2E1C`/`#F6E1DC`

Channel colors: LINE `#06A94A` (chip `#E3F7EA`/`#0B6B34`), Facebook `#0866FF` (chip `#E6EEFF`/`#1146A8`).

### Typography
- Font: **IBM Plex Sans Thai** (400/500/600/700) from Google Fonts; IDs and codes in **IBM Plex Mono** 500.
- Scale: page title 20/700 · card title 14/600 · body 13–14/400 · caption 12 · micro labels 11 (section labels letter-spacing 1px) · KPI number 20–28/700.

### Shape and spacing
- Radius: 8px (buttons, inputs, nav items), 12px (cards), pill badges 9–14px.
- Spacing on an 4/8px grid; page padding 20px 24px; gaps 12–20px between cards.
- Buttons: height 36px (primary = `brand` fill + white text 600; secondary = white + 1px `brand` border + `brand.hover` text; neutral = white + `border`).
- Shadow only on the active sidebar item: `0 1px 2px rgba(20,60,110,0.14)`. No gradients, no emoji.
- Accessibility: real `<button>`/`<a>`/`<input>`+`<label>`, visible focus ring in `brand`, text contrast ≥ 4.5:1, `aria-label` on icon-only buttons.

## 4. App shell (all pages)

- **Sidebar** 232px, `sidebar.bg`, right border `sidebar.border`, padding 20px 12px:
  - Logo row: tile "CB360" (32px tall, `brand` fill, white bold 13px, radius 8) + wordmark "CusBox360" 18/700 `#0F2B4D`.
  - Section label "CDP · ข้อมูลลูกค้า": ลูกค้า (Customer 360), Segments, Tier & Loyalty, Consent.
  - Section label "ACTIVITY": Sales Pipeline, Omnichannel Inbox (badge "8" in `badge.orange`), Service / Case, Voice (3CX), Credit Sales.
  - Bottom: Connectors, ตั้งค่า, then user block (avatar initials on `#CFE2F8`, name 13/600, role 12 `sidebar.label`).
  - Active item: white background, `brand.hover` text, 600 weight, soft shadow.
- **Header** 60px white with bottom border: page title or breadcrumb, filters, primary action on the right.

## 5. Screens (routes)

### 5.1 `/customers/:id` — Customer 360 (CDP)
Breadcrumb "CDP / ลูกค้า / สมชาย ใจดี", global search input ("ค้นหา ชื่อ · เบอร์ · LINE UID · Customer ID"), button "+ ลูกค้าใหม่". Three-column grid `330px | 1fr | 320px`:
- **Left – Profile card**: avatar, name, Customer ID (mono), Tier badge, Credit grade badge; segment chips; 2×2 stat tiles (Lifetime Value, ยอด 12 เดือน, Order 12 เดือน, ซื้อล่าสุด); tier-retention progress bar with caption; contact list (มือถือ masked "081-xxx-5678", อีเมล, ช่องทาง LINE ✓ / Facebook ✓, วันเกิด, ลูกค้าตั้งแต่); Consent (PDPA) chips per purpose × channel (✓ green / ✕ red).
- **Middle – Timeline**: tabs Timeline | Orders | Service | Credit | Segments; filter chips (ทั้งหมด, Order, แชท, โทร, Ticket, Deal); vertical timeline items with colored 28px code circle, title, time, detail, meta, and "เปิดใน <module>" link.
- **Right – Related activity**: Deal เปิดอยู่ card (links to Pipeline), Ticket เปิดอยู่ card with SLA remaining (links to Case), เครดิต card (limit, usage bar, overdue), Next best action card (warn colors) with button "สร้าง Task ให้ทีมสินเชื่อ".

### 5.2 `/inbox` — Omnichannel Inbox (Chatwoot-style)
Columns: sidebar | conversation list 340px | chat pane (flex) | CDP customer card 320px.
- **List**: title "Inbox", status filter "สถานะ: Open ▾", search, tabs Mine 8 / Unassigned 3 / All 24; rows with avatar + channel dot (L green / f blue), name, time, preview, tier badge, label chip, unread count. Clicking a row selects it (selected style).
- **Chat pane header**: customer name, channel chip "LINE · <OA name>", assignee/team/conversation ID; buttons โอนแชท, Pending, "✓ Resolve" (primary).
- **Messages**: customer bubbles left (white, border), agent bubbles right (`brand` fill, white text), private notes full-width dashed warn box labeled "PRIVATE NOTE · ลูกค้าไม่เห็น", date separator.
- **Composer**: tabs ตอบกลับ / Private note, hint "พิมพ์ / เพื่อใช้ข้อความสำเร็จรูป", textarea, attach icon button, canned-response chips, send button.
- **Right card "ข้อมูลจาก CDP"**: avatar, tier + credit badges, phone, spend, last order, segment chips, open Deal/Ticket links, Labels with "+ เพิ่ม", buttons "+ สร้าง Lead", "+ สร้าง Ticket", "เปิด Customer 360".
- Conversation states supported in UI: Open, Pending, Snoozed, Resolved.

### 5.3 `/pipeline` — Sales Pipeline
Header: title, filters (pipeline "ลูกค้าใหม่ ▾", owner, period), "+ Deal ใหม่". KPI row (4): มูลค่า Pipeline (open deals), Forecast (value × probability), Win rate, Deal นิ่งเกิน 14 วัน (warn).
Kanban with 6 columns: Lead 10% · Qualified 25% · Proposal 50% · Negotiation 75% · Closed Won 100% · Closed Lost 0%. Column header: name, count, probability, total value, 3px colored bottom border. Deal card: title, customer, value, owner initials, source chip (LINE / Facebook / 3CX / Web form / Sales rep), age chip ("X วันใน Stage", warn when > 14); Closed Lost cards show "Lost: <reason>". Compute KPIs from the data. Drag-and-drop between columns is a nice-to-have (use dnd-kit) — Closed Lost must require a reason.

### 5.4 `/segments` — Segments (CDP)
Header: title, "ลูกค้าทั้งหมด 48,200 คน · คำนวณใหม่ทุกคืน 02:00", "+ Segment ใหม่". Three regions:
- **Left list (340px)**: group filter chips (ทั้งหมด, RFM, Lifecycle, Service, Credit, สร้างเอง); rows with name, group · Dynamic/Static, member count, trend %. Selectable.
- **Middle builder**: name input, Dynamic/Static segmented control; rule box "ตรงทุกเงื่อนไข (AND)" with rows [field] [operator] [value] [×]; buttons "+ เงื่อนไข", "+ กลุ่ม OR"; helper text listing usable data sources. Below: member preview table (ลูกค้า, Tier, ซื้อล่าสุด, ยอด 12 เดือน, Consent LINE).
- **Right (300px)**: live count card (big number + per-tier bars), "ใช้ Segment นี้" actions (ส่ง LINE Broadcast primary, สร้าง Outbound call list (3CX), ส่ง Survey, Export CSV) with consent/permission note; Webhook card (segment.joined / segment.left) with toggle.

### 5.5 `/tiers` — Tier & Loyalty (CDP)
- 4 tier cards (top border in tier accent): badge, share %, member count, rule text, marketing benefits, service benefits.
  - MEMBER 33,740 (70%) ยอด 0–19,999 บาท หรือ 1–5 Order · SILVER 9,640 (20%) 20,000–59,999 / 6–11 · GOLD 3,856 (8%) 60,000–149,999 / 12–23 · PLATINUM 964 (2%) ≥150,000 / ≥24.
- KPI row: ขึ้น Tier เดือนนี้ ↑312 (green), ลง Tier ↓87 (red), จะลง Tier ใน 30 วัน 146 (warn card with "Win-back →" to Segments).
- Table "การเปลี่ยน Tier ล่าสุด": customer, from → to badges with ↑/↓, reason, date.
- Right panel "กฎการขึ้น-ลงระดับ": 12-month rolling net spend; upgrade immediately (tier valid 12 months); downgrade max 1 level with 30-day notice; credit sales counted at invoice, grade C–D cannot upgrade; manual override needs approver + expiry + reason; VIP flag separate from tier. Checkboxes: notify via LINE; send `tier.changed` webhook.

### 5.6 `/cases` — Service / Case
Header: title, view filter, type filter, "+ สร้าง Ticket". Two columns `1fr | 420px`:
- **Left**: KPI tiles (Ticket เปิดอยู่ 128, เกิน SLA 6 danger, ปิดวันนี้ 54, CSAT 30 วัน 4.6/5); ticket table (Ticket ID mono, หัวข้อ, ลูกค้า + tier letter badge, หมวด · ช่องทาง, สถานะ, SLA remaining colored ok/warn/over). Rows selectable.
- **Right detail**: ID + status/SLA pill, title, origin line ("สร้างจากแชท LINE …"), field grid (ลูกค้า link, ประเภท/หมวด, SLA by tier e.g. Platinum ตอบแรก 1 ชม. · ปิด 1 วันทำการ, อ้างอิง Order), Activity log (colored dots), Log note textarea (@mention, attach), buttons ตั้งเตือน, Escalate, ปิด Ticket.
- SLA matrix by tier (Complaint): Member 8 ชม./3 วันทำการ · Silver 6 ชม./2 · Gold 4 ชม./1.5 · Platinum 1 ชม./1.

### 5.7 `/credit` — Credit Sales
Header: title, sync timestamp, "สร้าง Collection call list". Two columns `1fr | 340px`:
- **Left**: KPI tiles (ยอดลูกหนี้รวม ฿18.60M, เกินกำหนดชำระ ฿3.20M (17%) danger, DSO 41 วัน, ลูกค้า Grade C–D 58 ราย); Aging stacked bar with legend (ยังไม่ครบกำหนด ฿15.40M, 1–30 ฿1.90M, 31–60 ฿0.70M, 61–90 ฿0.35M, 90+ ฿0.25M — blue → amber → red); accounts table sorted by overdue (ลูกค้า, Grade, วงเงิน, ใช้ไป % with mini bar — orange when > 80%, เกินกำหนด, Aging, Next action).
- **Right**: "คำขอเพิ่มวงเงิน" queue (2 cards with current → requested limit, source, on-time %, tier, อนุมัติ / ไม่อนุมัติ buttons); "ติดตามชำระวันนี้" counts (LINE reminders, 3CX collection list, ส่งต่อทีมการเงิน) and the note "Agent ทั่วไปเห็นเฉพาะสีสถานะเครดิต · ตัวเลขเห็นเฉพาะสิทธิ์ credit.read".

### 5.8 Placeholders
`/consent` and `/voice` render the shell with an empty-state card ("กำลังพัฒนา").

## 6. Mock data (keep consistent across all screens)

Hero customer: **สมชาย ใจดี**, `C00123`, PLATINUM, Credit A, LTV ฿1,284,500, ยอด 12 เดือน ฿186,400, 27 orders, last order SO-10482 ฿8,950 (12 วันก่อน), phone 081-xxx-5678, somchai@example.com, LINE ✓ Facebook ✓, segments Champions / Good Payer / LINE Active, credit limit ฿300,000 used 42% overdue ฿0, open Deal "ต่อสัญญาบริการรายปี 2027" ฿120,000 Negotiation 75%, open Ticket TK-2310 "สอบถามรอบจัดส่ง SO-10482" Pending SLA 3 ชม.

Other customers (fictional): บจก. นำชัยการพิมพ์ (GOLD, A), Pim Chanida (SILVER), อนันต์ ศรีสุข (GOLD, A, requesting limit ฿200,000 → ฿350,000), กนกวรรณ พ. (SILVER after upgrade), Tanawat K. (MEMBER), บจก. เจริญวัสดุ (PLATINUM), บจก. ศรีอักษร (Grade D, 90+ overdue), ร้านถ่ายเอกสารหน้า ม. (C), ร้านเครื่องเขียนสยาม (C), โรงเรียนอนุบาลดวงดาว (B), รพ.สัตว์ใจดี (GOLD), คลินิกหมอฟันยิ้มสวย (MEMBER).

Users: สมหญิง ร. (Supervisor), วิภา ส. (Service/Chat Agent), ธนพล ก. (Sales Manager), อศ (Sales), มาลี ต. (Marketing), ประเทือง ว. (Credit Officer).

Define TypeScript types at least for: `Customer`, `Tier`, `CreditAccount`, `Segment`, `SegmentRule`, `Deal`, `DealStage`, `Conversation`, `Message`, `Ticket`, `TimelineEvent`, `TierChange`.

## 7. Interactions

- Sidebar navigation between all routes; active state reflects the current route.
- Selecting a row in Inbox, Segments and Cases updates the highlighted row and the detail/builder panel.
- Cross-links: timeline "เปิดใน …" links, Deal/Ticket cards, "เปิด Customer 360", customer names in tables → Customer 360.
- Inbox: switching Reply / Private note changes composer style; Resolve changes status chip.
- Pipeline KPIs recompute from data; optional drag-and-drop updates stage.
- All buttons without real behavior show a small toast ("Demo").

## 8. Out of scope
No authentication, no real LINE/Facebook/3CX integration, no backend, no dark mode.

## 9. Deliverables and acceptance
1. Runnable project (`npm install && npm run dev`) with README.
2. Tokens in `tailwind.config` and a shared component set: `Sidebar`, `PageHeader`, `Card`, `KpiTile`, `TierBadge`, `GradeBadge`, `Chip`, `DataTable`, `KanbanColumn`, `ChatBubble`, `CustomerSideCard`, `ProgressBar`.
3. All 7 screens match the layouts above at 1440×900 without horizontal scroll.
4. Thai text renders in IBM Plex Sans Thai; no emoji; contrast ≥ 4.5:1.
5. Mock data is consistent everywhere (the hero customer shows the same tier, grade, figures on every screen).

Build order: tokens + shell → Customer 360 → Inbox → Pipeline → Segments → Tier → Cases → Credit. After each screen, list what you built and any assumptions.
