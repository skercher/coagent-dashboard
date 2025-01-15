'use client';

import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { createBrowserClient } from '../../../services/supabaseClient';

export function LogoutButton() {
  const handleLogout = async () => {
    try {
      const supabase = createBrowserClient();
      
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Clear cookies
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      
      // Clear localStorage
      localStorage.clear();
      
      // Hard redirect to login
      window.location.replace('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <Button 
      variant="ghost" 
      size="icon"
      onClick={handleLogout}
      className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground"
    >
      <LogOut className="h-5 w-5" />
      <span className="sr-only">Log out</span>
    </Button>
  );
} 