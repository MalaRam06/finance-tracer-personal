import React, { useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Layout.css';

const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        {
            path: '/dashboard',
            label: 'Dashboard',
            icon: '📊'
        },
        {
            path: '/transactions',
            label: 'Transactions',
            icon: '💳'
        }
    ];

    return (
        <div className="layout">
            <header className="header">
                <div className="header-left">
                    <button 
                        className="menu-toggle"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    >
                        ☰
                    </button>
                    <h1 className="logo">💰 Finance Tracker</h1>
                </div>
                <div className="header-right">
                    <span className="user-name">👤 {user?.name}</span>
                    <button onClick={handleLogout} className="logout-btn">
                        Logout
                    </button>
                </div>
            </header>

            <div className="layout-body">
                <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
                    <nav className="nav">
                        {navItems.map(item => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                                onClick={() => setIsSidebarOpen(false)}
                            >
                                <span className="nav-icon">{item.icon}</span>
                                <span className="nav-label">{item.label}</span>
                            </Link>
                        ))}
                    </nav>
                </aside>

                <main className="main-content">
                    <Outlet />
                </main>
            </div>

            {isSidebarOpen && (
                <div 
                    className="sidebar-overlay"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}
        </div>
    );
};

export default Layout;