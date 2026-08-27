import { Suspense, useLayoutEffect, useEffect, useRef, useState, type ReactNode } from 'react'
import { NavLink, useLocation, useOutlet } from 'react-router-dom'
import { BottomNavigation } from '@/components/BottomNavigation'
import { VoiceControl } from '@/components/VoiceControl'
import { navItems } from '@/components/navItems'
import styles from './AppShell.module.css'

const MOBILE_MEDIA_QUERY = '(max-width: 959px)'
const TRANSITION_DURATION_MS = 260

type AnimatedScreen = {
  pathname: string
  navIndex: number
  node: ReturnType<typeof useOutlet>
}

type TransitionDirection = 'forward' | 'backward'

function getNavIndex(pathname: string) {
  return navItems.findIndex(({ to }) => {
    if (to === '/') {
      return pathname === to
    }

    return pathname === to || pathname.startsWith(`${to}/`)
  })
}

function getPathDepth(pathname: string) {
  return pathname.split('/').filter(Boolean).length
}

function getTransitionDirection(
  previousPathname: string,
  nextPathname: string,
  previousIndex: number,
  nextIndex: number,
): TransitionDirection | null {
  if (previousIndex < 0 || nextIndex < 0) {
    return null
  }

  if (previousIndex !== nextIndex) {
    return nextIndex > previousIndex ? 'forward' : 'backward'
  }

  // Same tab — animate nested drill-in / drill-out (e.g. /bins ↔ /bins/:id).
  const previousDepth = getPathDepth(previousPathname)
  const nextDepth = getPathDepth(nextPathname)
  if (previousDepth === nextDepth) {
    return null
  }

  return nextDepth > previousDepth ? 'forward' : 'backward'
}

function getIsMobile() {
  if (typeof window.matchMedia !== 'function') {
    return true
  }

  return window.matchMedia(MOBILE_MEDIA_QUERY).matches
}

function PageScreen({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={[styles.screen, className].filter(Boolean).join(' ')}>
      <Suspense fallback={<p className={styles.loading}>Loading…</p>}>{children}</Suspense>
    </div>
  )
}

export function AppShell() {
  const location = useLocation()
  const outlet = useOutlet()
  const timeoutRef = useRef<number | null>(null)
  const outletRef = useRef(outlet)
  const [isMobile, setIsMobile] = useState(getIsMobile)
  const [activeScreen, setActiveScreen] = useState<AnimatedScreen>(() => ({
    pathname: location.pathname,
    navIndex: getNavIndex(location.pathname),
    node: outlet,
  }))
  const [transition, setTransition] = useState<{
    from: AnimatedScreen
    to: AnimatedScreen
    direction: TransitionDirection
  } | null>(null)

  outletRef.current = outlet

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') {
      return
    }

    const mediaQuery = window.matchMedia(MOBILE_MEDIA_QUERY)
    const handleChange = (event: MediaQueryListEvent) => setIsMobile(event.matches)

    setIsMobile(mediaQuery.matches)
    mediaQuery.addEventListener('change', handleChange)

    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  useLayoutEffect(() => {
    // Identify screens by pathname so query-string updates (e.g. /search?q=)
    // keep the current page mounted instead of remounting it.
    if (activeScreen.pathname === location.pathname) {
      return
    }

    const nextScreen: AnimatedScreen = {
      pathname: location.pathname,
      navIndex: getNavIndex(location.pathname),
      node: outletRef.current,
    }
    const direction = isMobile
      ? getTransitionDirection(
          activeScreen.pathname,
          nextScreen.pathname,
          activeScreen.navIndex,
          nextScreen.navIndex,
        )
      : null

    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    setActiveScreen(nextScreen)

    if (direction === null) {
      setTransition(null)
      return
    }

    setTransition({
      from: activeScreen,
      to: nextScreen,
      direction,
    })

    timeoutRef.current = window.setTimeout(() => {
      setTransition(null)
      timeoutRef.current = null
    }, TRANSITION_DURATION_MS)
  }, [activeScreen, isMobile, location.pathname])

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const enterClass =
    transition?.direction === 'forward' ? styles.enterFromRight : transition ? styles.enterFromLeft : undefined
  const exitClass =
    transition?.direction === 'forward' ? styles.exitToLeft : transition ? styles.exitToRight : undefined
  const voiceControl = <VoiceControl placement={isMobile ? 'mobile' : 'desktop'} />

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar} aria-label="Desktop navigation">
        <nav className={styles.sidebarNav}>
          {navItems.slice(0, 2).map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `${styles.sidebarLink} ${isActive ? styles.active : ''}`} end={to === '/'}>
              <Icon className={styles.sidebarIcon} />
              {label}
            </NavLink>
          ))}
          {!isMobile && voiceControl}
          {navItems.slice(2).map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `${styles.sidebarLink} ${isActive ? styles.active : ''}`} end={to === '/'}>
              <Icon className={styles.sidebarIcon} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className={styles.mainColumn}>
        <main className={styles.main}>
          <div className={`${styles.viewport} ${transition ? styles.viewportTransitioning : ''}`}>
            {transition ? (
              <PageScreen key={transition.from.pathname} className={exitClass}>
                {transition.from.node}
              </PageScreen>
            ) : null}
            <PageScreen key={activeScreen.pathname} className={enterClass}>
              {activeScreen.node}
            </PageScreen>
          </div>
        </main>
        <BottomNavigation voiceControl={isMobile ? voiceControl : null} />
      </div>
    </div>
  )
}
