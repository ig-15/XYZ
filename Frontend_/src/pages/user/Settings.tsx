import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface UserSettings {
  email: string;
  name: string;
  phone: string;
  notifications: {
    email: boolean;
    sms: boolean;
  };
}

export default function UserSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('profile');

  const { data: settings, isLoading } = useQuery<UserSettings>({
    queryKey: ['userSettings'],
    queryFn: async () => {
      const response = await fetch('/api/user/settings');
      if (!response.ok) throw new Error('Failed to fetch settings');
      return response.json();
    }
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<UserSettings>) => {
      const response = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update settings');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userSettings'] });
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
    updateProfileMutation.mutate({
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
    });
  };

  const handleNotificationUpdate = (type: 'email' | 'sms', value: boolean) => {
    updateProfileMutation.mutate({
      notifications: {
        ...settings?.notifications,
        [type]: value,
      },
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
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
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

            <TabsContent value="notifications">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Email Notifications</h3>
                    <p className="text-sm text-gray-500">
                      Receive notifications about your parking activities via email
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
                      Receive notifications about your parking activities via SMS
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

            <TabsContent value="security">
              <div className="space-y-4">
                <Button variant="outline" className="w-full">
                  Change Password
                </Button>
                <Button variant="outline" className="w-full">
                  Enable Two-Factor Authentication
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 