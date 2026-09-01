'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback, useTransition } from 'react';

/**
 * Custom hook to synchronize local state with URL search parameters.
 * When value changes, it updates the query string via Next.js router (replace, no scroll)
 * or window.history.replaceState, preventing loss of tab/view on browser reload.
 */
export function useUrlState<T extends string | null = string>(
  key: string,
  defaultValue: T,
): [T, (newValue: T) => void] {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  const paramValue = searchParams ? searchParams.get(key) : null;
  const currentValue = (paramValue !== null ? (paramValue as T) : defaultValue);

  const setValue = useCallback(
    (newValue: T) => {
      const currentParams = searchParams ? new URLSearchParams(searchParams.toString()) : new URLSearchParams();

      if (newValue === defaultValue || !newValue) {
        currentParams.delete(key);
      } else {
        currentParams.set(key, newValue);
      }

      const queryString = currentParams.toString();
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname;

      // Update URL smoothly without scrolling or page reloads
      startTransition(() => {
        router.replace(newUrl, { scroll: false });
      });
    },
    [defaultValue, key, pathname, router, searchParams],
  );

  return [currentValue, setValue];
}
