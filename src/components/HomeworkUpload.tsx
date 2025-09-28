import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, Download, CheckCircle, Clock, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const translations = {
  en: {
    homework: 'Homework',
    submitHomework: 'Submit Homework',
    textAnswer: 'Text Answer',
    fileUpload: 'File Upload',
    textPlaceholder: 'Enter your answer here...',
    selectFile: 'Select file to upload',
    submit: 'Submit',
    submitting: 'Submitting...',
    submitted: 'Submitted',
    reviewed: 'Reviewed',
    pending: 'Pending Review',
    instructorComment: 'Instructor Comment',
    maxFileSize: 'Maximum file size: 10MB',
    supportedFormats: 'Supported formats: PDF, DOC, DOCX, TXT, JPG, PNG',
    success: 'Homework submitted successfully',
    error: 'Failed to submit homework',
    downloadFile: 'Download File'
  },
  ru: {
    homework: 'Домашнее задание',
    submitHomework: 'Отправить домашнее задание',
    textAnswer: 'Текстовый ответ',
    fileUpload: 'Загрузка файла',
    textPlaceholder: 'Введите ваш ответ здесь...',
    selectFile: 'Выберите файл для загрузки',
    submit: 'Отправить',
    submitting: 'Отправка...',
    submitted: 'Отправлено',
    reviewed: 'Проверено',
    pending: 'Ожидает проверки',
    instructorComment: 'Комментарий преподавателя',
    maxFileSize: 'Максимальный размер файла: 10МБ',
    supportedFormats: 'Поддерживаемые форматы: PDF, DOC, DOCX, TXT, JPG, PNG',
    success: 'Домашнее задание успешно отправлено',
    error: 'Не удалось отправить домашнее задание',
    downloadFile: 'Скачать файл'
  },
  kz: {
    homework: 'Үй тапсырмасы',
    submitHomework: 'Үй тапсырмасын жіберу',
    textAnswer: 'Мәтіндік жауап',
    fileUpload: 'Файл жүктеу',
    textPlaceholder: 'Жауабыңызды мұнда енгізіңіз...',
    selectFile: 'Жүктеу үшін файл таңдаңыз',
    submit: 'Жіберу',
    submitting: 'Жіберілуде...',
    submitted: 'Жіберілді',
    reviewed: 'Тексерілді',
    pending: 'Тексеруді күтуде',
    instructorComment: 'Дәрісші пікірі',
    maxFileSize: 'Максималды файл өлшемі: 10МБ',
    supportedFormats: 'Қолдау көрсетілетін форматтар: PDF, DOC, DOCX, TXT, JPG, PNG',
    success: 'Үй тапсырмасы сәтті жіберілді',
    error: 'Үй тапсырмасын жіберу сәтсіз аяқталды',
    downloadFile: 'Файлды жүктеп алу'
  }
};

interface HomeworkUploadProps {
  lessonId: string;
}

export default function HomeworkUpload({ lessonId }: HomeworkUploadProps) {
  const { profile } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  
  const [textAnswer, setTextAnswer] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submission, setSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const t = translations[language];

  useEffect(() => {
    const fetchSubmission = async () => {
      if (!profile?.id) return;

      try {
        const { data, error } = await supabase
          .from('submissions')
          .select('*')
          .eq('lesson_id', lessonId)
          .eq('student_id', profile.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching submission:', error);
          return;
        }

        if (data) {
          setSubmission(data);
          setTextAnswer(data.text_answer || '');
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmission();
  }, [lessonId, profile?.id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check file size (10MB limit)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 10MB",
          variant: "destructive"
        });
        return;
      }
      
      // Check file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'image/jpeg',
        'image/png'
      ];
      
      if (!allowedTypes.includes(selectedFile.type)) {
        toast({
          title: "Invalid file type",
          description: "Please select a supported file format",
          variant: "destructive"
        });
        return;
      }
      
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile?.id || (!textAnswer.trim() && !file)) {
      toast({
        title: "Error",
        description: "Please provide either a text answer or upload a file",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    setUploadProgress(0);

    try {
      let fileUrl = null;

      // Upload file if provided
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${lessonId}/${fileName}`;

        // Simulate progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => Math.min(prev + 10, 90));
        }, 200);

        const { error: uploadError } = await supabase.storage
          .from('homework-files')
          .upload(filePath, file);

        clearInterval(progressInterval);

        if (uploadError) {
          throw uploadError;
        }

        fileUrl = filePath;
        setUploadProgress(95);
      }

      // Create or update submission
      const submissionData = {
        lesson_id: lessonId,
        student_id: profile.id,
        text_answer: textAnswer.trim() || null,
        file_url: fileUrl,
        updated_at: new Date().toISOString()
      };

      if (submission) {
        // Update existing submission (only if not reviewed)
        if (submission.reviewed) {
          toast({
            title: "Cannot update",
            description: "This submission has already been reviewed",
            variant: "destructive"
          });
          return;
        }

        const { error } = await supabase
          .from('submissions')
          .update(submissionData)
          .eq('id', submission.id);

        if (error) throw error;
        setSubmission({ ...submission, ...submissionData });
      } else {
        // Create new submission
        const { data, error } = await supabase
          .from('submissions')
          .insert(submissionData)
          .select()
          .single();

        if (error) throw error;
        setSubmission(data);
      }

      setUploadProgress(100);
      
      toast({
        title: t.success,
        variant: "default"
      });

      setTimeout(() => setUploadProgress(0), 2000);
    } catch (error: any) {
      console.error('Error submitting homework:', error);
      toast({
        title: t.error,
        description: error.message,
        variant: "destructive"
      });
      setUploadProgress(0);
    } finally {
      setSubmitting(false);
    }
  };

  const downloadFile = async () => {
    if (!submission?.file_url) return;

    try {
      const { data, error } = await supabase.storage
        .from('homework-files')
        .download(submission.file_url);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = submission.file_url.split('/').pop() || 'homework-file';
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

  if (loading) {
    return <div className="h-32 w-full bg-muted animate-pulse rounded" />;
  }

  // Only show for students
  if (profile?.role !== 'student') {
    return null;
  }

  const canEdit = !submission || !submission.reviewed;

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {t.homework}
          {submission && (
            <Badge variant={submission.reviewed ? "default" : "secondary"}>
              {submission.reviewed ? t.reviewed : t.pending}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {submission && submission.reviewed && submission.instructor_comment && (
          <div className="mb-6 p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-4 w-4" />
              <span className="font-medium">{t.instructorComment}</span>
            </div>
            <p className="text-sm">{submission.instructor_comment}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="textAnswer">{t.textAnswer}</Label>
            <Textarea
              id="textAnswer"
              value={textAnswer}
              onChange={(e) => setTextAnswer(e.target.value)}
              placeholder={t.textPlaceholder}
              rows={6}
              disabled={!canEdit}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">{t.fileUpload}</Label>
            <Input
              id="file"
              type="file"
              onChange={handleFileChange}
              disabled={!canEdit}
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
            />
            <div className="text-xs text-muted-foreground space-y-1">
              <p>{t.maxFileSize}</p>
              <p>{t.supportedFormats}</p>
            </div>
            {file && (
              <p className="text-sm text-green-600">
                Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(1)}MB)
              </p>
            )}
            {submission?.file_url && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={downloadFile}
                className="mt-2"
              >
                <Download className="h-4 w-4 mr-2" />
                {t.downloadFile}
              </Button>
            )}
          </div>

          {submitting && uploadProgress > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Upload Progress</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}

          {canEdit && (
            <Button type="submit" disabled={submitting || (!textAnswer.trim() && !file)}>
              {submitting ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  {t.submitting}
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  {t.submit}
                </>
              )}
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
}