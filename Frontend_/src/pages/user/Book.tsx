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
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/sonner';
import { Loader2, Calendar, Clock, Car } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { parkingApi, carApi, bookingApi } from '@/services/api';
import { Parking, Car as CarType } from '@/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, addHours } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Form schema for booking
const bookingFormSchema = z.object({
  parkingId: z.string().min(1, 'Parking is required'),
  carId: z.string().min(1, 'Car is required'),
  date: z.date({
    required_error: "Date is required",
  }),
  startTime: z.string().min(1, 'Start time is required'),
  duration: z.number().min(1, 'Duration must be at least 1 hour').max(24, 'Duration cannot exceed 24 hours'),
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

const BookParking = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedParking, setSelectedParking] = useState<Parking | null>(null);
  
  // Fetch all parking spaces
  const { data: parkings, isLoading: isLoadingParkings } = useQuery({
    queryKey: ['parkings'],
    queryFn: () => parkingApi.getAllParkings(),
  });

  // Fetch user's cars
  const { data: userCars, isLoading: isLoadingCars } = useQuery({
    queryKey: ['user-cars'],
    queryFn: () => carApi.getUserCars(user?.id || ''),
    enabled: !!user?.id,
  });

  // Booking form
  const bookingForm = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      parkingId: '',
      carId: '',
      date: new Date(),
      startTime: '09:00',
      duration: 2,
    },
  });

  // Create booking mutation
  const createBookingMutation = useMutation({
    mutationFn: (data: BookingFormValues) => {
      // Convert the date and startTime to the format expected by the backend
      const bookingDate = format(data.date, 'yyyy-MM-dd');
      
      return bookingApi.createBooking({
        userId: user?.id || '',
        parkingId: data.parkingId,
        carId: data.carId,
        date: bookingDate,
        startTime: data.startTime,
        duration: data.duration
      });
    },
    onSuccess: () => {
      toast.success('Booking created successfully');
      bookingForm.reset({
        parkingId: '',
        carId: '',
        date: new Date(),
        startTime: '09:00',
        duration: 2,
      });
      queryClient.invalidateQueries({ queryKey: ['user-bookings'] });
      // Navigate to bookings page after successful booking
      navigate('/user/bookings');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create booking');
    },
  });

  const handleParkingChange = (value: string) => {
    const parking = parkings?.data?.find((p: Parking) => p.id === value);
    setSelectedParking(parking || null);
  };

  const handleBookingSubmit = (values: BookingFormValues) => {
    createBookingMutation.mutate(values);
  };

  // Calculate estimated cost
  const calculateEstimatedCost = () => {
    if (!selectedParking) return 0;
    
    const duration = bookingForm.getValues('duration');
    // Use either hourly_rate or feePerHour based on what's available
    const hourlyRate = selectedParking.hourly_rate || selectedParking.feePerHour;
    return hourlyRate * duration;
  };

  // Calculate occupancy percentage
  const calculateOccupancy = (parking: Parking) => {
    // Use either total_spaces or totalSpaces based on what's available
    const totalSpaces = parking.total_spaces || parking.totalSpaces;
    const availableSpaces = parking.available_spaces || parking.availableSpaces;
    
    if (totalSpaces === 0) return 0;
    return ((totalSpaces - availableSpaces) / totalSpaces) * 100;
  };

  // Get badge variant based on occupancy
  const getOccupancyVariant = (occupancy: number) => {
    if (occupancy >= 90) return "destructive";
    if (occupancy >= 70) return "warning";
    return "success";
  };

  // Generate time slots
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      const hourFormatted = hour.toString().padStart(2, '0');
      slots.push(`${hourFormatted}:00`);
    }
    return slots;
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Book Parking Space</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Book a Parking Space</CardTitle>
                <CardDescription>Reserve a parking space for your vehicle</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...bookingForm}>
                  <form onSubmit={bookingForm.handleSubmit(handleBookingSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={bookingForm.control}
                        name="parkingId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Parking Lot*</FormLabel>
                            <Select
                              onValueChange={(value) => {
                                field.onChange(value);
                                handleParkingChange(value);
                              }}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select parking lot" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {isLoadingParkings ? (
                                  <div className="flex justify-center p-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  </div>
                                ) : (
                                  parkings?.data?.map((parking: Parking) => {
                                    // Use either available_spaces or availableSpaces based on what's available
                                    const availableSpaces = parking.available_spaces !== undefined 
                                      ? parking.available_spaces 
                                      : parking.availableSpaces;
                                    
                                    return (
                                      <SelectItem 
                                        key={parking.id} 
                                        value={parking.id}
                                        disabled={availableSpaces <= 0}
                                      >
                                        {parking.name} ({availableSpaces} spaces available)
                                      </SelectItem>
                                    );
                                  })
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={bookingForm.control}
                        name="carId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Your Car*</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select your car" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {isLoadingCars ? (
                                  <div className="flex justify-center p-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  </div>
                                ) : !userCars?.data || userCars?.data.length === 0 ? (
                                  <div className="p-2 text-center">
                                    <p className="text-sm text-muted-foreground">No cars registered</p>
                                    <p className="text-xs text-muted-foreground">Please add a car in your profile first</p>
                                  </div>
                                ) : (
                                  userCars?.data.map((car: CarType) => (
                                    <SelectItem key={car.id} value={car.id}>
                                      {car.plate_number || car.plateNumber} - {car.make} {car.model}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <FormField
                        control={bookingForm.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Date*</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className="w-full pl-3 text-left font-normal"
                                  >
                                    <Calendar className="mr-2 h-4 w-4" />
                                    {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <CalendarComponent
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) => date < new Date()}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={bookingForm.control}
                        name="startTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Start Time*</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select start time" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {generateTimeSlots().map((time) => (
                                  <SelectItem key={time} value={time}>
                                    {time}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={bookingForm.control}
                        name="duration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Duration (hours)*</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={1}
                                max={24}
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        className="w-full md:w-auto"
                        disabled={createBookingMutation.isPending || !userCars?.data?.length}
                      >
                        {createBookingMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          'Book Parking Space'
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
          
          <div>
            {selectedParking ? (
              <Card>
                <CardHeader>
                  <CardTitle>{selectedParking.name}</CardTitle>
                  <CardDescription>Parking lot details</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium">Location</p>
                      <p>{selectedParking.location || 'N/A'}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium">Hourly Rate</p>
                      <p className="text-lg font-bold">
                        ${(selectedParking.hourly_rate || selectedParking.feePerHour).toFixed(2)}/hour
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium">Occupancy</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={calculateOccupancy(selectedParking)} />
                        <span>{Math.round(calculateOccupancy(selectedParking))}%</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium">Available</p>
                        <p className="text-2xl font-bold">
                          {selectedParking.available_spaces !== undefined 
                            ? selectedParking.available_spaces 
                            : selectedParking.availableSpaces}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Total</p>
                        <p className="text-2xl font-bold">
                          {selectedParking.total_spaces !== undefined 
                            ? selectedParking.total_spaces 
                            : selectedParking.totalSpaces}
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium">Status</p>
                      <Badge variant={getOccupancyVariant(calculateOccupancy(selectedParking))}>
                        {calculateOccupancy(selectedParking) >= 90 
                          ? 'Full' 
                          : calculateOccupancy(selectedParking) >= 70 
                            ? 'Filling Up' 
                            : 'Available'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Booking Summary</CardTitle>
                  <CardDescription>Select a parking lot to see details</CardDescription>
                </CardHeader>
                <CardContent className="text-center py-8">
                  <Car className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Select a parking lot to view details and calculate costs
                  </p>
                </CardContent>
              </Card>
            )}
            
            {selectedParking && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Booking Summary</CardTitle>
                  <CardDescription>Estimated cost and details</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Date:</span>
                      <span className="font-medium">
                        {format(bookingForm.getValues('date'), 'PPP')}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Time:</span>
                      <span className="font-medium">
                        {bookingForm.getValues('startTime')}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Duration:</span>
                      <span className="font-medium">
                        {bookingForm.getValues('duration')} hours
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">End Time:</span>
                      <span className="font-medium">
                        {(() => {
                          const startTime = bookingForm.getValues('startTime');
                          const [hours, minutes] = startTime.split(':').map(Number);
                          const startDate = new Date();
                          startDate.setHours(hours, minutes);
                          const endDate = addHours(startDate, bookingForm.getValues('duration'));
                          return format(endDate, 'HH:mm');
                        })()}
                      </span>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Rate:</span>
                      <span className="font-medium">
                        ${(selectedParking.hourly_rate || selectedParking.feePerHour).toFixed(2)}/hour
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Estimated Cost:</span>
                      <span>${calculateEstimatedCost().toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/50 px-6 py-4">
                  <p className="text-xs text-muted-foreground">
                    Note: This is an estimated cost. Actual cost may vary based on actual parking duration.
                  </p>
                </CardFooter>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BookParking;