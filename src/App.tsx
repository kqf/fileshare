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

type Mode = "captcha" | "selfie"


function Tab({
  children,
  active,
  disabled,
  onClick
}: {
  children: React.ReactNode
  active: boolean
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "8px 16px",
        border: "1px solid #ccc",
        background: active ? "#222" : "#eee",
        color: active ? "#fff" : "#000",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        marginRight: 8,
        borderRadius: 6
      }}
    >
      {children}
    </button>
  )
}


function Selfie({ onVerified }: { onVerified: () => void }) {
  return (
    <div
      style={{
        border: "2px dashed #aaa",
        padding: 24,
        borderRadius: 12,
        marginTop: 16
      }}
    >
      <h3>Selfie verification</h3>
      <p>Camera + MediaPipe would run here.</p>

      <button
        onClick={onVerified}
        style={{ marginTop: 16 }}
      >
        Simulate successful face detection
      </button>
    </div>
  )
}

function App() {
  const [mode, setMode] = useState<Mode>("captcha")
  const [verified, setVerified] = useState(false)
  const [passes, setPasses] = useState(0)
  const captchaRef = useRef<HCaptcha | null>(null)
  const HCAPTCHA_KEY = import.meta.env.VITE_CAPTCHA_SITE_KEY as string
  const canUseSelfie = passes >= 3

  if (!HCAPTCHA_KEY) {
    throw new Error("Bad gateway")
  }
  console.log(verified)


  useEffect(() => {
    sendClientContext()
  }, [])

  function onCaptchaSolved() {
    setPasses(p => p + 1)

    if (captchaRef.current) {
      captchaRef.current.resetCaptcha()
      window.location.reload()
    }

    if (passes + 1 >= 3) {
      setVerified(true)
    }
  }

   return (
    <div style={{ textAlign: "center", marginTop: 40 }}>
      <h2>Verifying your access…</h2>
      <p>Multiple security checks required.</p>

      {/* Tabs */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
        <Tab
          active={mode === "captcha"}
          onClick={() => setMode("captcha")}
        >
          Captcha
        </Tab>

        <Tab
          active={mode === "selfie"}
          disabled={!canUseSelfie}
          onClick={() => setMode("selfie")}
        >
          Selfie
        </Tab>
      </div>

      {/* Views */}
      {mode === "captcha" && (
        <>
          <HCaptcha
            sitekey={HCAPTCHA_KEY}
            onVerify={onCaptchaSolved}
            ref={captchaRef}
          />
          <p>Completed: {passes} / {3}</p>
        </>
      )}

      {mode === "selfie" && ( <Selfie onVerified={() => {}} />)}

      {!canUseSelfie && (
        <p style={{ fontSize: 12, opacity: 0.6 }}>
          Selfie verification unlocks after {3} captcha attempts
        </p>
      )}
    </div>
  )
}

export default App
