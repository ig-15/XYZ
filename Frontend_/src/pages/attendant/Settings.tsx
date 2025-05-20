import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";

interface AttendantSettings {
  email: string;
  name: string;
  phone: string;
  shift: {
    startTime: string;
    endTime: string;
  };
  notifications: {
    email: boolean;
    sms: boolean;
  };
  autoAssign: boolean;
}

export default function AttendantSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('profile');

  const { data: settings, isLoading } = useQuery<AttendantSettings>({
    queryKey: ['attendantSettings'],
    queryFn: async () => {
      const response = await fetch('/api/attendant/settings');
      if (!response.ok) throw new Error('Failed to fetch settings');
      return response.json();
    }
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: Partial<AttendantSettings>) => {
      const response = await fetch('/api/attendant/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update settings');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendantSettings'] });
      toast({
        title: "Success",
        description: "Settings updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
    },
  });

  const handleProfileUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateSettingsMutation.mutate({
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
    });
  };

  const handleShiftUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateSettingsMutation.mutate({
      shift: {
        startTime: formData.get('startTime') as string,
        endTime: formData.get('endTime') as string,
      },
    });
  };

  const handleNotificationUpdate = (type: 'email' | 'sms', value: boolean) => {
    updateSettingsMutation.mutate({
      notifications: {
        ...settings?.notifications,
        [type]: value,
      },
    });
  };

  const handleAutoAssignToggle = (value: boolean) => {
    updateSettingsMutation.mutate({
      autoAssign: value,
    });
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="shift">Shift</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={settings?.email}
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={settings?.name}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    defaultValue={settings?.phone}
                  />
                </div>
                <Button type="submit">Save Changes</Button>
              </form>
            </TabsContent>

            <TabsContent value="shift">
              <form onSubmit={handleShiftUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Shift Start Time</Label>
                  <Input
                    id="startTime"
                    name="startTime"
                    type="time"
                    defaultValue={settings?.shift.startTime}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">Shift End Time</Label>
                  <Input
                    id="endTime"
                    name="endTime"
                    type="time"
                    defaultValue={settings?.shift.endTime}
                  />
                </div>
                <Button type="submit">Save Changes</Button>
              </form>
            </TabsContent>

            <TabsContent value="notifications">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Email Notifications</h3>
                    <p className="text-sm text-gray-500">
                      Receive notifications about parking activities via email
                    </p>
                  </div>
                  <Button
                    variant={settings?.notifications.email ? "default" : "outline"}
                    onClick={() => handleNotificationUpdate('email', !settings?.notifications.email)}
                  >
                    {settings?.notifications.email ? 'Enabled' : 'Disabled'}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">SMS Notifications</h3>
                    <p className="text-sm text-gray-500">
                      Receive notifications about parking activities via SMS
                    </p>
                  </div>
                  <Button
                    variant={settings?.notifications.sms ? "default" : "outline"}
                    onClick={() => handleNotificationUpdate('sms', !settings?.notifications.sms)}
                  >
                    {settings?.notifications.sms ? 'Enabled' : 'Disabled'}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preferences">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Auto-Assign Parking Spaces</h3>
                    <p className="text-sm text-gray-500">
                      Automatically assign parking spaces to incoming vehicles
                    </p>
                  </div>
                  <Switch
                    checked={settings?.autoAssign}
                    onCheckedChange={handleAutoAssignToggle}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 