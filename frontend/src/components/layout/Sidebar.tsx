import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Sidebar() {
  const { role } = useAuth();

  const menu = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Clientes", path: "/clientes" },
    { label: "Historico", path: "/historico" },
    { label: "Evolucao", path: "/historico/evolucao" },
    ...(role === "ADMIN"
      ? [
          { label: "Audit Logs", path: "/administracao/audit" },
        ]
      : []),
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white p-4">
      <h2 className="text-lg font-semibold mb-4">
        Hair Analysis
      </h2>

      <nav className="space-y-2">
        {menu.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className="block px-3 py-2 rounded hover:bg-slate-800"
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
