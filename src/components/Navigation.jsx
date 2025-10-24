import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Navigation = () => {
  const { t } = useTranslation();
  const location = useLocation();

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: '🏠' },
    { path: '/journal', label: 'Journal Entry', icon: '📝' },
    { path: '/sales', label: 'Sales', icon: '💰' },
    { path: '/purchase', label: 'Purchase', icon: '🛒' },
    { path: '/inventory', label: 'Inventory', icon: '📦' },
    { path: '/customers', label: 'Customers', icon: '👥' },
    { path: '/suppliers', label: 'Suppliers', icon: '🏢' },
    { path: '/receivables', label: 'Receivables', icon: '💳' },
    { path: '/reports', label: 'Reports', icon: '📊' },
    { path: '/multi-currency', label: 'Multi-Currency', icon: '💱' }
  ];

  return (
    <nav className="navigation">
      <div className="nav-brand">
        <h2>📚 KrissAccounting</h2>
      </div>
      <ul className="nav-menu">
        {menuItems.map((item) => (
          <li key={item.path} className="nav-item">
            <Link 
              to={item.path} 
              className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-text">{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Navigation;