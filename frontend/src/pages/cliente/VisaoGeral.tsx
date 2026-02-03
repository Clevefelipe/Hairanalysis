import { useState } from "react";
import ClientesHeader from "./components/ClientesHeader";
import ClientesBusca from "./components/ClientesBusca";
import ClientesLista from "./components/ClientesLista";
import CadastroClienteModal from "./CadastroClienteModal";
import "../../styles/system.css";

export default function VisaoGeralCliente() {
  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState(false);

  return (
    <section className="clientes-page">
      <ClientesHeader onNovoCliente={() => setModalAberto(true)} />

      <ClientesBusca value={busca} onChange={setBusca} />

      <ClientesLista />

      {modalAberto && (
        <CadastroClienteModal onClose={() => setModalAberto(false)} />
      )}
    </section>
  );
}
