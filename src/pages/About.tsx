import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Users, Award, Globe, BookOpen, Target } from 'lucide-react';

const About = () => {
  const team = [
    {
      name: 'Aida Zhakenova',
      role: 'Founder & Lead Instructor',
      bio: 'Certified ASL interpreter with 15+ years experience. Passionate about making sign language accessible to all.',
      avatar: '👩🏻‍🏫',
      credentials: ['Certified ASL Interpreter', 'M.Ed. Special Education']
    },
    {
      name: 'Marat Bekzhanov',
      role: 'Senior ASL Instructor',
      bio: 'Deaf community advocate and native signer. Specializes in cultural education and advanced conversation.',
      avatar: '👨🏻‍🏫',
      credentials: ['Native ASL Speaker', 'Community Advocate']
    },
    {
      name: 'Samal Nurgazina',
      role: 'Curriculum Developer',
      bio: 'Educational technology specialist focused on accessible learning design for diverse abilities.',
      avatar: '👩🏻‍💻',
      credentials: ['M.S. Educational Technology', 'Accessibility Specialist']
    }
  ];

  const values = [
    {
      icon: Heart,
      title: 'Inclusivity',
      description: 'We believe everyone deserves access to communication and community, regardless of hearing ability.'
    },
    {
      icon: Users,
      title: 'Community',
      description: 'Building bridges between deaf and hearing communities through shared language and understanding.'
    },
    {
      icon: Award,
      title: 'Excellence',
      description: 'Providing high-quality instruction and resources that meet the highest educational standards.'
    },
    {
      icon: Globe,
      title: 'Cultural Awareness',
      description: 'Honoring deaf culture while adapting ASL education for the Kazakhstani context.'
    }
  ];

  const stats = [
    { icon: Users, number: '500+', label: 'Students Taught' },
    { icon: BookOpen, number: '3', label: 'Years Experience' },
    { icon: Award, number: '15+', label: 'Certified Instructors' },
    { icon: Target, number: '95%', label: 'Student Success Rate' }
  ];

  return (
    <main id="main-content" className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <h1 className="text-4xl lg:text-5xl font-bold text-high-contrast mb-6">
            About ASL Kazakhstan
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Founded in 2021, ASL Kazakhstan is the first comprehensive sign language education platform 
            designed specifically for the deaf and hard-of-hearing community in Kazakhstan.
          </p>
        </div>

        {/* Mission Section */}
        <section className="mb-20">
          <Card className="max-w-4xl mx-auto shadow-medium border-0 card-gradient">
            <CardContent className="p-12 text-center">
              <Heart className="h-16 w-16 text-primary mx-auto mb-6" />
              <h2 className="text-2xl lg:text-3xl font-bold text-high-contrast mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                To empower the deaf and hard-of-hearing community in Kazakhstan by providing accessible, 
                high-quality sign language education that builds bridges between deaf and hearing communities, 
                fostering understanding, inclusion, and cultural appreciation.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Values Section */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-high-contrast mb-4">
              Our Values
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              These core principles guide everything we do at ASL Kazakhstan.
            </p>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="shadow-soft hover:shadow-medium transition-all text-center">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <value.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-high-contrast mb-4">{value.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Stats Section */}
        <section className="mb-20 bg-muted/30 rounded-2xl p-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-high-contrast mb-4">
              Our Impact
            </h2>
            <p className="text-lg text-muted-foreground">
              Making a difference in the deaf and hard-of-hearing community since 2021.
            </p>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="h-8 w-8 text-primary" />
                </div>
                <div className="text-3xl lg:text-4xl font-bold text-primary mb-2">{stat.number}</div>
                <div className="text-muted-foreground font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Team Section */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-high-contrast mb-4">
              Meet Our Team
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our dedicated instructors and staff are passionate about sign language education 
              and committed to serving the deaf community.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <Card key={index} className="shadow-soft hover:shadow-medium transition-all">
                <CardContent className="p-8 text-center">
                  <div className="text-6xl mb-6">{member.avatar}</div>
                  <h3 className="text-xl font-semibold text-high-contrast mb-2">{member.name}</h3>
                  <p className="text-primary font-medium mb-4">{member.role}</p>
                  <p className="text-muted-foreground leading-relaxed mb-6">{member.bio}</p>
                  
                  <div className="space-y-2">
                    {member.credentials.map((credential, idx) => (
                      <Badge key={idx} variant="outline" className="mr-2">
                        {credential}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Story Section */}
        <section>
          <Card className="max-w-4xl mx-auto shadow-medium">
            <CardContent className="p-12">
              <h2 className="text-2xl lg:text-3xl font-bold text-high-contrast mb-6 text-center">
                Our Story
              </h2>
              <div className="prose max-w-none text-muted-foreground leading-relaxed space-y-6">
                <p>
                  ASL Kazakhstan was born from a simple yet powerful realization: the deaf and hard-of-hearing 
                  community in Kazakhstan needed accessible, high-quality sign language education that respected 
                  both American Sign Language traditions and local cultural context.
                </p>
                <p>
                  Our founder, Aida Zhakenova, witnessed firsthand the challenges faced by deaf individuals 
                  and their families in accessing quality sign language instruction. Traditional classroom 
                  settings were often inaccessible, expensive, or simply unavailable in many regions of Kazakhstan.
                </p>
                <p>
                  In 2021, we launched ASL Kazakhstan as an online platform that could reach students across 
                  the country. Our approach combines expert instruction, cultural sensitivity, and cutting-edge 
                  accessibility features to create an inclusive learning environment.
                </p>
                <p>
                  Today, we're proud to serve over 500 students and continue growing our community of learners, 
                  instructors, and advocates who believe in the power of sign language to connect people and 
                  build understanding.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
};

export default About;