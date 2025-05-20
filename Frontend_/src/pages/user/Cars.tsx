import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/sonner';
import { Loader2, Plus, Pencil, Trash2, Car } from 'lucide-react';
import UserLayout from '@/components/layouts/UserLayout';
import { carApi } from '@/services/api';
import { Car as CarType } from '@/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';

// Form schema for car
const carFormSchema = z.object({
  plate_number: z.string().min(1, 'Plate number is required'),
  make: z.string().optional(),
  model: z.string().optional(),
  color: z.string().optional(),
  year: z.string().optional(),
});

type CarFormValues = z.infer<typeof carFormSchema>;

const CarsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState<CarType | null>(null);
  const [carToDelete, setCarToDelete] = useState<CarType | null>(null);
  
  // Fetch user's cars
  const { data: userCars, isLoading: isLoadingCars } = useQuery({
    queryKey: ['user-cars'],
    queryFn: () => carApi.getUserCars(user?.id || ''),
    enabled: !!user?.id,
  });

  // Car form for adding/editing
  const carForm = useForm<CarFormValues>({
    resolver: zodResolver(carFormSchema),
    defaultValues: {
      plate_number: '',
      make: '',
      model: '',
      color: '',
      year: '',
    },
  });

  // Create car mutation
  const createCarMutation = useMutation({
    mutationFn: (data: CarFormValues) => carApi.createCar({
      ...data,
      owner_id: user?.id || '',
      year: data.year ? parseInt(data.year) : undefined,
    }),
    onSuccess: () => {
      toast.success('Car added successfully');
      carForm.reset();
      setIsAddDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['user-cars'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add car');
    },
  });

  // Update car mutation
  const updateCarMutation = useMutation({
    mutationFn: (data: CarFormValues & { id: string }) => carApi.updateCar(data.id, data),
    onSuccess: () => {
      toast.success('Car updated successfully');
      carForm.reset();
      setIsEditDialogOpen(false);
      setSelectedCar(null);
      queryClient.invalidateQueries({ queryKey: ['user-cars'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update car');
    },
  });

  // Delete car mutation
  const deleteCarMutation = useMutation({
    mutationFn: (carId: string) => carApi.deleteCar(carId),
    onSuccess: () => {
      toast.success('Car deleted successfully');
      setCarToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['user-cars'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete car');
    },
  });

  const handleAddSubmit = (values: CarFormValues) => {
    createCarMutation.mutate(values);
  };

  const handleEditSubmit = (values: CarFormValues) => {
    if (selectedCar) {
      updateCarMutation.mutate({
        ...values,
        id: selectedCar.id,
      });
    }
  };

  const handleDelete = () => {
    if (carToDelete) {
      deleteCarMutation.mutate(carToDelete.id);
    }
  };

  const handleEditClick = (car: CarType) => {
    setSelectedCar(car);
    carForm.reset({
      plate_number: car.plate_number || car.plateNumber || '',
      make: car.make || '',
      model: car.model || '',
      color: car.color || '',
      year: car.year?.toString() || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (car: CarType) => {
    setCarToDelete(car);
    handleDelete();
  };

  const handleAddDialogOpen = () => {
    carForm.reset({
      plate_number: '',
      make: '',
      model: '',
      color: '',
      year: '',
    });
    setIsAddDialogOpen(true);
  };

  return (
    <UserLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">My Cars</h1>
          <Button onClick={handleAddDialogOpen}>
            <Plus className="h-4 w-4 mr-2" />
            Add New Car
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>My Registered Vehicles</CardTitle>
            <CardDescription>Manage your registered vehicles for parking</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingCars ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !userCars?.data || userCars?.data.length === 0 ? (
              <div className="text-center py-12">
                <Car className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No Cars Registered</h3>
                <p className="text-muted-foreground mb-6">You haven't registered any cars yet.</p>
                <Button onClick={handleAddDialogOpen}>
                  <Plus className="h-4 w-4 mr-2" />
                  Register Your First Car
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plate Number</TableHead>
                    <TableHead>Make</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userCars?.data.map((car: CarType) => (
                    <TableRow key={car.id}>
                      <TableCell className="font-medium">{car.plate_number || car.plateNumber}</TableCell>
                      <TableCell>{car.make || 'N/A'}</TableCell>
                      <TableCell>{car.model || 'N/A'}</TableCell>
                      <TableCell>{car.color || 'N/A'}</TableCell>
                      <TableCell>{car.year || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant={car.is_parked ? "default" : "outline"}>
                          {car.is_parked ? 'Currently Parked' : 'Not Parked'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => handleEditClick(car)}
                            disabled={car.is_parked}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="icon"
                                className="text-destructive"
                                disabled={car.is_parked}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete the car with plate number <strong>{car.plate_number || car.plateNumber}</strong>. 
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeleteClick(car)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
          {userCars?.data && userCars?.data.length > 0 && (
            <CardFooter className="bg-muted/50 px-6 py-4">
              <p className="text-xs text-muted-foreground">
                Note: Cars that are currently parked cannot be edited or deleted.
              </p>
            </CardFooter>
          )}
        </Card>
        
        {/* Add Car Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Car</DialogTitle>
              <DialogDescription>
                Register a new vehicle to use for parking reservations.
              </DialogDescription>
            </DialogHeader>
            <Form {...carForm}>
              <form onSubmit={carForm.handleSubmit(handleAddSubmit)} className="space-y-4">
                <FormField
                  control={carForm.control}
                  name="plate_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plate Number*</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter plate number"
                          {...field}
                          className="uppercase"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={carForm.control}
                    name="make"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Make</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Toyota" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={carForm.control}
                    name="model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Model</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Corolla" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={carForm.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Color</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Blue" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={carForm.control}
                    name="year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Year</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 2022" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={createCarMutation.isPending}
                  >
                    {createCarMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      'Add Car'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        
        {/* Edit Car Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Car</DialogTitle>
              <DialogDescription>
                Update your vehicle information.
              </DialogDescription>
            </DialogHeader>
            <Form {...carForm}>
              <form onSubmit={carForm.handleSubmit(handleEditSubmit)} className="space-y-4">
                <FormField
                  control={carForm.control}
                  name="plate_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plate Number*</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter plate number"
                          {...field}
                          className="uppercase"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={carForm.control}
                    name="make"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Make</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Toyota" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={carForm.control}
                    name="model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Model</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Corolla" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={carForm.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Color</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Blue" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={carForm.control}
                    name="year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Year</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 2022" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsEditDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={updateCarMutation.isPending}
                  >
                    {updateCarMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      'Update Car'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </UserLayout>
  );
};

export default CarsPage;