/**
 * พัฒนากรออกเควส: ตัวเชื่อม Google Sheet (Google Apps Script)
 *
 * เกมอ่านทุกชีตที่ชื่อขึ้นต้นด้วย "ปี" (เช่น "ปี 60" … "ปี 67") แบบอ่านอย่างเดียว
 * คอลัมน์ A–J: จังหวัด | อำเภอ/เขต | ปีงบประมาณ | เลขที่สัญญา | ชื่อโครงการ | ผู้เสนอ |
 *              สถานที่ดำเนินการ | จำนวนเงินกู้ | สถานะการชำระหนี้ | สถานะโครงการ
 * ผลการลงพื้นที่บันทึกในชีต "บันทึกติดตาม" (สร้างให้อัตโนมัติ) ไม่แก้ข้อมูลปีงบเดิม
 *
 * วิธีติดตั้ง (ดู README.md):
 * 1. เปิดชีตข้อมูล > ส่วนขยาย > Apps Script
 * 2. วางไฟล์นี้เป็น Code.gs และสร้างไฟล์ HTML ชื่อ index แล้ววางเนื้อหา index.html
 * 3. ทำให้ใช้งานได้ > การทำให้ใช้งานได้รายการใหม่ > เว็บแอป
 *    เรียกใช้ในฐานะ: ฉัน · ผู้ที่มีสิทธิ์เข้าถึง: เฉพาะตัวฉันเอง
 */

const DATA_SHEET_RE = /^ปี\s*\d+/;
const LOG_SHEET = 'บันทึกติดตาม';
const LOG_HEADERS = ['เวลา', 'พัฒนากร', 'รหัสอ้างอิง', 'ชีต', 'เลขที่สัญญา', 'ชื่อโครงการ', 'ตำบล',
  'ผลการลงพื้นที่', 'รหัสผล', 'จำนวนเงินที่รับ', 'วันนัดชำระ', 'บันทึก', 'EXP'];

// ต้องตรงกับ RESULTS ใน index.html
const RESULTS = {
  paid:   { label: 'รับชำระเงิน', exp: 50 },
  appt:   { label: 'นัดชำระ', exp: 30 },
  letter: { label: 'แจ้งหนังสือทวงถาม', exp: 20 },
  rs:     { label: 'เสนอปรับโครงสร้างหนี้', exp: 20 },
  visit:  { label: 'เยี่ยมติดตามกลุ่ม', exp: 15 },
  none:   { label: 'ไม่พบผู้กู้', exp: 10 },
};

function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('พัฒนากรออกเควส')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
}

/** สร้างชีต "บันทึกติดตาม" (เกมเรียกให้เองตอนบันทึกครั้งแรก จะรันเองก็ได้) */
function setup() { logSheet_(); }

function logSheet_() {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(LOG_SHEET);
  if (!sh) {
    sh = ss.insertSheet(LOG_SHEET);
    sh.appendRow(LOG_HEADERS);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, LOG_HEADERS.length).setFontWeight('bold').setBackground('#f3eedc');
  }
  return sh;
}

/** ส่งข้อมูลทุกสัญญา + ประวัติการติดตาม ให้เกม */
function apiLoad() {
  const ss = SpreadsheetApp.getActive();
  const rows = [], sheets = [];
  ss.getSheets().forEach(sh => {
    const name = sh.getName();
    if (DATA_SHEET_RE.test(name)) sheets.push(name); // ส่งชื่อแท็บปีไปด้วย แม้ยังไม่มีข้อมูล
    if (!DATA_SHEET_RE.test(name) || sh.getLastRow() < 2) return;
    const v = sh.getRange(1, 1, sh.getLastRow(), 10).getDisplayValues();
    for (let i = 1; i < v.length; i++) {
      if (String(v[i][3]).trim() || String(v[i][4]).trim()) rows.push({ sheet: name, v: v[i] });
    }
  });
  return { ok: true, rows: rows, sheets: sheets, log: readLog_() };
}

function readLog_() {
  const sh = SpreadsheetApp.getActive().getSheetByName(LOG_SHEET);
  if (!sh || sh.getLastRow() < 2) return [];
  const first = Math.max(2, sh.getLastRow() - 3000 + 1);
  const v = sh.getRange(first, 1, sh.getLastRow() - first + 1, LOG_HEADERS.length).getValues();
  return v.filter(r => r[2]).map(r => ({
    ts: r[0] instanceof Date ? r[0].toISOString() : String(r[0]),
    player: String(r[1]), key: String(r[2]), result: String(r[8]),
    amount: Number(r[9]) || 0,
    appt: r[10] instanceof Date ? Utilities.formatDate(r[10], Session.getScriptTimeZone(), 'yyyy-MM-dd') : String(r[10] || ''),
    note: String(r[11] || ''), exp: Number(r[12]) || 0,
  }));
}

/** บันทึกผลการลงพื้นที่ 1 รายการ */
function apiSubmit(p) {
  p = p || {};
  const r = RESULTS[p.result];
  if (!r) return { ok: false, error: 'ผลการลงพื้นที่ไม่ถูกต้อง' };
  const player = String(p.player || '').trim().slice(0, 30);
  if (!player) return { ok: false, error: 'ไม่มีชื่อพัฒนากร' };
  if (!p.key) return { ok: false, error: 'ไม่มีรหัสสัญญา' };
  const amount = p.result === 'paid' ? Math.max(0, Math.round(Number(p.amount) || 0)) : 0;
  if (p.result === 'paid' && amount <= 0) return { ok: false, error: 'ต้องใส่จำนวนเงิน' };
  const appt = p.result === 'appt' ? String(p.appt || '').slice(0, 10) : '';
  const note = String(p.note || '').slice(0, 300);
  const now = new Date();

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    logSheet_().appendRow([
      now, safe_(player), safe_(p.key), safe_(p.sheet), safe_(p.contract), safe_(p.project), safe_(p.tambon),
      r.label, p.result, amount, appt, safe_(note), r.exp,
    ]);
  } finally {
    lock.releaseLock();
  }
  return { ok: true, entry: { ts: now.toISOString(), player, key: String(p.key), result: p.result, amount, appt, note, exp: r.exp } };
}

/** กันสูตรแปลกปลอม (formula injection) เวลาเขียนข้อความลงชีต */
function safe_(v) {
  const s = String(v == null ? '' : v);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}
