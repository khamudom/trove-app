import { NavLink } from 'react-router-dom'
import { navItems } from './navItems'
import styles from './BottomNavigation.module.css'

export function BottomNavigation() {
  return (
    <nav className={styles.nav} aria-label="Primary">
      {navItems.map(({ to, label, icon: Icon }) => (
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
