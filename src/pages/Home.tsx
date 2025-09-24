import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Users, Award, Heart, BookOpen, Video } from 'lucide-react';
import heroImage from '@/assets/asl-hero-image.jpg';

const Home = () => {
  const features = [
    {
      icon: Video,
      title: 'Expert Video Lessons',
      description: 'Learn from certified ASL instructors with high-quality video content and clear demonstrations.'
    },
    {
      icon: Users,
      title: 'Supportive Community',
      description: 'Join a welcoming community of learners and native signers who support each other\'s journey.'
    },
    {
      icon: Award,
      title: 'Structured Learning Path',
      description: 'Progress through carefully designed courses from basic signs to advanced conversation skills.'
    }
  ];

  const testimonials = [
    {
      name: 'Aida Nazarbayeva',
      role: 'Student',
      content: 'ASL Kazakhstan changed my life. The instructors are patient and the community is so welcoming. I can finally communicate with my deaf daughter.',
      avatar: '👩🏻'
    },
    {
      name: 'Marat Sultanov',
      role: 'Parent',
      content: 'The video lessons are clear and easy to follow. My son loves learning sign language here, and the progress has been amazing.',
      avatar: '👨🏻'
    },
    {
      name: 'Zarema Abdullayeva',
      role: 'Teacher',
      content: 'As an educator, I appreciate the structured approach and accessibility features. This platform truly serves the deaf community.',
      avatar: '👩🏻‍🏫'
    }
  ];

  const stats = [
    { number: '500+', label: 'Students' },
    { number: '50+', label: 'Video Lessons' },
    { number: '15+', label: 'Expert Instructors' },
    { number: '3', label: 'Years Experience' }
  ];

  return (
    <main id="main-content" className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="container mx-auto px-4 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge variant="secondary" className="w-fit">
                  🇰🇿 Made in Kazakhstan
                </Badge>
                <h1 className="text-4xl lg:text-6xl font-bold text-high-contrast">
                  Learn Sign Language
                  <span className="block text-primary">with Heart</span>
                </h1>
                <p className="text-xl text-muted-foreground max-w-lg leading-relaxed">
                  Join ASL Kazakhstan and connect with the deaf and hard-of-hearing community. 
                  Learn American Sign Language through expert instruction and inclusive education.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="focus-outline shadow-medium hover:shadow-large transition-all">
                  <Play className="mr-2 h-5 w-5" />
                  Start Learning Today
                </Button>
                <Button variant="outline" size="lg" className="focus-outline">
                  <BookOpen className="mr-2 h-5 w-5" />
                  View Course Catalog
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-8">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center lg:text-left">
                    <div className="text-2xl lg:text-3xl font-bold text-primary">{stat.number}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="relative overflow-hidden rounded-2xl shadow-large">
                <img 
                  src={heroImage} 
                  alt="Diverse hands making sign language gestures in a welcoming, educational setting"
                  className="w-full h-auto object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
              
              {/* Video placeholder overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <Button size="lg" variant="secondary" className="shadow-large focus-outline">
                  <Play className="mr-2 h-6 w-6" />
                  Watch Introduction
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-high-contrast mb-4">
              Why Choose ASL Kazakhstan?
            </h2>
            <p className="text-lg text-muted-foreground">
              We provide accessible, high-quality sign language education designed 
              specifically for the deaf and hard-of-hearing community in Kazakhstan.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="card-gradient border-0 shadow-soft hover:shadow-medium transition-all">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <feature.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-high-contrast mb-4">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-high-contrast mb-4">
              Stories from Our Community
            </h2>
            <p className="text-lg text-muted-foreground">
              Hear from students, parents, and educators who have found their voice through sign language.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="shadow-soft hover:shadow-medium transition-all">
                <CardContent className="p-8">
                  <div className="flex items-center mb-6">
                    <div className="text-3xl mr-4">{testimonial.avatar}</div>
                    <div>
                      <div className="font-semibold text-high-contrast">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                  <p className="text-muted-foreground leading-relaxed italic">
                    "{testimonial.content}"
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24 hero-gradient">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold text-primary-foreground mb-6">
              Ready to Start Your Sign Language Journey?
            </h2>
            <p className="text-xl text-primary-foreground/90 mb-8 leading-relaxed">
              Join hundreds of students learning sign language with ASL Kazakhstan. 
              Start with our free introductory course today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="secondary" size="lg" className="focus-outline shadow-medium">
                <Heart className="mr-2 h-5 w-5" />
                Join Our Community
              </Button>
              <Button variant="outline" size="lg" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary focus-outline">
                <Play className="mr-2 h-5 w-5" />
                Try Free Lesson
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;