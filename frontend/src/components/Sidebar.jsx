import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

const studentLinks = [
  { to: '/dashboard',    icon: '⊞', label: 'Dashboard'   },
  { to: '/rooms',        icon: '🚪', label: 'Rooms'        },
  { to: '/bookings',     icon: '📋', label: 'My Bookings'  },
  { to: '/maintenance',  icon: '🔧', label: 'Maintenance'  },
  { to: '/profile',      icon: '👤', label: 'My Profile'   },
];

const adminLinks = [
  { to: '/dashboard',    icon: '⊞', label: 'Dashboard'   },
  { to: '/rooms',        icon: '🚪', label: 'Rooms'        },
  { to: '/bookings',     icon: '📋', label: 'All Bookings' },
  { to: '/maintenance',  icon: '🔧', label: 'Maintenance'  },
  { to: '/students',     icon: '🎓', label: 'Students'     },
  { to: '/profile',      icon: '👤', label: 'My Profile'   },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const links = user?.role === 'admin' ? adminLinks : studentLinks;
  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile toggle */}
      <button className="sidebar-toggle" onClick={() => setOpen(!open)}>☰</button>

      {/* Overlay for mobile */}
      {open && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }}
          onClick={() => setOpen(false)}
        />
      )}

      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <img src="/zuct-logo.jpg" alt="ZUCT" style={{width: 32, height: 32, objectFit: 'contain', marginBottom: 4, display: 'block'}} />
          <h1>ZUCT Hostel</h1>
          <p>Management System</p>
        </div>

        <nav className="sidebar-nav">
          <span className="nav-section-label">Navigation</span>
          {links.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setOpen(false)}
            >
              <span className="icon">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-avatar">
              {user?.profile_photo
                ? <img src={user.profile_photo} alt="avatar" />
                : initials
              }
            </div>
            <div className="user-info">
              <div className="user-name">{user?.name}</div>
              <div className="user-role">{user?.role}</div>
            </div>
            <button className="logout-btn" onClick={handleLogout} title="Logout">⏻</button>
          </div>
        </div>
      </aside>
    </>
  );
}
