import React, { useState } from 'react';
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
    deleteLesson: 'Delete',
    confirmDelete: 'Delete Lesson?',
    deleteWarning: 'Are you sure you want to delete this lesson? The video file will also be permanently removed. This action cannot be undone.',
    cancel: 'Cancel',
    delete: 'Delete Lesson',
    deleting: 'Deleting...',
    success: 'Lesson deleted successfully',
    error: 'Failed to delete lesson'
  },
  ru: {
    deleteLesson: 'Удалить',
    confirmDelete: 'Удалить урок?',
    deleteWarning: 'Вы уверены, что хотите удалить этот урок? Видеофайл также будет безвозвратно удален. Это действие нельзя отменить.',
    cancel: 'Отмена',
    delete: 'Удалить урок',
    deleting: 'Удаление...',
    success: 'Урок успешно удален',
    error: 'Не удалось удалить урок'
  },
  kz: {
    deleteLesson: 'Жою',
    confirmDelete: 'Сабақты жою керек пе?',
    deleteWarning: 'Бұл сабақты жоюға сенімдісіз бе? Видео файл да толығымен жойылады. Бұл әрекетті қайтару мүмкін емес.',
    cancel: 'Бас тарту',
    delete: 'Сабақты жою',
    deleting: 'Жойылуда...',
    success: 'Сабақ сәтті жойылды',
    error: 'Сабақты жою сәтсіз аяқталды'
  }
};

interface DeleteLessonDialogProps {
  lessonId: string;
  lessonTitle: string;
  storageKey: string;
  onLessonDeleted: () => void;
}

export default function DeleteLessonDialog({ 
  lessonId, 
  lessonTitle, 
  storageKey, 
  onLessonDeleted 
}: DeleteLessonDialogProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [deleting, setDeleting] = useState(false);
  const [open, setOpen] = useState(false);
  
  const t = translations[language];

  const handleDelete = async () => {
    setDeleting(true);

    try {
      // Delete video file from storage
      if (storageKey) {
        const { error: storageError } = await supabase.storage
          .from('lesson-videos')
          .remove([storageKey]);
        
        if (storageError) {
          console.warn('Video file may not have been deleted:', storageError);
        }
      }

      // Delete lesson record
      const { error: deleteError } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId);

      if (deleteError) throw deleteError;

      toast({
        title: t.success,
        variant: "default"
      });

      setOpen(false);
      onLessonDeleted();
    } catch (error: any) {
      console.error('Error deleting lesson:', error);
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
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Trash2 className="w-4 h-4 text-destructive" />
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