import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// styles loaded in App.tsx
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
