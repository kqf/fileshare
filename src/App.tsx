import { useEffect, useState, useRef } from 'react'
import HCaptcha from '@hcaptcha/react-hcaptcha'
import './App.css'

function sendClientContext() {
  const payload = {
    screen: { width: window.screen.width, height: window.screen.height },
    viewport: { width: window.innerWidth, height: window.innerHeight },
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language
  }
  navigator.sendBeacon('/_context', JSON.stringify(payload))
}

function App() {
  const [verified, setVerified] = useState(false)
  const [passes, setPasses] = useState(0)
  const captchaRef = useRef<HCaptcha | null>(null)
  const HCAPTCHA_KEY = import.meta.env.VITE_CAPTCHA_SITE_KEY as string

  if (!HCAPTCHA_KEY) {
    throw new Error("Bad gateway")
  }


  useEffect(() => {
    sendClientContext()
  }, [])

  function onCaptchaSolved() {
    setPasses(p => p + 1)

    if (captchaRef.current) {
      captchaRef.current.resetCaptcha()
    }

    if (passes + 1 >= 3) {
      setVerified(true)
    }
  }

  return (
    <div style={{ textAlign: 'center', marginTop: '40px' }}>
      {!verified && (
        <>
          <h2>Verifying your access…</h2>
          <p>Multiple security checks required.</p>

          <div style={{ display: 'inline-block' }}>
            <HCaptcha
              sitekey={HCAPTCHA_KEY}
              onVerify={onCaptchaSolved}
              ref={captchaRef}
            />
          </div>

          <p>Completed: {passes} / 3</p>
        </>
      )}

      {verified && (
        <>
          <h1>Hello world</h1>
          <p>Access granted.</p>
          <button onClick={() => alert('Download failed')}>
            Download files
          </button>
        </>
      )}
    </div>
  )
}

export default App
