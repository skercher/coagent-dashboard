'use client';

import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { supabase } from '../../../services/supabaseClient';

export function LogoutButton() {
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      
      // Clear cookies and redirect
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      
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