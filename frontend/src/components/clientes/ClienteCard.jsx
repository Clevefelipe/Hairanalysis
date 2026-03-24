import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import Button from "@/components/ui/Button";
import { Edit, Trash2, Phone, User } from "lucide-react";

export default function ClienteCard({ cliente, onEdit, onDelete }) {
  return (
    <Card className="apple-card apple-section border-none">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold shadow-md">
              {cliente.nome[0].toUpperCase()}
            </div>
            <div>
              <h3 className="font-bold text-gray-900">{cliente.nome}</h3>
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {cliente.telefone}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Tipo de cabelo:</span>
            <span className="font-semibold text-gray-900 capitalize">{cliente.tipo_cabelo}</span>
          </div>
          {cliente.valor_apartir > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">A partir de:</span>
              <span className="font-semibold text-pink-600">
                R$ {cliente.valor_apartir.toFixed(2)}
              </span>
            </div>
          )}
        </div>

        {cliente.observacoes && (
          <p className="text-sm text-gray-600 mb-4 p-3 bg-white/70 rounded-lg border border-gray-100">
            {cliente.observacoes}
          </p>
        )}

        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => onEdit(cliente)}
            className="flex-1"
          >
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
          <Button
            variant="danger"
            onClick={() => onDelete(cliente.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

