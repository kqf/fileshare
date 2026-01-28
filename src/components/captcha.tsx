import { useState, useRef } from "react"
import HCaptcha from "@hcaptcha/react-hcaptcha"
import { handleCaptchaSolved } from "../context"
import Selfie from "./selfie"
import "./captcha.css"

type SegmentedSwitchProps<O extends Record<string, React.ReactNode>> = {
  options: O
  defaultValue: keyof O
  disabled?: Partial<Record<keyof O, boolean>>
}

export function SegmentedSwitch<O extends Record<string, React.ReactNode>>({
  options,
  defaultValue,
  disabled = {}
}: SegmentedSwitchProps<O>) {
  const [active, setActive] = useState<keyof O>(defaultValue)

  return (
    <div className="segmented-switch">
      <div className="segments">
        {(Object.keys(options) as Array<keyof O>).map(key => {
          const isDisabled = disabled[key]

          return (
            <button
              key={String(key)}
              disabled={isDisabled}
              onClick={() => setActive(key)}
              className={[
                "segment-button",
                active === key && "active",
                isDisabled && "disabled"
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {String(key)}
            </button>
          )
        })}
      </div>

      <div className="segment-content">
        {options[active]}
      </div>
    </div>
  )
}

export function Captcha({ children }: { children: React.ReactNode }) {
  const [verified, setVerified] = useState(false)
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
          defaultValue="captcha"
          disabled={{ selfie: !canUseSelfie }}
          options={{
            captcha: (
              <HCaptcha
                ref={captchaRef}
                sitekey={HCAPTCHA_KEY}
                onVerify={() => {
                  setVerified(true)
                  handleCaptchaSolved()
                }}
              />
            ),
            selfie: (
              <Selfie onVerified={() => setVerified(true)} />
            )
          }}
        />

        <div className="captcha-hint">
          Choose one verification method
        </div>
      </div>
    </div>
  )
}
