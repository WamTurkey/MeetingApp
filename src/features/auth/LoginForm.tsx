/**
 * LoginForm — email + password authentication form.
 *
 * Handles local form state, validation, and calls `onSubmit`
 * with credentials. The parent (page/widget) handles the actual
 * API call and token storage.
 */
import { type FormEvent, useState } from "react";
import { LogIn, Mail, Lock } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import type { LoginCredentials } from "@/entities/user/model";

export interface LoginFormProps {
  onSubmit: (credentials: LoginCredentials) => void | Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

export function LoginForm({ onSubmit, isLoading = false, error }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  function validate(): boolean {
    const next: typeof errors = {};

    if (!email.trim()) {
      next.email = "E-posta adresi gereklidir.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      next.email = "Geçerli bir e-posta adresi giriniz.";
    }

    if (!password) {
      next.password = "Şifre gereklidir.";
    } else if (password.length < 8) {
      next.password = "Şifre en az 8 karakter olmalıdır.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit({ email: email.trim().toLowerCase(), password });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      <Input
        label="E-posta"
        type="email"
        placeholder="ornek@sirket.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
        icon={<Mail className="h-4 w-4" />}
        autoComplete="email"
        disabled={isLoading}
      />

      <Input
        label="Şifre"
        type="password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
        icon={<Lock className="h-4 w-4" />}
        autoComplete="current-password"
        disabled={isLoading}
      />

      {error && (
        <div className="rounded-lg bg-danger-50 px-4 py-3 text-sm text-danger-700" role="alert">
          {error}
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        isLoading={isLoading}
        icon={<LogIn className="h-4 w-4" />}
        className="w-full mt-1"
      >
        Giriş Yap
      </Button>
    </form>
  );
}
