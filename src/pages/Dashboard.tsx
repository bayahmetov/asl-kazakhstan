import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import InstructorDashboard from './InstructorDashboard';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

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