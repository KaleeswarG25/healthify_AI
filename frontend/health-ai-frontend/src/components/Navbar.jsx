// src/components/Navbar.jsx
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaFileMedical, FaSignOutAlt, FaBars, FaTimes, FaRobot, FaHistory } from 'react-icons/fa';

const Navbar = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  if (!isAuthenticated) return null;

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo" onClick={() => setIsMenuOpen(false)}>
          <FaFileMedical className="logo-icon" />
          <span>AI Health</span>
        </Link>

        <button className="menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <FaTimes /> : <FaBars />}
        </button>

        <div className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
          <Link 
            to="/" 
            className={`nav-link ${isActive('/') ? 'active' : ''}`}
            onClick={() => setIsMenuOpen(false)}
          >
            Dashboard
          </Link>
          <Link 
            to="/upload" 
            className={`nav-link ${isActive('/upload') ? 'active' : ''}`}
            onClick={() => setIsMenuOpen(false)}
          >
            Upload
          </Link>
          <Link 
            to="/reports" 
            className={`nav-link ${isActive('/reports') ? 'active' : ''}`}
            onClick={() => setIsMenuOpen(false)}
          >
            Reports
          </Link>
          <Link 
            to="/analysis" 
            className={`nav-link ${isActive('/analysis') ? 'active' : ''}`}
            onClick={() => setIsMenuOpen(false)}
          >
            <FaRobot /> AI Analysis
          </Link>
        </div>

        <button onClick={handleLogout} className="logout-btn">
          <FaSignOutAlt />
          <span>Logout</span>
        </button>
      </div>

      <style>{`
        .navbar {
          background: white;
          padding: 1rem 2rem;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          position: sticky;
          top: 0;
          z-index: 1000;
        }

        .nav-container {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .nav-logo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          text-decoration: none;
          font-size: 1.5rem;
          font-weight: 700;
          background: linear-gradient(135deg, #667eea, #764ba2);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .logo-icon {
          color: #667eea;
          font-size: 1.8rem;
        }

        .menu-toggle {
          display: none;
          background: none;
          border: none;
          font-size: 1.5rem;
          color: #667eea;
          cursor: pointer;
        }

        .nav-menu {
          display: flex;
          gap: 2rem;
        }

        .nav-link {
          color: #4a5568;
          text-decoration: none;
          font-weight: 500;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .nav-link:hover {
          color: #667eea;
          background: #f7fafc;
        }

        .nav-link.active {
          color: #667eea;
          background: #ebf4ff;
          font-weight: 600;
        }

        .logout-btn {
          background: #f56565;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 0.5rem 1rem;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .logout-btn:hover {
          background: #e53e3e;
          transform: translateY(-2px);
        }

        @media (max-width: 768px) {
          .menu-toggle {
            display: block;
          }

          .nav-menu {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: white;
            flex-direction: column;
            padding: 1rem;
            gap: 0.5rem;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
            transform: translateY(-150%);
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s;
          }

          .nav-menu.active {
            transform: translateY(0);
            opacity: 1;
            visibility: visible;
          }

          .logout-btn span {
            display: none;
          }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;