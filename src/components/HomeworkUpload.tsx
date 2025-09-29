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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

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
    instructorFeedback: 'Instructor Feedback',
    maxFileSize: 'Maximum file size: 10MB',
    supportedFormats: 'Supported formats: PDF, DOC, DOCX, TXT, JPG, PNG',
    success: 'Success',
    error: 'Error',
    uploadError: 'Upload Error',
    submitError: 'Submit Error',
    submitSuccess: 'Homework submitted successfully',
    deleteError: 'Delete Error',
    deleteSuccess: 'Submission deleted successfully',
    downloadFile: 'Download File',
    previousSubmission: 'Your Submission',
    attachedFile: 'Attached File',
    uploading: 'Uploading',
    updateSubmission: 'Update Submission',
    delete: 'Delete',
    confirmDelete: 'Confirm Deletion',
    deleteConfirmation: 'Are you sure you want to delete this submission? This action cannot be undone.',
    cancel: 'Cancel',
    reviewedOn: 'Reviewed on'
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
    instructorFeedback: 'Отзыв преподавателя',
    maxFileSize: 'Максимальный размер файла: 10МБ',
    supportedFormats: 'Поддерживаемые форматы: PDF, DOC, DOCX, TXT, JPG, PNG',
    success: 'Успех',
    error: 'Ошибка',
    uploadError: 'Ошибка загрузки',
    submitError: 'Ошибка отправки',
    submitSuccess: 'Домашнее задание успешно отправлено',
    deleteError: 'Ошибка удаления',
    deleteSuccess: 'Работа успешно удалена',
    downloadFile: 'Скачать файл',
    previousSubmission: 'Ваша работа',
    attachedFile: 'Прикрепленный файл',
    uploading: 'Загрузка',
    updateSubmission: 'Обновить работу',
    delete: 'Удалить',
    confirmDelete: 'Подтвердить удаление',
    deleteConfirmation: 'Вы уверены, что хотите удалить эту работу? Это действие нельзя отменить.',
    cancel: 'Отмена',
    reviewedOn: 'Проверено'
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
    instructorFeedback: 'Дәрісші пікірі',
    maxFileSize: 'Максималды файл өлшемі: 10МБ',
    supportedFormats: 'Қолдау көрсетілетін форматтар: PDF, DOC, DOCX, TXT, JPG, PNG',
    success: 'Сәтті',
    error: 'Қате',
    uploadError: 'Жүктеу қатесі',
    submitError: 'Жіберу қатесі',
    submitSuccess: 'Үй тапсырмасы сәтті жіберілді',
    deleteError: 'Жою қатесі',
    deleteSuccess: 'Жұмыс сәтті жойылды',
    downloadFile: 'Файлды жүктеп алу',
    previousSubmission: 'Сіздің жұмысыңыз',
    attachedFile: 'Тіркелген файл',
    uploading: 'Жүктелуде',
    updateSubmission: 'Жұмысты жаңарту',
    delete: 'Жою',
    confirmDelete: 'Жоюды растау',
    deleteConfirmation: 'Бұл жұмысты жойғыңыз келетініне сенімдісіз бе? Бұл әрекетті қайтаруға болмайды.',
    cancel: 'Болдырмау',
    reviewedOn: 'Тексерілген күні'
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

  const [existingSubmission, setExistingSubmission] = useState<any>(null);

  useEffect(() => {
    fetchSubmission();
  }, [lessonId, profile?.id]);

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
        setExistingSubmission(data);
        setTextAnswer(data.text_answer || '');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

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
    if (!textAnswer.trim() && !file) return;

    setSubmitting(true);
    
    try {
      let fileUrl = null;
      
      // Upload file if present
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${lessonId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('homework-files')
          .upload(filePath, file);

        if (uploadError) {
          console.error('File upload error:', uploadError);
          toast({
            title: t.uploadError || "Upload Error",
            description: uploadError.message,
            variant: "destructive",
          });
          return;
        }

        fileUrl = filePath;
      }

      // Insert or update submission
      const submissionData = {
        lesson_id: lessonId,
        student_id: profile?.id,
        text_answer: textAnswer.trim() || null,
        file_url: fileUrl,
      };

      if (existingSubmission && !existingSubmission.reviewed) {
        // Update existing submission
        const { error } = await supabase
          .from('submissions')
          .update(submissionData)
          .eq('id', existingSubmission.id);

        if (error) {
          console.error('Update error:', error);
          toast({
            title: t.submitError || "Submit Error",
            description: error.message,
            variant: "destructive",
          });
          return;
        }
      } else {
        // Create new submission
        const { error } = await supabase
          .from('submissions')
          .insert([submissionData]);

        if (error) {
          console.error('Insert error:', error);
          toast({
            title: t.submitError || "Submit Error",
            description: error.message,
            variant: "destructive",
          });
          return;
        }
      }

      toast({
        title: t.success,
        description: t.submitSuccess || "Homework submitted successfully",
      });

      // Reset form
      setTextAnswer('');
      setFile(null);
      setUploadProgress(0);
      
      // Refetch submission
      fetchSubmission();
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: t.submitError || "Submit Error",
        description: 'An unexpected error occurred',
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!existingSubmission) return;

    try {
      // Delete file from storage if exists
      if (existingSubmission.file_url) {
        await supabase.storage
          .from('homework-files')
          .remove([existingSubmission.file_url]);
      }

      // Delete submission from database
      const { error } = await supabase
        .from('submissions')
        .delete()
        .eq('id', existingSubmission.id);

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

      // Reset state
      setExistingSubmission(null);
      setTextAnswer('');
      setFile(null);
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: t.deleteError || "Delete Error",
        description: 'An unexpected error occurred',
        variant: "destructive",
      });
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
      a.download = fileName || fileUrl.split('/').pop() || 'homework-file';
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

  const canEdit = !existingSubmission || !existingSubmission.reviewed;

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {t.homework}
          {existingSubmission && (
            <Badge variant={existingSubmission.reviewed ? "default" : "secondary"}>
              {existingSubmission.reviewed ? t.reviewed : t.pending}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {existingSubmission && existingSubmission.reviewed && existingSubmission.feedback && (
          <div className="mb-6 p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-4 w-4" />
              <span className="font-medium">{t.instructorFeedback || "Instructor Feedback"}</span>
            </div>
            <p className="text-sm">{existingSubmission.feedback}</p>
            {existingSubmission.reviewed_at && (
              <p className="text-xs text-muted-foreground mt-2">
                {t.reviewedOn || "Reviewed on"}: {new Date(existingSubmission.reviewed_at).toLocaleDateString()}
              </p>
            )}
          </div>
        )}

        {/* Display existing submission */}
        {existingSubmission && (
          <div className="mt-4 p-4 bg-secondary rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">{t.previousSubmission || "Your Submission"}</h4>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {new Date(existingSubmission.created_at).toLocaleDateString()} {new Date(existingSubmission.created_at).toLocaleTimeString()}
                </span>
                <span className={`text-sm px-2 py-1 rounded ${
                  existingSubmission.reviewed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {existingSubmission.reviewed ? t.reviewed : t.pending}
                </span>
              </div>
            </div>
            
            {existingSubmission.text_answer && (
              <div className="mb-2">
                <p className="text-sm text-muted-foreground mb-1">{t.textAnswer}:</p>
                <p className="text-sm bg-background p-2 rounded">{existingSubmission.text_answer}</p>
              </div>
            )}
            
            {existingSubmission.file_url && (
              <div className="mb-2">
                <p className="text-sm text-muted-foreground mb-1">{t.attachedFile || "Attached File"}:</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadFile(existingSubmission.file_url!, 'homework-file')}
                  className="text-xs"
                >
                  <Download className="w-3 h-3 mr-1" />
                  {t.downloadFile}
                </Button>
              </div>
            )}
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
            {existingSubmission?.file_url && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => downloadFile(existingSubmission.file_url!, 'homework-file')}
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
            <div className="flex gap-2">
              <Button 
                type="submit" 
                disabled={submitting || (!textAnswer.trim() && !file)}
                className="flex-1"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {uploadProgress > 0 ? `${t.uploading || "Uploading"} ${uploadProgress}%` : t.submitting}
                  </>
                ) : (
                  existingSubmission ? t.updateSubmission || "Update Submission" : t.submitHomework
                )}
              </Button>
              {existingSubmission && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" type="button">
                      {t.delete || "Delete"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t.confirmDelete || "Confirm Deletion"}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t.deleteConfirmation || "Are you sure you want to delete this submission? This action cannot be undone."}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t.cancel || "Cancel"}</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        {t.delete || "Delete"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}