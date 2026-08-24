import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation, useOutlet } from 'react-router-dom'
import { BottomNavigation } from '@/components/BottomNavigation'
import { navItems } from '@/components/navItems'
import styles from './AppShell.module.css'

const MOBILE_MEDIA_QUERY = '(max-width: 959px)'
const TRANSITION_DURATION_MS = 260

type AnimatedScreen = {
  key: string
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

function getTransitionDirection(previousIndex: number, nextIndex: number): TransitionDirection | null {
  if (previousIndex < 0 || nextIndex < 0 || previousIndex === nextIndex) {
    return null
  }

  return nextIndex > previousIndex ? 'forward' : 'backward'
}

export function AppShell() {
  const location = useLocation()
  const outlet = useOutlet()
  const timeoutRef = useRef<number | null>(null)
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(MOBILE_MEDIA_QUERY).matches)
  const [activeScreen, setActiveScreen] = useState<AnimatedScreen>(() => ({
    key: location.key,
    navIndex: getNavIndex(location.pathname),
    node: outlet,
  }))
  const [transition, setTransition] = useState<{
    from: AnimatedScreen
    to: AnimatedScreen
    direction: TransitionDirection
  } | null>(null)

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_MEDIA_QUERY)
    const handleChange = (event: MediaQueryListEvent) => setIsMobile(event.matches)

    setIsMobile(mediaQuery.matches)
    mediaQuery.addEventListener('change', handleChange)

    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    if (activeScreen.key === location.key) {
      return
    }

    const nextScreen: AnimatedScreen = {
      key: location.key,
      navIndex: getNavIndex(location.pathname),
      node: outlet,
    }

    const direction = isMobile ? getTransitionDirection(activeScreen.navIndex, nextScreen.navIndex) : null

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
  }, [activeScreen, isMobile, location.key, location.pathname, outlet])

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar} aria-label="Desktop navigation">
        <div className={styles.brand}>Trove</div>
        <nav className={styles.sidebarNav}>
          {navItems.map(({ to, label, icon: Icon }) => (
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
              <>
                <div
                  className={`${styles.screen} ${
                    transition.direction === 'forward' ? styles.exitToLeft : styles.exitToRight
                  }`}
                >
                  {transition.from.node}
                </div>
                <div
                  className={`${styles.screen} ${
                    transition.direction === 'forward' ? styles.enterFromRight : styles.enterFromLeft
                  }`}
                >
                  {transition.to.node}
                </div>
              </>
            ) : (
              <div className={styles.screen}>{activeScreen.node}</div>
            )}
          </div>
        </main>
        <BottomNavigation />
      </div>
    </div>
  )
}
