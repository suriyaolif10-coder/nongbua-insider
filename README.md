# หนองบัว INSIDER

**รู้ลึก รู้จริง เรื่องหนองบัวลำภู** — แพลตฟอร์มข่าวท้องถิ่น จ.หนองบัวลำภู ธีมดาร์ค พร้อมระบบหลังบ้านแยก

🔗 GitHub: https://github.com/suriyaolif10-coder/nongbua-insider

## ฟีเจอร์

### หน้าบ้าน (Public)
- ธีมดาร์ค `#0a0a0a` / `#121212` สีหลัก `#ff6a00`
- Header โลโก้ภูเขา + ค้นหาข่าว + ปุ่ม **+ เพิ่มข่าว** (พาไปหน้า Login)
- แท็บ: TOP, ข่าวชุมชน (เพจ Facebook), ข่าวหนองบัว และ 6 อำเภอ — เมืองหนองบัวลำภู, นากลาง, โนนสัง, ศรีบุญเรือง, สุวรรณคูหา, นาวัง + เมนู dropdown
- Hero Banner, สไลด์ข่าวเด่น (ปักหมุดได้, ปัดได้บนมือถือ), พื้นที่โฆษณา, ข่าวใหม่ล่าสุด ⚡, หน่วยงานราชการ
- โฆษณา 3 ตำแหน่ง `top | side | feed` นับยอดวิว (`views++`) ทุกครั้งที่แสดง

### หลังบ้าน (Admin) — `#/admin/login`
- รหัสผ่าน: `nongbua2026` (เก็บสถานะใน `localStorage`)
- เมนู: จัดการข่าว, หน่วยงาน, เพจ Facebook, โฆษณา, ตั้งค่าระบบ (CRUD ครบ)
- สรุปยอด: ยอดวิวรวม, รายได้รวม (views × price), โฆษณาที่เปิดอยู่
- ปุ่ม Logout

## Collections (localStorage, prefix `nongbua_`)
| collection | fields |
|---|---|
| `insider_tips` | title, district, image_url, content, source, featured |
| `agency_sites` | name, url, category |
| `fb_posts` | page_name, embed_url |
| `ad_banners` | title, image_url, link, position, price (300/500/800), active, views, owner |
| `app_config` | promptpay_number, repo_url |

ข้อมูลข่าวเริ่มต้นเป็น **ข้อมูลตัวอย่าง** แก้ไข/ลบได้ในหลังบ้าน หรือกด "รีเซ็ตข้อมูลตัวอย่าง" ในหน้าตั้งค่า

## เริ่มใช้งาน
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # ไฟล์อยู่ใน dist/
```

Deploy: มี workflow `.github/workflows/deploy.yml` สำหรับ GitHub Pages (เปิด Settings → Pages → Source: GitHub Actions)

> หมายเหตุ: รหัสผ่านและข้อมูลอยู่ฝั่ง browser เหมาะสำหรับเดโม/ต้นแบบ หากใช้งานจริงควรย้ายไปใช้ backend ที่มีระบบยืนยันตัวตน

Tech: React 18 • Vite • Tailwind CSS • React Router (HashRouter)
