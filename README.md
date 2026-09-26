# CusBox360 (CB360) Web Application

ระบบ Customer Data Platform (CDP) พร้อมโมดูลกิจกรรม (Activity Plug-in Modules) สำหรับธุรกิจไทย พัฒนาด้วย React 18, TypeScript, Vite และ Tailwind CSS ตาม Design System และ Mockup UI ทุกหน้าจออย่างสมบูรณ์

---

## 🚀 ฟีเจอร์และหน้าจอระบบ (Features & Screens)

### 1. CDP · ข้อมูลลูกค้า (Customer Data Platform)
- **`/customers/:id` — Customer 360**:
  - เลย์เอาต์ 3 คอลัมน์ (`330px | 1fr | 320px`)
  - **Left Profile Card**: Avatar, Customer ID, Tier Badge, Credit Grade Badge, Segment Chips, การ์ดสถิติ 2x2 (Lifetime Value, ยอด 12 เดือน, Order 12 เดือน, ซื้อล่าสุด), แถบความคืบหน้ารักษา Tier พร้อมแจ้งเตือน, ข้อมูลติดต่อ (เบอร์โทร masked, อีเมล, LINE, Facebook, วันเกิด, วันที่เป็นลูกค้า) และ Consent (PDPA) chips
  - **Middle Timeline & Sub-views**: แถบแท็บ Timeline | Orders | Service | Credit | Segments พร้อมชิปกรอง (ทั้งหมด, Order, แชท, โทร, Ticket, Deal) และ Timeline แบบเรียลไทม์พร้อมปุ่มเปิดไปยังโมดูลต้นทาง
  - **Right Related Activity**: การ์ด Deal เปิดอยู่, การ์ด Ticket เปิดอยู่พร้อมสถานะ SLA, การ์ดสถานะเครดิต และการ์ด Next Best Action สีเตือน (Warm Theme) พร้อมปุ่ม "สร้าง Task ให้ทีมสินเชื่อ"

- **`/segments` — Segments**:
  - เลย์เอาต์ 3 ส่วน (`340px | 1fr | 300px`)
  - **Left List**: ชิปกรองกลุ่ม (ทั้งหมด, RFM, Lifecycle, Service, Credit, สร้างเอง) พร้อมตัวเลขและแนวโน้ม %
  - **Middle Builder**: ตัวแก้ไขเงื่อนไข Rule Builder (ตรงทุกเงื่อนไข AND / กลุ่ม OR) เชื่อมโยงข้อมูลแบบเรียลไทม์ พร้อมตาราง Preview สมาชิก 6 รายการ
  - **Right Actions & Webhook**: แสดงยอดรวมเรียลไทม์พร้อมสัดส่วน Tier, ปุ่ม "ใช้ Segment นี้" (ส่ง LINE Broadcast, สร้าง Outbound call list 3CX, ส่ง Survey, Export CSV) และกล่อง Webhook (`segment.joined` / `segment.left`)

- **`/tiers` — Tier & Loyalty**:
  - การ์ด 4 ระดับสมาชิก (MEMBER, SILVER, GOLD, PLATINUM) พร้อมเกณฑ์ยอดใช้จ่าย สิทธิประโยชน์การตลาด และบริการ
  - แถวสถิติ KPI (ขึ้น Tier เดือนนี้ ↑312, ลง Tier เดือนนี้ ↓87, จะลง Tier ใน 30 วัน 146 พร้อมปุ่ม Win-back ไปยัง Segments)
  - ตารางการเปลี่ยน Tier ล่าสุด (เปลี่ยนจาก → เป็น, เหตุผล, วันที่)
  - แผง "กฎการขึ้น-ลงระดับ" พร้อมกล่องตัวเลือกส่งข้อความ LINE และ Webhook

- **`/consent` — Consent (PDPA)**:
  - หน้ารองรับการจัดการความยินยอมตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล

---

### 2. ACTIVITY (Daily Work Modules)
- **`/inbox` — Omnichannel Inbox (Chatwoot-style)**:
  - เลย์เอาต์ 3 คอลัมน์ (`340px | flex | 320px`)
  - รายการแชทแยกแท็บ (Mine 8, Unassigned 3, All 24) พร้อมตัวกรองสถานะ (Open, Pending, Snoozed, Resolved)
  - แชทแพน: หัวข้อผู้รับผิดชอบ, ปุ่มโอนแชท, Pending, Resolve, ข้อความลูกค้า/เจ้าหน้าที่, กล่อง Private Note สำหรับทีมภายใน
  - Composer: แท็บตอบกลับ / Private note, ทางลัดข้อความสำเร็จรูป (`/ส่งเลขพัสดุ`, `/ส่งช่องทางชำระ`), แนบไฟล์
  - การ์ด CDP ด้านขวา: แสดงข้อมูลลูกค้าแบบอ่านอย่างเดียว เชื่อมโยงกลับไปยัง Customer 360, สร้าง Lead, สร้าง Ticket ได้ทันที

- **`/pipeline` — Sales Pipeline**:
  - ตัวกรอง Pipeline, Owner, ไตรมาส
  - KPI 4 ตัว: มูลค่า Pipeline เปิดอยู่, Forecast (มูลค่า x Probability), Win rate %, Deal นิ่งเกิน 14 วัน
  - กระดาน Kanban 6 ขั้นตอน: Lead (10%), Qualified (25%), Proposal (50%), Negotiation (75%), Closed Won (100%), Closed Lost (0%)
  - การ์ด Deal พร้อมแท็กช่องทาง, จำนวนวันใน Stage, ปุ่มย้าย Stage (เมื่อเลือก Closed Lost จะมีหน้าต่างให้ระบุเหตุผลบังคับ) และปุ่ม `+ Deal ใหม่`

- **`/cases` — Service / Case**:
  - เลย์เอาต์ 2 คอลัมน์ (`1fr | 420px`)
  - KPI 4 ตัว: Ticket เปิดอยู่ (128), เกิน SLA (6), ปิดวันนี้ (54), CSAT 30 วัน (4.6 / 5)
  - ตาราง Ticket พร้อมแท็ก SLA สีเตือน/อันตราย
  - ลิ้นชักรายละเอียด Ticket ด้านขวา: ข้อมูลลูกค้า, SLA ตาม Tier, ประวัติ Activity log, กล่องพิมพ์ Log note และปุ่มตั้งเตือน, Escalate, ปิด Ticket

- **`/credit` — Credit Sales**:
  - เลย์เอาต์ 2 คอลัมน์ (`1fr | 340px`)
  - KPI 4 ตัว: ยอดลูกหนี้รวม (฿18.60M), เกินกำหนดชำระ (฿3.20M / 17%), DSO (41 วัน), ลูกค้า Grade C-D (58 ราย)
  - แถบสัดส่วน Aging ลูกหนี้ (ยังไม่ครบกำหนด, 1-30 วัน, 31-60 วัน, 61-90 วัน, 90+ วัน)
  - ตารางบัญชีลูกค้าเครดิตเรียงตามยอดเกินกำหนด พร้อมแท็ก Aging และ Next action
  - คอลัมน์ขวา: คิวคำขอเพิ่มวงเงินรออนุมัติ (ปุ่มอนุมัติ/ไม่อนุมัติ อัปเดตวงเงินของลูกค้าทันที) และรายการติดตามชำระวันนี้ (LINE, 3CX, ส่งต่อทีมการเงิน)

- **`/voice` — Voice (3CX)**:
  - หน้ารองรับระบบโทรศัพท์ Cloud PBX 3CX Telephony

---

## 🎨 Design System ("Light Blue" Theme)

- **สี (Colors)**:
  - พื้นหลังหลัก `bg.app`: `#F2F6FB`
  - กล่อง/การ์ด `bg.surface`: `#FFFFFF`
  - การ์ดเน้นสถิติ `bg.subtle`: `#F4F8FD`
  - ส่วนหัวตาราง `bg.muted`: `#F7FAFE`
  - Sidebar: `#EAF2FC`, ขอบ `#D5E3F4`, ข้อความ `#1E3A5F`, ป้ายกำกับ `#50698A`
  - แบรนด์ `brand`: `#1F6FD1`, Hover `#1558B0`, Deep `#174E8C`, Tint `#E3EEFB`, Selected `#EAF2FC`
  - สถานะเตือน `warn`: `#FDF6E9` / `#F0DDB5` / `#7A4F00`
  - สถานะอันตราย `danger`: `#FDF1EE` / `#F1CFC5` / `#8A2E1C`
  - ความสำเร็จ `success`: `#E3F1E6` / `#1F6B35`
- **ฟอนต์ (Typography)**:
  - ตัวหนังสือทั่วไป: `IBM Plex Sans Thai` (Google Fonts)
  - รหัส, ID และตัวเลข: `IBM Plex Mono`
- **การจัดสัดส่วน**:
  - Desktop First ที่ 1440x900 พร้อม Responsive รองรับหน้าจอ 1280px ไม่มี Horizontal Scrollbar หลุด

---

## 🛠️ การติดตั้งและรันโปรเจกต์ (Installation & Running)

```bash
# 1. ติดตั้ง Dependencies
npm install

# 2. เริ่มรัน Development Server
npm run dev

# 3. ทดสอบ Build สำหรับ Production
npm run build
```

---

## 📦 โครงสร้างโปรเจกต์ (Project Structure)

```
c:\atgv\cb360\
├── src/
│   ├── types/               # TypeScript Interfaces (Customer, Deal, Ticket, Conversation, etc.)
│   ├── data/                # Typed Mock Data (สอดคล้องกันทุกหน้าจอ)
│   ├── context/             # CustomerContext & ToastContext สำหรับ Global State & Feedback
│   ├── components/
│   │   ├── common/          # TierBadge, GradeBadge, ChannelChip, KpiTile, ProgressBar, Modal, CustomerSideCard
│   │   └── layout/          # Sidebar, PageHeader, AppLayout
│   ├── pages/               # ทั้ง 7 หน้าจอหลัก + Placeholder Pages
│   ├── App.tsx              # React Router setup
│   ├── index.css            # Tailwind directives & custom scrollbars
│   └── main.tsx             # React DOM root
├── tailwind.config.js       # Design tokens & color palette mapping
├── vite.config.ts           # Vite bundler config with path aliases
└── package.json
```
