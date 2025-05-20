
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { 
  Home, 
  Users, 
  Car, 
  File, 
  Map, 
  Ticket, 
  Settings,
  Calendar
} from 'lucide-react';

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  href: string;
  isActive?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({
  icon: Icon,
  label,
  href,
  isActive,
}) => {
  return (
    <Link
      to={href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent',
        isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </Link>
  );
};

export function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const renderAdminMenu = () => (
    <div className="space-y-1">
      <SidebarItem
        icon={Home}
        label="Dashboard"
        href="/admin/dashboard"
        isActive={isActive('/admin/dashboard')}
      />
      <SidebarItem
        icon={Map}
        label="Parking Spaces"
        href="/admin/parking-spaces"
        isActive={isActive('/admin/parking-spaces')}
      />
      <SidebarItem
        icon={Users}
        label="Users"
        href="/admin/users"
        isActive={isActive('/admin/users')}
      />
      <SidebarItem
        icon={Car}
        label="Cars"
        href="/admin/cars"
        isActive={isActive('/admin/cars')}
      />
      <SidebarItem
        icon={Ticket}
        label="Tickets"
        href="/admin/tickets"
        isActive={isActive('/admin/tickets')}
      />
      <SidebarItem
        icon={Calendar}
        label="Entries & Exits"
        href="/admin/entries"
        isActive={isActive('/admin/entries')}
      />
      <SidebarItem
        icon={File}
        label="Reports"
        href="/admin/reports"
        isActive={isActive('/admin/reports')}
      />
      <SidebarItem
        icon={Settings}
        label="Settings"
        href="/admin/settings"
        isActive={isActive('/admin/settings')}
      />
    </div>
  );

  const renderAttendantMenu = () => (
    <div className="space-y-1">
      <SidebarItem
        icon={Home}
        label="Dashboard"
        href="/attendant/dashboard"
        isActive={isActive('/attendant/dashboard')}
      />
      <SidebarItem
        icon={Car}
        label="Register Entry/Exit"
        href="/attendant/register"
        isActive={isActive('/attendant/register')}
      />
      <SidebarItem
        icon={Map}
        label="Parking Status"
        href="/attendant/status"
        isActive={isActive('/attendant/status')}
      />
      <SidebarItem
        icon={Ticket}
        label="Tickets"
        href="/attendant/tickets"
        isActive={isActive('/attendant/tickets')}
      />
      <SidebarItem
        icon={Settings}
        label="Settings"
        href="/attendant/settings"
        isActive={isActive('/attendant/settings')}
      />
    </div>
  );

  const renderUserMenu = () => (
    <div className="space-y-1">
      <SidebarItem
        icon={Home}
        label="Dashboard"
        href="/user/dashboard"
        isActive={isActive('/user/dashboard')}
      />
      <SidebarItem
        icon={Map}
        label="Book Parking"
        href="/user/book"
        isActive={isActive('/user/book')}
      />
      <SidebarItem
        icon={Car}
        label="My Cars"
        href="/user/cars"
        isActive={isActive('/user/cars')}
      />
      <SidebarItem
        icon={Ticket}
        label="My Bookings"
        href="/user/bookings"
        isActive={isActive('/user/bookings')}
      />
      <SidebarItem
        icon={File}
        label="History"
        href="/user/history"
        isActive={isActive('/user/history')}
      />
      <SidebarItem
        icon={Settings}
        label="Settings"
        href="/user/settings"
        isActive={isActive('/user/settings')}
      />
    </div>
  );

  const renderMenuByRole = () => {
    if (!user) return null;
    
    switch (user.role) {
      case 'admin':
        return renderAdminMenu();
      case 'attendant':
        return renderAttendantMenu();
      case 'user':
        return renderUserMenu();
      default:
        return null;
    }
  };

  return (
    <aside className="hidden border-r bg-sidebar md:flex md:w-64 md:flex-col">
      <div className="flex flex-col gap-2 px-2 py-4 h-full">
        <div className="py-2 px-4">
          <h2 className="text-lg font-semibold text-primary">XYZ Parking</h2>
          <p className="text-xs text-muted-foreground">Management System</p>
        </div>
        
        <div className="flex-1 overflow-auto py-2">
          {renderMenuByRole()}
        </div>
        
        <div className="mt-auto border-t p-4">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2">
            <div className="flex flex-1 items-center gap-3">
              <div className="rounded-full bg-primary/10 p-1">
                <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-medium">
                  {user?.firstname?.charAt(0)}{user?.lastname?.charAt(0)}
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium leading-none">
                  {user?.firstname} {user?.lastname}
                </span>
                <span className="text-xs text-muted-foreground">
                  {user?.role === 'admin' 
                    ? 'Administrator' 
                    : user?.role === 'attendant' 
                      ? 'Parking Attendant' 
                      : 'User'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
