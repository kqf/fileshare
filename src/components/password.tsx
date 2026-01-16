import { useState, type ReactNode } from 'react'

interface NeedsPasswordProps {
  children: ReactNode
}

export function NeedsPassword({ children }: NeedsPasswordProps) {
  const [password, setPassword] = useState('')
  const [authorized, setAuthorized] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submitPassword = async () => {
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/validate-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })

      if (!res.ok) {
        throw new Error('Invalid password')
      }

      setAuthorized(true)
    } catch {
      setError('Incorrect password')
      setPassword('')
    } finally {
      setSubmitting(false)
    }
  }

  // Render modal if not authorized
  if (!authorized) {
    return (
      <div style={overlayStyle}>
        <div style={modalStyle}>
          <h2 style={titleStyle}>Sign in</h2>
          <p style={subtitleStyle}>Enter the password to continue</p>

          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && void submitPassword()}
            disabled={submitting}
            autoFocus
            style={inputStyle}
            placeholder="Password"
          />

          {error && <p style={errorStyle}>{error}</p>}

          <button
            onClick={() => void submitPassword()}
            disabled={submitting || !password}
            style={buttonStyle(submitting || !password)}
          >
            {submitting ? 'Checking…' : 'Next'}
          </button>
        </div>
      </div>
    )
  }

  // Render children after authorization
  return <>{children}</>
}

// Overlay styles
const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0, 0, 0, 0.4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
  fontFamily: 'Roboto, Arial, sans-serif'
}

// Modal styles
const modalStyle: React.CSSProperties = {
  background: '#fff',
  padding: '2.5rem',
  borderRadius: '8px',
  minWidth: '360px',
  display: 'flex',
  flexDirection: 'column',
  gap: '1.25rem',
  boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
  alignItems: 'center'
}

// Typography
const titleStyle: React.CSSProperties = {
  fontSize: '1.5rem',
  fontWeight: 500,
  margin: 0,
  color: '#202124'
}

const subtitleStyle: React.CSSProperties = {
  fontSize: '0.95rem',
  color: '#5f6368',
  textAlign: 'center',
  margin: 0
}

// Input
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem 1rem',
  fontSize: '1rem',
  borderRadius: '4px',
  border: '1px solid #dadce0',
  outline: 'none',
  boxSizing: 'border-box'
}

// Error message
const errorStyle: React.CSSProperties = {
  color: '#d93025',
  fontSize: '0.875rem',
  margin: 0,
  alignSelf: 'flex-start'
}

// Button (Google blue style)
const buttonStyle = (disabled: boolean): React.CSSProperties => ({
  background: disabled ? '#aeb0b5' : '#1a73e8',
  color: '#fff',
  fontWeight: 500,
  border: 'none',
  borderRadius: '4px',
  padding: '0.75rem 1rem',
  fontSize: '1rem',
  cursor: disabled ? 'default' : 'pointer',
  width: '100%',
  transition: 'background 0.2s'
})
