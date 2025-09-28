import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
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
import { Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const translations = {
  en: {
    deleteCourse: 'Delete Course',
    confirmDelete: 'Are you sure?',
    deleteWarning: 'Are you sure you want to delete this course? All lessons and videos will also be permanently deleted. This action cannot be undone.',
    cancel: 'Cancel',
    delete: 'Delete Course',
    deleting: 'Deleting...',
    success: 'Course deleted successfully',
    error: 'Failed to delete course'
  },
  ru: {
    deleteCourse: 'Удалить курс',
    confirmDelete: 'Вы уверены?',
    deleteWarning: 'Вы уверены, что хотите удалить этот курс? Все уроки и видео также будут безвозвратно удалены. Это действие нельзя отменить.',
    cancel: 'Отмена',
    delete: 'Удалить курс',
    deleting: 'Удаление...',
    success: 'Курс успешно удален',
    error: 'Не удалось удалить курс'
  },
  kz: {
    deleteCourse: 'Курсты жою',
    confirmDelete: 'Сіз сенімдісіз бе?',
    deleteWarning: 'Бұл курсты жоюға сенімдісіз бе? Барлық сабақтар мен видеолар да толығымен жойылады. Бұл әрекетті қайтару мүмкін емес.',
    cancel: 'Бас тарту',
    delete: 'Курсты жою',
    deleting: 'Жойылуда...',
    success: 'Курс сәтті жойылды',
    error: 'Курсты жою сәтсіз аяқталды'
  }
};

interface DeleteCourseDialogProps {
  courseId: string;
  courseName: string;
}

export default function DeleteCourseDialog({ courseId, courseName }: DeleteCourseDialogProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [deleting, setDeleting] = useState(false);
  
  const t = translations[language];

  const handleDelete = async () => {
    setDeleting(true);

    try {
      // First, get all lessons for this course to delete their videos
      const { data: lessons, error: lessonsError } = await supabase
        .from('lessons')
        .select('storage_key')
        .eq('course_id', courseId);

      if (lessonsError) throw lessonsError;

      // Delete all lesson videos from storage
      if (lessons && lessons.length > 0) {
        const filePaths = lessons.map(lesson => lesson.storage_key);
        const { error: storageError } = await supabase.storage
          .from('lesson-videos')
          .remove(filePaths);
        
        if (storageError) {
          console.warn('Some videos may not have been deleted:', storageError);
        }
      }

      // Delete the course (lessons will be deleted automatically due to CASCADE)
      const { error: deleteError } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);

      if (deleteError) throw deleteError;

      toast({
        title: t.success,
        variant: "default"
      });

      // Navigate back to courses list
      navigate('/courses');
    } catch (error: any) {
      console.error('Error deleting course:', error);
      toast({
        title: t.error,
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 className="w-4 h-4 mr-2" />
          {t.deleteCourse}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t.confirmDelete}</AlertDialogTitle>
          <AlertDialogDescription>
            {t.deleteWarning}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>
            {t.cancel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t.deleting}
              </>
            ) : (
              t.delete
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}