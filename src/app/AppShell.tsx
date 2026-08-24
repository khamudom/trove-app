import { NavLink, Outlet } from 'react-router-dom'
import { BottomNavigation } from '@/components/BottomNavigation'
import { navItems } from '@/components/navItems'
import styles from './AppShell.module.css'

export function AppShell() {
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
          <Outlet />
        </main>
        <BottomNavigation />
      </div>
    </div>
  )
}
