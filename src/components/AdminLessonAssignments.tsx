import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { BookOpen, UserPlus, X, Loader2 } from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  course_id: string;
  courses: {
    title: string;
  };
}

interface Instructor {
  id: string;
  full_name: string;
  email: string;
}

interface LessonAssignment {
  id: string;
  lesson_id: string;
  instructor_id: string;
  profiles: {
    full_name: string;
    email: string;
  };
}

export function AdminLessonAssignments() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [assignments, setAssignments] = useState<Record<string, LessonAssignment[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState<string>('');
  const [selectedInstructor, setSelectedInstructor] = useState<string>('');
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load all lessons with course info
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('id, title, course_id, courses(title)')
        .order('created_at', { ascending: false });

      if (lessonsError) throw lessonsError;

      // Load all instructors
      const { data: instructorsData, error: instructorsError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('role', 'instructor')
        .order('full_name');

      if (instructorsError) throw instructorsError;

      // Load all assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('lesson_instructors')
        .select('id, lesson_id, instructor_id, profiles(full_name, email)');

      if (assignmentsError) throw assignmentsError;

      // Group assignments by lesson_id
      const groupedAssignments: Record<string, LessonAssignment[]> = {};
      assignmentsData?.forEach((assignment: any) => {
        if (!groupedAssignments[assignment.lesson_id]) {
          groupedAssignments[assignment.lesson_id] = [];
        }
        groupedAssignments[assignment.lesson_id].push(assignment);
      });

      setLessons(lessonsData || []);
      setInstructors(instructorsData || []);
      setAssignments(groupedAssignments);
    } catch (error: any) {
      toast.error('Failed to load data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignInstructor = async () => {
    if (!selectedLesson || !selectedInstructor) {
      toast.error('Please select both a lesson and an instructor');
      return;
    }

    setAssigning(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('lesson_instructors')
        .insert({
          lesson_id: selectedLesson,
          instructor_id: selectedInstructor,
          assigned_by: user?.id
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('This instructor is already assigned to this lesson');
        } else {
          throw error;
        }
        return;
      }

      toast.success('Instructor assigned successfully');
      setSelectedLesson('');
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
        .from('lesson_instructors')
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
            Assign Instructor to Lesson
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select value={selectedLesson} onValueChange={setSelectedLesson}>
              <SelectTrigger>
                <SelectValue placeholder="Select a lesson" />
              </SelectTrigger>
              <SelectContent className="bg-background">
                {lessons.map((lesson) => (
                  <SelectItem key={lesson.id} value={lesson.id}>
                    {lesson.title} ({lesson.courses?.title || 'Unknown Course'})
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
              disabled={assigning || !selectedLesson || !selectedInstructor}
            >
              {assigning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Assign Instructor
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
            Lesson Assignments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {lessons.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No lessons found</p>
            ) : (
              lessons.map((lesson) => (
                <div key={lesson.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{lesson.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        Course: {lesson.courses?.title || 'Unknown'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    {assignments[lesson.id]?.length > 0 ? (
                      assignments[lesson.id].map((assignment) => (
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
