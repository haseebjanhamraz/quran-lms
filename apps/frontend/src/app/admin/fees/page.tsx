'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function FeesRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/hr?tab=fees');
  }, [router]);

  return (
    <div className="py-20 flex flex-col items-center justify-center gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-brand" />
      <p className="text-xs font-semibold text-muted-foreground">Redirecting to HR & Financial Operations Management...</p>
    </div>
  );
}
