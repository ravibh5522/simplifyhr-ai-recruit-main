import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings as SettingsIcon, 
  Bell, 
  Shield, 
  Database, 
  Moon, 
  Sun,
  Monitor,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const Settings = () => {
  const { profile, signOut } = useAuth();
  const { toast } = useToast();
  
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    marketing: false,
    security: true,
  });

  const [privacy, setPrivacy] = useState({
    profileVisible: true,
    activityVisible: false,
    searchable: true,
  });

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
    toast({
      title: "Notification settings updated",
      description: `${key} notifications ${value ? 'enabled' : 'disabled'}`,
    });
  };

  const handlePrivacyChange = (key: string, value: boolean) => {
    setPrivacy(prev => ({ ...prev, [key]: value }));
    toast({
      title: "Privacy settings updated",
      description: "Your privacy preferences have been saved",
    });
  };

  const handleDeleteAccount = async () => {
    // This would typically involve calling a delete account API
    toast({
      title: "Account deletion requested",
      description: "Please contact support to complete account deletion",
      variant: "destructive",
    });
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'Super Admin';
      case 'client':
        return 'Client';
      case 'vendor':
        return 'Vendor';
      case 'candidate':
        return 'Candidate';
      default:
        return role;
    }
  };

  return (
    <DashboardLayout title="Settings">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-muted-foreground text-lg mt-2">
            Manage your account preferences and customize your experience
          </p>
        </div>

        <Tabs defaultValue="general" className="space-y-8">
          <TabsList className="grid w-full grid-cols-4 h-14 bg-muted/50 p-1">
            <TabsTrigger value="general" className="h-12 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <SettingsIcon className="w-4 h-4 mr-2" />
              General
            </TabsTrigger>
            <TabsTrigger value="notifications" className="h-12 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="privacy" className="h-12 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Shield className="w-4 h-4 mr-2" />
              Privacy
            </TabsTrigger>
            <TabsTrigger value="account" className="h-12 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Database className="w-4 h-4 mr-2" />
              Account
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <SettingsIcon className="w-5 h-5 text-white" />
                  </div>
                  General Settings
                </CardTitle>
                <CardDescription className="text-base">
                  Manage your general application preferences and account information
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-4 pb-2 border-b border-gray-100">Account Information</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <Label className="text-sm font-semibold text-gray-700">Email Address</Label>
                        <p className="text-gray-900 font-medium mt-1">{profile?.email}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <Label className="text-sm font-semibold text-gray-700">Account Role</Label>
                        <div className="mt-2">
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800 px-3 py-1">
                            {getRoleDisplayName(profile?.role)}
                          </Badge>
                        </div>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <Label className="text-sm font-semibold text-gray-700">Company</Label>
                        <p className="text-gray-900 font-medium mt-1">
                          {profile?.company_name || 'Not specified'}
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <Label className="text-sm font-semibold text-gray-700">Member Since</Label>
                        <p className="text-gray-900 font-medium mt-1">
                          {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          }) : 'Unknown'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-xl font-semibold mb-4">Appearance Preferences</h3>
                    <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div>
                          <Label className="text-lg font-medium">Theme Selection</Label>
                          <p className="text-muted-foreground mt-1">Choose your preferred color scheme for the application</p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Button variant="outline" size="lg" className="h-12 px-6">
                            <Sun className="w-5 h-5 mr-2" />
                            Light
                          </Button>
                          <Button variant="outline" size="lg" className="h-12 px-6">
                            <Moon className="w-5 h-5 mr-2" />
                            Dark
                          </Button>
                          <Button variant="outline" size="lg" className="h-12 px-6">
                            <Monitor className="w-5 h-5 mr-2" />
                            System
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <Bell className="w-5 h-5 text-white" />
                  </div>
                  Notification Preferences
                </CardTitle>
                <CardDescription className="text-base">
                  Control how and when you receive notifications from the platform
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-500 rounded-full">
                        <Bell className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <Label className="text-lg font-medium">Email Notifications</Label>
                        <p className="text-muted-foreground">Receive important updates and alerts via email</p>
                      </div>
                    </div>
                    <Switch
                      checked={notifications.email}
                      onCheckedChange={(checked) => handleNotificationChange('email', checked)}
                      className="scale-125"
                    />
                  </div>

                  <div className="flex items-center justify-between p-6 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-purple-500 rounded-full">
                        <Monitor className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <Label className="text-lg font-medium">Push Notifications</Label>
                        <p className="text-muted-foreground">Receive real-time browser notifications</p>
                      </div>
                    </div>
                    <Switch
                      checked={notifications.push}
                      onCheckedChange={(checked) => handleNotificationChange('push', checked)}
                      className="scale-125"
                    />
                  </div>

                  <div className="flex items-center justify-between p-6 bg-gradient-to-r from-amber-50 to-yellow-100 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-amber-500 rounded-full">
                        <SettingsIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <Label className="text-lg font-medium">Marketing Emails</Label>
                        <p className="text-muted-foreground">Get promotional content and feature updates</p>
                      </div>
                    </div>
                    <Switch
                      checked={notifications.marketing}
                      onCheckedChange={(checked) => handleNotificationChange('marketing', checked)}
                      className="scale-125"
                    />
                  </div>

                  <div className="flex items-center justify-between p-6 bg-gradient-to-r from-red-50 to-rose-100 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-red-500 rounded-full">
                        <Shield className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <Label className="text-lg font-medium">Security Alerts</Label>
                        <p className="text-muted-foreground">Critical security and account notifications</p>
                      </div>
                    </div>
                    <Switch
                      checked={notifications.security}
                      onCheckedChange={(checked) => handleNotificationChange('security', checked)}
                      className="scale-125"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="privacy">
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  Privacy Settings
                </CardTitle>
                <CardDescription className="text-base">
                  Control your privacy and data visibility preferences across the platform
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-6 bg-gradient-to-r from-green-50 to-emerald-100 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-green-500 rounded-full">
                        <SettingsIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <Label className="text-lg font-medium">Profile Visibility</Label>
                        <p className="text-muted-foreground">Allow other users to view your profile information</p>
                      </div>
                    </div>
                    <Switch
                      checked={privacy.profileVisible}
                      onCheckedChange={(checked) => handlePrivacyChange('profileVisible', checked)}
                      className="scale-125"
                    />
                  </div>

                  <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-cyan-100 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-500 rounded-full">
                        <Monitor className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <Label className="text-lg font-medium">Activity Visibility</Label>
                        <p className="text-muted-foreground">Display your online status and activity to other users</p>
                      </div>
                    </div>
                    <Switch
                      checked={privacy.activityVisible}
                      onCheckedChange={(checked) => handlePrivacyChange('activityVisible', checked)}
                      className="scale-125"
                    />
                  </div>

                  <div className="flex items-center justify-between p-6 bg-gradient-to-r from-orange-50 to-amber-100 rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-orange-500 rounded-full">
                        <Database className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <Label className="text-lg font-medium">Search Visibility</Label>
                        <p className="text-muted-foreground">Allow others to find your profile in search results</p>
                      </div>
                    </div>
                    <Switch
                      checked={privacy.searchable}
                      onCheckedChange={(checked) => handlePrivacyChange('searchable', checked)}
                      className="scale-125"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="account">
            <div className="space-y-8">
              <Card className="shadow-lg">
                <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50 border-b">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 bg-teal-500 rounded-lg">
                      <Database className="w-5 h-5 text-white" />
                    </div>
                    Account Management
                  </CardTitle>
                  <CardDescription className="text-base">
                    Manage your account data and export preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="space-y-6">
                    <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-100 rounded-xl">
                      <div className="flex items-start justify-between">
                        <div className="space-y-3">
                          <h3 className="text-xl font-semibold text-gray-900">Data Export</h3>
                          <p className="text-gray-600 leading-relaxed max-w-2xl">
                            Download a comprehensive copy of all your data including profile information, 
                            job applications, activity history, and all associated records.
                          </p>
                        </div>
                      </div>
                      <div className="mt-6">
                        <Button variant="outline" size="lg" className="h-12 px-8 bg-white hover:bg-gray-50">
                          <Database className="w-5 h-5 mr-3" />
                          Export My Data
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-red-200 shadow-lg shadow-red-100">
                <CardHeader className="bg-gradient-to-r from-red-50 to-rose-50 border-b border-red-100">
                  <CardTitle className="flex items-center gap-3 text-xl text-red-700">
                    <div className="p-2 bg-red-500 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-white" />
                    </div>
                    Danger Zone
                  </CardTitle>
                  <CardDescription className="text-base text-red-600">
                    Irreversible and destructive actions that cannot be undone
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="p-6 bg-gradient-to-r from-red-50 to-rose-100 rounded-xl border border-red-200">
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-red-500 rounded-full flex-shrink-0">
                          <Trash2 className="w-5 h-5 text-white" />
                        </div>
                        <div className="space-y-3">
                          <h3 className="text-xl font-semibold text-red-900">Delete Account</h3>
                          <p className="text-red-700 leading-relaxed">
                            Permanently delete your account and all associated data. This action will 
                            remove all your profile information, job applications, messages, and activity 
                            history from our servers. This action cannot be undone.
                          </p>
                        </div>
                      </div>
                      <div className="pt-4">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="lg" className="h-12 px-8">
                              <Trash2 className="w-5 h-5 mr-3" />
                              Delete Account
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="max-w-md">
                            <AlertDialogHeader className="space-y-4">
                              <div className="flex items-center justify-center">
                                <div className="p-3 bg-red-100 rounded-full">
                                  <AlertTriangle className="w-8 h-8 text-red-600" />
                                </div>
                              </div>
                              <AlertDialogTitle className="text-center text-xl">
                                Are you absolutely sure?
                              </AlertDialogTitle>
                              <AlertDialogDescription className="text-center leading-relaxed">
                                This action cannot be undone. This will permanently delete your account
                                and remove all your data from our servers including your profile, 
                                applications, and activity history.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="flex-col space-y-2 sm:flex-row sm:space-y-0">
                              <AlertDialogCancel className="sm:flex-1">Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={handleDeleteAccount} 
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 sm:flex-1"
                              >
                                Delete Account
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Settings;