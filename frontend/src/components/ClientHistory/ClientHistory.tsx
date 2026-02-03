import { useEffect, useState } from "react";
import { getHistoryByClient } from "../../services/history.service";

interface HistoryItem {
  id: string;
  date: string;
  procedure: string;
  notes: string;
  professional: string;
}

interface Props {
  clientId: string;
}

export default function ClientHistory({ clientId }: Props) {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHistoryByClient(clientId)
      .then(setItems)
      .finally(() => setLoading(false));
  }, [clientId]);

  if (loading) return <p>Carregando histórico...</p>;
  if (!items.length) return <p>Nenhum histórico encontrado.</p>;

  return (
    <div>
      <h3>Histórico Clínico</h3>

      <ul>
        {items.map((item) => (
          <li key={item.id} style={{ marginBottom: 16 }}>
            <strong>{item.date}</strong> — {item.procedure}
            <br />
            Profissional: {item.professional}
            <br />
            Observações: {item.notes}
          </li>
        ))}
      </ul>
    </div>
  );
}
