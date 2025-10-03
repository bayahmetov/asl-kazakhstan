import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { BookOpen, UserPlus, X, Loader2 } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
}

interface Instructor {
  id: string;
  full_name: string;
  email: string;
}

interface CourseAssignment {
  id: string;
  course_id: string;
  instructor_id: string;
  profiles: {
    full_name: string;
    email: string;
  };
}

export function AdminCourseAssignments() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [assignments, setAssignments] = useState<Record<string, CourseAssignment[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedInstructor, setSelectedInstructor] = useState<string>('');
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load all courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('id, title, description')
        .order('title');

      if (coursesError) throw coursesError;

      // Load all instructors from user_roles table
      const { data: userRolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'instructor');

      if (rolesError) throw rolesError;

      const instructorIds = userRolesData?.map(r => r.user_id) || [];

      // Get profiles for those instructor user_ids
      const { data: instructorsData, error: instructorsError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', instructorIds)
        .order('full_name');

      if (instructorsError) throw instructorsError;

      // Load all assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('course_instructors')
        .select('id, course_id, instructor_id, profiles!instructor_id(full_name, email)');

      if (assignmentsError) throw assignmentsError;

      // Group assignments by course_id
      const groupedAssignments: Record<string, CourseAssignment[]> = {};
      assignmentsData?.forEach((assignment: any) => {
        if (!groupedAssignments[assignment.course_id]) {
          groupedAssignments[assignment.course_id] = [];
        }
        groupedAssignments[assignment.course_id].push(assignment);
      });

      setCourses(coursesData || []);
      setInstructors(instructorsData || []);
      setAssignments(groupedAssignments);
    } catch (error: any) {
      toast.error('Failed to load data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignInstructor = async () => {
    if (!selectedCourse || !selectedInstructor) {
      toast.error('Please select both a course and an instructor');
      return;
    }

    setAssigning(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('course_instructors')
        .insert({
          course_id: selectedCourse,
          instructor_id: selectedInstructor,
          assigned_by: user?.id
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('This instructor is already assigned to this course');
        } else {
          throw error;
        }
        return;
      }

      toast.success('Instructor assigned successfully');
      setSelectedCourse('');
      setSelectedInstructor('');
      loadData();
    } catch (error: any) {
      toast.error('Failed to assign instructor: ' + error.message);
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    try {
      const { error } = await supabase
        .from('course_instructors')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;

      toast.success('Instructor removed successfully');
      loadData();
    } catch (error: any) {
      toast.error('Failed to remove instructor: ' + error.message);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Assign Instructor to Course
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger>
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent className="bg-background">
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedInstructor} onValueChange={setSelectedInstructor}>
              <SelectTrigger>
                <SelectValue placeholder="Select an instructor" />
              </SelectTrigger>
              <SelectContent className="bg-background">
                {instructors.map((instructor) => (
                  <SelectItem key={instructor.id} value={instructor.id}>
                    {instructor.full_name || instructor.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              onClick={handleAssignInstructor} 
              disabled={assigning || !selectedCourse || !selectedInstructor}
            >
              {assigning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Assign
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Course Assignments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {courses.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No courses found</p>
            ) : (
              courses.map((course) => (
                <div key={course.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{course.title}</h3>
                      {course.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {course.description}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    {assignments[course.id]?.length > 0 ? (
                      assignments[course.id].map((assignment) => (
                        <Badge key={assignment.id} variant="secondary" className="flex items-center gap-2">
                          {assignment.profiles?.full_name || assignment.profiles?.email}
                          <button
                            onClick={() => handleRemoveAssignment(assignment.id)}
                            className="ml-1 hover:text-destructive"
                            aria-label="Remove instructor"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">No instructors assigned</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
