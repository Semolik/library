'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function AuthShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isLoginPage = pathname === '/login';
  const authLink = isLoginPage ? '/register' : '/login';
  const authText = isLoginPage ? 'Регистрация' : 'Авторизация';

  return (
    <div className="flex min-h-svh flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            На главную
          </Link>
          <Link href={authLink} className="text-sm font-medium text-primary hover:text-primary/80">
            {authText}
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}

