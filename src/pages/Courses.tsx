import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CreateCourseDialog from '@/components/CreateCourseDialog';
import { Play, Clock, Users, Star, CheckCircle, LogOut, BookOpen, Search, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SearchBar } from '@/components/SearchBar';

const Courses = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const { language, t } = useLanguage();
  const { toast } = useToast();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  
  // Handle case where auth context might not be available for public access
  const user = auth?.user || null;
  const profile = auth?.profile || null;
  const signOut = auth?.signOut || (() => {});

  const fetchCourses = async () => {
    setLoading(true);
    try {
      console.log('Fetching courses...');
      const startTime = performance.now();
      
      // Fetch courses with dynamic statistics
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          lessons:lessons(count),
          enrollments:course_enrollments(count)
        `)
        .order('created_at', { ascending: false });
      
      // Get lesson duration data separately
      let coursesWithStats = data || [];
      if (data) {
        const courseIds = data.map(course => course.id);
        const { data: durationData } = await supabase
          .from('lessons')
          .select('course_id, duration')
          .in('course_id', courseIds);
        
        // Calculate total duration per course
        const durationMap = durationData?.reduce((acc: any, lesson: any) => {
          if (!acc[lesson.course_id]) acc[lesson.course_id] = 0;
          acc[lesson.course_id] += lesson.duration || 0;
          return acc;
        }, {}) || {};
        
        coursesWithStats = data.map(course => ({
          ...course,
          totalDuration: durationMap[course.id] || 0,
          lessonCount: course.lessons?.[0]?.count || 0,
          studentCount: course.enrollments?.[0]?.count || 0
        }));
      }

      const endTime = performance.now();
      console.log(`Courses fetch took ${endTime - startTime} milliseconds`);

      if (error) {
        console.error('Error fetching courses:', error);
        setCourses([]);
        toast({
          title: "Error",
          description: "Failed to load courses",
          variant: "destructive"
        });
      } else {
        console.log('Courses loaded:', coursesWithStats.length);
        setCourses(coursesWithStats);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      setCourses([]);
      toast({
        title: "Error", 
        description: "Network error while loading courses",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCourseCreated = () => {
    fetchCourses(); // Refresh courses list
  };

  useEffect(() => {
    let mounted = true;
    
    const loadCourses = async () => {
      if (mounted) {
        await fetchCourses();
      }
    };
    
    loadCourses();
    
    return () => {
      mounted = false;
    };
  }, []);


  const CourseCard = ({ course }: { course: any }) => (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
      <CardHeader className="flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-2 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs">
                {course.level || 'Beginner'}
              </Badge>
              {course.isPopular && (
                <Badge variant="default" className="text-xs">
                  Most Popular
                </Badge>
              )}
            </div>
            <CardTitle className="text-lg sm:text-xl group-hover:text-primary transition-colors line-clamp-2">
              {course.title}
            </CardTitle>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground flex-shrink-0">
            <Star className="h-4 w-4 fill-current text-yellow-500" />
            <span className="hidden sm:inline">{course.rating || 4.8}</span>
          </div>
        </div>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed line-clamp-3">
          {course.description}
        </p>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6 text-xs sm:text-sm text-muted-foreground">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1">
            <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="truncate">{course.totalDuration ? `${Math.floor(course.totalDuration / 3600)}h ${Math.floor((course.totalDuration % 3600) / 60)}m` : '0m'}</span>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1">
            <BookOpen className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="truncate">{course.lessonCount} {t('courses.lessons')}</span>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1">
            <Users className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="truncate">{course.studentCount}</span>
          </div>
        </div>
        
        <Button 
          className="w-full" 
          onClick={() => navigate(`/courses/${course.id}`)}
          size="sm"
        >
          <Play className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
          <span className="text-sm">{t('courses.viewDetails')}</span>
        </Button>
      </CardContent>
    </Card>
  );

  // Filter courses based on search query and level
  const filteredCourses = courses.filter(course => {
    const matchesSearch = searchQuery === '' || 
      course.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.tags?.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesLevel = levelFilter === 'all' || course.level === levelFilter;
    
    return matchesSearch && matchesLevel;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      {/* Header */}
      <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold mb-1">{t('courses.title')}</h1>
              <p className="text-sm sm:text-base text-muted-foreground">{t('courses.subtitle')}</p>
            </div>
            
            <div className="flex items-center gap-3 flex-wrap">
              <SearchBar />
              
              {user && (
                <>
                  <div className="text-right hidden sm:block">
                    <p className="font-medium text-sm">{profile?.full_name || user?.email}</p>
                    <Badge variant={profile?.role === 'instructor' ? 'default' : 'secondary'} className="text-xs">
                      {profile?.role || 'student'}
                    </Badge>
                  </div>
                  <Button onClick={signOut} variant="outline" size="sm">
                    <LogOut className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Sign Out</span>
                  </Button>
                </>
              )}
              
              {!user && (
                <div className="flex items-center gap-2">
                  <Button onClick={() => navigate('/auth')} variant="outline" size="sm">
                    Log In
                  </Button>
                  <Button onClick={() => navigate('/auth')} size="sm">
                    Sign Up
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Search and Filter Section */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search courses by title, description, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {searchQuery && (
            <div className="text-sm text-muted-foreground">
              Found {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''} matching "{searchQuery}"
            </div>
          )}
        </div>

        {/* Course Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {filteredCourses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>

        {/* Empty State */}
        {filteredCourses.length === 0 && !loading && (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-muted-foreground mb-2">
              {searchQuery || levelFilter !== 'all' ? 'No courses found' : 'No courses available'}
            </h2>
            <p className="text-muted-foreground">
              {searchQuery || levelFilter !== 'all' ? 'Try adjusting your search or filters' : 'Check back later for new courses!'}
            </p>
            {(searchQuery || levelFilter !== 'all') && (
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => {
                  setSearchQuery('');
                  setLevelFilter('all');
                }}
              >
                Clear filters
              </Button>
            )}
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
                <CreateCourseDialog onCourseCreated={handleCourseCreated} />
              </CardContent>
            </Card>
          </section>
        )}
      </div>
    </div>
  );
};

export default Courses;