import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock } from 'lucide-react';

const translations = {
  en: {
    courseProgress: 'Course Progress',
    completed: 'Completed',
    inProgress: 'In Progress',
    notStarted: 'Not Started',
    lessonsCompleted: 'lessons completed'
  },
  ru: {
    courseProgress: 'Прогресс курса',
    completed: 'Завершен',
    inProgress: 'В процессе',
    notStarted: 'Не начат',
    lessonsCompleted: 'уроков завершено'
  },
  kz: {
    courseProgress: 'Курс прогресі',
    completed: 'Аяқталды',
    inProgress: 'Процесте',
    notStarted: 'Басталмады',
    lessonsCompleted: 'сабақ аяқталды'
  }
};

interface CourseProgressProps {
  courseId: string;
  totalLessons: number;
}

export default function CourseProgress({ courseId, totalLessons }: CourseProgressProps) {
  const { profile } = useAuth();
  const { language } = useLanguage();
  const [completedLessons, setCompletedLessons] = useState(0);
  const [loading, setLoading] = useState(true);

  const t = translations[language];

  useEffect(() => {
    const fetchProgress = async () => {
      if (!profile?.id || !courseId) return;

      try {
        // Get all lessons for this course
        const { data: lessons, error: lessonsError } = await supabase
          .from('lessons')
          .select('id')
          .eq('course_id', courseId);

        if (lessonsError) {
          console.error('Error fetching lessons:', lessonsError);
          return;
        }

        if (!lessons || lessons.length === 0) {
          setCompletedLessons(0);
          return;
        }

        // Get completed lessons count
        const { data: progress, error: progressError } = await supabase
          .from('lesson_progress')
          .select('id')
          .eq('student_id', profile.id)
          .eq('completed', true)
          .in('lesson_id', lessons.map(l => l.id));

        if (progressError) {
          console.error('Error fetching progress:', progressError);
          return;
        }

        setCompletedLessons(progress?.length || 0);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [courseId, profile?.id]);

  if (loading) {
    return <div className="h-16 w-full bg-muted animate-pulse rounded" />;
  }

  // Only show for students
  if (profile?.role !== 'student') {
    return null;
  }

  const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const isCompleted = progressPercentage === 100;
  const isStarted = completedLessons > 0;

  let status = t.notStarted;
  let statusColor = 'secondary';
  
  if (isCompleted) {
    status = t.completed;
    statusColor = 'default';
  } else if (isStarted) {
    status = t.inProgress;
    statusColor = 'outline';
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium flex items-center gap-2">
          {isCompleted ? (
            <CheckCircle className="h-4 w-4 text-green-600" />
          ) : (
            <Clock className="h-4 w-4 text-muted-foreground" />
          )}
          {t.courseProgress}
        </h3>
        <Badge variant={statusColor as any}>
          {status}
        </Badge>
      </div>
      
      <Progress value={progressPercentage} className="h-2" />
      
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>{completedLessons}/{totalLessons} {t.lessonsCompleted}</span>
        <span>{progressPercentage}%</span>
      </div>
    </div>
  );
}