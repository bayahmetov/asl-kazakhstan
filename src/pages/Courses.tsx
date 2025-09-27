import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Clock, Users, Star, CheckCircle, LogOut, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Courses = () => {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { language, t } = useLanguage();
  const { toast } = useToast();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const { data, error } = await supabase
          .from('courses')
          .select(`
            *,
            profiles!instructor_id(full_name)
          `)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching courses:', error);
          // Use sample data as fallback
          setCourses(sampleCourses);
        } else {
          setCourses(data || sampleCourses);
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
        setCourses(sampleCourses);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  // Sample courses for fallback
  const sampleCourses = [
    {
      id: '1',
      title: t('courses.alphabetTitle'),
      description: t('courses.alphabetDesc'),
      instructor_id: 'sample',
      created_at: new Date().toISOString(),
      level: 'Beginner',
      lessons: 8,
      duration: 120,
      students: 127,
      rating: 4.9,
      isPopular: true
    },
    {
      id: '2', 
      title: t('courses.basicTitle'),
      description: t('courses.basicDesc'),
      instructor_id: 'sample',
      created_at: new Date().toISOString(),
      level: 'Beginner',
      lessons: 12,
      duration: 180,
      students: 98,
      rating: 4.8
    },
    {
      id: '3',
      title: t('courses.familyTitle'),
      description: t('courses.familyDesc'),
      instructor_id: 'sample',
      created_at: new Date().toISOString(),
      level: 'Beginner',
      lessons: 10,
      duration: 150,
      students: 85,
      rating: 4.7
    },
    {
      id: '4',
      title: t('courses.workTitle'),
      description: t('courses.workDesc'),
      instructor_id: 'sample',
      created_at: new Date().toISOString(),
      level: 'Advanced',
      lessons: 18,
      duration: 300,
      students: 34,
      rating: 4.9
    }
  ];

  const CourseCard = ({ course }: { course: any }) => (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {course.level || 'Beginner'}
              </Badge>
              {course.isPopular && (
                <Badge variant="default" className="text-xs">
                  Most Popular
                </Badge>
              )}
            </div>
            <CardTitle className="text-xl group-hover:text-primary transition-colors">
              {course.title}
            </CardTitle>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Star className="h-4 w-4 fill-current text-yellow-500" />
            {course.rating || 4.8}
          </div>
        </div>
        <p className="text-muted-foreground leading-relaxed">
          {course.description}
        </p>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {course.duration ? `${Math.floor(course.duration / 60)}h` : '2h'}
          </div>
          <div className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            {course.lessons || 8} {t('courses.lessons')}
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {course.students || 50}
          </div>
        </div>
        
        <Button 
          className="w-full" 
          onClick={() => navigate(`/courses/${course.id}`)}
        >
          <Play className="mr-2 h-4 w-4" />
          {t('courses.viewDetails')}
        </Button>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      {/* Header with user info */}
      <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">{t('courses.title')}</h1>
              <p className="text-muted-foreground">{t('courses.subtitle')}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-medium">{profile?.full_name || user?.email}</p>
                <Badge variant={profile?.role === 'instructor' ? 'default' : 'secondary'}>
                  {profile?.role || 'student'}
                </Badge>
              </div>
              <Button onClick={signOut} variant="outline" size="sm">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Course Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>

        {/* Empty State */}
        {courses.length === 0 && !loading && (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-muted-foreground mb-2">No courses available</h2>
            <p className="text-muted-foreground">Check back later for new courses!</p>
          </div>
        )}

        {/* Instructor CTA */}
        {profile?.role === 'instructor' && (
          <section className="mt-16 text-center">
            <Card className="max-w-4xl mx-auto">
              <CardContent className="p-12">
                <CheckCircle className="h-16 w-16 text-primary mx-auto mb-6" />
                <h2 className="text-2xl lg:text-3xl font-bold mb-4">
                  Ready to Create Your Course?
                </h2>
                <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Share your knowledge with students around Kazakhstan. Create engaging video lessons and build your course today.
                </p>
                <Button size="lg" onClick={() => toast({ title: "Coming Soon", description: "Course creation will be available soon!" })}>
                  <Play className="mr-2 h-5 w-5" />
                  Create New Course  
                </Button>
              </CardContent>
            </Card>
          </section>
        )}
      </div>
    </div>
  );
};

export default Courses;