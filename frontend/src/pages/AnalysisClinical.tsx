import { useState } from "react";
import { submitClinicalAnalysis } from "../services/analysis.service";

export default function AnalysisClinical() {
  const [form, setForm] = useState({
    clientId: "",
    hairType: "",
    porosity: "",
    elasticity: "",
    chemicalHistory: false,
    thermalDamage: false,
    mechanicalDamage: false,
    scalpCondition: "",
    observations: "",
  });

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  async function handleSubmit(e: any) {
    e.preventDefault();
    await submitClinicalAnalysis(form);
    alert("Análise clínica registrada com sucesso");
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Análise Capilar Clínica</h2>

      <select name="hairType" onChange={handleChange} required>
        <option value="">Tipo de fio</option>
        <option value="LISO">Liso</option>
        <option value="ONDULADO">Ondulado</option>
        <option value="CACHEADO">Cacheado</option>
        <option value="CRESPO">Crespo</option>
      </select>

      <select name="porosity" onChange={handleChange} required>
        <option value="">Porosidade</option>
        <option value="BAIXA">Baixa</option>
        <option value="MEDIA">Média</option>
        <option value="ALTA">Alta</option>
      </select>

      <select name="elasticity" onChange={handleChange} required>
        <option value="">Elasticidade</option>
        <option value="BAIXA">Baixa</option>
        <option value="MEDIA">Média</option>
        <option value="ALTA">Alta</option>
      </select>

      <label>
        <input type="checkbox" name="chemicalHistory" onChange={handleChange} />
        Histórico químico
      </label>

      <label>
        <input type="checkbox" name="thermalDamage" onChange={handleChange} />
        Danos térmicos
      </label>

      <label>
        <input type="checkbox" name="mechanicalDamage" onChange={handleChange} />
        Danos mecânicos
      </label>

      <select name="scalpCondition" onChange={handleChange} required>
        <option value="">Couro cabeludo</option>
        <option value="NORMAL">Normal</option>
        <option value="OLEOSA">Oleosa</option>
        <option value="SECA">Seca</option>
        <option value="SENSIVEL">Sensível</option>
      </select>

      <textarea
        name="observations"
        placeholder="Observações clínicas"
        onChange={handleChange}
      />

      <button type="submit">Gerar análise clínica</button>
    </form>
  );
}
