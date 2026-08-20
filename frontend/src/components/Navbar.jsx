import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = () => {
    if (user?.fullName) {
      return user.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (user?.name) {
      return user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'G';
  };

  const displayName = user?.fullName || user?.name || user?.email || 'Guest';

  return (
    <header className="app-navbar">
      <div className="nav-container">
        {/* Brand */}
        <Link to="/dashboard" className="brand-group">
          <span className="brand-mark">LX</span>
          <div className="brand-text">
            <span className="brand-name">LinkX</span>
            <span className="brand-tag">Smart URL Shortener</span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="app-nav-links">
          <NavLink 
            to="/dashboard" 
            className={({ isActive }) => `app-nav-link${isActive ? ' active' : ''}`}
          >
            <i className="fas fa-table-columns"></i> Dashboard
          </NavLink>
        </nav>

        {/* Right Section */}
        <div className="nav-right">
          {token ? (
            <div className="nav-user-menu">
              <div className="nav-user-avatar">{getInitials()}</div>
              <div className="nav-user-info">
                <span className="nav-user-name">{displayName}</span>
                <button className="nav-logout-button" onClick={handleLogout}>
                  <i className="fas fa-arrow-right-from-bracket"></i> Logout
                </button>
              </div>
            </div>
          ) : (
            null
          )}
        </div>
      </div>
    </header>
  );
}