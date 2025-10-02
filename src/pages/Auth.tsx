import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { z } from 'zod';

const translations = {
  en: {
    signIn: 'Sign In',
    signUp: 'Sign Up',
    email: 'Email',
    password: 'Password',
    fullName: 'Full Name',
    role: 'Role',
    student: 'Student',
    instructor: 'Instructor',
    signInDescription: 'Sign in to your account to access courses',
    signUpDescription: 'Create a new account to get started',
    signInButton: 'Sign In',
    signUpButton: 'Create Account',
    emailPlaceholder: 'Enter your email',
    passwordPlaceholder: 'Enter your password',
    fullNamePlaceholder: 'Enter your full name',
    selectRole: 'Select your role',
    emailRequired: 'Email is required',
    passwordRequired: 'Password is required',
    fullNameRequired: 'Full name is required',
    invalidEmail: 'Please enter a valid email',
    passwordTooShort: 'Password must be at least 6 characters'
  },
  ru: {
    signIn: 'Вход',
    signUp: 'Регистрация',
    email: 'Электронная почта',
    password: 'Пароль',
    fullName: 'Полное имя',
    role: 'Роль',
    student: 'Студент',
    instructor: 'Преподаватель',
    signInDescription: 'Войдите в свой аккаунт для доступа к курсам',
    signUpDescription: 'Создайте новый аккаунт для начала работы',
    signInButton: 'Войти',
    signUpButton: 'Создать аккаунт',
    emailPlaceholder: 'Введите ваш email',
    passwordPlaceholder: 'Введите ваш пароль',
    fullNamePlaceholder: 'Введите ваше полное имя',
    selectRole: 'Выберите вашу роль',
    emailRequired: 'Email обязателен',
    passwordRequired: 'Пароль обязателен',
    fullNameRequired: 'Полное имя обязательно',
    invalidEmail: 'Введите корректный email',
    passwordTooShort: 'Пароль должен содержать минимум 6 символов'
  },
  kz: {
    signIn: 'Кіру',
    signUp: 'Тіркелу',
    email: 'Электрондық пошта',
    password: 'Құпия сөз',
    fullName: 'Толық аты',
    role: 'Рөл',
    student: 'Студент',
    instructor: 'Дәрісші',
    signInDescription: 'Курстарға қол жеткізу үшін аккаунтыңызға кіріңіз',
    signUpDescription: 'Бастау үшін жаңа аккаунт жасаңыз',
    signInButton: 'Кіру',
    signUpButton: 'Аккаунт жасау',
    emailPlaceholder: 'Email енгізіңіз',
    passwordPlaceholder: 'Құпия сөзіңізді енгізіңіз',
    fullNamePlaceholder: 'Толық атыңызды енгізіңіз',
    selectRole: 'Рөліңізді таңдаңыз',
    emailRequired: 'Email міндетті',
    passwordRequired: 'Құпия сөз міндетті',
    fullNameRequired: 'Толық аты міндетті',
    invalidEmail: 'Дұрыс email енгізіңіз',
    passwordTooShort: 'Құпия сөз кемінде 6 таңбадан тұруы керек'
  }
};

const signUpSchema = z.object({
  email: z.string()
    .trim()
    .email("Please enter a valid email address")
    .max(255, "Email must be less than 255 characters"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be less than 72 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  fullName: z.string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must be less than 100 characters"),
});

const signInSchema = z.object({
  email: z.string()
    .trim()
    .email("Please enter a valid email address")
    .max(255, "Email must be less than 255 characters"),
  password: z.string()
    .min(1, "Password is required")
    .max(72, "Password must be less than 72 characters"),
});

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(false);
  
  const { user, signIn, signUp } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  
  const t = translations[language];
  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const validateForm = () => {
    try {
      const data = isSignUp 
        ? { email, password, fullName }
        : { email, password };
      
      const schema = isSignUp ? signUpSchema : signInSchema;
      schema.parse(data);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: any = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0]] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      if (isSignUp) {
        await signUp(email, password, fullName);
      } else {
        await signIn(email, password);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">
            {isSignUp ? t.signUp : t.signIn}
          </CardTitle>
          <CardDescription className="text-center">
            {isSignUp ? t.signUpDescription : t.signInDescription}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={isSignUp ? 'signup' : 'signin'} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger 
                value="signin" 
                onClick={() => setIsSignUp(false)}
              >
                {t.signIn}
              </TabsTrigger>
              <TabsTrigger 
                value="signup" 
                onClick={() => setIsSignUp(true)}
              >
                {t.signUp}
              </TabsTrigger>
            </TabsList>
            
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t.email}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.emailPlaceholder}
                  className={errors.email ? 'border-destructive' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">{t.password}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.passwordPlaceholder}
                  className={errors.password ? 'border-destructive' : ''}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>

              {isSignUp && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="fullName">{t.fullName}</Label>
                    <Input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={t.fullNamePlaceholder}
                      className={errors.fullName ? 'border-destructive' : ''}
                    />
                    {errors.fullName && (
                      <p className="text-sm text-destructive">{errors.fullName}</p>
                    )}
                  </div>
                  
                </>
              )}
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? '...' : (isSignUp ? t.signUpButton : t.signInButton)}
              </Button>
            </form>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}