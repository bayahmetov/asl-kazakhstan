import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const translations = {
  en: {
    createCourse: 'Create Course',
    createNewCourse: 'Create a New Course',
    fillDetails: 'Fill in the course details below',
    courseTitle: 'Course Title',
    titlePlaceholder: 'Enter course title...',
    description: 'Description',
    descriptionPlaceholder: 'Enter course description...',
    level: 'Level',
    levelPlaceholder: 'Select course level',
    cancel: 'Cancel',
    create: 'Create Course',
    creating: 'Creating...',
    success: 'Course created successfully!',
    error: 'Failed to create course'
  },
  ru: {
    createCourse: 'Создать курс',
    createNewCourse: 'Создать новый курс',
    fillDetails: 'Заполните детали курса ниже',
    courseTitle: 'Название курса',
    titlePlaceholder: 'Введите название курса...',
    description: 'Описание',
    descriptionPlaceholder: 'Введите описание курса...',
    level: 'Уровень',
    levelPlaceholder: 'Выберите уровень курса',
    cancel: 'Отмена',
    create: 'Создать курс',
    creating: 'Создание...',
    success: 'Курс успешно создан!',
    error: 'Не удалось создать курс'
  },
  kz: {
    createCourse: 'Курс жасау',
    createNewCourse: 'Жаңа курс жасау',
    fillDetails: 'Курс мәліметтерін толтырыңыз',
    courseTitle: 'Курс атауы',
    titlePlaceholder: 'Курс атауын енгізіңіз...',
    description: 'Сипаттама',
    descriptionPlaceholder: 'Курс сипаттамасын енгізіңіз...',
    level: 'Деңгей',
    levelPlaceholder: 'Курс деңгейін таңдаңыз',
    cancel: 'Бас тарту',
    create: 'Курс жасау',
    creating: 'Жасалуда...',
    success: 'Курс сәтті жасалды!',
    error: 'Курс жасау сәтсіз аяқталды'
  }
};

interface CreateCourseDialogProps {
  onCourseCreated: () => void;
}

export default function CreateCourseDialog({ onCourseCreated }: CreateCourseDialogProps) {
  const { profile } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState('beginner');
  const [creating, setCreating] = useState(false);
  
  const t = translations[language];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !description.trim()) {
      return;
    }

    setCreating(true);

    try {
      const { error } = await supabase
        .from('courses')
        .insert({
          title: title.trim(),
          description: description.trim(),
          level: level,
          instructor_id: profile?.id
        });

      if (error) throw error;

      toast({
        title: t.success,
        variant: "default"
      });

      setTitle('');
      setDescription('');
      setLevel('beginner');
      setOpen(false);
      onCourseCreated();
    } catch (error) {
      console.error('Error creating course:', error);
      toast({
        title: t.error,
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  // Only show for instructors
  if (profile?.role !== 'instructor') {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          {t.createCourse}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{t.createNewCourse}</DialogTitle>
            <DialogDescription>
              {t.fillDetails}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">{t.courseTitle}</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t.titlePlaceholder}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">{t.description}</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t.descriptionPlaceholder}
                rows={4}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="level">{t.level}</Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger>
                  <SelectValue placeholder={t.levelPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={creating}
            >
              {t.cancel}
            </Button>
            <Button type="submit" disabled={creating || !title.trim() || !description.trim()}>
              {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {creating ? t.creating : t.create}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}