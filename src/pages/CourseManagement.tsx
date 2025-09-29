import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Search, UserPlus, UserMinus, Users, ArrowLeft } from 'lucide-react';

interface UserProfile {
  id: string;
  full_name: string;
  username: string;
  role: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
  instructor_id: string;
}

interface CourseEnrollment {
  id: string;
  student_id: string;
  course_id: string;
  enrolled_at: string;
  profiles: {
    id: string;
    full_name: string;
    username: string;
    role: string;
  };
}

export default function CourseManagement() {
  const { id: courseId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [course, setCourse] = useState<Course | null>(null);
  const [enrolledStudents, setEnrolledStudents] = useState<CourseEnrollment[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Filter users based on search query
  const filteredUsers = allUsers.filter(user => 
    user.role === 'student' && // Only show students
    !enrolledStudents.some(enrollment => enrollment.student_id === user.id) && // Not already enrolled
    (
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  useEffect(() => {
    if (courseId && user) {
      fetchCourseData();
    }
  }, [courseId, user]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);

      // Fetch course details
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;

      // Check if user is the instructor for this course
      if (courseData.instructor_id !== user?.id) {
        navigate('/courses');
        return;
      }

      setCourse(courseData);

      // Fetch enrolled students with proper join
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('course_enrollments')
        .select(`
          id,
          student_id,
          course_id,
          enrolled_at
        `)
        .eq('course_id', courseId);

      if (enrollmentsError) throw enrollmentsError;

      // Fetch user profiles for enrolled students
      if (enrollmentsData && enrollmentsData.length > 0) {
        const studentIds = enrollmentsData.map(enrollment => enrollment.student_id);
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, email, username, role, avatar_url')
          .in('id', studentIds);

        if (profilesError) throw profilesError;

        // Combine enrollment data with profiles
        const enrollmentsWithProfiles = enrollmentsData.map(enrollment => ({
          ...enrollment,
          profiles: profilesData?.find(profile => profile.id === enrollment.student_id) || {
            id: enrollment.student_id,
            full_name: '',
            username: '',
            role: 'student'
          }
        }));

        setEnrolledStudents(enrollmentsWithProfiles);
      } else {
        setEnrolledStudents([]);
      }

      // Fetch all students using the secure function (no sensitive data)
      const { data: usersData, error: usersError } = await supabase
        .rpc('search_students_for_enrollment');

      if (usersError) throw usersError;
      setAllUsers(usersData || []);

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load course data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async (studentId: string, studentName: string) => {
    try {
      setActionLoading(true);

      const { error } = await supabase
        .from('course_enrollments')
        .insert({
          student_id: studentId,
          course_id: courseId,
        });

      if (error) {
        console.error('Error adding student:', error);
        
        // Check for RLS policy violation or permission errors
        if (error.code === '42501' || error.message.includes('row-level security')) {
          toast({
            title: "Permission Denied",
            description: "You don't have permission to enroll students in this course.",
            variant: "destructive",
          });
        } else if (error.code === '23505') {
          toast({
            title: "Already Enrolled",
            description: `${studentName} is already enrolled in this course.`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: error.message || "Failed to add student to course. Please try again.",
            variant: "destructive",
          });
        }
        return;
      }

      toast({
        title: "Success",
        description: `${studentName} has been added to the course`
      });

      // Refresh data
      await fetchCourseData();
    } catch (error: any) {
      console.error('Error adding student:', error);
      toast({
        title: "Error",
        description: "Failed to add student to course. Please try again.",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveStudent = async (enrollmentId: string, studentName: string) => {
    try {
      setActionLoading(true);

      const { error } = await supabase
        .from('course_enrollments')
        .delete()
        .eq('id', enrollmentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${studentName} has been removed from the course`
      });

      // Refresh data
      await fetchCourseData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove student from course",
        variant: "destructive"
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!course || profile?.role !== 'instructor') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to manage this course.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/courses/${courseId}`)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Course
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{course.title}</h1>
              <p className="text-muted-foreground">Manage Course Participants</p>
            </div>
          </div>
          <Badge variant="secondary" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            {enrolledStudents.length} Students
          </Badge>
        </div>

        {/* Current Participants */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Current Participants ({enrolledStudents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {enrolledStudents.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No students enrolled in this course yet.
              </p>
            ) : (
              <div className="grid gap-4">
                {enrolledStudents.map((enrollment) => (
                  <div
                    key={enrollment.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        {enrollment.profiles.full_name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="font-medium">{enrollment.profiles.full_name || 'Unnamed User'}</p>
                        {enrollment.profiles.username && (
                          <p className="text-sm text-muted-foreground">@{enrollment.profiles.username}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        Enrolled {new Date(enrollment.enrolled_at).toLocaleDateString()}
                      </Badge>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" disabled={actionLoading}>
                            <UserMinus className="w-4 h-4 mr-2" />
                            Remove
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove Student</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to remove {enrollment.profiles.full_name || 'this student'} from the course? 
                              They will lose access to all course materials and their progress will be preserved but inaccessible.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRemoveStudent(enrollment.id, enrollment.profiles.full_name || 'Student')}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              Remove Student
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add New Participants */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Add New Participants
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search students by name or username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Search Results */}
            {searchQuery.trim() === '' ? (
              <p className="text-muted-foreground text-center py-8">
                Start typing to search for students to add to this course.
              </p>
            ) : filteredUsers.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No students found matching your search criteria.
              </p>
            ) : (
              <div className="grid gap-4">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        {user.full_name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="font-medium">{user.full_name || 'Unnamed User'}</p>
                        {user.username && (
                          <p className="text-sm text-muted-foreground">@{user.username}</p>
                        )}
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" disabled={actionLoading}>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Add to Course
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Add Student to Course</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to add {user.full_name || 'this student'} to the course? 
                            They will gain access to all course materials and lessons.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleAddStudent(user.id, user.full_name || 'Student')}
                          >
                            Add Student
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}