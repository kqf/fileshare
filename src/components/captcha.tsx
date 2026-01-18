import { useState, useRef } from 'react'
import HCaptcha from '@hcaptcha/react-hcaptcha'
import { handleCaptchaSolved } from '../context'
import Selfie from './Selfie'

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


export function Captcha({ children }: { children: React.ReactNode }) {
  const [verified, setVerified] = useState(false)
  const [passes, setPasses] = useState(0)
  const [mode, setMode] = useState<Mode>("captcha")

  const captchaRef = useRef<HCaptcha | null>(null)

  const HCAPTCHA_KEY = import.meta.env.VITE_CAPTCHA_SITE_KEY as string
  const MAX_ATTEMPTS = 3
  // const canUseSelfie = passes >= MAX_ATTEMPTS
  const canUseSelfie = true

  if (!HCAPTCHA_KEY) throw new Error("Something went wrong ...")

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
            onVerify={() => {
                handleCaptchaSolved()
                setPasses(passes + 1)
                setVerified(true)
            }}
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
