'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/icons';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SearchInput({ className }: { className?: string }) {
  return (
    <div className={cn("flex-1", className)}>
      <Input
        type="search"
        placeholder="Search..."
        className="w-full md:max-w-[400px] lg:max-w-[600px]"
      />
    </div>
  );
}
