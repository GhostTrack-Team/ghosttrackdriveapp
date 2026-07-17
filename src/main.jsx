import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import CompanionApp from './CompanionApp.jsx'

const urlParams = new URLSearchParams(window.location.search);
const isCompanion = urlParams.get('mode') === 'companion';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isCompanion ? <CompanionApp /> : <App />}
  </StrictMode>,
)

