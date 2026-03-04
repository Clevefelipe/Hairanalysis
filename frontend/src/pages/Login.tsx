import { useState } from "react";
import api from "@/services/api";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!validateFields()) {
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      const token =
        response.data?.access_token ||
        response.data?.accessToken ||
        response.data?.token;
      const refreshToken =
        response.data?.refresh_token ||
        response.data?.refreshToken ||
        null;

      if (!token) {
        throw new Error("Token nao retornado");
      }

      login(token, refreshToken);
      window.location.href = "/dashboard";
    } catch (err: any) {
      const apiMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message;
      setError(apiMessage || "E-mail ou senha inválidos.");
    } finally {
      setLoading(false);
    }
  }

  const handleTogglePasswordVisibility = () => setShowPassword((prev) => !prev);

  function validateFields() {
    let isValid = true;
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail) {
      setEmailError("Informe o e-mail profissional.");
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setEmailError("Use um formato válido de e-mail.");
      isValid = false;
    } else {
      setEmailError(null);
    }

    if (!trimmedPassword) {
      setPasswordError("Informe sua senha.");
      isValid = false;
    } else if (trimmedPassword.length < 6) {
      setPasswordError("Mínimo de 6 caracteres.");
      isValid = false;
    } else {
      setPasswordError(null);
    }

    return isValid;
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[52%_48%] bg-[#020611] text-slate-900">
      <div className="relative overflow-hidden bg-black text-white flex items-center justify-center px-8 py-16 lg:px-16">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
          <div className="absolute inset-12 rounded-3xl border border-white/15" />
          <div className="noise-layer absolute inset-0 opacity-50" />
        </div>

        <div className="relative z-10 max-w-2xl space-y-8 pr-6 lg:pr-20">
          <div className="flex items-center gap-3">
            <img src="Logo - 2.png" alt="Hair Analysis System" className="h-14 w-14 rounded-2xl" />
            <span className="mt-1 text-2xl font-semibold tracking-wide text-white font-[Sora] leading-none">Hair Analysis System</span>
          </div>

          <div className="space-y-4">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-[11px] uppercase tracking-[0.28em] text-white/70">
              <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-success-300)]" />
              IA aplicada à análises capilares profissional
            </p>

            <h1 className="text-4xl lg:text-5xl font-semibold leading-tight text-white font-[Sora]">
              IA de visão computacional que qualifica e audita cada fio em minutos
              <span className="block text-[color:var(--color-success-200)]">pare de operar no escuro: laudos claros, seguros e acionáveis.</span>
            </h1>

            <p className="text-sm md:text-base leading-relaxed text-slate-100/80 font-[Manrope] max-w-lg">
              Protocolos proprietários, rastreabilidade ponta a ponta e recomendações acionáveis — menos retrabalho, mais confiança técnica e transparência para o cliente.
            </p>
          </div>

          <ul className="text-sm text-slate-100/90 space-y-3 font-[Manrope]">
            <li className="flex items-center gap-3">
              <span className="h-2 w-10 rounded-full bg-[color:var(--color-success-300)]" />
              Recomendação inteligente de tratamentos personalizados
            </li>
            <li className="flex items-center gap-3">
              <span className="h-2 w-10 rounded-full bg-slate-300" />
              Histórico e evolução visual auditável por cliente
            </li>
            <li className="flex items-center gap-3">
              <span className="h-2 w-10 rounded-full bg-[color:var(--color-success-400)]" />
              Pipelines proprietários de visão computacional certificável
            </li>
          </ul>

          <div className="text-xs text-slate-100/80 border-t border-white/15 pt-4 font-[Manrope] flex items-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 border border-white/20">
              <span className="h-2 w-2 rounded-full bg-[color:var(--color-success-300)]" />
              SOC 2-ready
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 border border-white/20">
              <span className="h-2 w-2 rounded-full bg-cyan-300" />
              Logs auditáveis
            </span>
            <span className="text-slate-100/80">Uso exclusivo para salões e clínicas especializadas.</span>
          </div>
        </div>

        <div className="absolute -right-16 top-1/2 z-10 hidden -translate-y-1/2 lg:block">
          <div className="relative h-64 w-64 translate-x-12 rounded-3xl border border-white/15 bg-white/5 backdrop-blur-xl shadow-[0_20px_60px_rgba(15,23,42,0.4)]">
            <div className="absolute inset-5 rounded-2xl border border-white/10 bg-white/10" />
            <div className="absolute left-6 top-6 h-6 w-24 rounded-full bg-white/25" />
            <div className="absolute left-6 top-16 h-3 w-36 rounded-full bg-white/15" />
            <div className="absolute left-6 top-24 h-3 w-40 rounded-full bg-white/10" />
            <div className="absolute right-6 bottom-10 h-12 w-12 rounded-[18px] border border-white/20" />
          </div>
        </div>
      </div>

      <div className="relative flex items-center justify-center bg-[#f4f6fb] px-6 py-12 sm:px-10">
        <div aria-hidden="true" className="noise-layer pointer-events-none absolute inset-0 opacity-40" />
        <form
          onSubmit={handleSubmit}
          className="relative w-full max-w-md rounded-3xl border border-white/70 bg-white/95 p-8 shadow-sm backdrop-blur-xl"
        >
          <div className="absolute inset-0 -z-10 rounded-3xl bg-white" />

          <div className="mb-5 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-slate-900 border border-white/25 bg-transparent">
              <span className="h-2 w-2 rounded-full bg-[color:var(--color-success-400)]" /> Ambiente seguro
            </span>
            <span className="text-slate-600">LGPD | TLS 1.3</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-[26px] font-semibold text-slate-900 font-[Sora]">
              Acesse sua central profissional
            </h2>
            <p className="text-sm text-slate-500 font-[Manrope]">
              Operação monitorada, criptografada e pronta para auditoria clínica.
            </p>
            <div className="flex flex-wrap gap-2 text-[11px] text-slate-500 font-[Manrope]">
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 border border-slate-200/70">
                <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-success-400)]" />
                Sessões protegidas
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 border border-slate-200/70">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                Logs e auditoria
              </span>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-4 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-sm text-rose-600 shadow-inner"
            >
              <svg className="h-5 w-5 text-rose-500" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path
                  d="M9.102 2.908 1.826 15.5a1 1 0 0 0 .878 1.5h14.592a1 1 0 0 0 .878-1.5L10.898 2.908a1 1 0 0 0-1.796 0Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M10 6v4m0 4h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs text-slate-500 font-semibold tracking-[0.01em]">E-mail profissional</label>
              <input
                type="email"
                autoComplete="email"
                autoFocus
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError(null);
                }}
                aria-invalid={!!emailError}
                aria-describedby={emailError ? "email-error" : undefined}
                className="w-full rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 text-slate-900 shadow-inner shadow-slate-100 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100 transition"
                required
              />
              {emailError && (
                <p id="email-error" className="text-xs text-rose-500 font-medium">
                  {emailError}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-500 font-semibold tracking-[0.01em]">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError(null);
                  }}
                  aria-invalid={!!passwordError}
                  aria-describedby={passwordError ? "password-error" : undefined}
                  className="w-full rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 pr-12 text-slate-900 shadow-inner shadow-slate-100 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100 transition"
                  required
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleTogglePasswordVisibility();
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === " " || e.key === "Spacebar" || e.key === "Enter") {
                      e.preventDefault();
                      e.stopPropagation();
                      handleTogglePasswordVisibility();
                    }
                  }}
                  className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-700"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m3 3 18 18" />
                      <path d="M10.58 10.58a2 2 0 0 0 2.84 2.84" />
                      <path d="M9.88 5.09A11 11 0 0 1 12 5c7 0 10 7 10 7a17 17 0 0 1-3.42 4.91" />
                      <path d="M6.24 6.24A16.6 16.6 0 0 0 2 12s3 7 10 7a10.93 10.93 0 0 0 4.86-1.11" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {passwordError && (
                <p id="password-error" className="text-xs text-rose-500 font-medium">
                  {passwordError}
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary mt-6 flex w-full items-center justify-center gap-2 text-base disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && (
              <svg className="h-5 w-5 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-80" d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              </svg>
            )}
            {loading ? "Validando acesso" : "Entrar"}
          </button>

          <ul className="mt-6 space-y-2 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs font-[Manrope] text-slate-600">
            <li className="flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[color:var(--color-success-50)] text-[color:var(--color-success-500)]">🔒</span>
              Conexão segura e criptografada
            </li>
            <li className="flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-500">🧪</span>
              Plataforma exclusiva para profissionais credenciados
            </li>
            <li className="flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-sky-50 text-sky-500">📊</span>
              Dados armazenados com proteção LGPD
            </li>
          </ul>

          <p className="mt-4 text-xs text-slate-400 font-[Manrope] text-center">
            Problemas de acesso? Contate o administrador do salão.
          </p>
        </form>
      </div>
    </div>
  );
}
