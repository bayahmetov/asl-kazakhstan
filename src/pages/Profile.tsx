import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { User, Upload, LogOut } from 'lucide-react';
import { z } from 'zod';

const translations = {
  en: {
    profile: 'Profile',
    firstName: 'First Name',
    lastName: 'Last Name',
    email: 'Email',
    avatar: 'Avatar',
    changeAvatar: 'Change Avatar',
    updateProfile: 'Update Profile',
    changePassword: 'Change Password',
    newPassword: 'New Password',
    confirmPassword: 'Confirm Password',
    updatePassword: 'Update Password',
    logout: 'Log Out',
    firstNamePlaceholder: 'Enter your first name',
    lastNamePlaceholder: 'Enter your last name',
    passwordPlaceholder: 'Enter new password',
    confirmPasswordPlaceholder: 'Confirm new password',
    updating: 'Updating...',
    profileUpdated: 'Profile updated successfully',
    passwordUpdated: 'Password updated successfully',
    passwordMismatch: 'Passwords do not match',
    passwordTooShort: 'Password must be at least 6 characters',
    avatarUpdated: 'Avatar updated successfully',
    role: 'Role'
  },
  ru: {
    profile: 'Профиль',
    firstName: 'Имя',
    lastName: 'Фамилия',
    email: 'Email',
    avatar: 'Аватар',
    changeAvatar: 'Изменить аватар',
    updateProfile: 'Обновить профиль',
    changePassword: 'Изменить пароль',
    newPassword: 'Новый пароль',
    confirmPassword: 'Подтвердить пароль',
    updatePassword: 'Обновить пароль',
    logout: 'Выйти',
    firstNamePlaceholder: 'Введите ваше имя',
    lastNamePlaceholder: 'Введите вашу фамилию',
    passwordPlaceholder: 'Введите новый пароль',
    confirmPasswordPlaceholder: 'Подтвердите новый пароль',
    updating: 'Обновление...',
    profileUpdated: 'Профиль успешно обновлен',
    passwordUpdated: 'Пароль успешно обновлен',
    passwordMismatch: 'Пароли не совпадают',
    passwordTooShort: 'Пароль должен содержать минимум 6 символов',
    avatarUpdated: 'Аватар успешно обновлен',
    role: 'Роль'
  },
  kz: {
    profile: 'Профиль',
    firstName: 'Аты',
    lastName: 'Тегі',
    email: 'Email',
    avatar: 'Аватар',
    changeAvatar: 'Аватарды өзгерту',
    updateProfile: 'Профильді жаңарту',
    changePassword: 'Құпия сөзді өзгерту',
    newPassword: 'Жаңа құпия сөз',
    confirmPassword: 'Құпия сөзді растау',
    updatePassword: 'Құпия сөзді жаңарту',
    logout: 'Шығу',
    firstNamePlaceholder: 'Атыңызды енгізіңіз',
    lastNamePlaceholder: 'Тегіңізді енгізіңіз',
    passwordPlaceholder: 'Жаңа құпия сөзді енгізіңіз',
    confirmPasswordPlaceholder: 'Құпия сөзді растаңыз',
    updating: 'Жаңартылуда...',
    profileUpdated: 'Профиль сәтті жаңартылды',
    passwordUpdated: 'Құпия сөз сәтті жаңартылды',
    passwordMismatch: 'Құпия сөздер сәйкес келмейді',
    passwordTooShort: 'Құпия сөз кемінде 6 таңбадан тұруы керек',
    avatarUpdated: 'Аватар сәтті жаңартылды',
    role: 'Рөл'
  }
};

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name must be less than 50 characters').optional(),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name must be less than 50 characters').optional(),
});

const passwordSchema = z.object({
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function Profile() {
  const { user, profile, signOut } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const t = translations[language];

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [profileErrors, setProfileErrors] = useState<any>({});
  const [passwordErrors, setPasswordErrors] = useState<any>({});
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      const [first, ...lastParts] = (profile.full_name || '').split(' ');
      setFirstName(first || '');
      setLastName(lastParts.join(' ') || '');
    }
  }, [profile]);

  const validateProfile = () => {
    try {
      profileSchema.parse({ firstName, lastName });
      setProfileErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: any = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0]] = err.message;
          }
        });
        setProfileErrors(newErrors);
      }
      return false;
    }
  };

  const validatePassword = () => {
    try {
      passwordSchema.parse({ newPassword, confirmPassword });
      setPasswordErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: any = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0]] = err.message;
          }
        });
        setPasswordErrors(newErrors);
      }
      return false;
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 2MB",
          variant: "destructive"
        });
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please select a JPEG, PNG, or WebP image",
          variant: "destructive"
        });
        return;
      }

      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateProfile() || !user) return;

    setProfileLoading(true);
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: t.profileUpdated
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePassword()) return;

    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setNewPassword('');
      setConfirmPassword('');
      toast({
        title: "Success",
        description: t.passwordUpdated
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update password",
        variant: "destructive"
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile || !user) return;

    setAvatarLoading(true);
    try {
      // Upload avatar to storage
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, avatarFile, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile with avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: data.publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setAvatarFile(null);
      setAvatarPreview(null);
      toast({
        title: "Success",
        description: t.avatarUpdated
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update avatar",
        variant: "destructive"
      });
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
  };

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">{t.profile}</h1>
        </div>

        {/* Avatar Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              {t.avatar}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={avatarPreview || profile.avatar_url || ''} alt="Avatar" />
                <AvatarFallback>
                  {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="mb-2"
                />
                <p className="text-xs text-muted-foreground">
                  Maximum file size: 2MB. Supported formats: JPEG, PNG, WebP
                </p>
              </div>
            </div>
            {avatarFile && (
              <Button 
                onClick={handleAvatarUpload} 
                disabled={avatarLoading}
                className="w-full"
              >
                {avatarLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {t.updating}
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    {t.changeAvatar}
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle>{t.profile}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">{t.firstName}</Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder={t.firstNamePlaceholder}
                    className={profileErrors.firstName ? 'border-destructive' : ''}
                  />
                  {profileErrors.firstName && (
                    <p className="text-sm text-destructive">{profileErrors.firstName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">{t.lastName}</Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder={t.lastNamePlaceholder}
                    className={profileErrors.lastName ? 'border-destructive' : ''}
                  />
                  {profileErrors.lastName && (
                    <p className="text-sm text-destructive">{profileErrors.lastName}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t.email}</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">{t.role}</Label>
                <Input
                  id="role"
                  type="text"
                  value={profile.role}
                  disabled
                  className="bg-muted"
                />
              </div>

              <Button type="submit" disabled={profileLoading} className="w-full">
                {profileLoading ? t.updating : t.updateProfile}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle>{t.changePassword}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">{t.newPassword}</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t.passwordPlaceholder}
                  className={passwordErrors.newPassword ? 'border-destructive' : ''}
                />
                {passwordErrors.newPassword && (
                  <p className="text-sm text-destructive">{passwordErrors.newPassword}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t.confirmPassword}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t.confirmPasswordPlaceholder}
                  className={passwordErrors.confirmPassword ? 'border-destructive' : ''}
                />
                {passwordErrors.confirmPassword && (
                  <p className="text-sm text-destructive">{passwordErrors.confirmPassword}</p>
                )}
              </div>

              <Button type="submit" disabled={passwordLoading} className="w-full">
                {passwordLoading ? t.updating : t.updatePassword}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Logout */}
        <Card>
          <CardContent className="pt-6">
            <Button 
              onClick={handleLogout} 
              variant="destructive" 
              className="w-full"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {t.logout}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}