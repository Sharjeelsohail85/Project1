import { useEffect } from 'react'
import { useParams, useLocation } from 'react-router-dom'

export default function OAuthCallback() {
  const { provider } = useParams()
  const location = useLocation()

  useEffect(() => {
    // We send a message back to the parent window (window.opener)
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
  }, [provider, location])

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
