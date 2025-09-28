import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Upload, ArrowLeft, Loader2 } from 'lucide-react';
import { z } from 'zod';

const translations = {
  en: {
    uploadLesson: 'Upload Lesson',
    backToCourse: 'Back to Course',
    lessonTitle: 'Lesson Title',
    lessonDescription: 'Lesson Description',
    videoFile: 'Video File',
    selectVideo: 'Select video file',
    upload: 'Upload Lesson',
    uploading: 'Uploading...',
    titleRequired: 'Title is required',
    videoRequired: 'Video file is required',
    titlePlaceholder: 'Enter lesson title',
    descriptionPlaceholder: 'Enter lesson description (optional)',
    maxFileSize: 'Maximum file size: 100MB',
    supportedFormats: 'Supported formats: MP4, MOV, AVI, MKV'
  },
  ru: {
    uploadLesson: 'Загрузить урок',
    backToCourse: 'Назад к курсу',
    lessonTitle: 'Название урока',
    lessonDescription: 'Описание урока',
    videoFile: 'Видеофайл',
    selectVideo: 'Выберите видеофайл',
    upload: 'Загрузить урок',
    uploading: 'Загрузка...',
    titleRequired: 'Название обязательно',
    videoRequired: 'Видеофайл обязателен',
    titlePlaceholder: 'Введите название урока',
    descriptionPlaceholder: 'Введите описание урока (опционально)',
    maxFileSize: 'Максимальный размер файла: 100МБ',
    supportedFormats: 'Поддерживаемые форматы: MP4, MOV, AVI, MKV'
  },
  kz: {
    uploadLesson: 'Сабақ жүктеу',
    backToCourse: 'Курсқа қайту',
    lessonTitle: 'Сабақ атауы',
    lessonDescription: 'Сабақ сипаттамасы',
    videoFile: 'Видео файл',
    selectVideo: 'Видео файлды таңдаңыз',
    upload: 'Сабақ жүктеу',
    uploading: 'Жүктелуде...',
    titleRequired: 'Атау міндетті',
    videoRequired: 'Видео файл міндетті',
    titlePlaceholder: 'Сабақ атауын енгізіңіз',
    descriptionPlaceholder: 'Сабақ сипаттамасын енгізіңіз (міндетті емес)',
    maxFileSize: 'Максималды файл өлшемі: 100МБ',
    supportedFormats: 'Қолдау көрсетілетін форматтар: MP4, MOV, AVI, MKV'
  }
};

const lessonSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  videoFile: z.instanceof(File, { message: 'Video file is required' })
});

export default function UploadLesson() {
  const { id: courseId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<any>({});
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStartTime, setUploadStartTime] = useState<number | null>(null);
  
  const t = translations[language];

  const validateForm = () => {
    try {
      lessonSchema.parse({
        title,
        description: description || undefined,
        videoFile
      });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: any = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0]] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (100MB limit)
      if (file.size > 100 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 100MB",
          variant: "destructive"
        });
        return;
      }
      
      // Check file type
      const allowedTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/x-msvideo', 'video/x-matroska'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please select a valid video file (MP4, MOV, AVI, MKV)",
          variant: "destructive"
        });
        return;
      }
      
      setVideoFile(file);
    }
  };

  // Get video duration helper
  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        resolve(Math.round(video.duration));
      };
      video.onerror = () => resolve(0);
      video.src = URL.createObjectURL(file);
    });
  };

  // Calculate estimated time remaining
  const getTimeRemaining = (): string => {
    if (!uploadStartTime || uploadProgress <= 0) return '';
    
    const elapsed = Date.now() - uploadStartTime;
    const rate = uploadProgress / elapsed;
    const remaining = ((100 - uploadProgress) / rate) / 1000;
    
    if (remaining > 60) {
      return `~${Math.ceil(remaining / 60)} min remaining`;
    }
    return `~${Math.ceil(remaining)} sec remaining`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !courseId || !videoFile) return;
    
    setUploading(true);
    setUploadProgress(0);
    setUploadStartTime(Date.now());
    
    try {
      // Get video duration
      const duration = await getVideoDuration(videoFile);

      // Upload video to Supabase Storage
      const fileExt = videoFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${courseId}/${fileName}`;

      // Simulate progress for better UX (Supabase doesn't provide real progress)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) return prev; // Cap at 90% until actual upload completes
          return prev + Math.random() * 5;
        });
      }, 200);
      
      const { error: uploadError } = await supabase.storage
        .from('lesson-videos')
        .upload(filePath, videoFile);

      clearInterval(progressInterval);
      
      if (uploadError) {
        throw uploadError;
      }

      setUploadProgress(95);
      
      // Create lesson record
      const { error: lessonError } = await supabase
        .from('lessons')
        .insert({
          course_id: courseId,
          title: title.trim(),
          description: description.trim() || null,
          storage_key: filePath,
          duration
        });
      
      if (lessonError) {
        // Clean up uploaded file if lesson creation fails
        await supabase.storage
          .from('lesson-videos')
          .remove([filePath]);
        throw lessonError;
      }

      setUploadProgress(100);
      
      toast({
        title: "Success",
        description: "Lesson uploaded successfully"
      });

      setTimeout(() => {
        navigate(`/courses/${courseId}`);
      }, 500);
    } catch (error: any) {
      setUploadProgress(0);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload lesson",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      setUploadStartTime(null);
    }
  };

  // Check if user is instructor and can upload
  if (profile?.role !== 'instructor') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Access Denied</h1>
          <p className="text-muted-foreground">Only instructors can upload lessons.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button 
        onClick={() => navigate(`/courses/${courseId}`)} 
        variant="outline" 
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        {t.backToCourse}
      </Button>

      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              {t.uploadLesson}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">{t.lessonTitle}</Label>
                <Input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t.titlePlaceholder}
                  className={errors.title ? 'border-destructive' : ''}
                />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t.lessonDescription}</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t.descriptionPlaceholder}
                  rows={3}
                  className={errors.description ? 'border-destructive' : ''}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">{errors.description}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="video">{t.videoFile}</Label>
                <Input
                  id="video"
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  className={errors.videoFile ? 'border-destructive' : ''}
                />
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>{t.maxFileSize}</p>
                  <p>{t.supportedFormats}</p>
                </div>
                {errors.videoFile && (
                  <p className="text-sm text-destructive">{errors.videoFile}</p>
                )}
                {videoFile && (
                  <p className="text-sm text-green-600">
                    Selected: {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(1)}MB)
                  </p>
                )}
              </div>

              {uploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Upload Progress</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                  {uploadStartTime && uploadProgress > 5 && (
                    <p className="text-sm text-muted-foreground text-center">
                      {getTimeRemaining()}
                    </p>
                  )}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={uploading}>
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t.uploading}
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    {t.upload}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}