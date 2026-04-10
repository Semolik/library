import { LoginForm } from '@/components/auth/login-form';
import { AuthShell } from '@/components/auth/auth-shell';

export default function LoginPage() {
  return (
    <AuthShell>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold">Вход</h1>
          <p className="text-muted-foreground text-sm">Войдите в свою учётную запись</p>
        </div>
        <LoginForm />
      </div>
    </AuthShell>
  );
}
