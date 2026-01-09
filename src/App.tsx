import { useEffect } from 'react'
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
  useEffect(() => {
    sendClientContext()
  }, [])

  return (
    <>
      <h1>Hello world</h1>
    </>
  )
}

export default App
