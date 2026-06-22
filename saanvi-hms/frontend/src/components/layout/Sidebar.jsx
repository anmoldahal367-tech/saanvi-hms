import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { NAV_ITEMS } from '../../utils/navConfig';
import Icon from '../common/Icon';
import './Sidebar.css';

/**
 * Sidebar navigation. This is the visible half of RBAC: it only renders
 * the links the logged-in user's role is allowed to see. The other half
 * (actually blocking access) lives in ProtectedRoute and the backend.
 */
export default function Sidebar() {
  const { user } = useAuth();

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(user?.role));

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="sidebar__brand-mark">S</span>
        <span className="sidebar__brand-name">SAANVI-HMS</span>
      </div>

      <nav className="sidebar__nav">
        {visibleItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}
          >
            <Icon name={item.icon} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
