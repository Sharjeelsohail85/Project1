import { useEffect, useState } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { Cloud, Lock, Mail, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react'

export default function OAuthCallback() {
  const { provider } = useParams()
  const location = useLocation()
  
  const isMega = provider === 'mega'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('idle') // 'idle', 'loading', 'success'

  useEffect(() => {
    // For normal OAuth providers (google, facebook, dropbox), process immediately
    if (!isMega) {
      if (window.opener) {
        try {
          window.opener.postMessage(
            {
              type: 'oauth-callback',
              provider: provider || 'oauth',
              url: window.location.href,
            },
            window.location.origin
          )
        } catch (error) {
          console.error('Error posting message back to parent:', error)
        }
      }

      // Automatically try to close the popup after 1 second
      const timer = setTimeout(() => {
        try {
          window.close()
        } catch (e) {
          // Safe catch if browser blocks script-initiated close
        }
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [provider, isMega])

  const handleMegaSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (!email.trim() || !password.trim()) {
      setError('Please fill in both email and password fields.')
      return
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address.')
      return
    }

    setStatus('loading')

    // Simulate high-fidelity authentication with MEGA servers
    setTimeout(() => {
      const generatedToken = `mega_token_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
      setStatus('success')

      const successUrl = `${window.location.origin}/auth/mega/callback#access_token=${generatedToken}&email=${encodeURIComponent(email)}`

      // 1. Post message to opener window
      if (window.opener) {
        try {
          window.opener.postMessage(
            {
              type: 'oauth-callback',
              provider: 'mega',
              url: successUrl,
            },
            window.location.origin
          )
        } catch (err) {
          console.error('Failed to postMessage:', err)
        }
      }

      // 2. Also set location hash so polling interval can catch it as a fallback
      window.location.hash = `access_token=${generatedToken}&email=${encodeURIComponent(email)}`

      // 3. Close window after a short delay
      setTimeout(() => {
        try {
          window.close()
        } catch (closeErr) {
          // Ignore
        }
      }, 800)
    }, 1500)
  }

  if (isMega) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#0a0a0a',
          color: '#ffffff',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '20px',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '400px',
            backgroundColor: '#161616',
            borderRadius: '16px',
            padding: '32px 24px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,0,0,0.1)',
            boxSizing: 'border-box',
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'rgba(235, 9, 36, 0.1)',
                border: '2px solid #eb0924',
                color: '#eb0924',
                marginBottom: '16px',
              }}
            >
              <Cloud size={32} />
            </div>
            <h2 style={{ margin: '0 0 6px 0', fontSize: '1.5rem', fontWeight: 700 }}>
              Connect MEGA
            </h2>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>
              Sign in to your MEGA account to stream & upload videos
            </p>
          </div>

          {status === 'success' ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ color: '#03DAC6', marginBottom: '16px' }}>
                <CheckCircle size={56} style={{ margin: '0 auto' }} />
              </div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', fontWeight: 600 }}>
                Successfully Connected!
              </h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                This window will close automatically.
              </p>
            </div>
          ) : (
            <form onSubmit={handleMegaSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {error && (
                <div
                  style={{
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'flex-start',
                    padding: '12px',
                    backgroundColor: 'rgba(235, 9, 36, 0.1)',
                    border: '1px solid rgba(235, 9, 36, 0.3)',
                    borderRadius: '8px',
                    color: '#ff4d5a',
                    fontSize: '0.8rem',
                  }}
                >
                  <AlertCircle size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
                  <span>{error}</span>
                </div>
              )}

              {/* Email */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={status === 'loading'}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      backgroundColor: '#222222',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      padding: '12px 12px 12px 40px',
                      fontSize: '0.9rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Password */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter account password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={status === 'loading'}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      backgroundColor: '#222222',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      padding: '12px 40px 12px 40px',
                      fontSize: '0.9rem',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'rgba(255,255,255,0.4)',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={status === 'loading'}
                style={{
                  width: '100%',
                  backgroundColor: status === 'loading' ? '#9e1b29' : '#eb0924',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '14px',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '10px',
                }}
              >
                {status === 'loading' ? (
                  <>
                    <div
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTopColor: '#ffffff',
                        animation: 'spin 0.8s linear infinite',
                      }}
                    />
                    <span>Connecting Securely...</span>
                  </>
                ) : (
                  'Sign In to MEGA'
                )}
              </button>
            </form>
          )}
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#121212',
        color: '#ffffff',
        fontFamily: 'system-ui, sans-serif',
        textAlign: 'center',
        padding: '24px',
        boxSizing: 'border-box'
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          border: '3px solid #03DAC6',
          borderTopColor: 'transparent',
          animation: 'spin 1s linear infinite',
          marginBottom: '20px',
        }}
      />
      <h2 style={{ margin: '0 0 10px 0', fontSize: '1.25rem', fontWeight: 600 }}>
        Connecting Account...
      </h2>
      <p style={{ margin: 0, opacity: 0.7, fontSize: '0.875rem' }}>
        We are completing your secure connection. You may close this window.
      </p>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

