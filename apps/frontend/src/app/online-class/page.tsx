'use client';

import React, { Suspense } from 'react';
import OnlineClassMain from '@/components/online-class/OnlineClassMain';
import { Loader2 } from 'lucide-react';

export default function OnlineClassPage() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-zinc-950 text-foreground select-none">
      <Suspense
        fallback={
          <div className="flex h-screen w-screen items-center justify-center bg-zinc-950 text-zinc-300">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mb-2" />
            <span className="text-xs font-mono ml-2">Loading Interactive Whiteboard...</span>
          </div>
        }
      >
        <OnlineClassMain />
      </Suspense>
    </div>
  );
}
