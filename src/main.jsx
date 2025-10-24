import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import './i18n.js'
import { StoreProvider, useStore } from './state/store.jsx'

function ThemedApp(){
  const { state } = useStore()
  useEffect(()=>{
    const root = document.documentElement
    root.setAttribute('data-theme', state.theme)
  },[state.theme])
  return <App />
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <StoreProvider>
      <ThemedApp />
    </StoreProvider>
  </StrictMode>,
)
