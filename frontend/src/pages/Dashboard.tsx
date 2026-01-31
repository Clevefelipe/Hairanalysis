import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">
        Painel
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Análise Tricológica */}
        <div className="border rounded-lg p-4 bg-white shadow-sm space-y-3">
          <h2 className="text-lg font-medium">
            Análise Tricológica
          </h2>
          <p className="text-sm text-gray-600">
            Diagnóstico do couro cabeludo com suporte de IA.
          </p>
          <button
            onClick={() => navigate("/analise-tricologica")}
            className="px-4 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
          >
            Iniciar análise
          </button>
        </div>

        {/* Análise Capilar */}
        <div className="border rounded-lg p-4 bg-white shadow-sm space-y-3">
          <h2 className="text-lg font-medium">
            Análise Capilar
          </h2>
          <p className="text-sm text-gray-600">
            Avaliação da fibra capilar e integridade dos fios.
          </p>
          <button
            onClick={() => navigate("/analise-capilar")}
            className="px-4 py-2 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
          >
            Iniciar análise
          </button>
        </div>

        {/* Histórico */}
        <div className="border rounded-lg p-4 bg-white shadow-sm space-y-3">
          <h2 className="text-lg font-medium">
            Histórico de Análises
          </h2>
          <p className="text-sm text-gray-600">
            Visualize resultados anteriores e evolução do cliente.
          </p>
          <button
            onClick={() => navigate("/historico")}
            className="px-4 py-2 rounded bg-green-600 text-white text-sm hover:bg-green-700"
          >
            Ver histórico
          </button>
        </div>
      </div>
    </div>
  );
}
