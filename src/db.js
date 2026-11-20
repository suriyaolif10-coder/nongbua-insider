// API จำลองบน localStorage สำหรับ collections:
// agency_sites, ad_banners, insider_tips, fb_posts, app_config
import { useEffect, useState } from 'react'

const PREFIX = 'nongbua_'
const AUTH_KEY = PREFIX + 'admin_auth'
export const ADMIN_PASSWORD = 'nongbua2026'
export const GITHUB_URL = 'https://github.com/suriyaolif10-coder/nongbua-insider'

export const DISTRICTS = [
  { name: 'เมืองหนองบัวลำภู', short: 'อ.เมือง' },
  { name: 'นากลาง', short: 'นากลาง' },
  { name: 'โนนสัง', short: 'โนนสัง' },
  { name: 'ศรีบุญเรือง', short: 'ศรีบุญเรือง' },
  { name: 'สุวรรณคูหา', short: 'สุวรรณคูหา' },
  { name: 'นาวัง', short: 'นาวัง' },
]

export const AD_PRICES = [300, 500, 800]
export const AD_POSITIONS = ['top', 'side', 'feed']

const DAY = 86400000
const ago = (d) => new Date(Date.now() - d * DAY).toISOString()

// ข้อมูลตัวอย่าง (แก้ไข/ลบได้จากหลังบ้าน)
const SEED = {
  insider_tips: [
    {
      id: 't1', featured: true, district: 'สุวรรณคูหา', image_url: './img/temple.svg', source: 'ทอล์คนิวส์ ออนไลน์', created_at: ago(13),
      title: 'ชาวสุวรรณคูหาร่วมใจจัดงานบุญประเพณี แห่เทียนพรรษาสืบสานวัฒนธรรมอีสาน',
      content: 'ตัวอย่างข่าว: ประชาชนในพื้นที่อำเภอสุวรรณคูหาร่วมกันจัดงานบุญประเพณีประจำปี มีการแห่ขบวนเทียนพรรษาและการแสดงทางวัฒนธรรมของชุมชน',
    },
    {
      id: 't2', district: 'เมืองหนองบัวลำภู', image_url: './img/lake.svg', source: 'หนองบัว INSIDER', created_at: ago(2),
      title: 'หนองบัวบานสะพรั่ง จุดเช็คอินใหม่ใจกลางเมืองหนองบัวลำภู',
      content: 'ตัวอย่างข่าว: บึงบัวในเขตอำเภอเมืองเริ่มบานเต็มพื้นที่ นักท่องเที่ยวและชาวบ้านแวะถ่ายรูปช่วงเช้าและเย็น',
    },
    {
      id: 't3', district: 'นากลาง', image_url: './img/field.svg', source: 'เพจข่าวนากลาง', created_at: ago(3),
      title: 'เกษตรกรนากลางเริ่มเกี่ยวข้าวนาปี คาดผลผลิตดีกว่าปีก่อน',
      content: 'ตัวอย่างข่าว: เกษตรกรในอำเภอนากลางเริ่มฤดูเก็บเกี่ยวข้าวนาปี หลังปริมาณฝนเพียงพอตลอดฤดูกาล',
    },
    {
      id: 't4', district: 'นาวัง', image_url: './img/cave.svg', source: 'หนองบัว INSIDER', created_at: ago(5),
      title: 'เที่ยวถ้ำนาวัง สัมผัสหินงอกหินย้อยกลางเทือกเขาภูพาน',
      content: 'ตัวอย่างข่าว: แหล่งท่องเที่ยวทางธรรมชาติในอำเภอนาวัง เปิดให้นักท่องเที่ยวเข้าชมในช่วงปลายฝนต้นหนาว',
    },
    {
      id: 't5', district: 'ศรีบุญเรือง', image_url: './img/market.svg', source: 'ศรีบุญเรืองนิวส์', created_at: ago(1),
      title: 'ถนนคนเดินศรีบุญเรือง เปิดพื้นที่สินค้าชุมชนทุกวันเสาร์',
      content: 'ตัวอย่างข่าว: ชุมชนศรีบุญเรืองจัดถนนคนเดินจำหน่ายสินค้าพื้นเมืองและอาหารท้องถิ่นทุกสัปดาห์',
    },
    {
      id: 't6', district: 'โนนสัง', image_url: './img/road.svg', source: 'หนองบัว INSIDER', created_at: ago(0.2),
      title: 'แจ้งเตือนผู้ใช้ทาง ซ่อมผิวถนนสายหลักโนนสัง ช่วงกลางคืน',
      content: 'ตัวอย่างข่าว: หน่วยงานที่เกี่ยวข้องแจ้งปิดช่องจราจรบางส่วนเพื่อซ่อมแซมผิวถนน ขอให้ผู้ใช้รถใช้ถนนระมัดระวัง',
    },
  ],
  agency_sites: [
    { id: 'a1', name: 'ศาลากลางจังหวัดหนองบัวลำภู', url: 'https://www.nongbualamphu.go.th', category: 'ราชการ' },
    { id: 'a2', name: 'สำนักงานประชาสัมพันธ์จังหวัด', url: 'https://www.prd.go.th', category: 'ราชการ' },
    { id: 'a3', name: 'สำนักงานการท่องเที่ยวและกีฬา', url: 'https://www.mots.go.th', category: 'ท่องเที่ยว' },
  ],
  fb_posts: [
    { id: 'f1', page_name: 'หนองบัว INSIDER', embed_url: 'https://www.facebook.com/facebook' },
  ],
  ad_banners: [
    { id: 'b1', title: 'ร้านกาแฟภูพาน', image_url: '', link: '#', position: 'side', price: 300, active: false, views: 0, owner: 'ตัวอย่าง' },
  ],
  app_config: [
    { id: 'config', promptpay_number: '', repo_url: GITHUB_URL },
  ],
}

const listeners = new Set()
const emit = () => listeners.forEach((fn) => fn())

function read(col) {
  try {
    const raw = localStorage.getItem(PREFIX + col)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  const seed = SEED[col] || []
  write(col, seed, false)
  return seed
}

function write(col, rows, notify = true) {
  try { localStorage.setItem(PREFIX + col, JSON.stringify(rows)) } catch { /* ignore */ }
  if (notify) emit()
}

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7)

export const db = {
  list: (col) => read(col),
  get: (col, id) => read(col).find((r) => r.id === id),
  create(col, data) {
    const row = { ...data, id: uid(), created_at: new Date().toISOString() }
    write(col, [row, ...read(col)])
    return row
  },
  update(col, id, patch) {
    write(col, read(col).map((r) => (r.id === id ? { ...r, ...patch } : r)))
  },
  remove(col, id) {
    write(col, read(col).filter((r) => r.id !== id))
  },
  // นับยอดวิวโฆษณา (views++)
  incrementViews(id) {
    write('ad_banners', read('ad_banners').map((r) => (r.id === id ? { ...r, views: (Number(r.views) || 0) + 1 } : r)))
  },
  config: () => read('app_config')[0] || SEED.app_config[0],
  saveConfig(patch) {
    const cur = read('app_config')
    const base = cur[0] || SEED.app_config[0]
    write('app_config', [{ ...base, ...patch, id: 'config' }, ...cur.slice(1)])
  },
  subscribe(fn) {
    listeners.add(fn)
    const onStorage = (e) => e.key && e.key.startsWith(PREFIX) && fn()
    window.addEventListener('storage', onStorage)
    return () => { listeners.delete(fn); window.removeEventListener('storage', onStorage) }
  },
}

export function useCollection(col) {
  const [rows, setRows] = useState(() => db.list(col))
  useEffect(() => db.subscribe(() => setRows(db.list(col))), [col])
  return rows
}

export const auth = {
  isLoggedIn: () => { try { return localStorage.getItem(AUTH_KEY) === 'true' } catch { return false } },
  login(pw) {
    if (pw !== ADMIN_PASSWORD) return false
    localStorage.setItem(AUTH_KEY, 'true')
    return true
  },
  logout: () => localStorage.removeItem(AUTH_KEY),
}

export function timeAgo(iso) {
  if (!iso) return ''
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'เมื่อสักครู่'
  if (s < 3600) return `${Math.floor(s / 60)} นาทีที่แล้ว`
  if (s < 86400) return `${Math.floor(s / 3600)} ชั่วโมงที่แล้ว`
  if (s < 86400 * 30) return `${Math.floor(s / 86400)} วันที่แล้ว`
  return new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })
}

export const districtShort = (name) => DISTRICTS.find((d) => d.name === name)?.short || name
