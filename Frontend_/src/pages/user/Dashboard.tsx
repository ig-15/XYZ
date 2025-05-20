
import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatsCard from '@/components/dashboard/StatsCard';
import DataTable from '@/components/tables/DataTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { TableColumn } from '@/types';
import { 
  Car, 
  Map, 
  Calendar, 
  Plus 
} from 'lucide-react';

interface ParkingHistory {
  id: string;
  parking: string;
  entryTime: string;
  exitTime: string | null;
  duration: string;
  fee: number;
}

interface BookedSpace {
  id: string;
  parking: string;
  location: string;
  startTime: string;
  endTime: string;
  status: 'active' | 'pending' | 'completed';
}

const UserDashboard = () => {
  const navigate = useNavigate();

  // Mock stats
  const userStats = {
    totalBookings: 12,
    activeParkings: 1,
    registeredCars: 3,
    monthlySpending: 145.50,
  };

  // Mock data for parking history
  const parkingHistory: ParkingHistory[] = [
    {
      id: '1',
      parking: 'Downtown Parking',
      entryTime: '2025-05-15T10:30:00Z',
      exitTime: '2025-05-15T13:45:00Z',
      duration: '3h 15m',
      fee: 16.25,
    },
    {
      id: '2',
      parking: 'Mall Parking',
      entryTime: '2025-05-12T09:15:00Z',
      exitTime: '2025-05-12T11:30:00Z',
      duration: '2h 15m',
      fee: 11.25,
    },
    {
      id: '3',
      parking: 'Airport Parking',
      entryTime: '2025-05-08T18:00:00Z',
      exitTime: '2025-05-10T14:30:00Z',
      duration: '1d 20h 30m',
      fee: 94.50,
    },
  ];

  // Mock data for booked spaces
  const bookedSpaces: BookedSpace[] = [
    {
      id: '1',
      parking: 'Office Parking',
      location: 'Block A, Level 2',
      startTime: '2025-05-21T09:00:00Z',
      endTime: '2025-05-21T18:00:00Z',
      status: 'pending',
    }
  ];

  // Table columns for parking history
  const historyColumns: TableColumn<ParkingHistory>[] = [
    {
      header: 'Parking',
      accessorKey: 'parking',
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
  ];

  // Table columns for booked spaces
  const bookingColumns: TableColumn<BookedSpace>[] = [
    {
      header: 'Parking',
      accessorKey: 'parking',
    },
    {
      header: 'Location',
      accessorKey: 'location',
    },
    {
      header: 'Start Time',
      accessorKey: 'startTime',
      cell: ({ getValue }) => new Date(getValue() as string).toLocaleString(),
    },
    {
      header: 'End Time',
      accessorKey: 'endTime',
      cell: ({ getValue }) => new Date(getValue() as string).toLocaleString(),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ getValue }) => {
        const status = getValue() as string;
        const statusClasses = {
          active: 'bg-green-100 text-green-800',
          pending: 'bg-yellow-100 text-yellow-800',
          completed: 'bg-gray-100 text-gray-800',
        };
        
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClasses[status as keyof typeof statusClasses]}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        );
      },
    },
    {
      header: 'Actions',
      accessorKey: 'id',
      cell: () => (
        <Button variant="ghost" size="sm">
          View
        </Button>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="font-semibold text-3xl">User Dashboard</h1>
            <p className="text-muted-foreground">Manage your parking and bookings</p>
          </div>
          <Button onClick={() => navigate('/user/book')}>
            <Plus className="mr-2 h-4 w-4" />
            Book Parking Space
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Bookings"
            value={userStats.totalBookings}
            icon={<Calendar size={20} />}
            description="All time"
          />
          <StatsCard
            title="Active Parkings"
            value={userStats.activeParkings}
            icon={<Map size={20} />}
            description="Currently active"
          />
          <StatsCard
            title="Registered Cars"
            value={userStats.registeredCars}
            icon={<Car size={20} />}
            description="In your account"
          />
          <StatsCard
            title="Monthly Spending"
            value={`$${userStats.monthlySpending}`}
            description="This month"
          />
        </div>

        {/* Booked Spaces */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Upcoming & Active Bookings</CardTitle>
            <Button variant="outline" size="sm" onClick={() => navigate('/user/book')}>
              Book New Space
            </Button>
          </CardHeader>
          <CardContent>
            <DataTable
              data={bookedSpaces}
              columns={bookingColumns}
              emptyMessage="No active or upcoming bookings"
            />
          </CardContent>
        </Card>

        {/* Recent Parking History */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Recent Parking History</CardTitle>
            <Button variant="outline" size="sm" onClick={() => navigate('/user/history')}>
              View All History
            </Button>
          </CardHeader>
          <CardContent>
            <DataTable
              data={parkingHistory}
              columns={historyColumns}
              emptyMessage="No parking history available"
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default UserDashboard;
