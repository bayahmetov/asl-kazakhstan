import React from 'react';
import { NavLink } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X, Heart, User, BookOpen, Globe } from 'lucide-react';
import { useState } from 'react';
import { useLanguage, Language } from '@/contexts/LanguageContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const navigationItems = [
    { to: '/', label: t('nav.home'), icon: Heart },
    { to: '/courses', label: t('nav.courses'), icon: BookOpen },
    { to: '/about', label: t('nav.about') },
    { to: '/contact', label: t('nav.contact') },
  ];

  const languages = [
    { code: 'en' as Language, label: 'English', flag: '🇺🇸' },
    { code: 'ru' as Language, label: 'Русский', flag: '🇷🇺' },
    { code: 'kz' as Language, label: 'Қазақша', flag: '🇰🇿' },
  ];

  return (
    <>
      {/* Skip link for accessibility */}
      <a 
        href="#main-content" 
        className="skip-link focus-outline"
        aria-label={t('nav.skipToMain')}
      >
        {t('nav.skipToMain')}
      </a>

      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <nav className="container mx-auto flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <NavLink 
            to="/" 
            className="flex items-center space-x-2 focus-outline rounded-md"
            aria-label={t('nav.homeLabel')}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Heart className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-foreground">{t('brand.name')}</span>
          </NavLink>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navigationItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `focus-outline rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-primary bg-primary-soft'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            
            {/* Language Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="focus-outline">
                  <Globe className="mr-2 h-4 w-4" />
                  {languages.find(lang => lang.code === language)?.flag}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {languages.map((lang) => (
                  <DropdownMenuItem 
                    key={lang.code} 
                    onClick={() => setLanguage(lang.code)}
                    className={language === lang.code ? 'bg-primary-soft' : ''}
                  >
                    <span className="mr-2">{lang.flag}</span>
                    {lang.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button variant="default" size="sm" className="focus-outline">
              <User className="mr-2 h-4 w-4" />
              {t('nav.signIn')}
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            {/* Mobile Language Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="focus-outline">
                  {languages.find(lang => lang.code === language)?.flag}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {languages.map((lang) => (
                  <DropdownMenuItem 
                    key={lang.code} 
                    onClick={() => setLanguage(lang.code)}
                    className={language === lang.code ? 'bg-primary-soft' : ''}
                  >
                    <span className="mr-2">{lang.flag}</span>
                    {lang.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="sm"
              className="focus-outline"
              onClick={toggleMenu}
              aria-label={isMenuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </nav>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-border bg-background">
            <div className="container mx-auto px-4 py-4 space-y-3">
              {navigationItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsMenuOpen(false)}
                  className={({ isActive }) =>
                    `block rounded-md px-3 py-2 text-base font-medium transition-colors focus-outline ${
                      isActive
                        ? 'text-primary bg-primary-soft'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              <Button variant="default" className="w-full mt-4 focus-outline">
                <User className="mr-2 h-4 w-4" />
                {t('nav.signIn')}
              </Button>
            </div>
          </div>
        )}
      </header>
    </>
  );
};

export default Navigation;