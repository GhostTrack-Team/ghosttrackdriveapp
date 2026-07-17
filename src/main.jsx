import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import CompanionApp from './CompanionApp.jsx'

const urlParams = new URLSearchParams(window.location.search);
// Default to the Driver Phone Companion App unless explicitly visiting "?mode=journey"
const isCompanion = urlParams.get('mode') !== 'journey';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isCompanion ? <CompanionApp /> : <App />}
  </StrictMode>,
)

