import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Lets Android Chrome show reminders (it only allows notifications from a service worker); public/sw.js does nothing else.
navigator.serviceWorker?.register('/sw.js').catch(() => {})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
