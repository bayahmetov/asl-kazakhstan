import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, Users, Award, Heart, BookOpen, Video } from 'lucide-react';
import heroImage from '@/assets/rsl-hero-image.jpg';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  const features = [
    {
      icon: Video,
      title: t('home.qualityInstruction'),
      description: t('home.qualityDesc')
    },
    {
      icon: Users,
      title: t('home.supportiveCommunity'),
      description: t('home.supportiveDesc')
    },
    {
      icon: Award,
      title: t('home.accessibleDesign'),
      description: t('home.accessibleDesc')
    }
  ];

  const testimonials = [
    {
      name: t('home.testimonial1Author'),
      role: t('home.testimonial1Role'),
      content: t('home.testimonial1'),
      avatar: '👩🏻'
    },
    {
      name: t('home.testimonial2Author'),
      role: t('home.testimonial2Role'),
      content: t('home.testimonial2'),
      avatar: '👨🏻'
    },
    {
      name: t('home.testimonial3Author'),
      role: t('home.testimonial3Role'),
      content: t('home.testimonial3'),
      avatar: '👩🏻‍🏫'
    }
  ];

  const stats = [
    { number: '500+', label: t('stats.students') },
    { number: '50+', label: t('stats.lessons') },
    { number: '15+', label: t('stats.instructors') },
    { number: '3', label: t('stats.experience') }
  ];

  return (
    <main id="main-content" className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5 py-20 lg:py-32">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-10">
              <div className="space-y-6">
                <Badge variant="secondary" className="w-fit px-4 py-1.5 text-sm font-medium">
                  🇰🇿 Made in Kazakhstan
                </Badge>
                <h1 className="text-5xl lg:text-7xl font-bold leading-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                  {t('home.heroTitle')}
                </h1>
                <p className="text-xl lg:text-2xl text-muted-foreground max-w-2xl leading-relaxed">
                  {t('home.heroSubtitle')}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="focus-outline shadow-medium hover:shadow-large transition-all text-lg px-8 py-6" onClick={() => navigate('/courses/1/lesson/1')}>
                  <Play className="mr-2 h-6 w-6" />
                  {t('home.startLearning')}
                </Button>
                <Button variant="outline" size="lg" className="focus-outline text-lg px-8 py-6" onClick={() => navigate('/courses')}>
                  <BookOpen className="mr-2 h-6 w-6" />
                  {t('home.exploreCourses')}
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 pt-8">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center lg:text-left">
                    <div className="text-3xl lg:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">{stat.number}</div>
                    <div className="text-sm font-medium text-muted-foreground mt-2">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="relative overflow-hidden rounded-3xl shadow-large ring-1 ring-border/50">
                <img 
                  src={heroImage} 
                  alt="Diverse hands making sign language gestures in a welcoming, educational setting"
                  className="w-full h-auto object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              </div>
              
              {/* Video placeholder overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <Button size="lg" variant="secondary" className="shadow-large focus-outline backdrop-blur-sm bg-background/90" onClick={() => navigate('/courses/1/lesson/1')}>
                  <Play className="mr-2 h-6 w-6" />
                  {t('home.watchIntro')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-32 bg-muted/20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              {t('home.whyChoose')}
            </h2>
            <p className="text-xl text-muted-foreground leading-relaxed">
              We provide accessible, high-quality sign language education designed 
              specifically for the deaf and hard-of-hearing community in Kazakhstan.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-soft hover:shadow-large transition-all duration-300 group">
                <CardContent className="p-10 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform">
                    <feature.icon className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-4">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-lg">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              {t('home.testimonialTitle')}
            </h2>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Hear from students, parents, and educators who have found their voice through sign language.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-10">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="shadow-soft hover:shadow-large transition-all duration-300">
                <CardContent className="p-10">
                  <div className="flex items-center mb-8">
                    <div className="text-5xl mr-4">{testimonial.avatar}</div>
                    <div>
                      <div className="font-semibold text-lg">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                  <p className="text-muted-foreground leading-relaxed text-lg italic">
                    "{testimonial.content}"
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-primary via-primary/90 to-accent relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30"></div>
        <div className="container mx-auto px-4 lg:px-8 text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl lg:text-6xl font-bold text-primary-foreground mb-8">
              {t('home.readyToStart')}
            </h2>
            <p className="text-2xl text-primary-foreground/90 mb-12 leading-relaxed">
              {t('home.joinCommunity')}
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button variant="secondary" size="lg" className="focus-outline shadow-medium text-lg px-10 py-6" onClick={() => navigate('/courses')}>
                <Heart className="mr-2 h-6 w-6" />
                Join Our Community
              </Button>
              <Button variant="outline" size="lg" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary focus-outline text-lg px-10 py-6" onClick={() => navigate('/courses/1/lesson/1')}>
                <Play className="mr-2 h-6 w-6" />
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