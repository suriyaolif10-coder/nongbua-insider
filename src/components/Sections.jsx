import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { SafeImg, Icon, Brand } from './ui.jsx'
import { db, useCollection, timeAgo, districtShort, GITHUB_URL } from '../db.js'

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <img src="./img/hero-mountain.svg" alt="ภูเขาหนองบัวลำภู" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/55 to-ink-950" />
      <div className="relative mx-auto flex max-w-6xl flex-col items-center px-4 py-14 text-center sm:py-20">
        <h1 className="font-display text-5xl font-extrabold leading-none text-brand drop-shadow-[0_4px_18px_rgba(255,106,0,.35)] sm:text-7xl">
          หนองบัว <span className="tracking-wide">INSIDER</span>
        </h1>
        <p className="mt-4 text-lg font-medium text-white sm:text-2xl">รู้ลึก รู้จริง เรื่องหนองบัวลำภู</p>
        <p className="mt-3 text-[11px] font-medium tracking-[0.25em] text-neutral-300 sm:text-xs">
          LOCAL NEWS • NONG BUA LAMPHU • ISAN REGION
        </p>
      </div>
    </section>
  )
}

export function NewsSlider({ items }) {
  const [idx, setIdx] = useState(0)
  const touch = useRef(null)
  const count = items.length

  useEffect(() => { setIdx(0) }, [count])
  useEffect(() => {
    if (count < 2) return
    const t = setInterval(() => setIdx((i) => (i + 1) % count), 5000)
    return () => clearInterval(t)
  }, [count, idx])

  if (!count) return null
  const go = (d) => setIdx((i) => (i + d + count) % count)

  return (
    <section aria-roledescription="carousel" aria-label="ข่าวเด่น">
      <div
        className="relative overflow-hidden rounded-2xl bg-ink-800"
        onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touch.current == null) return
          const dx = e.changedTouches[0].clientX - touch.current
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1)
          touch.current = null
        }}
      >
        <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${idx * 100}%)` }}>
          {items.map((n) => (
            <Link key={n.id} to={`/news/${n.id}`} className="relative block aspect-[4/3] w-full shrink-0 sm:aspect-[16/9]">
              <SafeImg src={n.image_url} alt={n.title} className="absolute inset-0 h-full w-full" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              <span className="absolute left-3 top-3 rounded-md bg-brand px-2.5 py-1 text-xs font-semibold text-white shadow sm:left-4 sm:top-4">
                {districtShort(n.district)}
              </span>
              <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
                <h2 className="line-clamp-3 font-display text-xl font-bold leading-snug text-white sm:text-3xl">{n.title}</h2>
                <p className="mt-2 text-xs text-neutral-300">{n.source} • {timeAgo(n.created_at)}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <div className="mt-3 flex justify-center gap-1.5">
        {items.map((n, i) => (
          <button
            key={n.id}
            aria-label={`ข่าวที่ ${i + 1}`}
            onClick={() => setIdx(i)}
            className={`h-2 rounded-full transition-all ${i === idx ? 'w-6 bg-brand' : 'w-2 bg-neutral-600 hover:bg-neutral-400'}`}
          />
        ))}
      </div>
    </section>
  )
}

// ช่องโฆษณา: แสดงโฆษณาที่ active ตามตำแหน่ง และนับ views++ ทุกครั้งที่ render
export function AdSlot({ position = 'top', className = '' }) {
  const ads = useCollection('ad_banners').filter((a) => a.active && a.position === position)
  const fbPage = useCollection('fb_posts')[0]?.embed_url || '#'
  const [pickedId] = useState(() => {
    const pool = db.list('ad_banners').filter((a) => a.active && a.position === position)
    return pool.length ? pool[Math.floor(Math.random() * pool.length)].id : null
  })
  const ad = ads.find((a) => a.id === pickedId) || ads[0]

  useEffect(() => {
    if (ad?.id) db.incrementViews(ad.id)
  }, [ad?.id])

  if (!ad) {
    return (
      <div className={`flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-neutral-700 px-4 py-6 text-center ${className}`}>
        <span className="text-sm font-medium text-neutral-500">พื้นที่โฆษณา</span>
        <a href={fbPage} target="_blank" rel="noreferrer" className="text-sm font-medium text-brand hover:underline">
          ลงโฆษณากับหนองบัว INSIDER ติดต่อทางเพจ &gt;
        </a>
      </div>
    )
  }

  return (
    <a href={ad.link || '#'} target="_blank" rel="noreferrer sponsored" className={`group relative block overflow-hidden rounded-xl border border-white/10 ${className}`}>
      {ad.image_url ? (
        <SafeImg src={ad.image_url} alt={ad.title} className={`w-full ${position === 'side' ? 'aspect-square' : 'aspect-[16/5]'}`} />
      ) : (
        <div className={`flex w-full items-center justify-center bg-gradient-to-r from-brand/30 to-ink-800 p-6 font-display text-xl font-bold text-white ${position === 'side' ? 'aspect-square' : 'aspect-[16/5]'}`}>
          {ad.title}
        </div>
      )}
      <span className="absolute right-2 top-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-neutral-300">โฆษณา</span>
    </a>
  )
}

export function NewsRow({ n }) {
  return (
    <Link to={`/news/${n.id}`} className="group flex gap-3 rounded-xl bg-ink-900 p-2.5 transition hover:bg-ink-800">
      <SafeImg src={n.image_url} alt={n.title} className="h-20 w-28 shrink-0 rounded-lg sm:h-24 sm:w-36" />
      <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
        <div>
          <span className="text-[11px] font-semibold text-brand">{districtShort(n.district)}</span>
          <h3 className="line-clamp-2 text-sm font-medium leading-snug text-white group-hover:text-brand sm:text-base">{n.title}</h3>
        </div>
        <p className="truncate text-[11px] text-neutral-500">{n.source} • {timeAgo(n.created_at)}</p>
      </div>
    </Link>
  )
}

export function LatestNews({ items, title = 'ข่าวใหม่ล่าสุด' }) {
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-bold text-white">
        {title} <span aria-hidden="true">⚡</span>
      </h2>
      {items.length === 0 ? (
        <p className="rounded-xl bg-ink-900 p-6 text-center text-sm text-neutral-500">ยังไม่มีข่าวในหมวดนี้</p>
      ) : (
        <div className="space-y-2.5">
          {items.map((n, i) => (
            <div key={n.id}>
              <NewsRow n={n} />
              {i === 2 && <AdSlot position="feed" className="mt-2.5" />}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export function fbEmbedSrc(url) {
  if (!url) return ''
  if (url.includes('/plugins/')) return url
  return `https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(url)}&tabs=timeline&width=500&height=600&small_header=true&hide_cover=false`
}

export function FbFeed() {
  const posts = useCollection('fb_posts')
  return (
    <section>
      <h2 className="mb-3 font-display text-xl font-bold text-white">ข่าวชุมชน <span className="text-brand">•</span> เพจ Facebook</h2>
      {posts.length === 0 && <p className="rounded-xl bg-ink-900 p-6 text-center text-sm text-neutral-500">ยังไม่มีเพจ</p>}
      <div className="grid gap-4 md:grid-cols-2">
        {posts.map((p) => (
          <div key={p.id} className="overflow-hidden rounded-xl bg-ink-900">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="font-semibold text-white">{p.page_name}</span>
              <a href={p.embed_url} target="_blank" rel="noreferrer" className="text-xs text-brand hover:underline">เปิดเพจ &gt;</a>
            </div>
            <iframe title={p.page_name} src={fbEmbedSrc(p.embed_url)} className="h-[520px] w-full border-0 bg-white" loading="lazy" allow="encrypted-media" />
          </div>
        ))}
      </div>
    </section>
  )
}

export function AgencyList({ compact = false }) {
  const sites = useCollection('agency_sites')
  const groups = sites.reduce((acc, s) => ((acc[s.category || 'อื่นๆ'] ||= []).push(s), acc), {})
  return (
    <section className="rounded-xl bg-ink-900 p-4">
      <h2 className="mb-3 font-display text-lg font-bold text-white">หน่วยงานราชการ</h2>
      {Object.entries(groups).map(([cat, list]) => (
        <div key={cat} className="mb-3 last:mb-0">
          <p className="mb-1 text-xs font-semibold text-brand">{cat}</p>
          <ul className={compact ? 'space-y-1' : 'grid gap-2 sm:grid-cols-2'}>
            {list.map((s) => (
              <li key={s.id}>
                <a href={s.url} target="_blank" rel="noreferrer" className="block truncate rounded-lg px-2 py-1.5 text-sm text-neutral-300 hover:bg-white/5 hover:text-white">
                  {s.name} <span className="text-neutral-600">↗</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
      {sites.length === 0 && <p className="text-sm text-neutral-500">ยังไม่มีข้อมูล</p>}
    </section>
  )
}

export function Footer() {
  const repo = useCollection('app_config')[0]?.repo_url || GITHUB_URL
  return (
    <footer className="mt-12 border-t border-white/10 bg-black">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-8 text-center">
        <Brand />
        <p className="text-sm text-neutral-400">รู้ลึก รู้จริง เรื่องหนองบัวลำภู</p>
        <p className="text-xs text-neutral-500">เมืองหนองบัวลำภู • นากลาง • โนนสัง • ศรีบุญเรือง • สุวรรณคูหา • นาวัง</p>
        <a href={repo} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs text-neutral-400 hover:text-brand">
          <Icon.GitHub className="h-4 w-4" /> github.com/suriyaolif10-coder/nongbua-insider
        </a>
        <p className="text-[11px] text-neutral-600">© {new Date().getFullYear()} หนองบัว INSIDER</p>
      </div>
    </footer>
  )
}
