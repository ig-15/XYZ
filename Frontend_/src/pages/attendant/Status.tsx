
import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { parkingApi } from '@/services/api';
import { Parking } from '@/types';
import { 
  Map, 
  Car,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';

const ParkingStatus = () => {
  const [selectedParkingId, setSelectedParkingId] = useState<string>('');

  // Fetch all parking spaces
  const { data: parkings, isLoading } = useQuery({
    queryKey: ['parkings'],
    queryFn: parkingApi.getAll,
  });

  // Get selected parking details
  const selectedParking = selectedParkingId 
    ? parkings?.find(parking => parking.id === selectedParkingId) 
    : parkings?.[0];

  // Calculate occupancy percentage
  const getOccupancyPercentage = (parking?: Parking) => {
    if (!parking) return 0;
    const occupied = parking.totalSpaces - parking.availableSpaces;
    return Math.round((occupied / parking.totalSpaces) * 100);
  };

  // Get occupancy status text and color
  const getOccupancyStatus = (percentage: number) => {
    if (percentage >= 90) {
      return {
        text: 'Critical',
        color: 'text-red-500',
        progressColor: 'bg-red-500'
      };
    } else if (percentage >= 70) {
      return {
        text: 'High',
        color: 'text-amber-500',
        progressColor: 'bg-amber-500'
      };
    } else if (percentage >= 40) {
      return {
        text: 'Moderate',
        color: 'text-blue-500',
        progressColor: 'bg-blue-500'
      };
    } else {
      return {
        text: 'Low',
        color: 'text-green-500',
        progressColor: 'bg-green-500'
      };
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-semibold text-3xl">Parking Status</h1>
          <p className="text-muted-foreground">View real-time status of parking spaces.</p>
        </div>

        <div className="space-y-6">
          <div className="max-w-xs">
            <Select
              value={selectedParkingId || (parkings?.[0]?.id || '')}
              onValueChange={setSelectedParkingId}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select parking location" />
              </SelectTrigger>
              <SelectContent>
                {parkings?.map((parking) => (
                  <SelectItem key={parking.id} value={parking.id}>
                    {parking.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedParking && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Map className="h-5 w-5" /> {selectedParking.name} Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-4 border rounded-lg bg-muted/30">
                      <div className="text-sm text-muted-foreground">Location</div>
                      <div className="text-2xl font-semibold mt-1">{selectedParking.location}</div>
                    </div>
                    <div className="p-4 border rounded-lg bg-muted/30">
                      <div className="text-sm text-muted-foreground">Total Spaces</div>
                      <div className="text-2xl font-semibold mt-1">{selectedParking.totalSpaces}</div>
                    </div>
                    <div className="p-4 border rounded-lg bg-muted/30">
                      <div className="text-sm text-muted-foreground">Parking Fee</div>
                      <div className="text-2xl font-semibold mt-1">${selectedParking.feePerHour}/hr</div>
                    </div>
                  </div>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium">Current Occupancy</h3>
                          {(() => {
                            const percentage = getOccupancyPercentage(selectedParking);
                            const status = getOccupancyStatus(percentage);
                            return (
                              <span className={`font-medium ${status.color}`}>
                                {status.text} ({percentage}%)
                              </span>
                            );
                          })()}
                        </div>

                        <Progress 
                          value={getOccupancyPercentage(selectedParking)} 
                          className="h-2"
                        />

                        <div className="flex justify-between text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Car className="h-4 w-4" />
                            <span>
                              {selectedParking.totalSpaces - selectedParking.availableSpaces} occupied
                            </span>
                          </div>
                          <div>
                            {selectedParking.availableSpaces} available
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Visualization of parking spaces */}
                    {Array.from({ length: selectedParking.totalSpaces }).map((_, index) => {
                      const isOccupied = index < (selectedParking.totalSpaces - selectedParking.availableSpaces);
                      return (
                        <div
                          key={index}
                          className={`h-24 rounded-md flex items-center justify-center ${
                            isOccupied 
                              ? 'bg-muted border-2 border-muted-foreground/20' 
                              : 'bg-green-100 border-2 border-green-200'
                          }`}
                        >
                          <div className="text-center">
                            <div className="font-medium">{`Slot ${index + 1}`}</div>
                            <div className={`text-sm ${isOccupied ? 'text-muted-foreground' : 'text-green-600'}`}>
                              {isOccupied ? 'Occupied' : 'Available'}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {isLoading && (
            <div className="text-center py-12">Loading parking information...</div>
          )}

          {!isLoading && !parkings?.length && (
            <div className="text-center py-12 border rounded-lg bg-muted/30">
              <Map className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No Parking Spaces Available</h3>
              <p className="text-muted-foreground">No parking spaces have been configured in the system.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ParkingStatus;