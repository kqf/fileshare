import './App.css'
import { useEffect } from 'react'
import { MyCaptcha } from './components/captcha'
import sendClientContext from './context'


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
