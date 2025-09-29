import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  BookOpen, 
  Users, 
  FileText, 
  MessageSquare, 
  CheckCircle, 
  Clock, 
  Download,
  ArrowLeft
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const translations = {
  en: {
    dashboard: 'Instructor Dashboard',
    backToCourses: 'Back to Courses',
    submissions: 'Homework Submissions',
    pending: 'Pending Review',
    reviewed: 'Reviewed',
    noSubmissions: 'No submissions yet',
    studentName: 'Student',
    submittedOn: 'Submitted',
    textAnswer: 'Text Answer',
    downloadFile: 'Download File',
    addComment: 'Add Comment',
    markReviewed: 'Mark as Reviewed',
    comment: 'Comment',
    commentPlaceholder: 'Add your feedback here...',
    save: 'Save',
    saving: 'Saving...',
    success: 'Feedback saved successfully',
    error: 'Failed to save feedback',
    reviewSuccess: 'Marked as reviewed',
    unreviewSuccess: 'Marked as pending',
    deleteError: 'Delete Error',
    deleteSuccess: 'Submission deleted successfully',
    feedbackPlaceholder: 'Add your feedback here...',
    feedback: 'Feedback'
  },
  ru: {
    dashboard: 'Панель преподавателя',
    backToCourses: 'Назад к курсам',
    submissions: 'Домашние задания',
    pending: 'Ожидает проверки',
    reviewed: 'Проверено',
    noSubmissions: 'Заданий пока нет',
    studentName: 'Студент',
    submittedOn: 'Отправлено',
    textAnswer: 'Текстовый ответ',
    downloadFile: 'Скачать файл',
    addComment: 'Добавить комментарий',
    markReviewed: 'Отметить как проверенное',
    comment: 'Комментарий',
    commentPlaceholder: 'Добавьте ваш отзыв здесь...',
    save: 'Сохранить',
    saving: 'Сохранение...',
    success: 'Отзыв успешно сохранен',
    error: 'Не удалось сохранить отзыв',
    reviewSuccess: 'Отмечено как проверенное',
    unreviewSuccess: 'Отмечено как ожидающее',
    deleteError: 'Ошибка удаления',
    deleteSuccess: 'Работа успешно удалена',
    feedbackPlaceholder: 'Добавьте ваш отзыв здесь...',
    feedback: 'Отзыв'
  },
  kz: {
    dashboard: 'Дәрісші панелі',
    backToCourses: 'Курстарға қайту',
    submissions: 'Үй тапсырмалары',
    pending: 'Тексеруді күтуде',
    reviewed: 'Тексерілді',
    noSubmissions: 'Тапсырмалар әлі жоқ',
    studentName: 'Студент',
    submittedOn: 'Жіберілді',
    textAnswer: 'Мәтіндік жауап',
    downloadFile: 'Файлды жүктеп алу',
    addComment: 'Пікір қосу',
    markReviewed: 'Тексерілді деп белгілеу',
    comment: 'Пікір',
    commentPlaceholder: 'Пікіріңізді мұнда жазыңыз...',
    save: 'Сақтау',
    saving: 'Сақталуда...',
    success: 'Пікір сәтті сақталды',
    error: 'Пікірді сақтау сәтсіз аяқталды',
    reviewSuccess: 'Тексерілді деп белгіленді',
    unreviewSuccess: 'Күтуде деп белгіленді',
    deleteError: 'Жою қатесі',
    deleteSuccess: 'Жұмыс сәтті жойылды',
    feedbackPlaceholder: 'Пікіріңізді мұнда жазыңыз...',
    feedback: 'Пікір'
  }
};

export default function InstructorDashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [comments, setComments] = useState<{ [key: string]: string }>({});

  const t = translations[language];

  useEffect(() => {
    fetchSubmissions();
  }, [profile]);

  const updateSubmission = async (submissionId: string, reviewed: boolean) => {
    setUpdating(submissionId);
    
    try {
      const feedback = comments[submissionId] || '';
      
      const updateData = { 
        reviewed,
        feedback: feedback,
        reviewed_at: reviewed ? new Date().toISOString() : null,
      };
      
      const { error } = await supabase
        .from('submissions')
        .update(updateData)
        .eq('id', submissionId);

      if (error) {
        console.error('Error updating submission:', error);
        toast({
          title: t.error,
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: t.success,
        description: reviewed ? t.reviewSuccess || "Marked as reviewed" : t.unreviewSuccess || "Marked as pending",
      });

      // Refresh submissions
      fetchSubmissions();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: t.error,
        description: 'An unexpected error occurred',
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  const deleteSubmission = async (submissionId: string, fileUrl?: string) => {
    try {
      // Delete file from storage if exists
      if (fileUrl) {
        await supabase.storage
          .from('homework-files')
          .remove([fileUrl]);
      }

      // Delete submission from database
      const { error } = await supabase
        .from('submissions')
        .delete()
        .eq('id', submissionId);

      if (error) {
        console.error('Delete error:', error);
        toast({
          title: t.deleteError || "Delete Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: t.success,
        description: t.deleteSuccess || "Submission deleted successfully",
      });

      // Refresh submissions
      fetchSubmissions();
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: t.deleteError || "Delete Error",
        description: 'An unexpected error occurred',
        variant: "destructive",
      });
    }
  };

  const fetchSubmissions = async () => {
    if (!profile?.id || profile.role !== 'instructor') return;

    setLoading(true);
    setError(null);

    try {
      // Step 1: Get instructor's courses
      const { data: instructorCourses, error: coursesError } = await supabase
        .from('courses')
        .select('id, title')
        .eq('instructor_id', profile.id);

      if (coursesError) {
        console.error('Error fetching courses:', coursesError);
        setError('Failed to load courses');
        return;
      }

      if (!instructorCourses || instructorCourses.length === 0) {
        setSubmissions([]);
        return;
      }

      const courseIds = instructorCourses.map(course => course.id);

      // Step 2: Get lessons for these courses
      const { data: lessons, error: lessonsError } = await supabase
        .from('lessons')
        .select('id, title, course_id')
        .in('course_id', courseIds);

      if (lessonsError) {
        console.error('Error fetching lessons:', lessonsError);
        setError('Failed to load lessons');
        return;
      }

      if (!lessons || lessons.length === 0) {
        setSubmissions([]);
        return;
      }

      const lessonIds = lessons.map(lesson => lesson.id);

      // Step 3: Get submissions for these lessons
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('submissions')
        .select('*')
        .in('lesson_id', lessonIds)
        .order('created_at', { ascending: false });

      if (submissionsError) {
        console.error('Error fetching submissions:', submissionsError);
        setError('Failed to load submissions');
        return;
      }

      if (!submissionsData || submissionsData.length === 0) {
        setSubmissions([]);
        return;
      }

      // Step 4: Get student profiles for these submissions
      const studentIds = [...new Set(submissionsData.map(sub => sub.student_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', studentIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        setError('Failed to load student profiles');
        return;
      }

      // Step 5: Combine all data
      const enrichedSubmissions = submissionsData.map(submission => {
        const lesson = lessons.find(l => l.id === submission.lesson_id);
        const course = instructorCourses.find(c => c.id === lesson?.course_id);
        const studentProfile = profiles?.find(p => p.id === submission.student_id);

        return {
          ...submission,
          lessons: {
            title: lesson?.title || 'Unknown Lesson',
            courses: {
              title: course?.title || 'Unknown Course'
            }
          },
          profiles: {
            full_name: studentProfile?.full_name || 'Unknown Student',
            email: studentProfile?.email || ''
          }
        };
      });

      setSubmissions(enrichedSubmissions);
      
      // Initialize comments state
      const initialComments: { [key: string]: string } = {};
      enrichedSubmissions.forEach(submission => {
        initialComments[submission.id] = submission.feedback || '';
      });
      setComments(initialComments);

    } catch (error) {
      console.error('Error:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (fileUrl: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('homework-files')
        .download(fileUrl);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({
        title: "Download failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Redirect if not instructor
  if (profile?.role !== 'instructor') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Access Denied</h1>
          <p className="text-muted-foreground">Only instructors can access this dashboard.</p>
          <Button onClick={() => navigate('/courses')} className="mt-4">
            {t.backToCourses}
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button 
          onClick={() => navigate('/courses')} 
          variant="outline" 
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t.backToCourses}
        </Button>

        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <FileText className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">{t.dashboard}</h1>
          </div>

          <div className="space-y-4">
            {/* Loading skeleton */}
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="h-5 bg-muted rounded animate-pulse w-48"></div>
                      <div className="h-4 bg-muted rounded animate-pulse w-32"></div>
                    </div>
                    <div className="h-6 bg-muted rounded animate-pulse w-20"></div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="h-4 bg-muted rounded animate-pulse"></div>
                  <div className="h-4 bg-muted rounded animate-pulse w-3/4"></div>
                  <div className="h-10 bg-muted rounded animate-pulse"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button 
          onClick={() => navigate('/courses')} 
          variant="outline" 
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t.backToCourses}
        </Button>

        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <FileText className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">{t.dashboard}</h1>
          </div>

          <Card>
            <CardContent className="text-center py-8">
              <div className="text-destructive mb-4">
                <FileText className="h-16 w-16 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Failed to Load Data</h2>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={() => fetchSubmissions()} variant="outline">
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const pendingSubmissions = submissions.filter(s => !s.reviewed);
  const reviewedSubmissions = submissions.filter(s => s.reviewed);

  return (
    <div className="container mx-auto px-4 py-8">
      <Button 
        onClick={() => navigate('/courses')} 
        variant="outline" 
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        {t.backToCourses}
      </Button>

      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <FileText className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">{t.dashboard}</h1>
        </div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {t.pending} ({pendingSubmissions.length})
            </TabsTrigger>
            <TabsTrigger value="reviewed" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              {t.reviewed} ({reviewedSubmissions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingSubmissions.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">{t.noSubmissions}</p>
                </CardContent>
              </Card>
            ) : (
              pendingSubmissions.map((submission) => (
                <Card key={submission.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {submission.lessons.courses.title} - {submission.lessons.title}
                        </CardTitle>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {submission.profiles.full_name || submission.profiles.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {new Date(submission.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Badge variant="secondary">
                        {t.pending}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {submission.text_answer && (
                      <div>
                        <Label className="text-sm font-medium">{t.textAnswer}</Label>
                        <div className="mt-1 p-3 bg-muted rounded-lg">
                          <p className="text-sm whitespace-pre-wrap">{submission.text_answer}</p>
                        </div>
                      </div>
                    )}

                    {submission.file_url && (
                      <div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadFile(
                            submission.file_url, 
                            `homework-${submission.profiles.full_name || 'student'}`
                          )}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          {t.downloadFile}
                        </Button>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor={`comment-${submission.id}`}>{t.comment}</Label>
                      <Textarea
                        id={`comment-${submission.id}`}
                        value={comments[submission.id] || ''}
                        onChange={(e) => setComments(prev => ({
                          ...prev,
                          [submission.id]: e.target.value
                        }))}
                        placeholder={t.commentPlaceholder}
                        rows={3}
                      />
                    </div>

                    <Button
                      onClick={() => updateSubmission(submission.id, true)}
                      disabled={updating === submission.id}
                      className="w-full"
                    >
                      {updating === submission.id ? (
                        <>
                          <Clock className="w-4 h-4 mr-2 animate-spin" />
                          {t.saving}
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          {t.markReviewed}
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="reviewed" className="space-y-4">
            {reviewedSubmissions.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <CheckCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">{t.noSubmissions}</p>
                </CardContent>
              </Card>
            ) : (
              reviewedSubmissions.map((submission) => (
                <Card key={submission.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {submission.lessons.courses.title} - {submission.lessons.title}
                        </CardTitle>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {submission.profiles.full_name || submission.profiles.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <CheckCircle className="h-4 w-4" />
                            {new Date(submission.reviewed_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Badge variant="default">
                        {t.reviewed}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {submission.text_answer && (
                      <div>
                        <Label className="text-sm font-medium">{t.textAnswer}</Label>
                        <div className="mt-1 p-3 bg-muted rounded-lg">
                          <p className="text-sm whitespace-pre-wrap">{submission.text_answer}</p>
                        </div>
                      </div>
                    )}

                    {submission.instructor_comment && (
                      <div>
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          {t.comment}
                        </Label>
                        <div className="mt-1 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                          <p className="text-sm whitespace-pre-wrap">{submission.instructor_comment}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}