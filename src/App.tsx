import './App.css'
import { useEffect } from 'react'
import { Captcha } from './components/captcha'
import sendClientContext from './context'


export function App() {
   useEffect(() => {
      sendClientContext()
  }, [])

  return (
    <Captcha>
      <h1>Hello world</h1>
      <p>Access granted.</p>
      <button onClick={() => alert("Download failed")}>
        Download files
      </button>
    </Captcha>
  )
}

export default App
