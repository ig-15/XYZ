import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { format } from 'date-fns';
import api from '@/lib/api';

interface Ticket {
  id: string;
  carNumber: string;
  entryTime: string;
  exitTime?: string;
  status: 'active' | 'completed' | 'cancelled';
  amount?: number;
}

export default function AttendantTickets() {
  const { toast } = useToast();
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const { data: tickets, isLoading, error } = useQuery<Ticket[]>({
    queryKey: ['tickets', filter],
    queryFn: async () => {
      const response = await api.get(`/tickets?status=${filter}`);
      return response.data;
    }
  });

  const handleCompleteTicket = async (ticketId: string) => {
    try {
      await api.post(`/tickets/${ticketId}/complete`);
      toast({
        title: "Success",
        description: "Ticket completed successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete ticket",
        variant: "destructive",
      });
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading tickets</div>;

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Parking Tickets</CardTitle>
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button
              variant={filter === 'active' ? 'default' : 'outline'}
              onClick={() => setFilter('active')}
            >
              Active
            </Button>
            <Button
              variant={filter === 'completed' ? 'default' : 'outline'}
              onClick={() => setFilter('completed')}
            >
              Completed
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket ID</TableHead>
                <TableHead>Car Number</TableHead>
                <TableHead>Entry Time</TableHead>
                <TableHead>Exit Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets?.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell>{ticket.id}</TableCell>
                  <TableCell>{ticket.carNumber}</TableCell>
                  <TableCell>{format(new Date(ticket.entryTime), 'PPp')}</TableCell>
                  <TableCell>
                    {ticket.exitTime ? format(new Date(ticket.exitTime), 'PPp') : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        ticket.status === 'active'
                          ? 'default'
                          : ticket.status === 'completed'
                          ? 'secondary'
                          : 'destructive'
                      }
                    >
                      {ticket.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{ticket.amount ? `$${ticket.amount}` : '-'}</TableCell>
                  <TableCell>
                    {ticket.status === 'active' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCompleteTicket(ticket.id)}
                      >
                        Complete
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 