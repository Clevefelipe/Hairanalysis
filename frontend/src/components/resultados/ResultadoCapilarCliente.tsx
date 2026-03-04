import "./ResultadoCapilarCliente.css";
import { ResultadoCapilar } from "@/types/ResultadoCapilar";
import { exportResultadoCapilarPDF } from "@/components/utils/pdf/exportResultadoCapilar";
import { useAuth } from "@/context/AuthContext";
import { formatDateBr } from "@/utils/date";

interface Props {
  resultado?: ResultadoCapilar | null;
}

export default function ResultadoCapilarCliente({ resultado }: Props) {
  const { role } = useAuth();
  const isTecnico = role === "PROFESSIONAL";

  if (!resultado) {
    return (
      <div className="resultado-container">
        <p className="resultado-vazio">
          Nenhuma análise capilar disponível.
        </p>
      </div>
    );
  }

  return (
    <div className="resultado-container">
      <header className="resultado-header">
        <div className="resultado-header-top">
          <div>
            <h1 className="resultado-titulo">
              Análise Capilar {isTecnico ? "Técnica" : "Profissional"}
            </h1>

            {isTecnico && (
              <div className="resultado-meta">
                <span>Cliente: {resultado.clienteNome}</span>
                <span>
                  Profissional: {resultado.profissionalNome}
                </span>
                <span>
                  Data: {formatDateBr(resultado.dataAnalise)}
                </span>
              </div>
            )}
          </div>

          <button
            className="btn-pdf"
            onClick={() =>
              exportResultadoCapilarPDF({
                fileName: `resultado-${resultado.id}`,
              })
            }
          >
            Exportar PDF
          </button>
        </div>
      </header>

      <section className="card">
        <h2 className="card-titulo">Diagnóstico Geral</h2>
        <p className="card-texto">{resultado.diagnosticoGeral}</p>
      </section>

      <section className="card destaque">
        <h2 className="card-titulo">Score de Saúde Capilar</h2>
        <span className="score-valor">{resultado.scoreSaude}%</span>
      </section>

      {isTecnico && (
        <section className="card">
          <h2 className="card-titulo">Alertas Técnicos</h2>
          <ul className="lista">
            {(resultado.alertas ?? []).map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="card">
        <h2 className="card-titulo">Plano de Tratamento</h2>
        <ul className="lista">
          {(resultado.tratamentosRecomendados ?? []).map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
