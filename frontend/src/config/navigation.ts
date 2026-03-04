import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  History,
  TrendingUp,
  Sparkles,
  Microscope,
  Settings2,
  BookOpen,
  UsersRound,
  ClipboardList,
  Layers3,
  Palette,
} from "lucide-react";

type Role = "ADMIN" | "PROFESSIONAL" | null | undefined;

export type NavigationItem = {
  label: string;
  path: string;
  icon: LucideIcon;
  roles?: Array<"ADMIN" | "PROFESSIONAL">;
  description?: string;
  badge?: string;
};

export type NavigationGroup = {
  title: string;
  items: NavigationItem[];
};

const CORE_FLOW: NavigationItem[] = [
  {
    label: "Central de Análises",
    path: "/analises",
    icon: Layers3,
    description: "Orquestração completa de análise, protocolo e recomendações",
    badge: "Core",
  },
  {
    label: "Clientes",
    path: "/clientes",
    icon: Users,
    description: "Cadastro e gestão completa da base de clientes",
    badge: "Relacionamento",
  },
  {
    label: "Análise Capilar",
    path: "/analise-capilar",
    icon: Sparkles,
    description: "Fluxo principal com avaliação estética assistida por IA",
    badge: "Operação",
  },
  {
    label: "Análise Tricológica",
    path: "/analise-tricologica",
    icon: Microscope,
    description: "Avaliação do couro cabeludo e sinais tricológicos",
    badge: "Operação",
  },
  {
    label: "Histórico",
    path: "/historico",
    icon: History,
    description: "Evolução técnica e comparação entre visitas",
    badge: "Acompanhamento",
  },
];

const ADMIN_ONLY: NavigationItem[] = [
  {
    label: "Base de Conhecimento",
    path: "/admin/conhecimento",
    icon: BookOpen,
    roles: ["ADMIN"],
    description: "Documentos, protocolos e governança técnica",
    badge: "Procedimentos",
  },
  {
    label: "Profissionais",
    path: "/admin/profissionais",
    icon: UsersRound,
    roles: ["ADMIN"],
  },
  {
    label: "Branding do Salão",
    path: "/admin/branding",
    icon: Palette,
    roles: ["ADMIN"],
    description: "Paleta, tipografia e logo por tenant",
    badge: "Marca",
  },
  {
    label: "Audit Logs",
    path: "/administracao/audit",
    icon: ClipboardList,
    roles: ["ADMIN"],
  },
];

export function canAccess(item: NavigationItem, role: Role) {
  if (!item.roles || item.roles.length === 0) return true;
  return role ? item.roles.includes(role) : false;
}

export function getSidebarGroups(role: Role): NavigationGroup[] {
  return [
    {
      title: "Fluxo Principal",
      items: CORE_FLOW.filter((item) => canAccess(item, role)),
    },
    {
      title: "Operação",
      items: [
        { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
        { label: "Evolução", path: "/historico/evolucao", icon: TrendingUp },
        { label: "Alisamentos", path: "/alisamentos", icon: Settings2 },
      ].filter((item) => canAccess(item, role)),
    },
    {
      title: "Administração",
      items: ADMIN_ONLY.filter((item) => canAccess(item, role)),
    },
  ].filter((group) => group.items.length > 0);
}

export function getTopbarShortcuts(role: Role): NavigationItem[] {
  return [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    ...CORE_FLOW,
    ...ADMIN_ONLY,
  ].filter((item) => canAccess(item, role));
}

export function getTopbarQuickActions(role: Role): NavigationItem[] {
  const capilar = CORE_FLOW.find((item) => item.path === "/analise-capilar");
  const clientes = CORE_FLOW.find((item) => item.path === "/clientes");
  return [capilar, clientes, canAccess(ADMIN_ONLY[0], role) ? ADMIN_ONLY[0] : null].filter(
    (item): item is NavigationItem => Boolean(item),
  );
}

export function getDashboardQuickActions(role: Role): NavigationItem[] {
  return getTopbarQuickActions(role);
}
