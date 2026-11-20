import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Brand } from '../components/ui.jsx'
import { auth } from '../db.js'

export default function Login() {
  const navigate = useNavigate()
  const [pw, setPw] = useState('')
  const [error, setError] = useState('')

  if (auth.isLoggedIn()) return <Navigate to="/admin" replace />

  const submit = (e) => {
    e.preventDefault()
    if (auth.login(pw)) navigate('/admin', { replace: true })
    else setError('รหัสผ่านไม่ถูกต้อง')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950 px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-white/10 bg-ink-900 p-6 shadow-2xl">
        <div className="mb-6 flex flex-col items-center gap-2">
          <Brand size="lg" />
          <p className="text-sm text-neutral-400">เข้าสู่ระบบหลังบ้าน</p>
        </div>
        <label htmlFor="pw" className="mb-1 block text-sm text-neutral-300">รหัสผ่าน</label>
        <input
          id="pw"
          type="password"
          autoFocus
          value={pw}
          onChange={(e) => { setPw(e.target.value); setError('') }}
          className="input"
          placeholder="••••••••"
        />
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
        <button type="submit" className="btn-brand mt-5 w-full py-2.5">เข้าสู่ระบบ</button>
        <Link to="/" className="mt-4 block text-center text-xs text-neutral-500 hover:text-brand">← กลับหน้าเว็บไซต์</Link>
      </form>
    </div>
  )
}
