import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  UserMinus,
} from "lucide-react";
import MetricCard from "@/components/ui/MetricCard";
import SectionToolbar from "@/components/ui/SectionToolbar";
import { useToast } from "@/components/ui/ToastProvider";
import { listarClientes } from "@/core/cliente/cliente.service";

const QUALITY_COLORS = ["#0f766e", "#38bdf8", "#e2e8f0"];

export default function SaudeBaseClientes() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { notify } = useToast();

  useEffect(() => {
    setLoading(true);
    listarClientes()
      .then((data) => setClientes(Array.isArray(data) ? data : []))
      .catch(() => {
        setClientes([]);
        notify("Não foi possível carregar a saúde da base.", "error");
      })
      .finally(() => setLoading(false));
  }, [notify]);

  const safeClientes = Array.isArray(clientes) ? clientes : [];
  const clientsWithCpf = safeClientes.filter((c) => c?.cpf).length;
  const clientsWithEmail = safeClientes.filter((c) => c?.email).length;
  const clientsWithBirth = safeClientes.filter((c) => c?.dataNascimento).length;
  const readyForAiCount = safeClientes.filter((c) => c?.telefone && c?.cpf).length;
  const incomplete = safeClientes.length - readyForAiCount;

  const now = Date.now();
  const isRecentVisit = (value?: string) => {
    if (!value) return false;
    const diff = now - new Date(value).getTime();
    return diff >= 0 && diff <= 90 * 24 * 60 * 60 * 1000;
  };

  const readyActiveCount = safeClientes.filter(
    (c) => c?.telefone && c?.cpf && isRecentVisit(c?.ultimaVisita),
  ).length;
  const readyInactiveCount = Math.max(readyForAiCount - readyActiveCount, 0);

  const qualityScore = safeClientes.length
    ? Math.round(
        ((readyForAiCount * 0.5 + clientsWithEmail * 0.2 + clientsWithBirth * 0.3) /
          safeClientes.length) *
          100,
      )
    : 0;

  const qualityPie = [
    { name: "Pronto + ativo", value: readyActiveCount },
    { name: "Pronto sem retorno", value: readyInactiveCount },
    { name: "Incompleto", value: Math.max(safeClientes.length - readyForAiCount, 0) },
  ].filter((item) => item.value > 0);

  const completionBars = [
    { label: "Telefone", value: safeClientes.filter((c) => c?.telefone).length },
    { label: "CPF", value: clientsWithCpf },
    { label: "E-mail", value: clientsWithEmail },
    { label: "Nascimento", value: clientsWithBirth },
  ];

  const pendingClients = useMemo(() => {
    return [...safeClientes]
      .map((cliente) => {
        const missing = [
          !cliente?.telefone && "telefone",
          !cliente?.cpf && "CPF",
          !cliente?.email && "email",
          !cliente?.dataNascimento && "nascimento",
        ].filter(Boolean) as string[];

        return {
          cliente,
          missing,
        };
      })
      .filter((item) => item.missing.length > 0)
      .slice(0, 15);
  }, [safeClientes]);

  return (
    <div className="section-stack space-y-6">
      <SectionToolbar className="justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Saúde da base</p>
          <h1 className="text-2xl font-semibold text-slate-900">Qualidade operacional dos cadastros</h1>
          <p className="text-sm text-slate-500">
            Separado da lista para focar em integridade de dados, prontidão para IA e pendências.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="btn-secondary inline-flex items-center gap-2"
            onClick={() => navigate("/clientes")}
          >
            <ArrowLeft size={16} /> Voltar à lista
          </button>
          <button
            className="btn-outline inline-flex items-center gap-2"
            onClick={() => navigate(0)}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Atualizar
          </button>
        </div>
      </SectionToolbar>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Prontas para IA"
          value={readyForAiCount}
          subLabel={`${safeClientes.length ? Math.round((readyForAiCount / safeClientes.length) * 100) : 0}% da base`}
          icon={<UserCheck size={18} className="text-[color:var(--color-success-600)]" />}
          className="h-full bg-slate-50"
        />
        <MetricCard
          label="Com pendências"
          value={Math.max(incomplete, 0)}
          subLabel="sem telefone ou CPF completo"
          icon={<AlertTriangle size={18} className="text-amber-600" />}
          className="h-full bg-slate-50"
        />
        <MetricCard
          label="Inativas (90d)"
          value={Math.max(readyInactiveCount, 0)}
          subLabel="sem visita recente"
          icon={<UserMinus size={18} className="text-slate-600" />}
          className="h-full bg-slate-50"
        />
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <SectionToolbar className="justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Score de qualidade</p>
            <h2 className="text-lg font-semibold text-slate-900">Cobertura de dados e maturidade</h2>
          </div>
          <span className="rounded-full border border-[color:var(--color-success-200)] bg-[color:var(--color-success-50)] px-3 py-1 text-xs font-semibold text-[color:var(--color-success-700)]">
            Score: {qualityScore}/100
          </span>
        </SectionToolbar>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-100 bg-slate-50/70 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Cobertura de dados</p>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={completionBars} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
                  <XAxis dataKey="label" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
                  <RechartsTooltip
                    contentStyle={{ borderRadius: 12, borderColor: "#cbd5e1" }}
                    formatter={(value?: number) => [`${value ?? 0} cliente(s)`, "Cobertura"]}
                  />
                  <Bar dataKey="value" fill="#0f766e" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-slate-50/70 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Maturidade da base</p>
            <div className="mt-4 h-64">
              {qualityPie.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={qualityPie}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={88}
                      innerRadius={46}
                      paddingAngle={2}
                    >
                      {qualityPie.map((entry, index) => (
                        <Cell key={`${entry.name}-${index}`} fill={QUALITY_COLORS[index % QUALITY_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{ borderRadius: 12, borderColor: "#cbd5e1" }}
                      formatter={(value?: number, name?: string) => [`${value ?? 0} cliente(s)`, name ?? ""]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-slate-500">
                  Sem dados para exibir.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <SectionToolbar className="justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Prioridades técnicas</p>
            <h2 className="text-lg font-semibold text-slate-900">Clientes que precisam de ajustes</h2>
          </div>
          <div className="rounded-full border border-[color:var(--color-success-200)] bg-[color:var(--color-success-50)] px-3 py-1 text-xs font-semibold text-[color:var(--color-success-700)]">
            Base consistente: {pendingClients.length === 0 ? "sem pendências" : `${pendingClients.length} pendências`}
          </div>
        </SectionToolbar>

        <div className="list-scroll mt-4 max-h-[360px] space-y-3 overflow-y-auto pr-1">
          {pendingClients.length > 0 ? (
            pendingClients.map((item) => (
              <button
                key={item.cliente?.id}
                onClick={() => navigate(`/clientes?clientId=${item.cliente?.id}`)}
                className="w-full rounded-2xl border border-slate-100 bg-slate-50/80 p-3 text-left transition hover:border-[color:var(--color-success-200)] hover:bg-[color:var(--color-success-50)]/40"
              >
                <p className="text-sm font-semibold text-slate-900">
                  {item.cliente?.nome || "Cliente sem nome"}
                </p>
                <p className="mt-1 text-xs text-slate-500">Faltando: {item.missing.join(", ")}</p>
              </button>
            ))
          ) : (
            <div className="rounded-2xl border border-[color:var(--color-success-200)] bg-[color:var(--color-success-50)] p-4 text-sm text-[color:var(--color-success-700)]">
              <div className="flex items-center gap-2 font-semibold">
                <ShieldCheck size={16} /> Base consistente: não há pendências críticas neste momento.
              </div>
              <p className="mt-1 text-xs text-[color:var(--color-success-800)]/80">
                Continue coletando telefone, CPF, e-mail e nascimento para manter a saúde alta.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
