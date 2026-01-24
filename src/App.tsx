import './App.css'
import { useEffect } from 'react'
import { Captcha } from './components/captcha'
import sendClientContext from './context'
import { NeedsPassword } from './components/password'


export function App() {
   useEffect(() => {
      sendClientContext()
  }, [])

  function onCaptchaSolved() {
    setPasses(p => p + 1)

    // reset so they have to solve again
    // if (captchaRef.current) {
    //   captchaRef.current.resetCaptcha()
    // }

    if (passes + 1 >= 3) {
      setVerified(true)
    }
  }

  return (
      <Captcha>
        <NeedsPassword>
        <p>Access granted.</p>
        <button onClick={() => alert("Download failed")}>
          Download files
        </button>
        </NeedsPassword>
      </Captcha>
  )
}

export default App
