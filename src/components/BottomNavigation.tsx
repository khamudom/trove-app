import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { navItems } from './navItems'
import styles from './BottomNavigation.module.css'

export function BottomNavigation({ voiceControl }: { voiceControl: ReactNode }) {
  return (
    <nav className={styles.nav} aria-label="Primary">
      {navItems.slice(0, 2).map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
          end={to === '/'}
        >
          <Icon className={styles.icon} />
          <span>{label}</span>
        </NavLink>
      ))}
      {voiceControl}
      {navItems.slice(2).map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
          end={to === '/'}
        >
          <Icon className={styles.icon} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
