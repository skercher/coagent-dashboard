'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { supabase } from '../../services/supabaseClient';

// Add request tracking
let isAuthenticating = false;

export default function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add render counting
  useEffect(() => {
    console.log('Login page rendered');
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    
    // Prevent duplicate submissions
    if (isAuthenticating || loading) {
      return;
    }
    
    setLoading(true);
    isAuthenticating = true;
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`
          }
        });
        if (error) throw error;
        setError('Account created! You can now sign in.');
        setIsSignUp(false);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        
        // Set cookie and redirect
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ session: data.session })
        });
        
        if (!response.ok) {
          throw new Error('Failed to set session cookie');
        }

        router.push('/');
        router.refresh();
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
      isAuthenticating = false;
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <Card className="w-[380px] bg-white/10 backdrop-blur-lg border-white/20">
        <CardHeader className="space-y-4 flex flex-col items-center">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
            <svg
              className="h-10 w-10 text-primary-foreground"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/>
              <circle cx="8" cy="8" r="2"/>
              <circle cx="16" cy="8" r="2"/>
              <circle cx="12" cy="16" r="2"/>
            </svg>
          </div>
          <div className="text-center">
            <CardTitle className="text-2xl font-bold text-white">
              Co Working Agent Dashboard
            </CardTitle>
            <CardDescription className="text-zinc-400 mt-2">
              {isSignUp ? 'Create your account' : 'Sign in to your account'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="p-3 mb-4 text-sm bg-destructive/15 text-destructive rounded-md">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              <Input
                name="email"
                type="email"
                placeholder="Email"
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-zinc-400"
              />
              <Input
                name="password"
                type="password"
                placeholder="Password"
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-zinc-400"
              />
              <Button 
                className="w-full bg-white/10 hover:bg-white/20 text-white" 
                disabled={loading}
              >
                {loading 
                  ? (isSignUp ? 'Creating account...' : 'Signing in...') 
                  : (isSignUp ? 'Create account' : 'Sign in')
                }
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center gap-4">
          <Button
            variant="link"
            className="text-zinc-400 hover:text-white"
            onClick={() => setIsSignUp(!isSignUp)}
          >
            {isSignUp 
              ? 'Already have an account? Sign in' 
              : "Don't have an account? Sign up"
            }
          </Button>
          <p className="text-sm text-zinc-400">Powered by Co Work Agent</p>
        </CardFooter>
      </Card>
    </div>
  );
}
