import { ArrowUpRight, FileText, Sparkles, Users } from "lucide-react";
import PageHero from "@/components/ui/PageHero";
import SectionToolbar from "@/components/ui/SectionToolbar";

const quickActions = [
  {
    title: "Cadastrar cliente",
    description: "Associar dados biométricos e histórico clínico.",
    action: "Abrir fluxo premium",
  },
  {
    title: "Importar planilha",
    description: "Traga registros legados (CSV, XLSX).",
    action: "Upload assistido",
  },
  {
    title: "Sincronizar CRM",
    description: "Integre com sistemas parceiros certificados.",
    action: "Conectar agora",
  },
];

const roadmapCards = [
  {
    icon: <Users className="text-[color:var(--color-success-500)]" size={18} />,
    title: "Segmentação inteligente",
    description:
      "Perfis automáticos por tipo de fio, protocolos preferidos e sensibilidade química.",
  },
  {
    icon: <FileText className="text-slate-500" size={18} />,
    title: "Dossiês em PDF",
    description:
      "Exportação premium com histórico clínico, evolução fotográfica e recomendações IA.",
  },
];

export function Clientes() {
  return (
    <main className="section-stack animate-page-in w-full">
      <PageHero
        title="Clientes"
        subtitle="Gestão de relacionamento e cadastros premium assistidos por IA."
        meta={[{ label: "Status", value: "Placeholder premium" }]}
      />

      <SectionToolbar className="justify-between">
        <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Gestão de relacionamento</div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-primary focus-ring-strong">Novo cliente</button>
          <button className="btn-secondary focus-ring-strong">Importar base</button>
        </div>
      </SectionToolbar>

      <div className="grid-dense md:grid-cols-3">
        {quickActions.map((item) => (
          <article key={item.title} className="panel-tight transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Ação rápida</p>
                <h3 className="mt-3 text-lg font-semibold text-slate-900">{item.title}</h3>
              </div>
              <ArrowUpRight className="text-slate-300" size={18} />
            </div>
            <p className="mt-3 text-sm text-slate-500">{item.description}</p>
            <button className="mt-4 text-sm font-medium text-[color:var(--color-success-600)] focus-ring-strong">
              {item.action}
            </button>
          </article>
        ))}
      </div>

      <div className="panel-tight border border-dashed border-[color:var(--color-success-200)] bg-[color:var(--color-success-50)]/30 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3 text-[color:var(--color-success-600)]">
          <Sparkles size={18} />
          <span className="text-xs uppercase tracking-[0.35em]">Visão futura</span>
        </div>
        <h2 className="mt-4 text-xl font-semibold text-slate-900">
          Estamos preparando a experiência premium de clientes
        </h2>
        <p className="mt-2 text-sm text-slate-500 max-w-2xl">
          O módulo herdará o mesmo wizard inteligente das análises, com captura guiada,
          validação de dados em tempo real e integração direta com histórico/PDF. Esta tela é um
          placeholder estilizado para manter consistência visual até a entrega completa.
        </p>
      </div>

      <div className="grid-dense md:grid-cols-2">
        {roadmapCards.map((card) => (
          <article key={card.title} className="panel-tight shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              {card.icon}
              <h3 className="text-base font-semibold text-slate-900">{card.title}</h3>
            </div>
            <p className="mt-3 text-sm text-slate-500">{card.description}</p>
          </article>
        ))}
      </div>
    </main>
  );
}
