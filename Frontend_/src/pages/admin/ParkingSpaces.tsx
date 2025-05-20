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
import { z } from 'zod';

// Form validation schema
const parkingSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  name: z.string().min(1, 'Name is required'),
  location: z.string().min(1, 'Location is required'),
  total_spaces: z.number().min(1, 'Total spaces must be at least 1'),
  fee_per_hour: z.number().min(0, 'Fee per hour must be 0 or greater'),
});

const ParkingSpaces = () => {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedParking, setSelectedParking] = useState<Parking | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    location: '',
    total_spaces: 0,
    fee_per_hour: 0,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

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
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to create parking space';
      const errors = error.response?.data?.errors || [];
      if (errors.length > 0) {
        setFormErrors(errors.reduce((acc: Record<string, string>, err: string) => {
          const [field] = err.split(' ');
          acc[field.toLowerCase()] = err;
          return acc;
        }, {}));
      } else {
        toast.error(message);
      }
    }
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
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update parking space';
      const errors = error.response?.data?.errors || [];
      if (errors.length > 0) {
        setFormErrors(errors.reduce((acc: Record<string, string>, err: string) => {
          const [field] = err.split(' ');
          acc[field.toLowerCase()] = err;
          return acc;
        }, {}));
      } else {
        toast.error(message);
      }
    }
  });

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      location: '',
      total_spaces: 0,
      fee_per_hour: 0,
    });
    setFormErrors({});
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    
    try {
      const validatedData = parkingSchema.parse(formData);
      createMutation.mutate(validatedData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.reduce((acc: Record<string, string>, err) => {
          acc[err.path[0]] = err.message;
          return acc;
        }, {});
        setFormErrors(errors);
      }
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    
    if (selectedParking) {
      try {
        const validatedData = parkingSchema.parse(formData);
        updateMutation.mutate({ 
          id: selectedParking.id, 
          parking: validatedData 
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          const errors = error.errors.reduce((acc: Record<string, string>, err) => {
            acc[err.path[0]] = err.message;
            return acc;
          }, {});
          setFormErrors(errors);
        }
      }
    }
  };

  const openEditDialog = (parking: Parking) => {
    setSelectedParking(parking);
    setFormData({
      code: parking.code,
      name: parking.name,
      location: parking.location,
      total_spaces: parking.total_spaces || parking.totalSpaces || 0,
      fee_per_hour: parking.fee_per_hour || parking.feePerHour || 0,
    });
    setFormErrors({});
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
      accessorKey: 'total_spaces',
      cell: ({ row }) => {
        const total = row.original.total_spaces || row.original.totalSpaces || 0;
        return total;
      }
    },
    {
      header: 'Available Spaces',
      accessorKey: 'available_spaces',
      cell: ({ row }) => {
        const available = row.original.available_spaces || row.original.availableSpaces || 0;
        const total = row.original.total_spaces || row.original.totalSpaces || 0;
        const percentage = total > 0 ? Math.round((available / total) * 100) : 0;
        
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
      accessorKey: 'fee_per_hour',
      cell: ({ row }) => {
        const fee = row.original.fee_per_hour || row.original.feePerHour || 0;
        return `$${fee.toFixed(2)}`;
      }
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
                    {formErrors.code && (
                      <p className="text-sm text-red-500">{formErrors.code}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input 
                      id="name" 
                      value={formData.name} 
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                    {formErrors.name && (
                      <p className="text-sm text-red-500">{formErrors.name}</p>
                    )}
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
                  {formErrors.location && (
                    <p className="text-sm text-red-500">{formErrors.location}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="total_spaces">Total Spaces</Label>
                    <Input 
                      id="total_spaces" 
                      type="number"
                      min="1"
                      value={formData.total_spaces} 
                      onChange={(e) => setFormData({...formData, total_spaces: parseInt(e.target.value) || 0})}
                      required
                    />
                    {formErrors.total_spaces && (
                      <p className="text-sm text-red-500">{formErrors.total_spaces}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fee_per_hour">Fee ($/hr)</Label>
                    <Input 
                      id="fee_per_hour" 
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.fee_per_hour} 
                      onChange={(e) => setFormData({...formData, fee_per_hour: parseFloat(e.target.value) || 0})}
                      required
                    />
                    {formErrors.fee_per_hour && (
                      <p className="text-sm text-red-500">{formErrors.fee_per_hour}</p>
                    )}
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
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-total_spaces">Total Spaces</Label>
                <Input 
                  id="edit-total_spaces" 
                  type="number"
                  value={formData.total_spaces} 
                  onChange={(e) => setFormData({...formData, total_spaces: parseInt(e.target.value) || 0})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-fee_per_hour">Fee ($/hr)</Label>
                <Input 
                  id="edit-fee_per_hour" 
                  type="number"
                  step="0.01"
                  value={formData.fee_per_hour} 
                  onChange={(e) => setFormData({...formData, fee_per_hour: parseFloat(e.target.value) || 0})}
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