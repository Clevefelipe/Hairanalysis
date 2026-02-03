import { useAuth } from "../../context/AuthContext";

function formatRole(role: string | null | undefined) {
  if (role === "ADMIN") return "Administrador";
  if (role === "PROFESSIONAL") return "Profissional";
  return "Usuario";
}

export default function TopBar() {
  const { logout, role, user } = useAuth();
  const displayName = user?.fullName || user?.name || formatRole(role);

  return (
    <header className="h-14 bg-white border-b flex items-center justify-between px-6">
      <div className="flex flex-col">
        <span className="text-sm text-gray-600">
          {displayName}
        </span>
        <span className="text-xs text-gray-400">
          {formatRole(role)} - Salon: {user?.salonId ?? "-"}
        </span>
      </div>

      <button
        onClick={logout}
        className="text-sm bg-slate-900 text-white px-3 py-1 rounded"
      >
        Sair
      </button>
    </header>
  );
}
