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
      <h1>Test</h1>
      <div className="card">
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
