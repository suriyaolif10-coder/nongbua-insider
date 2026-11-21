/**
 * เควสหมู่บ้าน: ตัวเชื่อม Google Sheet (Google Apps Script)
 *
 * วิธีใช้ (ดู README.md):
 * 1. เปิด Google Sheet > ส่วนขยาย > Apps Script > วางโค้ดนี้
 * 2. เลือกฟังก์ชัน setup แล้วกด "เรียกใช้" (สร้างชีต Quests / Log / Config ให้)
 * 3. แก้รหัสทีม (TEAM_PIN) ในชีต Config
 * 4. ทำให้ใช้งานได้ > การทำให้ใช้งานได้รายการใหม่ > เว็บแอป
 *    - เรียกใช้ในฐานะ: ฉัน
 *    - ผู้ที่มีสิทธิ์เข้าถึง: ทุกคน
 * 5. คัดลอก URL ไปวางที่ CONFIG.API_URL ใน index.html
 */

const SHEET_QUESTS = 'Quests';
const SHEET_LOG = 'Log';
const SHEET_CONFIG = 'Config';

// ต้องตรงกับ RESULTS ใน index.html
const RESULTS = {
  paid:    { label: 'รับชำระแล้ว',     exp: 50, close: true },
  plan:    { label: 'นัดผ่อนชำระ',      exp: 30, close: true },
  help:    { label: 'ส่งต่อคณะกรรมการ', exp: 20, close: true },
  visited: { label: 'ไม่พบเจ้าของบ้าน', exp: 10, close: false },
};

const QUEST_HEADERS = ['quest_id', 'house_code', 'zone', 'task', 'owed', 'status', 'last_note', 'last_visit', 'map_x', 'map_y'];
const LOG_HEADERS = ['timestamp', 'player', 'quest_id', 'house_code', 'result', 'result_code', 'amount', 'note', 'exp'];

/** สร้างชีตและหัวคอลัมน์ (รันครั้งแรกครั้งเดียว) */
function setup() {
  const ss = SpreadsheetApp.getActive();
  const q = ss.getSheetByName(SHEET_QUESTS) || ss.insertSheet(SHEET_QUESTS);
  if (q.getLastRow() === 0) {
    q.appendRow(QUEST_HEADERS);
    q.appendRow(['Q001', 'บ้าน ก-01', 'หมู่ 1', 'เยี่ยมติดตามงวด พ.ย.', 1500, 'open', '', '', '', '']);
    q.appendRow(['Q002', 'บ้าน ข-02', 'หมู่ 2', 'ทวนนัดผ่อนที่ตกลงไว้', 800, 'open', '', '', '', '']);
    q.setFrozenRows(1);
  }
  const l = ss.getSheetByName(SHEET_LOG) || ss.insertSheet(SHEET_LOG);
  if (l.getLastRow() === 0) { l.appendRow(LOG_HEADERS); l.setFrozenRows(1); }
  const c = ss.getSheetByName(SHEET_CONFIG) || ss.insertSheet(SHEET_CONFIG);
  if (c.getLastRow() === 0) {
    c.appendRow(['key', 'value', 'คำอธิบาย']);
    c.appendRow(['TEAM_PIN', '1234', 'รหัสทีมสำหรับเข้าเกม (เปลี่ยนก่อนใช้งานจริง)']);
    c.appendRow(['MONTHLY_TARGET', 15000, 'เป้ายอดรับชำระต่อเดือน (บาท)']);
  }
}

function doGet(e) { return handle_((e && e.parameter) || {}); }

function doPost(e) {
  let body = {};
  try { body = JSON.parse(e.postData.contents); } catch (err) { /* ignore */ }
  return handle_(body);
}

function handle_(p) {
  try {
    const cfg = getConfig_();
    if (!cfg.TEAM_PIN || String(p.pin || '') !== String(cfg.TEAM_PIN)) {
      return json_({ ok: false, error: 'รหัสทีมไม่ถูกต้อง' });
    }
    const player = String(p.player || '').trim().slice(0, 30);
    if (!player) return json_({ ok: false, error: 'ไม่มีชื่อผู้เล่น' });

    if (p.action === 'load') return json_(Object.assign({ ok: true, quests: readQuests_() }, stats_(player, cfg)));
    if (p.action === 'submit') return json_(submit_(p, player, cfg));
    return json_({ ok: false, error: 'ไม่รู้จักคำสั่ง' });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message || err) });
  }
}

function submit_(p, player, cfg) {
  const r = RESULTS[p.result];
  if (!r) return { ok: false, error: 'ผลการติดตามไม่ถูกต้อง' };
  const amount = p.result === 'paid' ? Math.max(0, Math.round(Number(p.amount) || 0)) : 0;
  if (p.result === 'paid' && amount <= 0) return { ok: false, error: 'ต้องใส่จำนวนเงิน' };
  const note = String(p.note || '').slice(0, 300);

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = SpreadsheetApp.getActive().getSheetByName(SHEET_QUESTS);
    const data = sh.getDataRange().getValues();
    const h = data[0];
    const col = name => h.indexOf(name);
    let rowIdx = -1;
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][col('quest_id')]) === String(p.quest_id)) { rowIdx = i; break; }
    }
    if (rowIdx < 0) return { ok: false, error: 'ไม่พบเควสนี้ในชีต' };
    if (String(data[rowIdx][col('status')]).toLowerCase() === 'done') return { ok: false, error: 'เควสนี้ปิดไปแล้ว' };

    const now = new Date();
    const lastNote = r.label + (amount ? ' ' + amount + ' บาท' : '') + (note ? ' · ' + note : '') + ' (' + player + ')';
    const row = rowIdx + 1;
    if (r.close) sh.getRange(row, col('status') + 1).setValue('done');
    sh.getRange(row, col('last_note') + 1).setValue(safe_(lastNote));
    if (col('last_visit') >= 0) sh.getRange(row, col('last_visit') + 1).setValue(now);

    SpreadsheetApp.getActive().getSheetByName(SHEET_LOG).appendRow([
      now, safe_(player), safe_(p.quest_id), safe_(data[rowIdx][col('house_code')]),
      r.label, p.result, amount, safe_(note), r.exp
    ]);
  } finally {
    lock.releaseLock();
  }
  return Object.assign({ ok: true, gained: r.exp }, stats_(player, cfg));
}

function readQuests_() {
  const sh = SpreadsheetApp.getActive().getSheetByName(SHEET_QUESTS);
  const data = sh.getDataRange().getValues();
  const h = data.shift();
  return data
    .filter(r => r[h.indexOf('quest_id')] !== '')
    .map(r => {
      const o = {};
      QUEST_HEADERS.forEach(k => { const i = h.indexOf(k); o[k] = i >= 0 ? r[i] : ''; });
      o.status = String(o.status || 'open').toLowerCase() === 'done' ? 'done' : 'open';
      o.last_visit = o.last_visit instanceof Date ? o.last_visit.toISOString() : String(o.last_visit || '');
      return o;
    });
}

/** EXP ของแต่ละคน (รวมทั้งหมด) + ยอดรับชำระของเดือนปัจจุบัน */
function stats_(player, cfg) {
  const sh = SpreadsheetApp.getActive().getSheetByName(SHEET_LOG);
  const data = sh.getDataRange().getValues();
  const h = data.shift();
  const now = new Date();
  const exp = {};
  let collected = 0;
  data.forEach(r => {
    const name = String(r[h.indexOf('player')]);
    exp[name] = (exp[name] || 0) + (Number(r[h.indexOf('exp')]) || 0);
    const t = r[h.indexOf('timestamp')];
    if (t instanceof Date && t.getMonth() === now.getMonth() && t.getFullYear() === now.getFullYear()) {
      collected += Number(r[h.indexOf('amount')]) || 0;
    }
  });
  if (!(player in exp)) exp[player] = 0;
  return {
    me: { exp: exp[player] },
    team: {
      collected: collected,
      target: Number(cfg.MONTHLY_TARGET) || 0,
      players: Object.keys(exp).map(n => ({ name: n, exp: exp[n] })),
    },
  };
}

function getConfig_() {
  const sh = SpreadsheetApp.getActive().getSheetByName(SHEET_CONFIG);
  const cfg = {};
  if (!sh) return cfg;
  sh.getDataRange().getValues().forEach(r => { if (r[0]) cfg[String(r[0]).trim()] = r[1]; });
  return cfg;
}

/** กันสูตรแปลกปลอม (formula injection) เวลาเขียนข้อความจากผู้เล่นลงชีต */
function safe_(v) {
  const s = String(v == null ? '' : v);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
