import React, { useState } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '@/services/api';
import DataTable from '@/components/tables/DataTable';
import { TableColumn, User, UserRole } from '@/types';
import { toast } from '@/components/ui/sonner';
import { Users as UsersIcon, User as UserIcon } from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';

const UsersManagement = () => {
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole | ''>('');
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);

  // Fetch users
  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: userApi.getAll,
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: (data: { id: string; role: UserRole }) => 
      userApi.updateRole(data.id, data.role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsRoleDialogOpen(false);
      setSelectedUser(null);
      setSelectedRole('');
      toast.success('User role updated successfully');
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: userApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deleted successfully');
    },
  });

  const openRoleDialog = (user: User) => {
    setSelectedUser(user);
    setSelectedRole(user.role);
    setIsRoleDialogOpen(true);
  };

  const handleRoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUser && selectedRole) {
      updateRoleMutation.mutate({
        id: selectedUser.id,
        role: selectedRole as UserRole,
      });
    }
  };

  const handleDeleteUser = (id: string) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      deleteUserMutation.mutate(id);
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Admin</Badge>;
      case 'attendant':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Attendant</Badge>;
      case 'user':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">User</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Table columns
  const columns: TableColumn<User>[] = [
    {
      header: 'Name',
      accessorKey: 'firstname',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs">
            {row.original.firstname.charAt(0)}{row.original.lastname.charAt(0)}
          </div>
          <div>
            <div className="font-medium">{row.original.firstname} {row.original.lastname}</div>
            <div className="text-sm text-muted-foreground">{row.original.email}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Email',
      accessorKey: 'email',
    },
    {
      header: 'Role',
      accessorKey: 'role',
      cell: ({ getValue }) => getRoleBadge(getValue() as UserRole),
    },
    {
      header: 'Created At',
      accessorKey: 'createdAt',
      cell: ({ getValue }) => {
        const date = new Date(getValue() as string);
        return date.toLocaleDateString();
      },
    },
    {
      header: 'Actions',
      accessorKey: 'id',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">Actions</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openRoleDialog(row.original)}>
              Change Role
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => handleDeleteUser(row.original.id)}
            >
              Delete User
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">User Management</h1>
          <p className="text-muted-foreground">Manage all system users and their roles.</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UsersIcon className="h-5 w-5" /> System Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable 
              data={users || []} 
              columns={columns}
              searchKey="email"
              isLoading={isLoading}
            />
          </CardContent>
        </Card>
      </div>
      
      {/* Change Role Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRoleSubmit} className="space-y-4 pt-4">
            {selectedUser && (
              <div className="flex items-center gap-3 p-3 border rounded-md bg-muted/40">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <UserIcon className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-medium">
                    {selectedUser.firstname} {selectedUser.lastname}
                  </div>
                  <div className="text-sm text-muted-foreground">{selectedUser.email}</div>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Role</label>
              <Select 
                value={selectedRole} 
                onValueChange={(value) => setSelectedRole(value as UserRole)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrator</SelectItem>
                  <SelectItem value="attendant">Parking Attendant</SelectItem>
                  <SelectItem value="user">Regular User</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateRoleMutation.isPending}>
                {updateRoleMutation.isPending ? 'Updating...' : 'Update Role'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default UsersManagement;