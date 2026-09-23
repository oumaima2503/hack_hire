import { StrictMode, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth'
import { ParentGate } from './components/ParentGate'
import { RequireAuth } from './components/RequireAuth'
import { I18nProvider } from './i18n'
import LearnLayout from './learn/LearnLayout'
import AuthPage from './pages/AuthPage'
import Checkout from './pages/Checkout'
import Confirmed from './pages/Confirmed'
import Dashboard from './pages/Dashboard'
import Landing from './pages/Landing'
import Onboarding from './pages/Onboarding'
import ParentTest from './pages/ParentTest'
import Result from './pages/Result'
import Assistant from './pages/learn/Assistant'
import GamePage from './pages/learn/GamePage'
import Home from './pages/learn/Home'
import JourneyPage from './pages/learn/Journey'
import Lesson from './pages/learn/Lesson'
import Progress from './pages/learn/Progress'
import Rewards from './pages/learn/Rewards'
import Studio from './pages/learn/Studio'
import ChildDetail from './pages/parent/ChildDetail'
import ChildEdit from './pages/parent/ChildEdit'
import ParentDashboard from './pages/parent/ParentDashboard'
import { SessionProvider } from './state'
import './styles.css'
import './learn.css'

const Private = ({ children }: { children: ReactNode }) => <RequireAuth>{children}</RequireAuth>
// Parent-only pages: logged in AND parent mode unlocked with the password.
const ParentOnly = ({ children }: { children: ReactNode }) => (
  <RequireAuth>
    <ParentGate>{children}</ParentGate>
  </RequireAuth>
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <AuthProvider>
        <SessionProvider>
          <BrowserRouter>
            <Routes>
              {/* Funnel */}
              <Route path="/" element={<Landing />} />
              <Route path="/onboarding" element={<ParentGate><Onboarding /></ParentGate>} />
              <Route path="/adventure" element={<ParentOnly><Result /></ParentOnly>} />
              <Route path="/checkout" element={<ParentOnly><Checkout /></ParentOnly>} />
              <Route path="/confirmed" element={<ParentOnly><Confirmed /></ParentOnly>} />
              <Route path="/parent-test" element={<ParentOnly><ParentTest /></ParentOnly>} />
              <Route path="/dashboard" element={<Dashboard />} />

              {/* Parent */}
              <Route path="/login" element={<AuthPage mode="login" />} />
              <Route path="/register" element={<AuthPage mode="register" />} />
              <Route path="/parent" element={<ParentOnly><ParentDashboard /></ParentOnly>} />
              <Route path="/parent/children/:childId" element={<ParentOnly><ChildDetail /></ParentOnly>} />
              <Route path="/parent/children/:childId/edit" element={<ParentOnly><ChildEdit /></ParentOnly>} />

              {/* Child learning world */}
              <Route path="/play/:childId" element={<Private><LearnLayout /></Private>}>
                <Route index element={<Home />} />
                <Route path="learn" element={<JourneyPage />} />
                <Route path="learn/:key" element={<Lesson />} />
                <Route path="games" element={<Navigate to="../learn" replace />} />
                <Route path="games/:key" element={<GamePage />} />
                <Route path="studio" element={<Studio />} />
                <Route path="rewards" element={<Rewards />} />
                <Route path="progress" element={<Progress />} />
                <Route path="assistant" element={<Assistant />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </SessionProvider>
      </AuthProvider>
    </I18nProvider>
  </StrictMode>,
)
