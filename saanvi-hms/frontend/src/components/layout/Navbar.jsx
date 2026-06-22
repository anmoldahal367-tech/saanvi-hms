import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import RoleBadge from '../common/RoleBadge';
import Icon from '../common/Icon';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ?.split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <header className="navbar">
      <div className="navbar__spacer" />
      <div className="navbar__user">
        <div className="navbar__avatar">{initials}</div>
        <div className="navbar__user-info">
          <span className="navbar__user-name">{user?.name}</span>
          <RoleBadge role={user?.role} />
        </div>
        <button className="navbar__logout" onClick={handleLogout} title="Log out">
          <Icon name="logout" size={17} />
        </button>
      </div>
    </header>
  );
}
