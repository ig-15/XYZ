
import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { carApi, parkingApi, entryApi } from '@/services/api';
import { toast } from '@/components/ui/sonner';
import { Car, ArrowRight, Map } from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const RegisterEntryExit = () => {
  const queryClient = useQueryClient();
  const [plateNumber, setPlateNumber] = useState('');
  const [selectedParkingId, setSelectedParkingId] = useState('');
  const [exitEntryId, setExitEntryId] = useState('');

  // Fetch parkings
  const { data: parkings } = useQuery({
    queryKey: ['parkings'],
    queryFn: parkingApi.getAll,
  });

  // Fetch active entries
  const { data: entries } = useQuery({
    queryKey: ['activeEntries'],
    queryFn: entryApi.getAll,
  });

  // Filter for active entries (no exit time)
  const activeEntries = entries?.filter(entry => entry.exitTime === null) || [];

  // Car lookup mutation
  const carLookupMutation = useMutation({
    mutationFn: carApi.getByPlateNumber,
    onSuccess: () => {
      toast.success('Car found in the system');
    },
    onError: () => {
      toast.error('Car not found. Please ask the user to register the vehicle first.');
    }
  });

  // Register car entry mutation
  const registerEntryMutation = useMutation({
    mutationFn: (data: { carId: string; parkingId: string }) => 
      entryApi.registerEntry(data.carId, data.parkingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeEntries'] });
      queryClient.invalidateQueries({ queryKey: ['parkings'] });
      setPlateNumber('');
      setSelectedParkingId('');
      toast.success('Entry registered successfully');
    },
  });

  // Register exit mutation
  const registerExitMutation = useMutation({
    mutationFn: entryApi.registerExit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activeEntries'] });
      queryClient.invalidateQueries({ queryKey: ['parkings'] });
      setExitEntryId('');
      toast.success('Exit registered successfully');
    },
  });

  const handleCarLookup = () => {
    if (!plateNumber.trim()) {
      toast.error('Please enter a plate number');
      return;
    }
    carLookupMutation.mutate(plateNumber);
  };

  const handleRegisterEntry = async () => {
    if (!plateNumber.trim() || !selectedParkingId) {
      toast.error('Please enter a plate number and select a parking space');
      return;
    }

    try {
      // First, look up the car
      const car = await carApi.getByPlateNumber(plateNumber);
      
      // Then, register the entry
      registerEntryMutation.mutate({
        carId: car.id,
        parkingId: selectedParkingId,
      });
    } catch (error) {
      toast.error('Failed to register entry. Make sure the car is registered in the system.');
    }
  };

  const handleRegisterExit = () => {
    if (!exitEntryId) {
      toast.error('Please select an entry to register exit');
      return;
    }
    registerExitMutation.mutate(exitEntryId);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-semibold text-3xl">Register Entry & Exit</h1>
          <p className="text-muted-foreground">Record vehicle movements in the parking system.</p>
        </div>
        
        <Tabs defaultValue="entry" className="w-full">
          <TabsList className="grid grid-cols-2 w-[400px] mb-4">
            <TabsTrigger value="entry">Register Entry</TabsTrigger>
            <TabsTrigger value="exit">Register Exit</TabsTrigger>
          </TabsList>
          
          <TabsContent value="entry">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" /> Register Vehicle Entry
                </CardTitle>
              </CardHeader>
              <CardContent className="max-w-xl">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="plateNumber">Vehicle Plate Number</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="plateNumber" 
                        placeholder="Enter plate number" 
                        value={plateNumber}
                        onChange={(e) => setPlateNumber(e.target.value)}
                      />
                      <Button 
                        variant="outline" 
                        onClick={handleCarLookup}
                        disabled={carLookupMutation.isPending || !plateNumber.trim()}
                      >
                        Verify
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="parkingSpace">Parking Space</Label>
                    <Select 
                      value={selectedParkingId} 
                      onValueChange={setSelectedParkingId}
                    >
                      <SelectTrigger id="parkingSpace">
                        <SelectValue placeholder="Select parking space" />
                      </SelectTrigger>
                      <SelectContent>
                        {parkings?.map((parking) => (
                          <SelectItem 
                            key={parking.id} 
                            value={parking.id}
                            disabled={parking.availableSpaces <= 0}
                          >
                            {parking.name} ({parking.availableSpaces} spaces available)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button 
                    className="w-full" 
                    onClick={handleRegisterEntry}
                    disabled={registerEntryMutation.isPending || !plateNumber.trim() || !selectedParkingId}
                  >
                    {registerEntryMutation.isPending ? 'Processing...' : 'Register Entry'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="exit">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowRight className="h-5 w-5" /> Register Vehicle Exit
                </CardTitle>
              </CardHeader>
              <CardContent className="max-w-xl">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="entryId">Select Active Entry</Label>
                    <Select 
                      value={exitEntryId} 
                      onValueChange={setExitEntryId}
                    >
                      <SelectTrigger id="entryId">
                        <SelectValue placeholder="Select vehicle entry" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeEntries.map((entry) => (
                          <SelectItem key={entry.id} value={entry.id}>
                            {entry.car?.plateNumber} - {entry.parking?.name} ({new Date(entry.entryTime).toLocaleString()})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button 
                    className="w-full" 
                    onClick={handleRegisterExit}
                    disabled={registerExitMutation.isPending || !exitEntryId}
                  >
                    {registerExitMutation.isPending ? 'Processing...' : 'Register Exit'}
                  </Button>
                  
                  {activeEntries.length === 0 && (
                    <div className="text-center p-4 border rounded-md bg-muted/30">
                      <Map className="h-12 w-12 mx-auto text-muted-foreground" />
                      <p className="mt-2 text-muted-foreground">No active entries found</p>
                      <p className="text-sm text-muted-foreground">All vehicles have been checked out.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default RegisterEntryExit;