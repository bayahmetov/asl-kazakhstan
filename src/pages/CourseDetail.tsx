import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { BookOpen, Clock, Users, Plus, Settings, Upload, Play, Lock } from 'lucide-react';
import DeleteCourseDialog from '@/components/DeleteCourseDialog';
import DeleteLessonDialog from '@/components/DeleteLessonDialog';
import CourseProgress from '@/components/CourseProgress';
import CourseEnrollments from '@/components/CourseEnrollments';
import { useToast } from '@/hooks/use-toast';

const translations = {
  en: {
    loading: 'Loading...',
    courseNotFound: 'Course not found',
    backToCourses: 'Back to Courses',
    lessons: 'Lessons',
    noLessons: 'No lessons available for this course.',
    uploadLesson: 'Upload Lesson',
    addLesson: 'Add Lesson',
    playLesson: 'Play Lesson',
    instructor: 'Instructor',
    createdAt: 'Created'
  },
  ru: {
    loading: 'Загрузка...',
    courseNotFound: 'Курс не найден',
    backToCourses: 'Назад к курсам',
    lessons: 'Уроки',
    noLessons: 'Для этого курса нет доступных уроков.',
    uploadLesson: 'Загрузить урок',
    addLesson: 'Добавить урок',
    playLesson: 'Воспроизвести урок',
    instructor: 'Преподаватель',
    createdAt: 'Создано'
  },
  kz: {
    loading: 'Жүктелуде...',
    courseNotFound: 'Курс табылмады',
    backToCourses: 'Курстарға қайту',
    lessons: 'Сабақтар',
    noLessons: 'Бұл курс үшін сабақтар жоқ.',
    uploadLesson: 'Сабақ жүктеу',
    addLesson: 'Сабақ қосу',
    playLesson: 'Сабақты ойнату',
    instructor: 'Дәрісші',
    createdAt: 'Жасалған'
  }
};

interface Course {
  id: string;
  title: string;
  description: string;
  instructor_id: string;
  created_at: string;
  profiles: {
    full_name: string;
  };
}

interface AssignedInstructor {
  id: string;
  instructor_id: string;
  profiles: {
    full_name: string;
    email: string;
  };
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  storage_key: string;
  created_at: string;
  duration?: number;
}

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const auth = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  
  // Handle case where auth context might not be available for public access
  const profile = auth?.profile || null;
  
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [assignedInstructors, setAssignedInstructors] = useState<AssignedInstructor[]>([]);
  const [loading, setLoading] = useState(true);
  
  const t = translations[language];

  useEffect(() => {
    const fetchCourseAndLessons = async () => {
      if (!id) return;
      
      try {
        // Fetch course details
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select('*')
          .eq('id', id)
          .single();

        if (courseError) {
          toast({
            title: "Error",
            description: "Failed to fetch course details",
            variant: "destructive"
          });
          return;
        }

        // Fetch instructor profile if course has an instructor (using public view)
        let profileData = null;
        if (courseData.instructor_id) {
          const { data: instructorProfile } = await supabase
            .from('public_profiles')
            .select('full_name')
            .eq('id', courseData.instructor_id)
            .single();
          
          profileData = instructorProfile ? { 
            full_name: instructorProfile.full_name 
          } : null;
        }

        // Combine course with profile data
        const courseWithProfile = {
          ...courseData,
          profiles: profileData || { full_name: 'No Instructor Assigned' }
        };

        setCourse(courseWithProfile);

        // Fetch assigned instructors for this course
        const { data: assignedInstructorsData, error: assignedError } = await supabase
          .from('course_instructors')
          .select('id, instructor_id, profiles!instructor_id(full_name, email)')
          .eq('course_id', id);

        if (!assignedError && assignedInstructorsData) {
          setAssignedInstructors(assignedInstructorsData as AssignedInstructor[]);
        }

        // Fetch lessons for this course
        const { data: lessonsData, error: lessonsError } = await supabase
          .from('lessons')
          .select('*')
          .eq('course_id', id)
          .order('created_at', { ascending: true });

        if (lessonsError) {
          toast({
            title: "Error",
            description: "Failed to fetch lessons",
            variant: "destructive"
          });
          return;
        }

        setLessons(lessonsData || []);
      } catch (error) {
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCourseAndLessons();
  }, [id, toast]);

  const handlePlayLesson = (lessonId: string) => {
    // Require authentication to play lessons
    if (!auth?.user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to access lesson content",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }
    navigate(`/courses/${id}/lesson/${lessonId}`);
  };

  const handleUploadLesson = () => {
    navigate(`/courses/${id}/upload`);
  };

  const handleLessonDeleted = () => {
    // Refresh lessons list
    if (id) {
      supabase
        .from('lessons')
        .select('*')
        .eq('course_id', id)
        .order('created_at', { ascending: true })
        .then(({ data }) => {
          setLessons(data || []);
        });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{t.courseNotFound}</h1>
          <Button onClick={() => navigate('/courses')} variant="outline">
            {t.backToCourses}
          </Button>
        </div>
      </div>
    );
  }

  const isInstructor = profile?.role === 'instructor';
  const isOwner = course.instructor_id === profile?.id;
  const isAssignedInstructor = assignedInstructors.some(
    instructor => instructor.instructor_id === profile?.id
  );
  const canManageCourse = isOwner || isAssignedInstructor;

  return (
    <div className="container mx-auto px-4 py-8">
      <Button 
        onClick={() => navigate('/courses')} 
        variant="outline" 
        className="mb-6"
      >
        {t.backToCourses}
      </Button>

      <div className="max-w-4xl mx-auto">
        <Card className="mb-8">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-3xl mb-2">{course.title}</CardTitle>
                <p className="text-muted-foreground mb-4">{course.description}</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      Course Owner: {course.profiles.full_name}
                    </Badge>
                  </div>
                  {assignedInstructors.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">Assigned Instructors:</span>
                      {assignedInstructors.map((instructor) => (
                        <Badge key={instructor.id} variant="outline">
                          {instructor.profiles?.full_name || instructor.profiles?.email}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <span className="text-sm text-muted-foreground block">
                    {t.createdAt}: {new Date(course.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                {profile?.role === 'instructor' && canManageCourse && (
                  <>
                    <Button onClick={handleUploadLesson}>
                      <Upload className="w-4 h-4 mr-2" />
                      {t.uploadLesson}
                    </Button>
                    <Button 
                      onClick={() => navigate(`/courses/${id}/manage`)}
                      variant="outline"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Manage Participants
                    </Button>
                    <Button onClick={() => navigate('/instructor-dashboard')} variant="outline">
                      <Settings className="w-4 h-4 mr-2" />
                      Dashboard
                    </Button>
                    {isOwner && <DeleteCourseDialog courseId={course.id} courseName={course.title} />}
                  </>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Course Statistics and Progress */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <span className="font-medium">Lessons</span>
              </div>
              <p className="text-2xl font-bold">{lessons.length}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-primary" />
                <span className="font-medium">Duration</span>
              </div>
              <p className="text-2xl font-bold">
                {lessons.reduce((total, lesson) => total + (lesson.duration || 0), 0) > 0 
                  ? `${Math.floor(lessons.reduce((total, lesson) => total + (lesson.duration || 0), 0) / 3600)}h ${Math.floor((lessons.reduce((total, lesson) => total + (lesson.duration || 0), 0) % 3600) / 60)}m`
                  : '0m'
                }
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-primary" />
                <span className="font-medium">Students</span>
              </div>
              <p className="text-2xl font-bold">0</p>
            </CardContent>
          </Card>
        </div>

        {/* Course Progress for Students */}
        {profile?.role === 'student' && (
          <CourseProgress courseId={id!} totalLessons={lessons.length} />
        )}

        {/* Course Enrollments for Instructors */}
        {profile?.role === 'instructor' && canManageCourse && (
          <CourseEnrollments courseId={id!} />
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="w-5 h-5" />
              {t.lessons}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lessons.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">{t.noLessons}</p>
                {profile?.role === 'instructor' && canManageCourse && (
                  <Button onClick={handleUploadLesson} variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    {t.addLesson}
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {lessons.map((lesson, index) => (
                  <div key={lesson.id}>
                    <div className={`relative flex items-center justify-between p-4 rounded-lg border transition-colors ${
                      !auth?.user 
                        ? 'opacity-60 cursor-not-allowed' 
                        : 'hover:bg-accent/50'
                    }`}>
                      {!auth?.user && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-[2px] rounded-lg pointer-events-none z-10">
                          <Lock className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{lesson.title}</h3>
                        {lesson.description && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {lesson.description}
                          </p>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {new Date(lesson.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          onClick={() => handlePlayLesson(lesson.id)}
                          size="sm"
                          variant={!auth?.user ? "outline" : "default"}
                        >
                          {!auth?.user ? (
                            <>
                              <Lock className="w-4 h-4 mr-2" />
                              Login to Watch
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 mr-2" />
                              {t.playLesson}
                            </>
                          )}
                        </Button>
                        {profile?.role === 'instructor' && canManageCourse && (
                          <DeleteLessonDialog
                            lessonId={lesson.id}
                            lessonTitle={lesson.title}
                            storageKey={lesson.storage_key}
                            onLessonDeleted={handleLessonDeleted}
                          />
                        )}
                      </div>
                    </div>
                    {index < lessons.length - 1 && <div className="border-t my-4" />}
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