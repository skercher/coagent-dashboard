'use client';

import { LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';

export function MobileLogoutButton() {
  return (
    <button
      onClick={() => signOut()}
      className="flex w-full items-center gap-3 p-4 text-muted-foreground hover:text-foreground"
    >
      <LogOut className="h-5 w-5" />
      <span className="text-base">Log out</span>
    </button>
  );
} 