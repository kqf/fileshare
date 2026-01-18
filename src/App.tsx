import './App.css'
import { useEffect } from 'react'
import { Captcha } from './components/captcha'
import sendClientContext from './context'
import { NeedsPassword } from './components/password'


export function App() {
   useEffect(() => {
      sendClientContext()
  }, [])

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
