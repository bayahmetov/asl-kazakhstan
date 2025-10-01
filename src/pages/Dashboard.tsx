import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import InstructorDashboard from './InstructorDashboard';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminMessages } from '@/components/AdminMessages';
import { AdminUserManagement } from '@/components/AdminUserManagement';
import { AdminStatistics } from '@/components/AdminStatistics';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Users, BookOpen, BarChart3 } from 'lucide-react';

export default function Dashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in</h1>
          <Button onClick={() => navigate('/auth')}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  if (profile.role === 'instructor') {
    return <InstructorDashboard />;
  }

  if (profile.role === 'admin') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <BarChart3 className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          </div>
          
          <div className="mb-8">
            <AdminStatistics />
          </div>
          
          <Tabs defaultValue="messages" className="space-y-6">
            <TabsList>
              <TabsTrigger value="messages">
                <MessageSquare className="h-4 w-4 mr-2" />
                Contact Messages
              </TabsTrigger>
              <TabsTrigger value="users">
                <Users className="h-4 w-4 mr-2" />
                User Management
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="messages">
              <AdminMessages />
            </TabsContent>
            
            <TabsContent value="users">
              <AdminUserManagement />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

  // For students, redirect to courses page for now
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Student Dashboard</h1>
        <p className="text-muted-foreground mb-4">Welcome! You can view your courses and progress here.</p>
        <Button onClick={() => navigate('/courses')}>
          View Courses
        </Button>
      </div>
    </div>
  );
}