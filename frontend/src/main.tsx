import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { I18nProvider } from './i18n'
import Checkout from './pages/Checkout'
import Confirmed from './pages/Confirmed'
import Dashboard from './pages/Dashboard'
import Landing from './pages/Landing'
import Onboarding from './pages/Onboarding'
import ParentTest from './pages/ParentTest'
import Result from './pages/Result'
import { SessionProvider } from './state'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <SessionProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/adventure" element={<Result />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/confirmed" element={<Confirmed />} />
            <Route path="/parent-test" element={<ParentTest />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </SessionProvider>
    </I18nProvider>
  </StrictMode>,
)
