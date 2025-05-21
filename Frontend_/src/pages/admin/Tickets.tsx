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
import { Loader2, Search, Calendar } from 'lucide-react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { ticketApi, parkingApi } from '@/services/api';
import { Ticket, Parking } from '@/types';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';

const TicketsPage: React.FC = () => {
  const [selectedParking, setSelectedParking] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const pageSize = 10;

  // Fetch all tickets
  const { data: tickets, isLoading: isLoadingTickets } = useQuery({
    queryKey: ['tickets', currentPage, searchQuery, selectedParking, startDate, endDate, minAmount, maxAmount],
    queryFn: () => ticketApi.getAllTickets({
      page: currentPage,
      limit: pageSize,
      plate: searchQuery,
      parkingId: selectedParking !== 'all' ? selectedParking : undefined,
      startDate: startDate ? format(startDate, 'yyyy-MM-dd') : undefined,
      endDate: endDate ? format(endDate, 'yyyy-MM-dd') : undefined,
      minAmount: minAmount ? parseFloat(minAmount) : undefined,
      maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
    }),
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

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedParking('all');
    setStartDate(undefined);
    setEndDate(undefined);
    setMinAmount('');
    setMaxAmount('');
    setCurrentPage(1);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Tickets Management</h1>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Tickets Filter</CardTitle>
            <CardDescription>Filter tickets by various criteria</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Parking</label>
                <Select value={selectedParking} onValueChange={handleParkingChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Parking" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Parkings</SelectItem>
                    {!isLoadingParkings && parkings?.data?.map((parking: Parking) => (
                      <SelectItem key={parking.id} value={parking.id}>
                        {parking.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Start Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">End Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Min Amount ($)</label>
                <Input
                  type="number"
                  placeholder="Min amount"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Max Amount ($)</label>
                <Input
                  type="number"
                  placeholder="Max amount"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Plate Number</label>
                <form onSubmit={handleSearch} className="flex gap-2">
                  <Input
                    placeholder="Search by plate number"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" size="icon">
                    <Search className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button variant="outline" onClick={handleResetFilters}>
                Reset Filters
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Tickets List</CardTitle>
            <CardDescription>
              Showing {tickets?.data?.length || 0} of {tickets?.totalItems || 0} tickets
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingTickets ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticket ID</TableHead>
                      <TableHead>Plate Number</TableHead>
                      <TableHead>Parking</TableHead>
                      <TableHead>Entry Time</TableHead>
                      <TableHead>Exit Time</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tickets?.data?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-4">
                          No tickets found
                        </TableCell>
                      </TableRow>
                    ) : (
                      tickets?.data?.map((ticket: Ticket) => (
                        <TableRow key={ticket.id}>
                          <TableCell className="font-medium">{ticket.id.substring(0, 8)}...</TableCell>
                          <TableCell>{ticket.plate_number}</TableCell>
                          <TableCell>{ticket.parking_name}</TableCell>
                          <TableCell>{ticket.entry_time ? format(new Date(ticket.entry_time), 'PPp') : 'N/A'}</TableCell>
                          <TableCell>
                            {ticket.exit_time 
                              ? format(new Date(ticket.exit_time), 'PPp') 
                              : 'Still Parked'}
                          </TableCell>
                          <TableCell>
                            {ticket.duration_hours 
                              ? `${Math.floor(ticket.duration_hours)}h ${Math.round((ticket.duration_hours % 1) * 60)}m` 
                              : 'N/A'}
                          </TableCell>
                          <TableCell>{ticket.amount ? formatCurrency(ticket.amount) : 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant={ticket.status === 'paid' ? "default" : ticket.status === 'pending' ? "secondary" : "outline"}>
                              {ticket.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                
                {/* Pagination */}
                {tickets && tickets.totalPages > 1 && (
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
                        {Array.from({ length: tickets.totalPages }, (_, i) => i + 1).map((page) => (
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
                        disabled={currentPage === tickets.totalPages}
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

export default TicketsPage;