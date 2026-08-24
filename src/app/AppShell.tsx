import { NavLink, Outlet } from 'react-router-dom'
import { BottomNavigation } from '@/components/BottomNavigation'
import { Icons } from '@/components/Icons'
import styles from './AppShell.module.css'

const sidebarItems = [
  { to: '/', label: 'Home', icon: Icons.Home },
  { to: '/bins', label: 'Bins', icon: Icons.Bins },
  { to: '/scan', label: 'Scan', icon: Icons.Scan },
  { to: '/search', label: 'Search', icon: Icons.Search },
]

export function AppShell() {
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar} aria-label="Desktop navigation">
        <div className={styles.brand}>Trove</div>
        <nav className={styles.sidebarNav}>
          {sidebarItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `${styles.sidebarLink} ${isActive ? styles.active : ''}`} end={to === '/'}>
              <Icon className={styles.sidebarIcon} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className={styles.mainColumn}>
        <main className={styles.main}>
          <Outlet />
        </main>
        <BottomNavigation />
      </div>
    </div>
  )
}
