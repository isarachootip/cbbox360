// =====================================================
// migrate.js — Create Tables + Seed Initial Data
// Run once: node migrate.js
// =====================================================
import { pool } from './db.js';

const createTables = async () => {
  console.log('📦 Creating tables...');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS conversations (
      id               TEXT PRIMARY KEY,
      customer_id      TEXT,
      customer_name    TEXT,
      customer_avatar  TEXT,
      customer_tier    TEXT DEFAULT 'MEMBER',
      channel          TEXT DEFAULT 'LINE',
      channel_account  TEXT,
      time             TEXT,
      last_message_preview TEXT,
      label            TEXT,
      unread_count     INTEGER DEFAULT 0,
      status           TEXT DEFAULT 'Open',
      assigned_to      TEXT,
      team             TEXT,
      tab_group        TEXT DEFAULT 'All',
      line_user_id     TEXT,
      is_bot_active    BOOLEAN DEFAULT TRUE,
      created_at       TIMESTAMPTZ DEFAULT NOW(),
      updated_at       TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id               TEXT PRIMARY KEY,
      conversation_id  TEXT REFERENCES conversations(id) ON DELETE CASCADE,
      sender           TEXT,         -- 'customer' | 'agent' | 'note'
      author_name      TEXT,
      text             TEXT,
      time             TEXT,
      tracking_number  TEXT,
      is_private_note  BOOLEAN DEFAULT FALSE,
      delivery_status  TEXT DEFAULT 'delivered', -- 'delivered' | 'failed' | 'sending'
      failure_reason   TEXT,
      created_at       TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_messages_conv_id ON messages(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_conv_status ON conversations(status);
    CREATE INDEX IF NOT EXISTS idx_conv_line_user ON conversations(line_user_id);
    
    -- Safe alterations for existing tables
    ALTER TABLE conversations ADD COLUMN IF NOT EXISTS is_bot_active BOOLEAN DEFAULT TRUE;
    ALTER TABLE messages ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'delivered';
    ALTER TABLE messages ADD COLUMN IF NOT EXISTS failure_reason TEXT;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS canned_responses (
      id            TEXT PRIMARY KEY,
      shortcut      TEXT UNIQUE NOT NULL,
      title         TEXT NOT NULL,
      category      TEXT DEFAULT 'answer',
      content       TEXT NOT NULL,
      tags          TEXT[] DEFAULT '{}',
      is_active     BOOLEAN DEFAULT TRUE,
      usage_count   INTEGER DEFAULT 0,
      last_used_at  TEXT,
      created_at    TEXT,
      updated_at    TEXT
    );
  `);

  console.log('✅ Tables created.');
};

// -------------------------------------------------------
// Seed: Conversations + Messages
// -------------------------------------------------------
const seedConversations = async () => {
  const existing = await pool.query('SELECT COUNT(*) FROM conversations');
  if (parseInt(existing.rows[0].count) > 0) {
    console.log('⏭️  Conversations already seeded, skipping.');
    return;
  }

  console.log('🌱 Seeding conversations...');

  // conv-1
  await pool.query(`
    INSERT INTO conversations (id, customer_id, customer_name, customer_tier, channel, channel_account, time, last_message_preview, label, unread_count, status, assigned_to, team, tab_group)
    VALUES ('conv-1','C00123','สมชาย ใจดี','PLATINUM','LINE','cb360 Official','10:41','ของจะถึงพรุ่งนี้ใช่ไหมครับ','จัดส่ง',0,'Open','วิภา ส.','Customer Care','Mine')
  `);
  for (const msg of [
    { id: 'm-1', sender: 'customer', text: 'สวัสดีครับ สั่งหมึกพิมพ์ไปเมื่อ 14 ก.ย. เลข SO-10482 ครับ', time: '10:32' },
    { id: 'm-2', sender: 'customer', text: 'ของจะถึงเมื่อไหร่ครับ ต้องใช้ด่วน', time: '10:33' },
    { id: 'm-3', sender: 'note', author_name: 'วิภา ส.', text: '@ธนพล ลูกค้า Platinum มี Deal ต่อสัญญาค้างอยู่ ช่วยโทรตามหลังปิดแชทนี้ด้วย', time: '10:35', is_private_note: true },
    { id: 'm-4', sender: 'agent', author_name: 'วิภา ส.', text: 'สวัสดีค่ะคุณสมชาย ตรวจสอบแล้ว SO-10482 ออกจากคลังวันนี้ จะถึงพรุ่งนี้ก่อน 12:00 ค่ะ เลขพัสดุ TH2609-88412', time: '10:38', tracking_number: 'TH2609-88412' },
    { id: 'm-5', sender: 'customer', text: 'ของจะถึงพรุ่งนี้ใช่ไหมครับ', time: '10:41' },
  ]) {
    await pool.query(
      `INSERT INTO messages (id, conversation_id, sender, author_name, text, time, tracking_number, is_private_note)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [msg.id, 'conv-1', msg.sender, msg.author_name || null, msg.text, msg.time, msg.tracking_number || null, msg.is_private_note || false]
    );
  }

  // conv-2
  await pool.query(`
    INSERT INTO conversations (id, customer_id, customer_name, customer_tier, channel, channel_account, time, last_message_preview, label, unread_count, status, assigned_to, team, tab_group)
    VALUES ('conv-2','C00124','บจก. นำชัยการพิมพ์','GOLD','LINE','cb360 Official','10:36','ขอใบเสนอราคาเครื่องพิมพ์ 5 เครื่อง','ใบเสนอราคา',2,'Open','ธนพล ก.','Sales','All')
  `);
  await pool.query(
    `INSERT INTO messages (id, conversation_id, sender, text, time) VALUES ($1,$2,$3,$4,$5)`,
    ['m-201', 'conv-2', 'customer', 'ขอใบเสนอราคาเครื่องพิมพ์รุ่น Pro 5 เครื่องครับ', '10:36']
  );

  console.log('✅ Conversations seeded.');
};

// -------------------------------------------------------
// Seed: Canned Responses
// -------------------------------------------------------
const seedCannedResponses = async () => {
  const existing = await pool.query('SELECT COUNT(*) FROM canned_responses');
  if (parseInt(existing.rows[0].count) > 0) {
    console.log('⏭️  Canned responses already seeded, skipping.');
    return;
  }

  console.log('🌱 Seeding canned responses...');

  const responses = [
    { id: 'cr-1', shortcut: '/ทักทายทั่วไป', title: 'ทักทายทั่วไป (สุภาพ & เป็นกันเอง)', category: 'greeting', content: 'สวัสดีค่ะคุณ {customer_name} CusBox360 ยินดีให้บริการค่ะ วันนี้มีเรื่องไหนให้แอดมินช่วยดูแลหรือสอบถามข้อมูลเพิ่มเติมได้เลยนะคะ 😊', tags: ['ทักทาย','ต้อนรับ','ทั่วไป'], usage_count: 142, last_used_at: 'วันนี้ 10:30', created_at: '2026-09-01', updated_at: '2026-09-20' },
    { id: 'cr-2', shortcut: '/ทักทายเช้า', title: 'สวัสดีตอนเช้า (Morning Greeting)', category: 'greeting', content: 'สวัสดีตอนเช้าค่ะคุณ {customer_name} ☀️ ขอให้เป็นวันที่สดใสและราบรื่นนะคะ สอบถามสินค้าหรือติดตามสถานะรายการสั่งซื้อ แจ้งแอดมินได้ตลอดเลยค่ะ', tags: ['เช้า','ทักทาย','เปิดร้าน'], usage_count: 89, last_used_at: 'วันนี้ 08:45', created_at: '2026-09-01', updated_at: '2026-09-15' },
    { id: 'cr-3', shortcut: '/ยินดีต้อนรับสมาชิกใหม่', title: 'ต้อนรับสมาชิกใหม่ (New Member)', category: 'greeting', content: 'ยินดีต้อนรับคุณ {customer_name} สู่ครอบครัว CusBox360 ค่ะ! 🎉 ขอบพระคุณที่ให้ความสนใจในผลิตภัณฑ์ของเรา หากต้องการคำแนะนำการใช้งานหรือโปรโมชั่นพิเศษ ยินดีให้คำปรึกษาค่ะ', tags: ['สมาชิกใหม่','ยินดีต้อนรับ','Member'], usage_count: 65, last_used_at: 'เมื่อวาน 15:20', created_at: '2026-09-05', updated_at: '2026-09-18' },
    { id: 'cr-4', shortcut: '/ขออภัยล่าช้า', title: 'ขออภัยที่ตอบกลับล่าช้า', category: 'greeting', content: 'ขออภัยในความล่าช้าเป็นอย่างยิ่งค่ะคุณ {customer_name} 🙏 ขณะนี้มีผู้ติดต่อเข้ามาเป็นจำนวนมาก แอดมินพร้อมดูแลรายการของคุณลูกค้าทันทีค่ะ มีเรื่องใดให้ช่วยเหลือแจ้งได้เลยนะคะ', tags: ['ขออภัย','ล่าช้า','คิวยาว'], usage_count: 118, last_used_at: 'วันนี้ 09:15', created_at: '2026-09-02', updated_at: '2026-09-22' },
    { id: 'cr-5', shortcut: '/ขอที่อยู่จัดส่ง', title: 'ขอชื่อ ที่อยู่ และเบอร์โทรสำหรับจัดส่ง', category: 'question', content: 'รบกวนคุณ {customer_name} แจ้งข้อมูลสำหรับจัดส่งสินค้าดังนี้นะคะ:\n1. ชื่อ-นามสกุล ผู้รับ\n2. เบอร์โทรศัพท์ที่ติดต่อได้สะดวก\n3. ที่อยู่จัดส่งโดยละเอียด (บ้านเลขที่, แขวง/ตำบล, เขต/อำเภอ, จังหวัด, รหัสไปรษณีย์) 📦', tags: ['ที่อยู่','เบอร์โทร','จัดส่ง'], usage_count: 235, last_used_at: 'วันนี้ 10:15', created_at: '2026-09-01', updated_at: '2026-09-25' },
    { id: 'cr-6', shortcut: '/ขอสลิปโอนเงิน', title: 'ขอหลักฐานการโอนเงิน (สลิป/หลักฐาน)', category: 'question', content: 'หลังจากโอนเงินเรียบร้อยแล้ว รบกวนส่งรูปสลิปหลักฐานการโอนเงิน พร้อมระบุเลขที่คำสั่งซื้อ ({order_code}) เพื่อให้แอดมินส่งเรื่องออกใบเสร็จและจัดส่งสินค้าต่อไปค่ะ 🧾', tags: ['สลิป','หลักฐาน','การชำระเงิน'], usage_count: 198, last_used_at: 'วันนี้ 10:25', created_at: '2026-09-01', updated_at: '2026-09-24' },
    { id: 'cr-7', shortcut: '/สอบถามเลขคำสั่งซื้อ', title: 'ขอหมายเลขคำสั่งซื้อ หรือเลขอ้างอิง', category: 'question', content: 'รบกวนขอทราบหมายเลขคำสั่งซื้อ (เช่น SO-XXXXX) หรือเบอร์โทรศัพท์ที่ใช้สั่งซื้อ เพื่อให้เจ้าหน้าที่ตรวจสอบสถานะในระบบให้ได้รวดเร็วขึ้นค่ะ 🔍', tags: ['คำสั่งซื้อ','Order ID','ค้นหา'], usage_count: 156, last_used_at: 'วันนี้ 09:50', created_at: '2026-09-03', updated_at: '2026-09-20' },
    { id: 'cr-8', shortcut: '/ขอรูปแจ้งเคลม', title: 'ขอรูปถ่ายและคลิปสินค้าชำรุดเคลม', category: 'question', content: 'รบกวนคุณ {customer_name} ถ่ายรูปกล่องพัสดุภายนอก, ป้ายจ่าหน้า และรูป/คลิปวิดีโอจุดที่สินค้าชำรุดเสียหาย เพื่อให้ทีมงาน Service ประสานงานเปลี่ยนสินค้าชิ้นใหม่ให้โดยด่วนค่ะ 🔧', tags: ['เคลม','รูปถ่าย','ชำรุด','Service'], usage_count: 74, last_used_at: 'เมื่อวาน 16:10', created_at: '2026-09-05', updated_at: '2026-09-21' },
    { id: 'cr-9', shortcut: '/ขอข้อมูลออกใบกำกับ', title: 'ขอข้อมูลออกใบกำกับภาษีเต็มรูป', category: 'question', content: 'สำหรับการออกใบกำกับภาษีเต็มรูปแบบ รบกวนแจ้งข้อมูลดังนี้ค่ะ:\n- ชื่อบริษัท/ชื่อบุคคล\n- เลขประจำตัวผู้เสียภาษี 13 หลัก\n- ที่อยู่ตาม ภ.พ.20 หรือบัตรประชาชน\n- สำนักงานใหญ่ หรือ สาขา (ระบุรหัสสาขา) 📑', tags: ['ใบกำกับภาษี','Tax ID','ภพ20','บัญชี'], usage_count: 92, last_used_at: 'วันนี้ 08:30', created_at: '2026-09-04', updated_at: '2026-09-19' },
    { id: 'cr-10', shortcut: '/ส่งช่องทางชำระ', title: 'บัญชีธนาคารสำหรับโอนเงิน', category: 'answer', content: '💳 ช่องทางชำระเงินของบริษัท:\nธนาคารกสิกรไทย (KBANK)\nเลขที่บัญชี: 012-3-45678-9\nชื่อบัญชี: บจก. คัสบอกซ์ สามหกศูนย์ (CusBox360 Co., Ltd.)\n*เมื่อโอนเงินแล้ว แนบสลิปผ่านแชทนี้ได้เลยนะคะ*', tags: ['ธนาคาร','ชำระเงิน','โอนเงิน','บัญชี'], usage_count: 310, last_used_at: 'วันนี้ 10:40', created_at: '2026-09-01', updated_at: '2026-09-26' },
    { id: 'cr-11', shortcut: '/ส่งเลขพัสดุ', title: 'แจ้งเลขติดตามพัสดุ (Tracking No.)', category: 'answer', content: '📦 พัสดุของคุณ {customer_name} (อ้างอิง {order_code}) ได้รับการส่งมอบให้ขนส่งเรียบร้อยแล้วค่ะ\nหมายเลขพัสดุ: {tracking_no}\nตรวจสอบสถานะได้ที่ขนส่ง Flash Express / Kerry Express ได้ตลอด 24 ชม. ค่ะ 🚚', tags: ['พัสดุ','จัดส่ง','Tracking','เลขพัสดุ'], usage_count: 284, last_used_at: 'วันนี้ 10:38', created_at: '2026-09-01', updated_at: '2026-09-26' },
    { id: 'cr-12', shortcut: '/แจ้งรอบจัดส่ง', title: 'รอบเวลาการตัดรอบและระยะเวลาจัดส่ง', category: 'answer', content: '⏱️ รอบจัดส่งของร้าน:\n- ตัดรอบทุกวันจันทร์ - เสาร์ เวลา 12:00 น.\n- คำสั่งซื้อหลัง 12:00 น. จะจัดส่งในวันทำการถัดไป\n- กทม. และปริมณฑลได้รับใน 1 วันทำการ / ต่างจังหวัด 1-2 วันทำการค่ะ', tags: ['รอบส่ง','ตัดรอบ','เวลาจัดส่ง'], usage_count: 167, last_used_at: 'วันนี้ 09:40', created_at: '2026-09-02', updated_at: '2026-09-15' },
    { id: 'cr-13', shortcut: '/เวลาทำการ', title: 'เวลาทำการและช่องทางติดต่อ', category: 'answer', content: '🏢 เวลาทำการศูนย์บริการลูกค้า CusBox360:\n• จันทร์ - ศุกร์: 08:30 - 18:00 น.\n• เสาร์: 09:00 - 16:00 น.\n• วันอาทิตย์และวันหยุดนักขัตฤกษ์: ปิดทำการ (สามารถฝากข้อความไว้ได้ เจ้าหน้าที่จะรีบติดต่อกลับในเวลาทำการค่ะ)', tags: ['เวลาทำการ','ติดต่อ','เปิดปิด'], usage_count: 88, last_used_at: 'เมื่อวาน 18:02', created_at: '2026-09-03', updated_at: '2026-09-10' },
    { id: 'cr-14', shortcut: '/นโยบายเปลี่ยนคืน', title: 'เงื่อนไขการรับประกันและเปลี่ยนสินค้า', category: 'answer', content: '🛡️ นโยบายการรับประกันสินค้า:\n- สินค้ารับประกัน 1 ปีเต็มศูนย์ไทย\n- หากพบปัญหาจากการผลิตภายใน 7 วัน เปลี่ยนตัวใหม่ให้ทันทีโดยไม่มีค่าใช้จ่าย\n- กรุณาเก็บกล่องและอุปกรณ์ครบชุดเพื่อใช้ในการเคลมค่ะ', tags: ['ประกัน','เคลม','เปลี่ยนสินค้า','7วัน'], usage_count: 104, last_used_at: 'วันนี้ 09:10', created_at: '2026-09-04', updated_at: '2026-09-22' },
    { id: 'cr-15', shortcut: '/เงื่อนไขเครดิต', title: 'การขอเปิดวงเงินสินเชื่อและเครดิตเทอม', category: 'answer', content: '💼 เงื่อนไขการขอวงเงินเครดิตเทอม (Credit Term 30-60 วัน):\n- มียอดสั่งซื้อสะสมกับบริษัทต่อเนื่องอย่างน้อย 3 เดือน หรือเกรด B ขึ้นไป\n- ยื่นเอกสาร: ภ.พ.20, หนังสือรับรองบริษัท (ไม่เกิน 3 เดือน) และ Statement ย้อนหลัง 6 เดือน\n- ใช้เวลาพิจารณาอนุมัติ 1-3 วันทำการค่ะ', tags: ['เครดิต','วงเงิน','Credit Term','การเงิน'], usage_count: 52, last_used_at: 'เมื่อวาน 14:15', created_at: '2026-09-08', updated_at: '2026-09-24' },
  ];

  for (const r of responses) {
    await pool.query(
      `INSERT INTO canned_responses (id, shortcut, title, category, content, tags, is_active, usage_count, last_used_at, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,true,$7,$8,$9,$10)
       ON CONFLICT (id) DO NOTHING`,
      [r.id, r.shortcut, r.title, r.category, r.content, r.tags, r.usage_count, r.last_used_at, r.created_at, r.updated_at]
    );
  }

  console.log('✅ Canned responses seeded.');
};

// -------------------------------------------------------
// Main
// -------------------------------------------------------
const migrate = async () => {
  try {
    await createTables();
    await seedConversations();
    await seedCannedResponses();
    console.log('\n🎉 Migration complete!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

migrate();
