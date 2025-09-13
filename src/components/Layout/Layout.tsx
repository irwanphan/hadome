import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Drawer, 
  DrawerContent, 
  DrawerItem
} from '@progress/kendo-react-layout';
import { Button } from '@progress/kendo-react-buttons';
import { Badge } from '@progress/kendo-react-indicators';
import { 
  IconDashboard, 
  IconCamera, 
  IconList, 
  IconSettings,
  IconMenu2
} from '@tabler/icons-react';
import BottomNavigation from './BottomNavigation';
import './BottomNavigation.css';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [expanded, setExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();

  const menuItems = [
    {
      text: 'Dashboard',
      icon: IconDashboard,
      route: '/analytics',
      badge: null
    },
    {
      text: 'Scan Receipt',
      icon: IconCamera,
      route: '/scan',
      badge: null
    },
    {
      text: 'Expenses',
      icon: IconList,
      route: '/expenses',
      badge: null
    },
    {
      text: 'Settings',
      icon: IconSettings,
      route: '/settings',
      badge: null
    }
  ];

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setExpanded(false);
      } else {
        setExpanded(true);
      }
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const handleClick = () => {
    setExpanded(!expanded);
  };

  const handleSelect = () => {
    // Auto-close on mobile
    if (isMobile) {
      setExpanded(false);
    }
  };

  return (
    <div className="app-layout">
      <Drawer 
        expanded={expanded && !isMobile} 
        position="start" 
        mode={isMobile ? "overlay" : "push"}
        mini={false}
        width={280}
        items={!isMobile ? menuItems.map(item => (
          <DrawerItem key={item.route}>
            <Link 
              to={item.route} 
              className={`drawer-link ${location.pathname === item.route ? 'active' : ''}`}
              onClick={handleSelect}
            >
              <item.icon size={20} />
              <span className="drawer-text">{item.text}</span>
              {item.badge && <Badge>{item.badge}</Badge>}
            </Link>
          </DrawerItem>
        )) : []}
      >
        <DrawerContent>
          <div className="drawer-content">
            <header className="app-header">
              <div className="header-left">
                {!isMobile && (
                  <Button 
                    fillMode="flat" 
                    onClick={handleClick}
                    className="drawer-toggle"
                  >
                    <IconMenu2 size={20} />
                  </Button>
                )}
                <div className="app-brand">
                  <h1 className="app-title">Receipt Scanner</h1>
                  <span className="app-subtitle">Expense Tracking Made Easy</span>
                </div>
              </div>
              <div className="header-right">
                <div className="user-info">
                  <span className="user-name">Welcome!</span>
                </div>
              </div>
            </header>
            <main className={`main-content ${isMobile ? 'mobile-content' : ''}`}>
              {children}
            </main>
          </div>
        </DrawerContent>
      </Drawer>
      
      {/* Bottom Navigation for Mobile */}
      {isMobile && <BottomNavigation />}
    </div>
  );
};

export default Layout;
