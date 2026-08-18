import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { IconHome, IconPlus, IconLock, IconInbox } from './Icons.jsx';
import ProfileMenu from './ProfileMenu.jsx';
import logo from '../assets/logo.jpg';

export default function Navbar() {
  const { session } = useAuth();
  const isAdmin = session?.role === 'ADMIN';
  const isHod = session?.role === 'HOD';
  const isMd = session?.role === 'MD';

  const empLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: IconHome },
    { to: '/apply-leave', label: 'Apply Leave', icon: IconPlus },
    { to: '/change-password', label: 'Password', icon: IconLock },
  ];
  const adminLinks = [
    { to: '/admin', label: 'Leave History', icon: IconInbox },
    { to: '/admin/reset-password', label: 'Reset Password', icon: IconLock },
  ];
  const hodLinks = [
    { to: '/hod', label: 'Requests', icon: IconInbox },
    { to: '/apply-leave', label: 'Apply Leave', icon: IconPlus },
    { to: '/hod/change-password', label: 'Password', icon: IconLock },
  ];
  const mdLinks = [
    { to: '/md', label: 'Requests', icon: IconInbox },
    { to: '/apply-leave', label: 'Apply Leave', icon: IconPlus },
    { to: '/md/change-password', label: 'Password', icon: IconLock },
  ];
  const links = isAdmin ? adminLinks : isMd ? mdLinks : isHod ? hodLinks : empLinks;

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <img src={logo} alt="Shree Datta SSSK" className="brand-mark brand-logo-img" />
            <div className="brand-text">
              <div className="brand-name">Shree Datta SSSK</div>
              <div className="brand-sub">Shirol · Leave Portal</div>
            </div>
          </div>

          <nav className="side-links">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} className={({ isActive }) => (isActive ? 'active' : '')}>
                <l.icon width={16} height={16} /> {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="topbar-user">
            <ProfileMenu />
          </div>
        </div>
      </header>

      <nav className="bottom-nav">
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} className={({ isActive }) => (isActive ? 'active' : '')}>
            <l.icon />
            {l.label}
          </NavLink>
        ))}
      </nav>
    </>
  );
}
