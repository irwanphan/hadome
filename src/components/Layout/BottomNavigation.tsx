import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  IconTextScan2,
  IconLayoutDashboardFilled,
  IconReceipt,
  IconSettingsFilled
} from '@tabler/icons-react';

interface BottomNavigationProps {
  className?: string;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ className = '' }) => {
  const location = useLocation();

  const menuItems = [
    {
      text: 'Dashboard',
      icon: IconLayoutDashboardFilled,
      route: '/analytics',
      label: 'Dashboard'
    },
    {
      text: 'Scan',
      icon: IconTextScan2,
      route: '/scan',
      label: 'Scan'
    },
    {
      text: 'Expenses',
      icon: IconReceipt,
      route: '/expenses',
      label: 'Expenses'
    },
    {
      text: 'Settings',
      icon: IconSettingsFilled,
      route: '/settings',
      label: 'Settings'
    }
  ];

  return (
    <nav className={`bottom-navigation ${className}`}>
      <div className="bottom-nav-container">
        {menuItems.map(item => (
          <Link
            key={item.route}
            to={item.route}
            className={`bottom-nav-item ${location.pathname === item.route ? 'active' : ''}`}
          >
            <div className="bottom-nav-icon">
              <item.icon size={20} />
            </div>
            <span className="bottom-nav-label">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default BottomNavigation;
