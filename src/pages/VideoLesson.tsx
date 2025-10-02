import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LessonProgress from '@/components/LessonProgress';
import HomeworkUpload from '@/components/HomeworkUpload';
import MaterialsUpload from '@/components/MaterialsUpload';
import { ArrowLeft, Play } from 'lucide-react';

const VideoLesson = () => {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loadingVideo, setLoadingVideo] = useState(false);

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
        
        // Fetch secure video URL
        await fetchVideoUrl();
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchVideoUrl = async () => {
      setLoadingVideo(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.error('No active session');
          return;
        }

        const { data, error } = await supabase.functions.invoke('get-video-url', {
          body: { lessonId },
        });

        if (error) {
          console.error('Error fetching video URL:', error);
          return;
        }

        setVideoUrl(data.signedUrl);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoadingVideo(false);
      }
    };

    fetchLesson();
  }, [lessonId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Lesson not found</h1>
          <Button onClick={() => navigate(`/courses/${courseId}`)} variant="outline">
            Back to Course
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Button 
        onClick={() => navigate(`/courses/${courseId}`)} 
        variant="outline" 
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Course
      </Button>

      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              {lesson.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-video bg-black rounded-lg mb-4 flex items-center justify-center">
              {loadingVideo ? (
                <div className="text-white">Loading video...</div>
              ) : videoUrl ? (
                <video 
                  controls 
                  controlsList="nodownload"
                  disablePictureInPicture
                  className="w-full h-full rounded-lg"
                  src={videoUrl}
                  onContextMenu={(e) => e.preventDefault()}
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div className="text-white text-center">
                  <Play className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>Video not available</p>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">About this lesson</h3>
                <p className="text-muted-foreground">{lesson.description || 'No description available'}</p>
              </div>
              
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Duration: {lesson.duration ? `${Math.floor(lesson.duration / 60)}:${(lesson.duration % 60).toString().padStart(2, '0')}` : 'Unknown'}</span>
                <span>Created: {new Date(lesson.created_at).toLocaleDateString()}</span>
              </div>

              {/* Lesson Progress Component */}
              {lessonId && courseId && (
                <LessonProgress lessonId={lessonId} courseId={courseId} />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Homework Upload */}
        {lessonId && (
          <HomeworkUpload lessonId={lessonId} />
        )}

        {/* Materials Upload (for instructors) */}
        {lessonId && courseId && (
          <MaterialsUpload lessonId={lessonId} courseId={courseId} />
        )}
      </div>
    </div>
  );
};

export default VideoLesson;