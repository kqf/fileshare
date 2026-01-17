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
    <NeedsPassword>
      <Captcha>
        <p>Access granted.</p>
        <button onClick={() => alert("Download failed")}>
          Download files
        </button>
      </Captcha>
    </NeedsPassword>
  )
}

export default App
