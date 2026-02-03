import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useAuth } from "../../context/AuthContext";

interface Props {
  children: ReactNode;
}

export default function PageContainer({ children }: Props) {
  const { isReady } = useAuth();

  if (!isReady) {
    return (
      <div className="h-screen flex items-center justify-center text-slate-500">
        Carregando aplicação...
      </div>
    );
  }

  return (
    <div className="flex">
      <Sidebar />

      <div className="flex-1 ml-64 min-h-screen bg-slate-50">
        <Topbar />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
