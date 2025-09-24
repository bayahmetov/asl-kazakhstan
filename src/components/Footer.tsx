import React from 'react';
import { NavLink } from 'react-router-dom';
import { Heart, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  const quickLinks = [
    { to: '/', label: 'Home' },
    { to: '/courses', label: 'Courses' },
    { to: '/about', label: 'About' },
    { to: '/contact', label: 'Contact' }
  ];

  const supportLinks = [
    { to: '/help', label: 'Help Center' },
    { to: '/accessibility', label: 'Accessibility' },
    { to: '/privacy', label: 'Privacy Policy' },
    { to: '/terms', label: 'Terms of Service' }
  ];

  const socialLinks = [
    { name: 'Facebook', url: '#', handle: '@ASLKazakhstan' },
    { name: 'Instagram', url: '#', handle: '@aslkazakhstan' },
    { name: 'YouTube', url: '#', handle: 'ASL Kazakhstan' },
    { name: 'Telegram', url: '#', handle: '@ASLKazakhstanChat' }
  ];

  return (
    <footer className="bg-muted/30 border-t border-border mt-20">
      <div className="container mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Brand & Mission */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center space-x-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Heart className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-high-contrast">ASL Kazakhstan</h3>
                <p className="text-sm text-muted-foreground">Learn with Heart</p>
              </div>
            </div>
            
            <p className="text-muted-foreground leading-relaxed max-w-md">
              Empowering the deaf and hard-of-hearing community in Kazakhstan through 
              accessible, high-quality sign language education.
            </p>

            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                <span>info@aslkazakhstan.kz</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                <span>+7 (727) 123-4567</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                <span>Almaty, Kazakhstan</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-high-contrast mb-4">Quick Links</h4>
            <nav className="space-y-3">
              {quickLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className="block text-sm text-muted-foreground hover:text-primary transition-colors focus-outline rounded"
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-high-contrast mb-4">Support</h4>
            <nav className="space-y-3">
              {supportLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className="block text-sm text-muted-foreground hover:text-primary transition-colors focus-outline rounded"
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>

        {/* Social Media & Copyright */}
        <div className="border-t border-border mt-12 pt-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            {/* Social Links */}
            <div className="flex items-center gap-6">
              <span className="text-sm text-muted-foreground font-medium">Follow us:</span>
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors focus-outline rounded"
                  aria-label={`Follow us on ${social.name}`}
                >
                  {social.name}
                </a>
              ))}
            </div>

            {/* Copyright */}
            <div className="text-sm text-muted-foreground">
              © 2024 ASL Kazakhstan. All rights reserved. Made with ❤️ for the deaf community.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;