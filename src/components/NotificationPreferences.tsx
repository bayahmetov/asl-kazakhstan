import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Bell, Mail } from 'lucide-react';

interface NotificationPrefs {
  email_lesson_published: boolean;
  email_homework_submitted: boolean;
  email_homework_feedback: boolean;
  email_course_enrolled: boolean;
  email_support_reply: boolean;
  email_message_reply: boolean;
  in_app_enabled: boolean;
}

export const NotificationPreferences = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<NotificationPrefs>({
    email_lesson_published: true,
    email_homework_submitted: true,
    email_homework_feedback: true,
    email_course_enrolled: true,
    email_support_reply: true,
    email_message_reply: true,
    in_app_enabled: true,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPreferences();
    }
  }, [user]);

  const fetchPreferences = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setPreferences({
          email_lesson_published: data.email_lesson_published,
          email_homework_submitted: data.email_homework_submitted,
          email_homework_feedback: data.email_homework_feedback,
          email_course_enrolled: data.email_course_enrolled,
          email_support_reply: data.email_support_reply,
          email_message_reply: data.email_message_reply,
          in_app_enabled: data.in_app_enabled,
        });
      }
    } catch (error: any) {
      console.error('Error fetching preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreference = async (key: keyof NotificationPrefs, value: boolean) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert(
          {
            user_id: user.id,
            [key]: value,
          },
          {
            onConflict: 'user_id',
          }
        );

      if (error) throw error;

      setPreferences((prev) => ({ ...prev, [key]: value }));
      
      toast({
        title: "Preferences Updated",
        description: "Your notification preferences have been saved.",
      });
    } catch (error: any) {
      console.error('Error updating preferences:', error);
      toast({
        title: "Error",
        description: "Failed to update preferences. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading preferences...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Preferences
        </CardTitle>
        <CardDescription>
          Manage how you receive notifications about platform activities
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* In-App Notifications */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-1 flex items-center gap-2">
              <Bell className="h-4 w-4" />
              In-App Notifications
            </h3>
            <p className="text-xs text-muted-foreground">
              Receive notifications within the platform
            </p>
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="in-app" className="flex-1">
              Enable in-app notifications
            </Label>
            <Switch
              id="in-app"
              checked={preferences.in_app_enabled}
              onCheckedChange={(checked) => updatePreference('in_app_enabled', checked)}
            />
          </div>
        </div>

        <Separator />

        {/* Email Notifications */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-1 flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Notifications
            </h3>
            <p className="text-xs text-muted-foreground">
              Receive email notifications for important events
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-lesson" className="flex-1">
                <div className="font-normal">New lesson published</div>
                <div className="text-xs text-muted-foreground">
                  When instructors publish new lessons in your courses
                </div>
              </Label>
              <Switch
                id="email-lesson"
                checked={preferences.email_lesson_published}
                onCheckedChange={(checked) => updatePreference('email_lesson_published', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="email-homework-submit" className="flex-1">
                <div className="font-normal">Homework submitted</div>
                <div className="text-xs text-muted-foreground">
                  When students submit homework (instructors only)
                </div>
              </Label>
              <Switch
                id="email-homework-submit"
                checked={preferences.email_homework_submitted}
                onCheckedChange={(checked) => updatePreference('email_homework_submitted', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="email-homework-feedback" className="flex-1">
                <div className="font-normal">Homework feedback</div>
                <div className="text-xs text-muted-foreground">
                  When instructors provide feedback on your homework
                </div>
              </Label>
              <Switch
                id="email-homework-feedback"
                checked={preferences.email_homework_feedback}
                onCheckedChange={(checked) => updatePreference('email_homework_feedback', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="email-enrolled" className="flex-1">
                <div className="font-normal">Course enrollment</div>
                <div className="text-xs text-muted-foreground">
                  When you are enrolled in a new course
                </div>
              </Label>
              <Switch
                id="email-enrolled"
                checked={preferences.email_course_enrolled}
                onCheckedChange={(checked) => updatePreference('email_course_enrolled', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="email-support" className="flex-1">
                <div className="font-normal">Support ticket reply</div>
                <div className="text-xs text-muted-foreground">
                  When you receive a reply on your support ticket
                </div>
              </Label>
              <Switch
                id="email-support"
                checked={preferences.email_support_reply}
                onCheckedChange={(checked) => updatePreference('email_support_reply', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="email-message" className="flex-1">
                <div className="font-normal">Contact message reply</div>
                <div className="text-xs text-muted-foreground">
                  When an admin replies to your contact message
                </div>
              </Label>
              <Switch
                id="email-message"
                checked={preferences.email_message_reply}
                onCheckedChange={(checked) => updatePreference('email_message_reply', checked)}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};