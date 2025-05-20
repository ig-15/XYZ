import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layouts/AdminLayout';
import StatsCard from '@/components/dashboard/StatsCard';
import DataTable from '@/components/tables/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Car,
  Map,
  Users,
  Ticket,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi, parkingApi, entryApi } from '@/services/api';
import { DashboardStats, Parking, Entry, TableColumn } from '@/types';

const AdminDashboard = () => {
  // Fetch dashboard statistics
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['adminStats'],
    queryFn: dashboardApi.getAdminStats,
  });

  // Fetch recent parkings
  const { data: parkings, isLoading: isLoadingParkings } = useQuery({
    queryKey: ['parkings'],
    queryFn: parkingApi.getAll,
  });

  // Fetch recent entries
  const { data: entries, isLoading: isLoadingEntries } = useQuery({
    queryKey: ['entries'],
    queryFn: entryApi.getAll,
  });

  // Table columns for parkings
  const parkingColumns: TableColumn<Parking>[] = [
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
      header: 'Spaces',
      accessorKey: 'totalSpaces',
    },
    {
      header: 'Available',
      accessorKey: 'availableSpaces',
      cell: (info) => {
        const value = info.getValue() as number;
        const total = info.row.original.totalSpaces;
        const percentage = Math.round((value / total) * 100);
        let colorClass = 'text-green-500';
        
        if (percentage < 20) {
          colorClass = 'text-red-500';
        } else if (percentage < 50) {
          colorClass = 'text-amber-500';
        }
        
        return (
          <div className="flex items-center">
            <span className={colorClass}>{value}</span>
            <span className="text-muted-foreground ml-2">({percentage}%)</span>
          </div>
        );
      },
    },
    {
      header: 'Fee ($/hr)',
      accessorKey: 'feePerHour',
      cell: ({ getValue }) => `$${getValue()}`,
    },
  ];

  // Table columns for entries
  const entryColumns: TableColumn<Entry>[] = [
    {
      header: 'Car Plate',
      accessorKey: 'car',
      cell: ({ row }) => row.original.car?.plateNumber || 'N/A',
    },
    {
      header: 'Parking',
      accessorKey: 'parking',
      cell: ({ row }) => row.original.parking?.name || 'N/A',
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
      header: 'Amount',
      accessorKey: 'chargedAmount',
      cell: ({ getValue }) => `$${getValue()}`,
    },
  ];

  const mockStats: DashboardStats = {
    totalParkings: 8,
    totalAttendants: 12,
    totalRevenue: 28450,
    occupancyRate: 68,
  };

  // Use mock data if API fails or during development
  const displayStats = stats || mockStats;
  const displayParkings = parkings || [];
  const displayEntries = entries || [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-semibold text-3xl">Admin Dashboard</h1>
          <p className="text-muted-foreground">Welcome to the XYZ Parking management system.</p>
        </div>
        
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Parking Spaces"
            value={displayStats.totalParkings}
            icon={<Map size={20} />}
            description="Across all locations"
          />
          <StatsCard
            title="Parking Attendants"
            value={displayStats.totalAttendants}
            icon={<Users size={20} />}
            description="Active employees"
          />
          <StatsCard
            title="Current Occupancy"
            value={`${displayStats.occupancyRate}%`}
            icon={<Car size={20} />}
            trend={{ value: 12, isPositive: true }}
            description="From last week"
          />
          <StatsCard
            title="Monthly Revenue"
            value={`$${displayStats.totalRevenue.toLocaleString()}`}
            icon={<Ticket size={20} />}
            trend={{ value: 8, isPositive: true }}
            description="From last month"
          />
        </div>
        
        {/* Parking Spaces Table */}
        <Card>
          <CardHeader>
            <CardTitle>Parking Spaces Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={displayParkings}
              columns={parkingColumns}
              searchKey="name"
              isLoading={isLoadingParkings}
            />
          </CardContent>
        </Card>
        
        {/* Recent Entries Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Entries & Exits</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={displayEntries}
              columns={entryColumns}
              isLoading={isLoadingEntries}
              emptyMessage="No recent entries or exits"
            />
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
