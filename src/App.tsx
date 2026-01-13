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

function TabBar({
  mode,
  canUseSelfie,
  onChange
}: {
  mode: "captcha" | "selfie"
  canUseSelfie: boolean
  onChange: (m: "captcha" | "selfie") => void
}) {
  return (
    <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
      <Tab active={mode === "captcha"} onClick={() => onChange("captcha")}>
        Captcha
      </Tab>

      <Tab
        active={mode === "selfie"}
        disabled={!canUseSelfie}
        onClick={() => onChange("selfie")}
      >
        Selfie
      </Tab>
    </div>
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


export function MyCaptcha({ children }: { children: React.ReactNode }) {
  const [verified, setVerified] = useState(false)
  const [passes, setPasses] = useState(0)
  const [mode, setMode] = useState<Mode>("captcha")

  const captchaRef = useRef<HCaptcha | null>(null)

  const HCAPTCHA_KEY = import.meta.env.VITE_CAPTCHA_SITE_KEY as string
  const MAX_ATTEMPTS = 3
  const canUseSelfie = passes >= MAX_ATTEMPTS

  if (!HCAPTCHA_KEY) throw new Error("Missing captcha key")

  function handleCaptchaSolved() {
    setPasses(prev => {
      const next = prev + 1
      if (next >= MAX_ATTEMPTS) setVerified(true)
      return next
    })

    captchaRef.current?.resetCaptcha()
  }

  if (verified) return <>{children}</>

  return (
    <div style={{ textAlign: "center", marginTop: 40 }}>
      <h2>Verifying your access…</h2>
      <p>Multiple security checks required.</p>

      <TabBar
        mode={mode}
        canUseSelfie={canUseSelfie}
        onChange={setMode}
      />

      {mode === "captcha" && (
        <>
          <HCaptcha
            sitekey={HCAPTCHA_KEY}
            onVerify={handleCaptchaSolved}
            ref={captchaRef}
          />
          <p>Completed: {passes} / {MAX_ATTEMPTS}</p>
        </>
      )}

      {mode === "selfie" && (
        <Selfie onVerified={() => {}} />
      )}

      {!canUseSelfie && (
        <p style={{ fontSize: 12, opacity: 0.6 }}>
          Selfie unlocks after {MAX_ATTEMPTS} captcha attempts
        </p>
      )}
    </div>
  )
}


export function App() {
  return (
    <MyCaptcha>
      <h1>Hello world</h1>
      <p>Access granted.</p>
      <button onClick={() => alert("Download failed")}>
        Download files
      </button>
    </MyCaptcha>
  )
}

export default App
