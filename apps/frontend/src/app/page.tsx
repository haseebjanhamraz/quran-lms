'use client';

import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace(`/${user.role.toLowerCase()}/dashboard`);
      } else {
        router.replace('/login');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">
          Loading your Quran LMS portal...
        </p>
      </div>
    </div>
  );
}
