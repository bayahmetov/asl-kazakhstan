import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { BookOpen, Clock, Users, Plus, Settings, Upload, Play } from 'lucide-react';
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
  const { profile } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
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

        // Fetch instructor profile if course has an instructor
        let profileData = null;
        if (courseData.instructor_id) {
          // Use secure function to get public instructor data (no email exposure)
          const { data: instructorProfiles } = await supabase
            .rpc('get_public_instructor_profiles');
          
          // Find the specific instructor for this course
          const instructorProfile = instructorProfiles?.find(
            profile => profile.id === courseData.instructor_id
          );
          
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
                <div className="flex items-center gap-4">
                  <Badge variant="secondary">
                    {t.instructor}: {course.profiles.full_name}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {t.createdAt}: {new Date(course.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                {profile?.role === 'instructor' && course.instructor_id === profile?.id && (
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
                    <DeleteCourseDialog courseId={course.id} courseName={course.title} />
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
        {profile?.role === 'instructor' && course?.instructor_id === profile?.id && (
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
                {profile?.role === 'instructor' && course.instructor_id === profile?.id && (
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
                    <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors">
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
                        >
                          <Play className="w-4 h-4 mr-2" />
                          {t.playLesson}
                        </Button>
                        {profile?.role === 'instructor' && course.instructor_id === profile?.id && (
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