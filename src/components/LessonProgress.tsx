import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Circle, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const translations = {
  en: {
    markComplete: 'Mark as Complete',
    markIncomplete: 'Mark as Incomplete',
    completed: 'Completed',
    progress: 'Progress',
    completedOn: 'Completed on'
  },
  ru: {
    markComplete: 'Отметить как завершенный',
    markIncomplete: 'Отметить как незавершенный',
    completed: 'Завершено',
    progress: 'Прогресс',
    completedOn: 'Завершено'
  },
  kz: {
    markComplete: 'Аяқталды деп белгілеу',
    markIncomplete: 'Аяқталмады деп белгілеу',
    completed: 'Аяқталды',
    progress: 'Прогресс',
    completedOn: 'Аяқталған күн'
  }
};

interface LessonProgressProps {
  lessonId: string;
  courseId: string;
}

export default function LessonProgress({ lessonId, courseId }: LessonProgressProps) {
  const { profile } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const t = translations[language];

  useEffect(() => {
    const fetchProgress = async () => {
      if (!profile?.id) return;

      try {
        const { data, error } = await supabase
          .from('lesson_progress')
          .select('*')
          .eq('lesson_id', lessonId)
          .eq('student_id', profile.id)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching progress:', error);
          return;
        }

        setProgress(data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [lessonId, profile?.id]);

  const toggleCompletion = async () => {
    if (!profile?.id || updating) return;

    setUpdating(true);

    try {
      if (progress && progress.completed) {
        // Mark as incomplete
        const { error } = await supabase
          .from('lesson_progress')
          .update({ 
            completed: false, 
            completed_at: null,
            progress_percentage: 0,
            updated_at: new Date().toISOString()
          })
          .eq('id', progress.id);

        if (error) throw error;

        setProgress({ ...progress, completed: false, completed_at: null, progress_percentage: 0 });
      } else {
        // Mark as complete or create new progress record
        const progressData = {
          lesson_id: lessonId,
          student_id: profile.id,
          completed: true,
          completed_at: new Date().toISOString(),
          progress_percentage: 100,
          updated_at: new Date().toISOString()
        };

        if (progress) {
          // Update existing
          const { error } = await supabase
            .from('lesson_progress')
            .update(progressData)
            .eq('id', progress.id);

          if (error) throw error;
          setProgress({ ...progress, ...progressData });
        } else {
          // Create new
          const { data, error } = await supabase
            .from('lesson_progress')
            .insert(progressData)
            .select()
            .single();

          if (error) throw error;
          setProgress(data);
        }
      }

      toast({
        title: progress?.completed ? 'Lesson marked as incomplete' : 'Lesson completed!',
        variant: "default"
      });
    } catch (error: any) {
      console.error('Error updating progress:', error);
      toast({
        title: 'Error',
        description: 'Failed to update progress',
        variant: 'destructive'
      });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div className="h-8 w-32 bg-muted animate-pulse rounded" />;
  }

  // Only show for students
  if (profile?.role !== 'student') {
    return null;
  }

  const isCompleted = progress?.completed || false;
  const completedAt = progress?.completed_at;

  return (
    <div className="flex items-center gap-4">
      <Button
        onClick={toggleCompletion}
        disabled={updating}
        variant={isCompleted ? "default" : "outline"}
        size="sm"
        className="flex items-center gap-2"
      >
        {isCompleted ? (
          <CheckCircle className="h-4 w-4" />
        ) : (
          <Circle className="h-4 w-4" />
        )}
        {isCompleted ? t.markIncomplete : t.markComplete}
      </Button>

      {isCompleted && completedAt && (
        <span className="text-sm text-muted-foreground">
          {t.completedOn}: {new Date(completedAt).toLocaleDateString()}
        </span>
      )}
    </div>
  );
}