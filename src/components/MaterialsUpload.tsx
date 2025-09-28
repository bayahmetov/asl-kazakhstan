import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, Download, Trash2, Plus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const translations = {
  en: {
    materials: 'Lesson Materials',
    uploadMaterial: 'Upload Material',
    materialTitle: 'Material Title',
    selectFile: 'Select file to upload',
    titlePlaceholder: 'Enter material title',
    upload: 'Upload',
    uploading: 'Uploading...',
    delete: 'Delete',
    deleting: 'Deleting...',
    download: 'Download',
    noMaterials: 'No materials uploaded yet',
    maxFileSize: 'Maximum file size: 50MB',
    supportedFormats: 'Supported formats: PDF, DOC, DOCX, PPT, PPTX, TXT, JPG, PNG',
    success: 'Material uploaded successfully',
    deleteSuccess: 'Material deleted successfully',
    error: 'Failed to upload material',
    deleteError: 'Failed to delete material'
  },
  ru: {
    materials: 'Материалы урока',
    uploadMaterial: 'Загрузить материал',
    materialTitle: 'Название материала',
    selectFile: 'Выберите файл для загрузки',
    titlePlaceholder: 'Введите название материала',
    upload: 'Загрузить',
    uploading: 'Загрузка...',
    delete: 'Удалить',
    deleting: 'Удаление...',
    download: 'Скачать',
    noMaterials: 'Материалы еще не загружены',
    maxFileSize: 'Максимальный размер файла: 50МБ',
    supportedFormats: 'Поддерживаемые форматы: PDF, DOC, DOCX, PPT, PPTX, TXT, JPG, PNG',
    success: 'Материал успешно загружен',
    deleteSuccess: 'Материал успешно удален',
    error: 'Не удалось загрузить материал',
    deleteError: 'Не удалось удалить материал'
  },
  kz: {
    materials: 'Сабақ материалдары',
    uploadMaterial: 'Материал жүктеу',
    materialTitle: 'Материал атауы',
    selectFile: 'Жүктеу үшін файл таңдаңыз',
    titlePlaceholder: 'Материал атауын енгізіңіз',
    upload: 'Жүктеу',
    uploading: 'Жүктелуде...',
    delete: 'Жою',
    deleting: 'Жойылуда...',
    download: 'Жүктеп алу',
    noMaterials: 'Материалдар әлі жүктелмеген',
    maxFileSize: 'Максималды файл өлшемі: 50МБ',
    supportedFormats: 'Қолдау көрсетілетін форматтар: PDF, DOC, DOCX, PPT, PPTX, TXT, JPG, PNG',
    success: 'Материал сәтті жүктелді',
    deleteSuccess: 'Материал сәтті жойылды',
    error: 'Материалды жүктеу сәтсіз аяқталды',
    deleteError: 'Материалды жою сәтсіз аяқталды'
  }
};

interface MaterialsUploadProps {
  lessonId: string;
  courseId: string;
}

export default function MaterialsUpload({ lessonId, courseId }: MaterialsUploadProps) {
  const { profile } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const t = translations[language];

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const { data, error } = await supabase
          .from('lesson_materials')
          .select('*')
          .eq('lesson_id', lessonId)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching materials:', error);
          return;
        }

        setMaterials(data || []);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMaterials();
  }, [lessonId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check file size (50MB limit)
      if (selectedFile.size > 50 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 50MB",
          variant: "destructive"
        });
        return;
      }
      
      setFile(selectedFile);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !file || !profile?.id) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${lessonId}/${fileName}`;

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const { error: uploadError } = await supabase.storage
        .from('lesson-materials')
        .upload(filePath, file);

      clearInterval(progressInterval);

      if (uploadError) {
        throw uploadError;
      }

      setUploadProgress(95);

      // Create material record
      const { data, error } = await supabase
        .from('lesson_materials')
        .insert({
          lesson_id: lessonId,
          title: title.trim(),
          file_url: filePath,
          file_type: file.type,
          file_size: file.size,
          uploaded_by: profile.id
        })
        .select()
        .single();

      if (error) {
        // Clean up uploaded file if record creation fails
        await supabase.storage
          .from('lesson-materials')
          .remove([filePath]);
        throw error;
      }

      setUploadProgress(100);
      setMaterials(prev => [data, ...prev]);
      
      toast({
        title: t.success,
        variant: "default"
      });

      // Reset form
      setTitle('');
      setFile(null);
      setShowUploadForm(false);
      setTimeout(() => setUploadProgress(0), 2000);
    } catch (error: any) {
      console.error('Error uploading material:', error);
      toast({
        title: t.error,
        description: error.message,
        variant: "destructive"
      });
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (materialId: string, fileUrl: string) => {
    setDeletingId(materialId);

    try {
      // Delete file from storage
      if (fileUrl) {
        const { error: storageError } = await supabase.storage
          .from('lesson-materials')
          .remove([fileUrl]);
        
        if (storageError) {
          console.warn('File may not have been deleted:', storageError);
        }
      }

      // Delete record
      const { error } = await supabase
        .from('lesson_materials')
        .delete()
        .eq('id', materialId);

      if (error) throw error;

      setMaterials(prev => prev.filter(m => m.id !== materialId));
      
      toast({
        title: t.deleteSuccess,
        variant: "default"
      });
    } catch (error: any) {
      console.error('Error deleting material:', error);
      toast({
        title: t.deleteError,
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setDeletingId(null);
    }
  };

  const downloadFile = async (fileUrl: string, title: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('lesson-materials')
        .download(fileUrl);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title}.${fileUrl.split('.').pop()}`;
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

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
    return Math.round(bytes / (1024 * 1024)) + ' MB';
  };

  if (loading) {
    return <div className="h-32 w-full bg-muted animate-pulse rounded" />;
  }

  const isInstructor = profile?.role === 'instructor';

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t.materials}
          </CardTitle>
          {isInstructor && !showUploadForm && (
            <Button onClick={() => setShowUploadForm(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              {t.uploadMaterial}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {showUploadForm && isInstructor && (
          <form onSubmit={handleUpload} className="space-y-4 mb-6 p-4 border rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="title">{t.materialTitle}</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t.titlePlaceholder}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">{t.selectFile}</Label>
              <Input
                id="file"
                type="file"
                onChange={handleFileChange}
                required
              />
              <div className="text-xs text-muted-foreground space-y-1">
                <p>{t.maxFileSize}</p>
                <p>{t.supportedFormats}</p>
              </div>
              {file && (
                <p className="text-sm text-green-600">
                  Selected: {file.name} ({formatFileSize(file.size)})
                </p>
              )}
            </div>

            {uploading && uploadProgress > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Upload Progress</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}

            <div className="flex gap-2">
              <Button type="submit" disabled={uploading || !title.trim() || !file}>
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
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowUploadForm(false);
                  setTitle('');
                  setFile(null);
                }}
                disabled={uploading}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        {materials.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">{t.noMaterials}</p>
        ) : (
          <div className="space-y-3">
            {materials.map((material) => (
              <div key={material.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{material.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(material.file_size)} • {new Date(material.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => downloadFile(material.file_url, material.title)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {t.download}
                  </Button>
                  {isInstructor && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(material.id, material.file_url)}
                      disabled={deletingId === material.id}
                    >
                      {deletingId === material.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-destructive" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}