import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Car, 
  CalendarClock, 
  Receipt, 
  LogOut 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { authApi } from '@/services/api';
import { useNavigate, Link } from 'react-router-dom';

interface UserLayoutProps {
  children: React.ReactNode;
}

const UserLayout: React.FC<UserLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Redirect if not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = async () => {
    try {
      await authApi.logout();
      logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const sidebarItems = [
    { name: 'Dashboard', path: '/user/dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    { name: 'My Cars', path: '/user/cars', icon: <Car className="h-5 w-5" /> },
    { name: 'My Bookings', path: '/user/bookings', icon: <CalendarClock className="h-5 w-5" /> },
    { name: 'Book Parking', path: '/user/book', icon: <Receipt className="h-5 w-5" /> },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="hidden md:flex flex-col w-64 bg-card border-r">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold">XYZ Parking</h1>
          <p className="text-sm text-muted-foreground">User Portal</p>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          <nav className="px-2 space-y-1">
            {sidebarItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  window.location.pathname === item.path
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {item.icon}
                <span className="ml-3">{item.name}</span>
              </Link>
            ))}
          </nav>
        </div>
        <div className="p-4 border-t">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-muted-foreground hover:text-foreground"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 mr-3" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b h-16 flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center">
            <button className="md:hidden p-2 mr-2 rounded-md hover:bg-muted">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h2 className="text-lg font-semibold">User Dashboard</h2>
          </div>
          <div className="flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder-avatar.jpg" alt={user?.firstname} />
                    <AvatarFallback>{user?.firstname?.charAt(0)}{user?.lastname?.charAt(0)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.firstname} {user?.lastname}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default UserLayout;