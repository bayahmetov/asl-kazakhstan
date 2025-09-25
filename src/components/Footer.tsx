import React from 'react';
import { NavLink } from 'react-router-dom';
import { Heart, Mail, Phone, MapPin } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const Footer = () => {
  const { t } = useLanguage();
  
  const quickLinks = [
    { to: '/', label: t('nav.home') },
    { to: '/courses', label: t('nav.courses') },
    { to: '/about', label: t('nav.about') },
    { to: '/contact', label: t('nav.contact') }
  ];

  const supportLinks = [
    { to: '/help', label: t('footer.helpCenter') },
    { to: '/accessibility', label: t('footer.accessibility') },
    { to: '/privacy', label: t('footer.privacy') },
    { to: '/terms', label: t('footer.terms') }
  ];

  const socialLinks = [
    { name: 'Facebook', url: '#', handle: '@RSLKazakhstan' },
    { name: 'Instagram', url: '#', handle: '@rslkazakhstan' },
    { name: 'YouTube', url: '#', handle: 'RSL Kazakhstan' },
    { name: 'Telegram', url: '#', handle: '@RSLKazakhstanChat' }
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
                <h3 className="text-xl font-semibold text-high-contrast">{t('brand.name')}</h3>
                <p className="text-sm text-muted-foreground">{t('brand.tagline')}</p>
              </div>
            </div>
            
            <p className="text-muted-foreground leading-relaxed max-w-md">
              {t('brand.mission')}
            </p>

            {/* Contact Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                <span>{t('contact.emailValue')}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                <span>{t('contact.phoneValue')}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                <span>{t('contact.addressValue')}</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-high-contrast mb-4">{t('common.quickLinks')}</h4>
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
            <h4 className="font-semibold text-high-contrast mb-4">{t('common.support')}</h4>
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
              <span className="text-sm text-muted-foreground font-medium">{t('common.followUs')}</span>
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
              {t('common.copyright')}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;