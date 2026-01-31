import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "../../styles/system.css";

type SectionProps = {
  title: string;
  children: React.ReactNode;
};

function Section({ title, children }: SectionProps) {
  return (
    <div className="sidebar-section">
      <span className="sidebar-section-title">{title}</span>
      <div className="sidebar-items">{children}</div>
    </div>
  );
}

type ItemProps = {
  to: string;
  label: string;
};

function Item({ to, label }: ItemProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        isActive ? "sidebar-link active" : "sidebar-link"
      }
    >
      {label}
    </NavLink>
  );
}

export default function Sidebar() {
  const { role } = useAuth();

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <Section title="Painel">
          <Item to="/dashboard" label="Dashboard" />
        </Section>

        <Section title="Análises">
          <Item to="/analise-capilar" label="Análise Capilar" />
          <Item to="/analise-tricologica" label="Análise Tricológica" />
        </Section>

        <Section title="Histórico">
          <Item to="/historico" label="Histórico" />
        </Section>

        {/* 🔐 ADMIN ONLY */}
        {role === "ADMIN" && (
          <Section title="Administração">
            <Item
              to="/administracao/audit"
              label="Audit Logs"
            />
          </Section>
        )}
      </nav>
    </aside>
  );
}
