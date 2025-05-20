import React, { useState } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { parkingApi } from '@/services/api';
import DataTable from '@/components/tables/DataTable';
import { TableColumn, Parking } from '@/types';
import { toast } from '@/components/ui/sonner';
import { Map, Plus, Pencil } from 'lucide-react';

const ParkingSpaces = () => {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedParking, setSelectedParking] = useState<Parking | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    location: '',
    totalSpaces: 0,
    availableSpaces: 0,
    feePerHour: 0,
  });

  // Fetch parkings
  const { data: parkings, isLoading } = useQuery({
    queryKey: ['parkings'],
    queryFn: parkingApi.getAll,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: parkingApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parkings'] });
      setIsCreateOpen(false);
      resetForm();
      toast.success('Parking space created successfully');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: { id: string; parking: Partial<Parking> }) => 
      parkingApi.update(data.id, data.parking),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parkings'] });
      setIsEditOpen(false);
      setSelectedParking(null);
      resetForm();
      toast.success('Parking space updated successfully');
    },
  });

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      location: '',
      totalSpaces: 0,
      availableSpaces: 0,
      feePerHour: 0,
    });
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedParking) {
      updateMutation.mutate({ 
        id: selectedParking.id, 
        parking: formData 
      });
    }
  };

  const openEditDialog = (parking: Parking) => {
    setSelectedParking(parking);
    setFormData({
      code: parking.code,
      name: parking.name,
      location: parking.location,
      totalSpaces: parking.totalSpaces,
      availableSpaces: parking.availableSpaces,
      feePerHour: parking.feePerHour,
    });
    setIsEditOpen(true);
  };

  // Table columns
  const columns: TableColumn<Parking>[] = [
    {
      header: 'Code',
      accessorKey: 'code',
    },
    {
      header: 'Name',
      accessorKey: 'name',
    },
    {
      header: 'Location',
      accessorKey: 'location',
    },
    {
      header: 'Total Spaces',
      accessorKey: 'totalSpaces',
    },
    {
      header: 'Available Spaces',
      accessorKey: 'availableSpaces',
      cell: ({ row }) => {
        const available = row.original.availableSpaces;
        const total = row.original.totalSpaces;
        const percentage = Math.round((available / total) * 100);
        
        let colorClass = 'text-green-500';
        if (percentage < 20) {
          colorClass = 'text-red-500';
        } else if (percentage < 50) {
          colorClass = 'text-amber-500';
        }
        
        return (
          <div className="flex items-center gap-2">
            <span className={colorClass}>{available}</span>
            <span className="text-muted-foreground text-sm">({percentage}%)</span>
          </div>
        );
      },
    },
    {
      header: 'Fee ($/hr)',
      accessorKey: 'feePerHour',
      cell: ({ getValue }) => `$${getValue()}`,
    },
    {
      header: 'Actions',
      accessorKey: 'id',
      cell: ({ row }) => (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => openEditDialog(row.original)}
          className="flex items-center gap-1"
        >
          <Pencil className="h-4 w-4" /> Edit
        </Button>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-semibold">Parking Spaces</h1>
            <p className="text-muted-foreground">Manage all parking spaces across locations.</p>
          </div>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" /> Add New Parking Space
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Parking Space</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateSubmit} className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">Parking Code</Label>
                    <Input 
                      id="code" 
                      value={formData.code} 
                      onChange={(e) => setFormData({...formData, code: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input 
                      id="name" 
                      value={formData.name} 
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input 
                    id="location" 
                    value={formData.location} 
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="totalSpaces">Total Spaces</Label>
                    <Input 
                      id="totalSpaces" 
                      type="number"
                      value={formData.totalSpaces} 
                      onChange={(e) => setFormData({...formData, totalSpaces: parseInt(e.target.value) || 0})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="availableSpaces">Available Spaces</Label>
                    <Input 
                      id="availableSpaces" 
                      type="number"
                      value={formData.availableSpaces} 
                      onChange={(e) => setFormData({...formData, availableSpaces: parseInt(e.target.value) || 0})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="feePerHour">Fee ($/hr)</Label>
                    <Input 
                      id="feePerHour" 
                      type="number"
                      step="0.01"
                      value={formData.feePerHour} 
                      onChange={(e) => setFormData({...formData, feePerHour: parseFloat(e.target.value) || 0})}
                      required
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Creating...' : 'Create Parking Space'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Map className="h-5 w-5" /> Parking Spaces
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable 
              data={parkings || []} 
              columns={columns}
              searchKey="name"
              isLoading={isLoading}
            />
          </CardContent>
        </Card>
      </div>
      
      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Parking Space</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-code">Parking Code</Label>
                <Input 
                  id="edit-code" 
                  value={formData.code} 
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input 
                  id="edit-name" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-location">Location</Label>
              <Input 
                id="edit-location" 
                value={formData.location} 
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                required
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-totalSpaces">Total Spaces</Label>
                <Input 
                  id="edit-totalSpaces" 
                  type="number"
                  value={formData.totalSpaces} 
                  onChange={(e) => setFormData({...formData, totalSpaces: parseInt(e.target.value) || 0})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-availableSpaces">Available Spaces</Label>
                <Input 
                  id="edit-availableSpaces" 
                  type="number"
                  value={formData.availableSpaces} 
                  onChange={(e) => setFormData({...formData, availableSpaces: parseInt(e.target.value) || 0})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-feePerHour">Fee ($/hr)</Label>
                <Input 
                  id="edit-feePerHour" 
                  type="number"
                  step="0.01"
                  value={formData.feePerHour} 
                  onChange={(e) => setFormData({...formData, feePerHour: parseFloat(e.target.value) || 0})}
                  required
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default ParkingSpaces;