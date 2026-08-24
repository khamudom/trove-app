import { NavLink } from 'react-router-dom'
import { Icons } from './Icons'
import styles from './BottomNavigation.module.css'

const items = [
  { to: '/', label: 'Home', icon: Icons.Home },
  { to: '/bins', label: 'Bins', icon: Icons.Bins },
  { to: '/scan', label: 'Scan', icon: Icons.Scan },
  { to: '/search', label: 'Search', icon: Icons.Search },
]

export function BottomNavigation() {
  return (
    <nav className={styles.nav} aria-label="Primary">
      {items.map(({ to, label, icon: Icon }) => (
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
