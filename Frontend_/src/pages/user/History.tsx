
import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import DataTable from '@/components/tables/DataTable';
import { TableColumn } from '@/types';
import { Calendar, Download, Search } from 'lucide-react';

// Mock data for parking history
const parkingHistory = [
  {
    id: '1',
    parking: 'Downtown Parking',
    entryTime: '2025-05-15T10:30:00Z',
    exitTime: '2025-05-15T13:45:00Z',
    duration: '3h 15m',
    fee: 16.25,
    vehiclePlate: 'ABC1234',
  },
  {
    id: '2',
    parking: 'Mall Parking',
    entryTime: '2025-05-12T09:15:00Z',
    exitTime: '2025-05-12T11:30:00Z',
    duration: '2h 15m',
    fee: 11.25,
    vehiclePlate: 'ABC1234',
  },
  {
    id: '3',
    parking: 'Airport Parking',
    entryTime: '2025-05-08T18:00:00Z',
    exitTime: '2025-05-10T14:30:00Z',
    duration: '1d 20h 30m',
    fee: 94.50,
    vehiclePlate: 'XYZ7890',
  },
  {
    id: '4',
    parking: 'City Center Parking',
    entryTime: '2025-05-05T10:00:00Z',
    exitTime: '2025-05-05T12:00:00Z',
    duration: '2h',
    fee: 6.50,
    vehiclePlate: 'XYZ7890',
  },
  {
    id: '5',
    parking: 'Hospital Parking',
    entryTime: '2025-05-01T14:30:00Z',
    exitTime: '2025-05-01T16:15:00Z',
    duration: '1h 45m',
    fee: 5.25,
    vehiclePlate: 'ABC1234',
  },
];

const UserHistory = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filteredHistory, setFilteredHistory] = useState(parkingHistory);

  // Table columns
  const columns: TableColumn<any>[] = [
    {
      header: 'Parking',
      accessorKey: 'parking',
    },
    {
      header: 'Vehicle',
      accessorKey: 'vehiclePlate',
    },
    {
      header: 'Entry Time',
      accessorKey: 'entryTime',
      cell: ({ getValue }) => new Date(getValue() as string).toLocaleString(),
    },
    {
      header: 'Exit Time',
      accessorKey: 'exitTime',
      cell: ({ getValue }) => {
        const value = getValue() as string | null;
        return value ? new Date(value).toLocaleString() : 'Still Parked';
      },
    },
    {
      header: 'Duration',
      accessorKey: 'duration',
    },
    {
      header: 'Fee',
      accessorKey: 'fee',
      cell: ({ getValue }) => `$${getValue()}`,
    },
    {
      header: '',
      accessorKey: 'id',
      cell: () => (
        <Button variant="ghost" size="sm" className="flex items-center gap-1">
          <Download className="h-4 w-4" /> Receipt
        </Button>
      ),
    },
  ];

  const handleSearch = () => {
    if (!startDate && !endDate) {
      setFilteredHistory(parkingHistory);
      return;
    }
    
    const filtered = parkingHistory.filter((item) => {
      const entryDate = new Date(item.entryTime);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      
      if (start && end) {
        return entryDate >= start && entryDate <= end;
      } else if (start) {
        return entryDate >= start;
      } else if (end) {
        return entryDate <= end;
      }
      return true;
    });
    
    setFilteredHistory(filtered);
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setFilteredHistory(parkingHistory);
  };

  // Calculate total spend
  const totalSpend = filteredHistory.reduce((sum, item) => sum + item.fee, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-semibold text-3xl">Parking History</h1>
          <p className="text-muted-foreground">View your past parking records and receipts.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Search & Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="space-y-2 flex-1">
                <label className="text-sm font-medium">Start Date</label>
                <Input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2 flex-1">
                <label className="text-sm font-medium">End Date</label>
                <Input 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSearch} className="flex-1 md:flex-none">
                  <Search className="h-4 w-4 mr-2" /> Search
                </Button>
                <Button variant="outline" onClick={clearFilters}>
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" /> Parking Records
            </CardTitle>
            <div className="bg-muted/30 px-3 py-1 rounded-md text-sm">
              Total Spent: <span className="font-medium">${totalSpend.toFixed(2)}</span>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable 
              data={filteredHistory} 
              columns={columns}
              searchKey="parking"
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default UserHistory;