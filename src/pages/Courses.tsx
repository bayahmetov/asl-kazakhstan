import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Clock, Users, Star, CheckCircle } from 'lucide-react';

const Courses = () => {
  const courseCategories = [
    {
      id: 'beginner',
      title: 'Beginner Level',
      description: 'Perfect for those just starting their sign language journey',
      color: 'bg-primary-soft',
      courses: [
        {
          id: 1,
          title: 'RSL Alphabet & Numbers',
          description: 'Master the fundamentals with letters A-Z and numbers 0-100',
          duration: '2 hours',
          lessons: 8,
          students: 127,
          rating: 4.9,
          level: 'Beginner',
          isPopular: true
        },
        {
          id: 2,
          title: 'Basic Greetings & Introductions',
          description: 'Learn essential signs for meeting people and basic conversations',
          duration: '3 hours',
          lessons: 12,
          students: 98,
          rating: 4.8,
          level: 'Beginner'
        },
        {
          id: 3,
          title: 'Family & Relationships',
          description: 'Express family relationships and describe people close to you',
          duration: '2.5 hours',
          lessons: 10,
          students: 85,
          rating: 4.7,
          level: 'Beginner'
        }
      ]
    },
    {
      id: 'intermediate',
      title: 'Intermediate Level',
      description: 'Build on your foundation with more complex conversations',
      color: 'bg-secondary-soft',
      courses: [
        {
          id: 4,
          title: 'Daily Activities & Routines',
          description: 'Describe your daily life, work, and hobbies in sign language',
          duration: '4 hours',
          lessons: 15,
          students: 76,
          rating: 4.8,
          level: 'Intermediate'
        },
        {
          id: 5,
          title: 'Emotions & Feelings',
          description: 'Express complex emotions and discuss mental health topics',
          duration: '3.5 hours',
          lessons: 14,
          students: 62,
          rating: 4.9,
          level: 'Intermediate',
          isNew: true
        }
      ]
    },
    {
      id: 'advanced',
      title: 'Advanced Level',
      description: 'Master fluent communication and cultural nuances',
      color: 'bg-accent-soft',
      courses: [
        {
          id: 6,
          title: 'Professional & Business RSL',
          description: 'Navigate workplace communication and professional settings',
          duration: '5 hours',
          lessons: 18,
          students: 34,
          rating: 4.9,
          level: 'Advanced'
        }
      ]
    }
  ];

  const CourseCard = ({ course }: { course: any }) => (
    <Card className="shadow-soft hover:shadow-medium transition-all group">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {course.level}
              </Badge>
              {course.isPopular && (
                <Badge variant="default" className="text-xs">
                  Most Popular
                </Badge>
              )}
              {course.isNew && (
                <Badge variant="secondary" className="text-xs">
                  New
                </Badge>
              )}
            </div>
            <CardTitle className="text-xl group-hover:text-primary transition-colors">
              {course.title}
            </CardTitle>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Star className="h-4 w-4 fill-current text-yellow-500" />
            {course.rating}
          </div>
        </div>
        <p className="text-muted-foreground leading-relaxed">
          {course.description}
        </p>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="grid grid-cols-3 gap-4 mb-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {course.duration}
          </div>
          <div className="flex items-center gap-1">
            <Play className="h-4 w-4" />
            {course.lessons} lessons
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {course.students} students
          </div>
        </div>
        
        <div className="space-y-3">
          <Button className="w-full focus-outline">
            <Play className="mr-2 h-4 w-4" />
            Start Course
          </Button>
          <Button variant="outline" className="w-full focus-outline">
            Preview Lessons
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <main id="main-content" className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl lg:text-5xl font-bold text-high-contrast mb-4">
            Video Lessons & Courses
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Learn sign language at your own pace with our structured video courses. 
            From basic alphabet to advanced conversations, we have lessons for every level.
          </p>
        </div>

        {/* Course Categories */}
        <div className="space-y-16">
          {courseCategories.map((category) => (
            <section key={category.id} className="space-y-8">
              {/* Category Header */}
              <div className={`rounded-2xl p-8 ${category.color}`}>
                <div className="max-w-3xl">
                  <h2 className="text-2xl lg:text-3xl font-bold text-high-contrast mb-3">
                    {category.title}
                  </h2>
                  <p className="text-lg text-muted-foreground">
                    {category.description}
                  </p>
                </div>
              </div>

              {/* Courses Grid */}
              <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-8">
                {category.courses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Learning Path CTA */}
        <section className="mt-20 text-center">
          <Card className="max-w-4xl mx-auto shadow-medium border-0 card-gradient">
            <CardContent className="p-12">
              <CheckCircle className="h-16 w-16 text-primary mx-auto mb-6" />
              <h2 className="text-2xl lg:text-3xl font-bold text-high-contrast mb-4">
                Not Sure Where to Start?
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Take our quick assessment to find the perfect learning path for your current level 
                and goals. Get personalized course recommendations.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="focus-outline">
                  <Play className="mr-2 h-5 w-5" />
                  Take Skill Assessment
                </Button>
                <Button variant="outline" size="lg" className="focus-outline">
                  Browse All Courses
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
};

export default Courses;