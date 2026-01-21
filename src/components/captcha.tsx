import { useState, useRef } from 'react'
import HCaptcha from '@hcaptcha/react-hcaptcha'
import { handleCaptchaSolved } from '../context'
import Selfie from './selfie'

type Mode = "captcha" | "selfie"

export function SegmentedSwitch({
  value,
  disabledRight,
  onChange
}: {
  value: Mode
  disabledRight?: boolean
  onChange: (v: Mode) => void
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        background: "#f2f2f2",
        borderRadius: 8,
        padding: 4,
        marginBottom: 20,
        boxShadow: "inset 0 0 0 1px #ddd"
      }}
    >
      {(["captcha", "selfie"] as Mode[]).map(mode => {
        const active = value === mode
        const disabled = mode === "selfie" && disabledRight

        return (
          <button
            key={mode}
            disabled={disabled}
            onClick={() => onChange(mode)}
            style={{
              padding: "6px 18px",
              borderRadius: 6,
              border: "none",
              fontSize: 14,
              background: active ? "#fff" : "transparent",
              color: active ? "#000" : "#555",
              cursor: disabled ? "not-allowed" : "pointer",
              boxShadow: active
                ? "0 1px 3px rgba(0,0,0,.15)"
                : "none",
              opacity: disabled ? 0.4 : 1,
              transition: "all 0.15s ease"
            }}
          >
            {mode === "captcha" ? "Captcha" : "Selfie"}
          </button>
        )
      })}
    </div>
  )
}


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
  const canUseSelfie = true

  if (!HCAPTCHA_KEY) throw new Error("Something went wrong ...")

  if (verified) return <>{children}</>

  return (
    <div style={{ textAlign: "center", marginTop: 40 }}>
      <h2>Verify you’re human</h2>
      <p>
        To protect our platform, we need to complete a quick verification.
      </p>

      <SegmentedSwitch
        value={mode}
        disabledRight={!canUseSelfie}
        onChange={setMode}
      />

      {mode === "captcha" && (
        <>
          <HCaptcha
            sitekey={HCAPTCHA_KEY}
            onVerify={() => {
                setPasses(passes + 1)
                setVerified(true)
                handleCaptchaSolved()
            }}
            ref={captchaRef}
          />
        </>
      )}

      {mode === "selfie" && (
        <Selfie onVerified={() => {}} />
      )}

    </div>
  )
}
