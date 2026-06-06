'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function ChangePasswordForm() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    setError('')
    setSuccess(false)

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) { setError(error.message); setLoading(false); return }
    setSuccess(true)
    setPassword('')
    setConfirm('')
    setLoading(false)
  }

  return (
    <div className="card">
      <h2>Change password</h2>
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">Password updated successfully.</div>}

      <form onSubmit={handleSubmit} className="stack">
        <div className="form-group">
          <label>New password</label>
          <input
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError('') }}
            minLength={8}
            required
            autoComplete="new-password"
          />
        </div>

        <div className="form-group">
          <label>Confirm new password</label>
          <input
            type="password"
            value={confirm}
            onChange={e => { setConfirm(e.target.value); setError('') }}
            minLength={8}
            required
            autoComplete="new-password"
          />
        </div>

        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Saving…' : 'Update password'}
        </button>
      </form>
    </div>
  )
}
