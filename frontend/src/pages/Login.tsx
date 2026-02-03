import { useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
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

      if (!token) {
        throw new Error("Token nao retornado");
      }

      login(token);
      window.location.href = "/dashboard";
    } catch (err) {
      setError("E-mail ou senha invalidos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-slate-50">
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white flex items-center justify-center p-10">
        <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />

        <div className="relative max-w-md space-y-6">
          <div className="flex items-center gap-3">
            <img src="/Logo.png" alt="Hair Analysis System" className="h-10 w-10 rounded" />
            <span className="text-lg font-semibold tracking-wide font-[Sora]">
              Hair Analysis System
            </span>
          </div>

          <h1 className="text-4xl font-semibold leading-tight font-[Sora]">
            Analise capilar assistida por IA,
            com foco tecnico-estetico.
          </h1>

          <p className="text-sm text-slate-300 font-[Manrope]">
            Plataforma proprietaria para saloes com
            padrao profissional, sem diagnostico clinico.
          </p>

          <ul className="text-sm text-slate-200 space-y-2 font-[Manrope]">
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Multi-tenant com seguranca por salonId
            </li>
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              Historico e evolucao por cliente
            </li>
            <li className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-indigo-400" />
              IA assistiva e heuristicas tecnicas
            </li>
          </ul>

          <div className="text-xs text-slate-400 border-t border-white/10 pt-4 font-[Manrope]">
            Uso exclusivo para saloes.
            Nao substitui avaliacao profissional nem diagnostico clinico.
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-8">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md bg-white shadow-xl shadow-slate-200/60 rounded-2xl p-8 space-y-5 border border-slate-200"
        >
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold text-slate-900 font-[Sora]">
              Acessar Sistema
            </h2>
            <p className="text-sm text-slate-500 font-[Manrope]">
              Entre com suas credenciais de acesso.
            </p>
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 border border-red-200 px-3 py-2 rounded">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-500">E-mail</label>
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                required
              />
            </div>

            <div>
              <label className="text-xs text-slate-500">Senha</label>
              <input
                type="password"
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white py-2.5 rounded-lg hover:bg-slate-800 transition font-[Manrope]"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>

          <div className="text-xs text-slate-400 font-[Manrope]">
            Problemas de acesso? Contate o administrador do salao.
          </div>
        </form>
      </div>
    </div>
  );
}
