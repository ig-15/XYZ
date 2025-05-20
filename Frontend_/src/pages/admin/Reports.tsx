import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
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
import { Loader2, Calendar, Download, FileText, BarChart, PieChart } from 'lucide-react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { reportApi, parkingApi } from '@/services/api';
import { Parking, Log, Entry } from '@/types';
import { format, subDays } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart as BarChartComponent,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as PieChartComponent,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B6B'];

const ReportsPage: React.FC = () => {
  const [reportType, setReportType] = useState<string>('entries');
  const [selectedParking, setSelectedParking] = useState<string>('all');
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Fetch all parking spaces
  const { data: parkings, isLoading: isLoadingParkings } = useQuery({
    queryKey: ['parkings'],
    queryFn: () => parkingApi.getAllParkings(),
  });

  // Fetch logs
  const { data: logs, isLoading: isLoadingLogs } = useQuery({
    queryKey: ['logs', currentPage, startDate, endDate],
    queryFn: () => reportApi.getLogs({
      page: currentPage,
      limit: pageSize,
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
    }),
    enabled: reportType === 'logs',
  });

  // Fetch entries report
  const { data: entriesReport, isLoading: isLoadingEntries } = useQuery({
    queryKey: ['entries-report', startDate, endDate, selectedParking],
    queryFn: () => reportApi.getEntriesReport({
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
      parkingId: selectedParking !== 'all' ? selectedParking : undefined,
    }),
    enabled: reportType === 'entries',
  });

  // Fetch exits report
  const { data: exitsReport, isLoading: isLoadingExits } = useQuery({
    queryKey: ['exits-report', startDate, endDate, selectedParking],
    queryFn: () => reportApi.getExitsReport({
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
      parkingId: selectedParking !== 'all' ? selectedParking : undefined,
    }),
    enabled: reportType === 'exits',
  });

  // Fetch revenue report
  const { data: revenueReport, isLoading: isLoadingRevenue } = useQuery({
    queryKey: ['revenue-report', startDate, endDate, selectedParking],
    queryFn: () => reportApi.getRevenueReport({
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
      parkingId: selectedParking !== 'all' ? selectedParking : undefined,
    }),
    enabled: reportType === 'revenue',
  });

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleParkingChange = (value: string) => {
    setSelectedParking(value);
  };

  const handleExportReport = () => {
    let exportData;
    let filename;
    
    switch (reportType) {
      case 'logs':
        exportData = logs?.data;
        filename = 'logs-report';
        break;
      case 'entries':
        exportData = entriesReport?.data;
        filename = 'entries-report';
        break;
      case 'exits':
        exportData = exitsReport?.data;
        filename = 'exits-report';
        break;
      case 'revenue':
        exportData = revenueReport?.data;
        filename = 'revenue-report';
        break;
      default:
        exportData = [];
        filename = 'report';
    }
    
    if (exportData) {
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}-${format(startDate, 'yyyy-MM-dd')}-to-${format(endDate, 'yyyy-MM-dd')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const renderLogsTable = () => {
    return (
      <div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs?.data?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4">
                  No logs found
                </TableCell>
              </TableRow>
            ) : (
              logs?.data?.map((log: any) => (
                <TableRow key={log.id}>
                  <TableCell>{format(new Date(log.timestamp), 'PPp')}</TableCell>
                  <TableCell>
                    <Badge variant={
                      log.action === 'entry' ? "default" : 
                      log.action === 'exit' ? "secondary" : 
                      log.action === 'payment' ? "success" : 
                      "outline"
                    }>
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell>{log.user?.firstname} {log.user?.lastname}</TableCell>
                  <TableCell>{log.description}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        
        {/* Pagination */}
        {logs?.pagination && (
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
                {Array.from({ length: logs.pagination.totalPages }, (_, i) => i + 1).map((page) => (
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
                disabled={currentPage === logs.pagination.totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderEntriesReport = () => {
    if (!entriesReport?.data) return null;
    
    const entries = entriesReport.data.filter((entry: any) => entry.status === 'active');
    const chartData = entries.reduce((acc: any[], entry: any) => {
      const date = format(new Date(entry.entry_time), 'MMM dd');
      const existing = acc.find(item => item.date === date);
      if (existing) {
        existing.entries++;
      } else {
        acc.push({ date, entries: 1 });
      }
      return acc;
    }, []);
    
    const parkingDistribution = entries.reduce((acc: any, entry: any) => {
      acc[entry.parking_name] = (acc[entry.parking_name] || 0) + 1;
      return acc;
    }, {});
    
    const pieData = Object.entries(parkingDistribution).map(([name, value]) => ({
      name,
      value
    }));

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{entries.length}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Unique Cars</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {new Set(entries.map((entry: any) => entry.plate_number)).size}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Average Daily Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {(entries.length / chartData.length).toFixed(1)}
              </p>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Daily Entries</CardTitle>
            <CardDescription>Number of car entries per day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChartComponent
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="entries" fill="#8884d8" name="Entries" />
                </BarChartComponent>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Entries by Parking Lot</CardTitle>
            <CardDescription>Distribution of entries across parking lots</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChartComponent>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} entries`, 'Count']} />
                </PieChartComponent>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Entries</CardTitle>
            <CardDescription>Latest car entries in the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Plate Number</TableHead>
                  <TableHead>Parking</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4">
                      No entries found
                    </TableCell>
                  </TableRow>
                ) : (
                  entries.slice(0, 10).map((entry: any) => (
                    <TableRow key={entry.id}>
                      <TableCell>{format(new Date(entry.entry_time), 'PPp')}</TableCell>
                      <TableCell>{entry.plate_number}</TableCell>
                      <TableCell>{entry.parking_name}</TableCell>
                      <TableCell>
                        <Badge variant={entry.status === 'active' ? 'default' : 'secondary'}>
                          {entry.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderExitsReport = () => {
    if (!exitsReport?.data) return null;
    
    const exits = exitsReport.data.filter((exit: any) => exit.status === 'completed');
    const chartData = exits.reduce((acc: any[], exit: any) => {
      const date = format(new Date(exit.exit_time), 'MMM dd');
      const existing = acc.find(item => item.date === date);
      if (existing) {
        existing.exits++;
      } else {
        acc.push({ date, exits: 1 });
      }
      return acc;
    }, []);
    
    const totalRevenue = exits.reduce((sum: number, exit: any) => sum + (exit.charged_amount || 0), 0);
    const totalDuration = exits.reduce((sum: number, exit: any) => sum + (exit.duration_hours || 0), 0);

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Exits</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{exits.length}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{formatCurrency(totalRevenue)}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Average Stay Duration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {Math.floor(totalDuration / exits.length)}h {Math.round(((totalDuration / exits.length) % 1) * 60)}m
              </p>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Daily Exits</CardTitle>
            <CardDescription>Number of car exits per day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChartComponent
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="exits" fill="#82ca9d" name="Exits" />
                </BarChartComponent>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Exits</CardTitle>
            <CardDescription>Latest car exits in the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exit Time</TableHead>
                  <TableHead>Plate Number</TableHead>
                  <TableHead>Parking</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      No exits found
                    </TableCell>
                  </TableRow>
                ) : (
                  exits.slice(0, 10).map((exit: any) => (
                    <TableRow key={exit.id}>
                      <TableCell>{format(new Date(exit.exit_time), 'PPp')}</TableCell>
                      <TableCell>{exit.plate_number}</TableCell>
                      <TableCell>{exit.parking_name}</TableCell>
                      <TableCell>
                        {Math.floor(exit.duration_hours)}h {Math.round((exit.duration_hours % 1) * 60)}m
                      </TableCell>
                      <TableCell>{formatCurrency(exit.charged_amount)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderRevenueReport = () => {
    if (!revenueReport?.data) return null;
    
    const chartData = revenueReport.data.map((stat: any) => ({
      date: format(new Date(stat.date), 'MMM dd'),
      revenue: parseFloat(stat.total_revenue)
    }));
    
    const totalRevenue = chartData.reduce((sum: number, item: any) => sum + item.revenue, 0);
    const avgDailyRevenue = totalRevenue / chartData.length;
    const totalTransactions = revenueReport.data.reduce((sum: number, stat: any) => sum + parseInt(stat.total_entries), 0);

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{formatCurrency(totalRevenue)}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Average Daily Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{formatCurrency(avgDailyRevenue)}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{totalTransactions}</p>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Daily Revenue</CardTitle>
            <CardDescription>Revenue collected per day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChartComponent
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis tickFormatter={(value) => `$${value}`} />
                  <Tooltip formatter={(value) => [formatCurrency(value as number), 'Revenue']} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#FF8042" name="Revenue" />
                </BarChartComponent>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Parking Lot Revenue</CardTitle>
            <CardDescription>Revenue by parking lot</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Parking Lot</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Transactions</TableHead>
                  <TableHead>Average per Transaction</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {revenueReport.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4">
                      No revenue data found
                    </TableCell>
                  </TableRow>
                ) : (
                  revenueReport.data.map((item: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell>{item.parking_name}</TableCell>
                      <TableCell>{formatCurrency(parseFloat(item.total_revenue))}</TableCell>
                      <TableCell>{item.total_entries}</TableCell>
                      <TableCell>{formatCurrency(parseFloat(item.avg_revenue))}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderReportContent = () => {
    switch (reportType) {
      case 'logs':
        return isLoadingLogs ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : renderLogsTable();
      case 'entries':
        return isLoadingEntries ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : renderEntriesReport();
      case 'exits':
        return isLoadingExits ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : renderExitsReport();
      case 'revenue':
        return isLoadingRevenue ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : renderRevenueReport();
      default:
        return null;
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Reports</h1>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Report Settings</CardTitle>
            <CardDescription>Configure report parameters</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Report Type</label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Report Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="logs">System Logs</SelectItem>
                    <SelectItem value="entries">Car Entries</SelectItem>
                    <SelectItem value="exits">Car Exits</SelectItem>
                    <SelectItem value="revenue">Revenue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Parking</label>
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
                      onSelect={(date) => date && setStartDate(date)}
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
                      onSelect={(date) => date && setEndDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button onClick={handleExportReport}>
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>
              {reportType === 'logs' && 'System Logs'}
              {reportType === 'entries' && 'Car Entries Report'}
              {reportType === 'exits' && 'Car Exits Report'}
              {reportType === 'revenue' && 'Revenue Report'}
            </CardTitle>
            <CardDescription>
              {format(startDate, 'PPP')} to {format(endDate, 'PPP')}
              {selectedParking !== 'all' && parkings?.data 
                ? ` for ${parkings.data.find((p: Parking) => p.id === selectedParking)?.name || 'selected parking'}`
                : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderReportContent()}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default ReportsPage;
