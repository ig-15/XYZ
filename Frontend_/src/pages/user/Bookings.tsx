import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Map, Ban, Check, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { bookingApi } from '@/services/api';
import { Booking } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/components/ui/sonner';
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

// Format date and time
const formatDateTime = (dateTime: string) => {
  const date = new Date(dateTime);
  return {
    date: date.toLocaleDateString(),
    time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    full: date.toLocaleString(),
  };
};

// Calculate duration between two dates in hours
const calculateDuration = (start: string, end: string) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const durationMs = endDate.getTime() - startDate.getTime();
  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h${minutes > 0 ? ` ${minutes}m` : ''}`;
};

// Calculate end time based on start time and duration
const calculateEndTime = (startTime: string, duration: number) => {
  const startDate = new Date(startTime);
  const endDate = new Date(startDate.getTime() + duration * 60 * 60 * 1000);
  return endDate.toISOString();
};

// Get status badge
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'pending':
      return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">Pending</Badge>;
    case 'confirmed':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Confirmed</Badge>;
    case 'completed':
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Completed</Badge>;
    case 'cancelled':
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Cancelled</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

// Booking card component
const BookingCard = ({ 
  booking, 
  isPast = false,
  onCancel
}: { 
  booking: Booking, 
  isPast?: boolean,
  onCancel: (id: string) => void
}) => {
  // Create a date object from the booking date and start time
  const bookingDateTime = new Date(`${booking.date}T${booking.startTime}`);
  
  // Calculate end time based on duration
  const endDateTime = new Date(bookingDateTime.getTime() + booking.duration * 60 * 60 * 1000);
  
  // Format for display
  const start = {
    date: bookingDateTime.toLocaleDateString(),
    time: bookingDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    full: bookingDateTime.toLocaleString(),
  };
  
  const end = {
    date: endDateTime.toLocaleDateString(),
    time: endDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    full: endDateTime.toLocaleString(),
  };
  
  // Calculate cost
  const cost = booking.parking ? 
    (booking.parking.hourly_rate || booking.parking.feePerHour) * booking.duration : 0;
  
  return (
    <Card>
      <div className={`h-2 w-full ${isPast ? 'bg-muted' : 'bg-primary/80'}`}></div>
      <CardContent className="pt-6">
        <div className="flex justify-between">
          <div>
            <h3 className="font-medium">{booking.parking?.name || 'Unknown Parking'}</h3>
            <p className="text-sm text-muted-foreground flex items-center mt-1">
              <Map className="h-3 w-3 mr-1" /> {booking.parking?.location || 'Location not available'}
            </p>
          </div>
          <div>
            {getStatusBadge(booking.status)}
          </div>
        </div>
        
        <div className="border-t border-border mt-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Start</div>
              <div className="text-sm font-medium">
                {start.date}
              </div>
              <div className="text-sm flex items-center">
                <Clock className="h-3 w-3 mr-1" /> {start.time}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">End</div>
              <div className="text-sm font-medium">
                {end.date}
              </div>
              <div className="text-sm flex items-center">
                <Clock className="h-3 w-3 mr-1" /> {end.time}
              </div>
            </div>
          </div>
          
          <div className="mt-4 flex justify-between items-center">
            <div>
              <div className="text-xs text-muted-foreground">Duration</div>
              <div className="text-sm font-medium">
                {booking.duration} hours
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Cost</div>
              <div className="text-sm font-medium">
                ${cost.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
        
        {!isPast && booking.status !== 'cancelled' && (
          <div className="mt-4 pt-4 border-t flex justify-end gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-red-500">
                  <Ban className="h-3 w-3 mr-1" /> Cancel
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to cancel this booking? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Booking</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => onCancel(booking.id)}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    Yes, Cancel Booking
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button size="sm">
              <Check className="h-3 w-3 mr-1" /> View Details
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const UserBookings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('upcoming');
  
  // Fetch user bookings
  const { data: bookings, isLoading } = useQuery({
    queryKey: ['user-bookings', user?.id],
    queryFn: () => bookingApi.getUserBookings(user?.id || ''),
    enabled: !!user?.id,
  });
  
  // Cancel booking mutation
  const cancelBookingMutation = useMutation({
    mutationFn: (bookingId: string) => bookingApi.cancelBooking(bookingId),
    onSuccess: () => {
      toast.success('Booking cancelled successfully');
      queryClient.invalidateQueries({ queryKey: ['user-bookings'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to cancel booking');
    },
  });
  
  // Handle booking cancellation
  const handleCancelBooking = (bookingId: string) => {
    cancelBookingMutation.mutate(bookingId);
  };
  
  // Filter bookings based on status
  const filterBookings = (bookings: Booking[] = []) => {
    const now = new Date();
    
    const upcoming = bookings.filter(booking => {
      // Create a date from the booking date and time
      const bookingDate = new Date(`${booking.date}T${booking.startTime}`);
      // Add duration to get end time
      const endTime = new Date(bookingDate.getTime() + booking.duration * 60 * 60 * 1000);
      
      // Check if booking is in the future or ongoing and not cancelled
      return (bookingDate > now || endTime > now) && booking.status !== 'cancelled';
    });
    
    const past = bookings.filter(booking => {
      // Create a date from the booking date and time
      const bookingDate = new Date(`${booking.date}T${booking.startTime}`);
      // Add duration to get end time
      const endTime = new Date(bookingDate.getTime() + booking.duration * 60 * 60 * 1000);
      
      // Check if booking is in the past or cancelled
      return endTime <= now || booking.status === 'cancelled';
    });
    
    return { upcoming, past };
  };
  
  const { upcoming = [], past = [] } = bookings?.data ? filterBookings(bookings.data) : { upcoming: [], past: [] };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="font-semibold text-3xl">My Bookings</h1>
            <p className="text-muted-foreground">Manage your parking space reservations.</p>
          </div>
          <Button onClick={() => navigate('/user/book')}>Book New Parking</Button>
        </div>

        <Tabs defaultValue="upcoming" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-[400px] grid-cols-2 mb-6">
            <TabsTrigger value="upcoming">Upcoming & Active</TabsTrigger>
            <TabsTrigger value="past">Past Bookings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upcoming">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : upcoming.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcoming.map(booking => (
                  <BookingCard 
                    key={booking.id} 
                    booking={booking} 
                    onCancel={handleCancelBooking}
                  />
                ))}
              </div>
            ) : (
              <Card className="col-span-full p-8 text-center">
                <div className="mx-auto flex flex-col items-center">
                  <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-medium text-lg">No Upcoming Bookings</h3>
                  <p className="text-muted-foreground mb-4">
                    You don't have any active or upcoming parking reservations.
                  </p>
                  <Button onClick={() => navigate('/user/book')}>Book Parking Space</Button>
                </div>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="past">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : past.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {past.map(booking => (
                  <BookingCard 
                    key={booking.id} 
                    booking={booking} 
                    isPast={true}
                    onCancel={handleCancelBooking}
                  />
                ))}
              </div>
            ) : (
              <Card className="col-span-full p-8 text-center">
                <div className="mx-auto flex flex-col items-center">
                  <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-medium text-lg">No Past Bookings</h3>
                  <p className="text-muted-foreground mb-4">
                    You don't have any past parking reservations.
                  </p>
                </div>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default UserBookings;