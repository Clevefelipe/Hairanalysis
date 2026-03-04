import { Outlet } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";

export default function SidebarLayout() {
  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <Sidebar />
      <main className="flex-1 bg-white/80 px-4 py-6 sm:px-6 lg:px-10">
        <Outlet />
      </main>
    </div>
  );
}
