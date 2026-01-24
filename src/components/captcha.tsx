import { useState, useRef } from "react"
import HCaptcha from "@hcaptcha/react-hcaptcha"
import { handleCaptchaSolved } from "../context"
import Selfie from "./selfie"
import "./captcha.css"

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
    <div className="segmented-switch">
      {(["captcha", "selfie"] as Mode[]).map(mode => {
        const active = value === mode
        const disabled = mode === "selfie" && disabledRight

        return (
          <button
            key={mode}
            disabled={disabled}
            onClick={() => onChange(mode)}
            className={[
              "segment-button",
              active && "active",
              disabled && "disabled"
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {mode === "captcha" ? "Captcha" : "Selfie"}
          </button>
        )
      })}
    </div>
  )
}


export function Captcha({ children }: { children: React.ReactNode }) {
  const [verified, setVerified] = useState(false)
  const [mode, setMode] = useState<Mode>("captcha")

  const captchaRef = useRef<HCaptcha | null>(null)

  const HCAPTCHA_KEY = import.meta.env.VITE_CAPTCHA_SITE_KEY as string
  const canUseSelfie = true

  if (!HCAPTCHA_KEY) throw new Error("Something went wrong ...")

  if (verified) return <>{children}</>

  return (
    <div className="captcha-card">
      <h2 className="captcha-title">Verify you’re human</h2>
      <p className="captcha-description">
        To protect our platform, we need to complete a quick verification.
      </p>

      <div className="captcha-switch-wrapper">
        <SegmentedSwitch
          value={mode}
          disabledRight={!canUseSelfie}
          onChange={setMode}
        />

        <div className="captcha-hint">
          Choose one verification method
        </div>
      </div>

      <div className="captcha-content">
        {mode === "captcha" && (
          <HCaptcha
            ref={captchaRef}
            sitekey={HCAPTCHA_KEY}
            onVerify={() => {
              setVerified(true)
              handleCaptchaSolved()
            }}
          />
        )}

        {mode === "selfie" && (
          <Selfie onVerified={() => setVerified(true)} />
        )}
      </div>
    </div>
  )
}
