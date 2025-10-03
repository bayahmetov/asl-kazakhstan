import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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
    passwordTooShort: 'Password must be at least 6 characters',
    continueWithGoogle: 'Continue with Google',
    orContinueWith: 'Or continue with',
    forgotPassword: 'Forgot password?',
    resetPassword: 'Reset Password',
    resetPasswordDescription: 'Enter your email and we\'ll send you a reset link',
    sendResetLink: 'Send Reset Link',
    backToSignIn: 'Back to Sign In',
    resetEmailSent: 'Password reset email sent! Check your inbox.'
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
    passwordTooShort: 'Пароль должен содержать минимум 6 символов',
    continueWithGoogle: 'Продолжить с Google',
    orContinueWith: 'Или продолжить с',
    forgotPassword: 'Забыли пароль?',
    resetPassword: 'Сброс пароля',
    resetPasswordDescription: 'Введите ваш email и мы отправим ссылку для сброса',
    sendResetLink: 'Отправить ссылку',
    backToSignIn: 'Вернуться ко входу',
    resetEmailSent: 'Письмо для сброса пароля отправлено! Проверьте почту.'
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
    passwordTooShort: 'Құпия сөз кемінде 6 таңбадан тұруы керек',
    continueWithGoogle: 'Google арқылы жалғастыру',
    orContinueWith: 'Немесе жалғастыру',
    forgotPassword: 'Құпия сөзді ұмыттыңыз ба?',
    resetPassword: 'Құпия сөзді қалпына келтіру',
    resetPasswordDescription: 'Email енгізіңіз, біз сілтеме жібереміз',
    sendResetLink: 'Сілтеме жіберу',
    backToSignIn: 'Кіруге оралу',
    resetEmailSent: 'Құпия сөзді қалпына келтіру хаты жіберілді! Поштаңызды тексеріңіз.'
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
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  
  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(false);
  
  const { user, signIn, signUp } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
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

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });
      
      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sign in with Google",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resetEmail.trim()) {
      toast({
        title: "Error",
        description: t.emailRequired,
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth`
      });
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: t.resetEmailSent
      });
      
      setShowResetPassword(false);
      setResetEmail('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset email",
        variant: "destructive"
      });
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
          {/* Google Sign In Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {t.continueWithGoogle}
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                {t.orContinueWith}
              </span>
            </div>
          </div>

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

              {!isSignUp && (
                <div className="text-center">
                  <Button
                    type="button"
                    variant="link"
                    className="text-sm"
                    onClick={() => setShowResetPassword(true)}
                  >
                    {t.forgotPassword}
                  </Button>
                </div>
              )}
            </form>
          </Tabs>
        </CardContent>
      </Card>

      {/* Reset Password Dialog */}
      <Dialog open={showResetPassword} onOpenChange={setShowResetPassword}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.resetPassword}</DialogTitle>
            <DialogDescription>
              {t.resetPasswordDescription}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">{t.email}</Label>
              <Input
                id="reset-email"
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder={t.emailPlaceholder}
                required
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowResetPassword(false)}
                className="flex-1"
              >
                {t.backToSignIn}
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? '...' : t.sendResetLink}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}