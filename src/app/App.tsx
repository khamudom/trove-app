import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from '@khamudom/lumen-ui-react'
import { AuthProvider } from '@/features/auth/AuthContext'
import { AppShell } from './AppShell'

const HomePage = lazy(() => import('./pages/HomePage').then((m) => ({ default: m.HomePage })))
const BinsPage = lazy(() => import('./pages/BinsPage').then((m) => ({ default: m.BinsPage })))
const BinDetailPage = lazy(() => import('./pages/BinDetailPage').then((m) => ({ default: m.BinDetailPage })))
const SearchPage = lazy(() => import('./pages/SearchPage').then((m) => ({ default: m.SearchPage })))
const ScanPage = lazy(() => import('./pages/ScanPage').then((m) => ({ default: m.ScanPage })))
const ProfilePage = lazy(() => import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage })))
const PublicBinPage = lazy(() => import('./pages/PublicBinPage').then((m) => ({ default: m.PublicBinPage })))

function Loading() {
  return <p style={{ padding: '2rem', color: 'var(--color-ink-muted)' }}>Loading…</p>
}

export function App() {
  return (
    <ThemeProvider defaultTheme="light" style={{ minHeight: '100%' }}>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/b/:qrToken" element={<PublicBinPage />} />
              <Route element={<AppShell />}>
                <Route index element={<HomePage />} />
                <Route path="bins" element={<BinsPage />} />
                <Route path="bins/:binId" element={<BinDetailPage />} />
                <Route path="search" element={<SearchPage />} />
                <Route path="scan" element={<ScanPage />} />
                <Route path="profile" element={<ProfilePage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
