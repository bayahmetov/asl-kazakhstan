import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { UserMinus, Users } from 'lucide-react';

interface CourseEnrollmentsProps {
  courseId: string;
}

const translations = {
  en: {
    enrolledStudents: "Enrolled Students",
    noStudents: "No students enrolled yet",
    loading: "Loading...",
    removeStudent: "Remove Student",
    confirmRemoval: "Confirm Removal",
    removalWarning: "Are you sure you want to remove this student from the course? They will lose access to all lessons and materials.",
    cancel: "Cancel",
    remove: "Remove",
    removeSuccess: "Student removed successfully",
    removeError: "Failed to remove student",
    enrolledOn: "Enrolled on",
  },
  ru: {
    enrolledStudents: "Зачисленные студенты",
    noStudents: "Пока нет зачисленных студентов",
    loading: "Загрузка...",
    removeStudent: "Исключить студента",
    confirmRemoval: "Подтвердить исключение",
    removalWarning: "Вы уверены, что хотите исключить этого студента из курса? Они потеряют доступ ко всем урокам и материалам.",
    cancel: "Отмена",
    remove: "Исключить",
    removeSuccess: "Студент успешно исключен",
    removeError: "Не удалось исключить студента",
    enrolledOn: "Зачислен",
  },
  kk: {
    enrolledStudents: "Тіркелген студенттер",
    noStudents: "Әлі тіркелген студенттер жоқ",
    loading: "Жүктелуде...",
    removeStudent: "Студентті алып тастау",
    confirmRemoval: "Алып тастауды растау",
    removalWarning: "Бұл студентті курстан алып тастағыңыз келетініне сенімдісіз бе? Олар барлық сабақтар мен материалдарға қол жетімділігін жоғалтады.",
    cancel: "Болдырмау",
    remove: "Алып тастау",
    removeSuccess: "Студент сәтті алып тасталды",
    removeError: "Студентті алып тастау сәтсіз аяқталды",
    enrolledOn: "Тіркелген күні",
  },
};

const CourseEnrollments: React.FC<CourseEnrollmentsProps> = ({ courseId }) => {
  const { profile } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const t = translations[language];

  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEnrollments();
  }, [courseId]);

  const fetchEnrollments = async () => {
    try {
      const { data, error } = await supabase
        .from('course_enrollments')
        .select(`
          id,
          student_id,
          created_at,
          profiles!course_enrollments_student_id_fkey (
            full_name,
            email
          )
        `)
        .eq('course_id', courseId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching enrollments:', error);
        return;
      }

      setEnrollments(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeStudent = async (enrollmentId: string) => {
    try {
      const { error } = await supabase
        .from('course_enrollments')
        .delete()
        .eq('id', enrollmentId);

      if (error) {
        console.error('Remove error:', error);
        toast({
          title: t.removeError,
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: t.removeSuccess,
      });

      // Refresh enrollments
      fetchEnrollments();
    } catch (error) {
      console.error('Remove error:', error);
      toast({
        title: t.removeError,
        description: 'An unexpected error occurred',
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t.enrolledStudents}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">{t.loading}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          {t.enrolledStudents} ({enrollments.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {enrollments.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">{t.noStudents}</p>
        ) : (
          <div className="space-y-3">
            {enrollments.map((enrollment) => (
              <div key={enrollment.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                <div>
                  <h4 className="font-medium">{enrollment.profiles?.full_name || 'Unknown Student'}</h4>
                  <p className="text-sm text-muted-foreground">{enrollment.profiles?.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.enrolledOn}: {new Date(enrollment.created_at).toLocaleDateString()}
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <UserMinus className="w-4 h-4 mr-1" />
                      {t.removeStudent}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t.confirmRemoval}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t.removalWarning}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => removeStudent(enrollment.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {t.remove}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CourseEnrollments;