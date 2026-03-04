import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Sidebar() {
  const { role } = useAuth();

  const menu = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Analises", path: "/analises" },
    { label: "Clientes", path: "/clientes" },
    { label: "Historico", path: "/historico" },
    { label: "Evolucao", path: "/historico/evolucao" },
    { label: "Alisamentos", path: "/alisamentos" },
    { label: "Servicos", path: "/servicos" },
    { label: "Branding", path: "/branding" },
    ...(role === "ADMIN" ? [{ label: "Audit Logs", path: "/administracao/audit" }] : []),
  ];

  return (
    <aside
      className="w-64 text-white p-4"
      style={{ backgroundColor: "var(--brand-primary)" }}
    >
      <h2 className="text-lg font-semibold mb-4">Hair Analysis</h2>

      <nav className="space-y-2">
        {menu.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `block px-3 py-2 rounded transition-colors ${
                isActive ? "text-white" : "text-slate-100"
              }`
            }
            style={({ isActive }) => ({
              backgroundColor: isActive
                ? "rgba(var(--brand-primary-rgb), 0.35)"
                : "transparent",
            })}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
