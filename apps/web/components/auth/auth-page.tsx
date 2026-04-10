'use client';

import React, { useState } from 'react';
import { LoginForm } from './login-form';
import { RegisterForm } from './register-form';
import { AuthShell } from './auth-shell';
import { Button } from '@workspace/ui/components/button';

/**
 * Страница аутентификации с переключением между логином и регистрацией
 */
export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <AuthShell>
      <div className="space-y-6">
        {isLogin ? <LoginForm /> : <RegisterForm />}

        <div className="flex items-center gap-2">
          <div className="flex-1 border-t" />
          <span className="text-xs text-muted-foreground">или</span>
          <div className="flex-1 border-t" />
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={() => setIsLogin(!isLogin)}
        >
          {isLogin ? 'Создать новый аккаунт' : 'Уже есть аккаунт?'}
        </Button>
      </div>
    </AuthShell>
  );
}

