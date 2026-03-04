import { UserRound, Repeat, LogOut } from "lucide-react";
import { SessionClient } from "@/context/ClientSessionContext";

type ActiveClientSessionBarProps = {
  client: SessionClient;
  onOpenClient: () => void;
  onSwitchClient: () => void;
  onEndSession: () => void;
};

export default function ActiveClientSessionBar({
  client,
  onOpenClient,
  onSwitchClient,
  onEndSession,
}: ActiveClientSessionBarProps) {
  return (
    <div className="sticky top-0 z-20 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-500">
        <span className="font-semibold">Cliente em sessão</span>
      </div>
      <div className="mt-2 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 underline-offset-2 hover:underline"
            onClick={onOpenClient}
          >
            <UserRound size={15} />
            {client.nome}
          </button>
          <div className="flex flex-wrap gap-2">
            <button className="btn-secondary inline-flex items-center gap-2 text-xs" onClick={onSwitchClient}>
              <Repeat size={14} />
              Trocar cliente
            </button>
            <button className="btn-secondary inline-flex items-center gap-2 text-xs" onClick={onEndSession}>
              <LogOut size={14} />
              Encerrar sessão
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
