import { type FormEvent, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Mail, Lock, LogIn, Shield, Users, FileText } from "lucide-react";
import { useAuth } from "@/app/providers/AuthProvider";
import { APP_NAME } from "@/shared/config/constants";

export function LoginPage() {
  const { login, isLoading, error } = useAuth();
  const navigate = useNavigate();
  // RequireAuth → state.from: oturum süresi dolup tekrar giriş yapan kullanıcı kaldığı sayfaya döner
  const fromState = (useLocation().state as { from?: { pathname?: string; search?: string } } | null)?.from;
  const returnTo =
    fromState?.pathname && fromState.pathname !== "/login" ? `${fromState.pathname}${fromState.search ?? ""}` : "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  function validate(): boolean {
    const next: typeof errors = {};
    if (!email.trim()) {
      next.email = "E-posta veya kullanıcı adı gereklidir.";
    } else if (email.includes("@") && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      next.email = "Geçerli bir e-posta adresi giriniz.";
    }
    if (!password) {
      next.password = "Şifre gereklidir.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    try {
      await login({ email: email.trim(), password: password.trim() });
      navigate(returnTo, { replace: true });
    } catch {
      // error handled by AuthProvider
    }
  }

  return (
    <div className="bg-shell-canvas relative flex min-h-screen items-center justify-center overflow-hidden p-4">

      {/* ── Mesh Gradient Background ──────────────── */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute inset-0 bg-slate-900/20 dark:bg-black/50" />
        <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-blue-400/30 blur-3xl dark:bg-blue-500/28" />
        <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-indigo-400/25 blur-3xl dark:bg-indigo-500/22" />
        <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-300/20 blur-3xl dark:bg-sky-500/12" />
        <div className="absolute right-1/4 top-1/4 h-64 w-64 rounded-full bg-indigo-300/15 blur-3xl dark:bg-indigo-400/12" />
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2230%22%20height%3D%2230%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cdefs%3E%3Cpattern%20id%3D%22g%22%20width%3D%2230%22%20height%3D%2230%22%20patternUnits%3D%22userSpaceOnUse%22%3E%3Cpath%20d%3D%22M30%200H0v30%22%20fill%3D%22none%22%20stroke%3D%22rgba(255%2C255%2C255%2C0.03)%22/%3E%3C/pattern%3E%3C/defs%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20fill%3D%22url(%23g)%22/%3E%3C/svg%3E')] opacity-60" />
      </div>

      {/* ── Main Content ─────────────────────────── */}
      <div className="relative z-10 flex w-full max-w-4xl flex-col items-center gap-8 lg:flex-row lg:gap-16">

        {/* ── Left: Branding Panel ───────────────── */}
        <div className="hidden flex-1 space-y-8 lg:block">
          {/* Logo */}
          <div className="flex h-16 w-auto items-center">
            <img src="/logo.png" alt="Logo" className="h-full w-auto object-contain drop-shadow-2xl dark:brightness-0 dark:invert" />
          </div>

          {/* Feature highlights */}
          <div className="space-y-5">
            {[
              { icon: <Users className="h-5 w-5" />, title: "Ekip Koordinasyonu", desc: "Katılımcıları, kararları ve görevleri tek noktadan yönetin." },
              { icon: <FileText className="h-5 w-5" />, title: "Otomatik Tutanak", desc: "Toplantı notlarınızı yapılandırılmış tutanaklara dönüştürün." },
              { icon: <Shield className="h-5 w-5" />, title: "Güvenli & Kurumsal", desc: "JWT tabanlı kimlik doğrulama ile verileriniz güvende." },
            ].map((f) => (
              <div key={f.title} className="group flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/5 text-blue-600 ring-1 ring-slate-900/10 transition-colors group-hover:bg-black/10 group-hover:text-blue-700 dark:bg-white/5 dark:text-blue-400 dark:ring-white/10 dark:group-hover:bg-white/10 dark:group-hover:text-blue-300">
                  {f.icon}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-shell-fg">{f.title}</h3>
                  <p className="mt-0.5 text-xs leading-relaxed text-shell-muted">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>


        </div>

        {/* ── Right: Glass Login Card ────────────── */}
        <div className="w-full max-w-md animate-scale-in">
          <div className="rounded-3xl border border-slate-900/10 bg-white/60 p-8 shadow-2xl shadow-slate-900/10 backdrop-blur-2xl dark:border-white/15 dark:bg-white/[0.07] dark:shadow-black/40">

            {/* Mobile-only logo */}
            <div className="mb-8 flex flex-col items-center gap-3 lg:hidden">
              <div className="relative flex h-14 w-auto shrink-0 items-center justify-center">
                <img src="/logo.png" alt="Logo" className="h-full w-auto object-contain dark:brightness-0 dark:invert" />
              </div>
              <div className="text-center">
                <h1 className="text-2xl font-bold text-shell-fg">{APP_NAME}</h1>
              </div>
            </div>

            {/* Desktop header */}
            <div className="mb-8 hidden lg:block">
              <h2 className="text-xl font-bold text-shell-fg">Hoş geldiniz</h2>
              <p className="mt-1 text-sm text-shell-muted">Hesabınıza giriş yaparak devam edin</p>
            </div>

            {/* ── Login Form ─────────────────────── */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
              {/* Email or Username */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-shell-muted">
                  E-posta veya Kullanıcı Adı
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="E-posta veya kullanıcı adı"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    autoComplete="username"
                    className="w-full rounded-xl border border-slate-900/10 bg-white/80 py-3 pl-11 pr-4 text-sm text-shell-fg placeholder-slate-400 outline-none transition-all duration-200 focus:border-blue-400/60 focus:bg-white focus:ring-2 focus:ring-blue-400/20 disabled:opacity-50 dark:border-white/10 dark:bg-slate-950/50 dark:text-white dark:placeholder-slate-500 dark:focus:bg-slate-950/70"
                  />
                </div>
                {errors.email && <p className="mt-1.5 text-xs text-red-400">{errors.email}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-shell-muted">
                  Şifre
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-slate-900/10 bg-white/80 py-3 pl-11 pr-4 text-sm text-shell-fg placeholder-slate-400 outline-none transition-all duration-200 focus:border-blue-400/60 focus:bg-white focus:ring-2 focus:ring-blue-400/20 disabled:opacity-50 dark:border-white/10 dark:bg-slate-950/50 dark:text-white dark:placeholder-slate-500 dark:focus:bg-slate-950/70"
                  />
                </div>
                {errors.password && <p className="mt-1.5 text-xs text-red-400">{errors.password}</p>}
              </div>

              {/* Error alert */}
              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300 backdrop-blur-sm" role="alert">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="group mt-1 flex w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-400 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 outline-none transition-all duration-200 hover:from-blue-500 hover:to-blue-300 hover:shadow-blue-400/35 focus-visible:ring-2 focus-visible:ring-blue-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 dark:from-blue-500 dark:to-blue-400 dark:text-slate-950"
              >
                {isLoading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-slate-950/30 dark:border-t-slate-950" />
                ) : (
                  <>
                    <LogIn className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    Giriş Yap
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <p className="mt-6 text-center text-2xs text-slate-600">
              © 2026 {APP_NAME}. Tüm hakları saklıdır.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
