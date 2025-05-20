import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
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
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search } from 'lucide-react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { carApi, parkingApi } from '@/services/api';
import { Car, Parking } from '@/types';

const CarsPage: React.FC = () => {
  const [selectedParking, setSelectedParking] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Fetch all cars
  const { data: cars, isLoading: isLoadingCars } = useQuery({
    queryKey: ['cars', currentPage, searchQuery, selectedParking],
    queryFn: () => carApi.getAllCars(currentPage, pageSize, searchQuery, selectedParking !== 'all' ? selectedParking : undefined),
  });

  // Fetch all parking spaces
  const { data: parkings, isLoading: isLoadingParkings } = useQuery({
    queryKey: ['parkings'],
    queryFn: () => parkingApi.getAllParkings(),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleParkingChange = (value: string) => {
    setSelectedParking(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Cars Management</h1>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Cars Filter</CardTitle>
            <CardDescription>Filter cars by parking lot or search by plate number</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="w-full md:w-1/3">
                <Select value={selectedParking} onValueChange={handleParkingChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Parking" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Parkings</SelectItem>
                    {parkings?.data.map((parking: Parking) => (
                      <SelectItem key={parking.id} value={parking.id}>
                        {parking.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <form onSubmit={handleSearch} className="flex w-full md:w-2/3 gap-2">
                <Input
                  placeholder="Search by plate number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Cars List</CardTitle>
            <CardDescription>
              {selectedParking !== 'all' 
                ? `Cars in ${parkings?.data.find((p: Parking) => p.id === selectedParking)?.name || 'selected parking'}`
                : 'All cars across all parking lots'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingCars || isLoadingParkings ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plate Number</TableHead>
                      <TableHead>Make</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Color</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Parking</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cars?.data.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4">
                          No cars found
                        </TableCell>
                      </TableRow>
                    ) : (
                      cars?.data.map((car: Car) => (
                        <TableRow key={car.id}>
                          <TableCell className="font-medium">{car.plate_number}</TableCell>
                          <TableCell>{car.make}</TableCell>
                          <TableCell>{car.model}</TableCell>
                          <TableCell>{car.color}</TableCell>
                          <TableCell>{car.owner_name || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant={car.is_parked ? "default" : "outline"}>
                              {car.is_parked ? 'Parked' : 'Not Parked'}
                            </Badge>
                          </TableCell>
                          <TableCell>{car.last_parking_name || 'N/A'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                
                {/* Pagination */}
                {cars && cars.totalPages > 1 && (
                  <div className="flex justify-center mt-6">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <div className="flex items-center gap-2">
                        {Array.from({ length: cars.totalPages }, (_, i) => i + 1).map((page) => (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            onClick={() => handlePageChange(page)}
                            className="w-10 h-10 p-0"
                          >
                            {page}
                          </Button>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === cars.totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default CarsPage;
