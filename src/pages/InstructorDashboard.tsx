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
    error: 'Failed to save feedback'
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
    error: 'Не удалось сохранить отзыв'
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
    error: 'Пікірді сақтау сәтсіз аяқталды'
  }
};

export default function InstructorDashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [comments, setComments] = useState<{ [key: string]: string }>({});

  const t = translations[language];

  useEffect(() => {
    const fetchSubmissions = async () => {
      if (!profile?.id || profile.role !== 'instructor') return;

      try {
        // Get submissions for courses taught by this instructor
        const { data, error } = await supabase
          .from('submissions')
          .select(`
            *,
            lessons!inner(
              title,
              courses!inner(
                title,
                instructor_id
              )
            ),
            profiles!inner(
              full_name,
              email
            )
          `)
          .eq('lessons.courses.instructor_id', profile.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching submissions:', error);
          return;
        }

        setSubmissions(data || []);
        
        // Initialize comments state
        const initialComments: { [key: string]: string } = {};
        data?.forEach(submission => {
          initialComments[submission.id] = submission.instructor_comment || '';
        });
        setComments(initialComments);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [profile]);

  const updateSubmission = async (submissionId: string, reviewed: boolean) => {
    setUpdating(submissionId);

    try {
      const { error } = await supabase
        .from('submissions')
        .update({
          reviewed,
          instructor_comment: comments[submissionId] || null,
          reviewed_at: reviewed ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', submissionId);

      if (error) throw error;

      // Update local state
      setSubmissions(prev => prev.map(sub => 
        sub.id === submissionId 
          ? { 
              ...sub, 
              reviewed, 
              instructor_comment: comments[submissionId] || null,
              reviewed_at: reviewed ? new Date().toISOString() : null
            }
          : sub
      ));

      toast({
        title: t.success,
        variant: "default"
      });
    } catch (error: any) {
      console.error('Error updating submission:', error);
      toast({
        title: t.error,
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUpdating(null);
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
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