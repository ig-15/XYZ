import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatsCard from '@/components/dashboard/StatsCard';
import DataTable from '@/components/tables/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TableColumn, Entry } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { entryApi } from '@/services/api';
import { Car, Clock, ArrowRight, X } from 'lucide-react';

const AttendantDashboard = () => {
  const [view, setView] = useState<'active' | 'completed' | 'all'>('active');
  
  // Fetch entries
  const { data: entries, isLoading: isLoadingEntries } = useQuery({
    queryKey: ['entries'],
    queryFn: entryApi.getAll,
  });
  
  // Filter entries based on view
  const filteredEntries = entries?.filter((entry) => {
    if (view === 'active') return entry.exitTime === null;
    if (view === 'completed') return entry.exitTime !== null;
    return true; // 'all' view
  }) || [];

  const activeCount = entries?.filter((entry) => entry.exitTime === null).length || 0;
  const completedCount = entries?.filter((entry) => entry.exitTime !== null).length || 0;
  
  // Table columns
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
      header: 'Status',
      accessorKey: 'exitTime',
      cell: ({ getValue, row }) => {
        const exitTime = getValue() as string | null;
        
        if (!exitTime) {
          return (
            <Badge variant="outline" className="bg-green-500/10 text-green-500">
              Active
            </Badge>
          );
        }
        
        return (
          <Badge variant="outline" className="bg-muted text-muted-foreground">
            Completed
          </Badge>
        );
      },
    },
    {
      header: 'Duration',
      accessorKey: 'entryTime',
      cell: ({ getValue, row }) => {
        const entryTime = new Date(getValue() as string);
        const exitTime = row.original.exitTime ? new Date(row.original.exitTime) : new Date();
        
        // Calculate duration
        const durationMs = exitTime.getTime() - entryTime.getTime();
        const hours = Math.floor(durationMs / (1000 * 60 * 60));
        const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
        
        return `${hours}h ${minutes}m`;
      },
    },
    {
      header: 'Amount',
      accessorKey: 'chargedAmount',
      cell: ({ getValue }) => `$${getValue()}`,
    },
    {
      header: 'Actions',
      accessorKey: 'id',
      cell: ({ getValue, row }) => {
        const id = getValue() as string;
        const exitTime = row.original.exitTime;
        
        if (!exitTime) {
          return (
            <Button size="sm" variant="outline" className="flex items-center gap-1">
              <Clock size={14} /> Register Exit
            </Button>
          );
        }
        
        return (
          <Button size="sm" variant="outline" disabled className="flex items-center gap-1 opacity-50">
            <X size={14} /> Completed
          </Button>
        );
      },
    },
  ];
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-semibold text-3xl">Attendant Dashboard</h1>
          <p className="text-muted-foreground">Manage parking entries and exits.</p>
        </div>
        
        {/* Filter Buttons */}
        <div className="flex items-center space-x-2">
          <Button
            variant={view === 'active' ? 'default' : 'outline'}
            onClick={() => setView('active')}
          >
            Active <Badge className="ml-2">{activeCount}</Badge>
          </Button>
          <Button
            variant={view === 'completed' ? 'default' : 'outline'}
            onClick={() => setView('completed')}
          >
            Completed <Badge className="ml-2">{completedCount}</Badge>
          </Button>
          <Button
            variant={view === 'all' ? 'default' : 'outline'}
            onClick={() => setView('all')}
          >
            All <Badge className="ml-2">{entries?.length || 0}</Badge>
          </Button>
        </div>
        
        {/* Recent Entries Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Entries & Exits</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={filteredEntries}
              columns={entryColumns}
              isLoading={isLoadingEntries}
              emptyMessage="No recent entries or exits"
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AttendantDashboard;
