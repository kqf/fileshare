import { useEffect } from 'react'
import './App.css'
import { MyCaptcha } from './components/captcha'


function sendClientContext() {
  const payload = {
    screen: { width: window.screen.width, height: window.screen.height },
    viewport: { width: window.innerWidth, height: window.innerHeight },
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language
  }
  navigator.sendBeacon('/_context', JSON.stringify(payload))
}

export function App() {
   useEffect(() => {
      sendClientContext()
  }, [])

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
