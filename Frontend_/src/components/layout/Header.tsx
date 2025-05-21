import React from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';
import { LogOut, Settings, User } from 'lucide-react';

interface HeaderProps {
  className?: string;
}

const getRoleLabel = (role: UserRole): string => {
  switch (role) {
    case 'admin':
      return 'Administrator';
    case 'attendant':
      return 'Parking Attendant';
    case 'user':
      return 'User';
    default:
      return 'Guest';
  }
};

const Header: React.FC<HeaderProps> = ({ className }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error during logout:', error);
      // Still navigate to login page even if there's an error
      navigate('/login');
    }
  };

  return (
    <header className={cn('flex h-16 items-center border-b bg-background px-4 lg:px-6', className)}>
      <div className="flex w-full justify-between">
        <div className="flex items-center">
          <h2 className="text-xl font-medium">XYZ Ltd Parking Management</h2>
        </div>
        
        {user ? (
          <div className="flex items-center gap-4">
            <span className="hidden md:block text-sm text-muted-foreground">
              Welcome, {user.firstname} {user.lastname}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className="relative rounded-full h-8 w-8 bg-primary text-white"
                >
                  <span className="sr-only">Open user menu</span>
                  <span>{user.firstname.charAt(0)}{user.lastname.charAt(0)}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{user.firstname} {user.lastname}</span>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuItem className="text-xs text-muted-foreground">
                  {getRoleLabel(user.role)}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => navigate('/login')}>
              Sign In
            </Button>
            <Button size="sm" onClick={() => navigate('/register')}>
              Sign Up
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
