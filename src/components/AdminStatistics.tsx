import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Users, BookOpen, FileText, MessageSquare, GraduationCap, Clock, TrendingUp } from 'lucide-react';

interface Statistics {
  totalUsers: number;
  totalInstructors: number;
  totalStudents: number;
  totalCourses: number;
  totalLessons: number;
  totalSubmissions: number;
  pendingSubmissions: number;
  totalMessages: number;
  totalTickets: number;
  openTickets: number;
}

export const AdminStatistics = () => {
  const [stats, setStats] = useState<Statistics>({
    totalUsers: 0,
    totalInstructors: 0,
    totalStudents: 0,
    totalCourses: 0,
    totalLessons: 0,
    totalSubmissions: 0,
    pendingSubmissions: 0,
    totalMessages: 0,
    totalTickets: 0,
    openTickets: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const [
        usersCount,
        instructorsCount,
        studentsCount,
        coursesCount,
        lessonsCount,
        submissionsCount,
        pendingSubmissionsCount,
        messagesCount,
        ticketsCount,
        openTicketsCount,
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'instructor'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('courses').select('id', { count: 'exact', head: true }),
        supabase.from('lessons').select('id', { count: 'exact', head: true }),
        supabase.from('submissions').select('id', { count: 'exact', head: true }),
        supabase.from('submissions').select('id', { count: 'exact', head: true }).eq('reviewed', false),
        supabase.from('messages').select('id', { count: 'exact', head: true }),
        supabase.from('support_tickets').select('id', { count: 'exact', head: true }),
        supabase.from('support_tickets').select('id', { count: 'exact', head: true }).neq('status', 'closed'),
      ]);

      setStats({
        totalUsers: usersCount.count || 0,
        totalInstructors: instructorsCount.count || 0,
        totalStudents: studentsCount.count || 0,
        totalCourses: coursesCount.count || 0,
        totalLessons: lessonsCount.count || 0,
        totalSubmissions: submissionsCount.count || 0,
        pendingSubmissions: pendingSubmissionsCount.count || 0,
        totalMessages: messagesCount.count || 0,
        totalTickets: ticketsCount.count || 0,
        openTickets: openTicketsCount.count || 0,
      });
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Instructors',
      value: stats.totalInstructors,
      icon: GraduationCap,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Students',
      value: stats.totalStudents,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Total Courses',
      value: stats.totalCourses,
      icon: BookOpen,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
    },
    {
      title: 'Total Lessons',
      value: stats.totalLessons,
      icon: FileText,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-100',
    },
    {
      title: 'Pending Submissions',
      value: stats.pendingSubmissions,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      subtitle: `of ${stats.totalSubmissions} total`,
    },
    {
      title: 'Contact Messages',
      value: stats.totalMessages,
      icon: MessageSquare,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100',
    },
    {
      title: 'Open Tickets',
      value: stats.openTickets,
      icon: TrendingUp,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      subtitle: `of ${stats.totalTickets} total`,
    },
  ];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading statistics...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            {stat.subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};