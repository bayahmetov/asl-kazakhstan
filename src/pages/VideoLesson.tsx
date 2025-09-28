import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const VideoLesson = () => {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLesson = async () => {
      if (!lessonId) return;

      try {
        const { data, error } = await supabase
          .from('lessons')
          .select('*')
          .eq('id', lessonId)
          .single();

        if (error) {
          console.error('Error fetching lesson:', error);
          return;
        }

        setLesson(data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLesson();
  }, [lessonId]);
  const { language } = useLanguage();
  const [currentLessonIndex, setCurrentLessonIndex] = useState(parseInt(lessonId || '1') - 1);

  // Mock lesson data - this would come from your backend/database
  const lessons = [
    {
      id: 1,
      title: {
        en: 'Basic Greetings in RSL',
        ru: 'Основные приветствия в РЖЯ',
        kk: 'РҚТ негізгі сәлемдесулер'
      },
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      description: {
        en: 'Learn how to greet people using Russian Sign Language',
        ru: 'Научитесь приветствовать людей на русском жестовом языке',
        kk: 'Орыс ым-ишара тілінде адамдармен сәлемдесуді үйреніңіз'
      }
    },
    {
      id: 2,
      title: {
        en: 'Family Signs in RSL',
        ru: 'Жесты семьи в РЖЯ',
        kk: 'РҚТ отбасы белгілері'
      },
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      description: {
        en: 'Learn signs for family members',
        ru: 'Изучите жесты для членов семьи',
        kk: 'Отбасы мүшелеріне арналған белгілерді үйреніңіз'
      }
    },
    {
      id: 3,
      title: {
        en: 'Numbers 1-10 in RSL',
        ru: 'Числа 1-10 в РЖЯ',
        kk: 'РҚТ 1-10 сандары'
      },
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      description: {
        en: 'Learn to count from 1 to 10 in Russian Sign Language',
        ru: 'Научитесь считать от 1 до 10 на русском жестовом языке',
        kk: 'Орыс ым-ишара тілінде 1-ден 10-ға дейін санауды үйреніңіз'
      }
    }
  ];

  const currentLesson = lessons[currentLessonIndex];

  const goToPreviousLesson = () => {
    if (currentLessonIndex > 0) {
      setCurrentLessonIndex(currentLessonIndex - 1);
      navigate(`/courses/${courseId}/lesson/${currentLessonIndex}`);
    }
  };

  const goToNextLesson = () => {
    if (currentLessonIndex < lessons.length - 1) {
      setCurrentLessonIndex(currentLessonIndex + 1);
      navigate(`/courses/${courseId}/lesson/${currentLessonIndex + 2}`);
    }
  };

  const translations = {
    backToCourses: {
      en: 'Back to Courses',
      ru: 'Назад к курсам',
      kk: 'Курстарға оралу'
    },
    lesson: {
      en: 'Lesson',
      ru: 'Урок',
      kk: 'Сабақ'
    },
    previous: {
      en: 'Previous',
      ru: 'Предыдущий',
      kk: 'Алдыңғы'
    },
    next: {
      en: 'Next',
      ru: 'Следующий',
      kk: 'Келесі'
    }
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/courses')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {translations.backToCourses[language]}
        </Button>

        {/* Lesson header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <span>{translations.lesson[language]} {currentLessonIndex + 1} / {lessons.length}</span>
          </div>
          <h1 className="text-3xl font-bold mb-4">
            {currentLesson?.title[language]}
          </h1>
          <p className="text-lg text-muted-foreground">
            {currentLesson?.description[language]}
          </p>
        </div>

        {/* Video container */}
        <div className="bg-card rounded-lg shadow-lg overflow-hidden mb-8">
          <div className="aspect-video">
            <iframe
              src={currentLesson?.videoUrl}
              title={currentLesson?.title[language]}
              className="w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>

        {/* Navigation controls */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={goToPreviousLesson}
            disabled={currentLessonIndex === 0}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            {translations.previous[language]}
          </Button>

          <div className="flex gap-2">
            {lessons.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentLessonIndex(index);
                  navigate(`/courses/${courseId}/lesson/${index + 1}`);
                }}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentLessonIndex 
                    ? 'bg-primary' 
                    : 'bg-muted hover:bg-muted-foreground'
                }`}
              />
            ))}
          </div>

          <Button
            onClick={goToNextLesson}
            disabled={currentLessonIndex === lessons.length - 1}
            className="flex items-center gap-2"
          >
            {translations.next[language]}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VideoLesson;