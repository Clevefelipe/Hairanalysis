import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-6 shadow-xl">
        <Outlet />
      </div>
    </div>
  );
}
