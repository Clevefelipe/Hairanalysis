import React, { useState } from "react";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ClienteForm({ cliente, onSubmit, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    nome: cliente?.nome || '',
    telefone: cliente?.telefone || '',
    tipo_cabelo: cliente?.tipo_cabelo || 'liso',
    observacoes: cliente?.observacoes || '',
    valor_apartir: cliente?.valor_apartir || 0
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label>Nome Completo *</Label>
          <Input
            required
            value={formData.nome}
            onChange={(e) => setFormData({...formData, nome: e.target.value})}
            placeholder="Digite o nome completo"
            className="bg-white/50"
          />
        </div>

        <div>
          <Label>Telefone *</Label>
          <Input
            required
            value={formData.telefone}
            onChange={(e) => setFormData({...formData, telefone: e.target.value})}
            placeholder="(00) 00000-0000"
            className="bg-white/50"
          />
        </div>
      </div>

      <div>
        <Label>Tipo de Cabelo</Label>
        <Select
          value={formData.tipo_cabelo}
          onValueChange={(value) => setFormData({...formData, tipo_cabelo: value})}
        >
          <SelectTrigger className="bg-white/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="liso">Liso</SelectItem>
            <SelectItem value="ondulado">Ondulado</SelectItem>
            <SelectItem value="cacheado">Cacheado</SelectItem>
            <SelectItem value="crespo">Crespo</SelectItem>
            <SelectItem value="misto">Misto</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Valor Apartir (R$)</Label>
        <Input
          type="number"
          step="0.01"
          value={formData.valor_apartir}
          onChange={(e) => setFormData({...formData, valor_apartir: parseFloat(e.target.value) || 0})}
          placeholder="0.00"
          className="bg-white/50"
        />
      </div>

      <div>
        <Label>Observações</Label>
        <Textarea
          value={formData.observacoes}
          onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
          placeholder="Informações adicionais sobre o cliente..."
          className="bg-white/50 h-24"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isLoading}
          className="border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface-50)]"
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading} variant="primary">
          {isLoading ? 'Salvando...' : cliente ? 'Atualizar Cliente' : 'Adicionar Cliente'}
        </Button>
      </div>
    </form>
  );
}

