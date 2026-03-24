// Hook customizado para garantir que análise sempre seja exibida com correções
// Força cache limpo e aplica correções em tempo real

import { useState, useEffect } from 'react';
import { corrigirTipoFioDuplicado, normalizarTexto, validarComInteligencia } from './AutoCorrectAI';

/**
 * Hook que força correção e limpeza de cache para análise
 * Garante que valores duplicados ou mal formatados sejam sempre corrigidos
 */
export const useAnaliseCorrigida = (analiseOriginal) => {
  const [analiseCorrigida, setAnaliseCorrigida] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const aplicarCorrecoes = async () => {
      if (!analiseOriginal) {
        setAnaliseCorrigida(null);
        setLoading(false);
        return;
      }

      // Força correção com validação inteligente
      const corrigida = await validarComInteligencia(analiseOriginal);
      
      // Força correções adicionais para garantir
      const forcado = {
        ...corrigida,
        tipo_fio: corrigirTipoFioDuplicado(corrigida.tipo_fio || ''),
        tipo_fio_detalhado: corrigirTipoFioDuplicado(corrigida.tipo_fio_detalhado || ''),
        necessidade_corte: normalizarTexto(corrigida.necessidade_corte || ''),
        volume_capilar: normalizarTexto(corrigida.volume_capilar || ''),
        estrutura_fio: normalizarTexto(corrigida.estrutura_fio || ''),
        nivel_dano: normalizarTexto(corrigida.nivel_dano || ''),
        brilho_natural: normalizarTexto(corrigida.brilho_natural || '')
      };
      
      setAnaliseCorrigida(forcado);
      setLoading(false);
    };

    aplicarCorrecoes();
  }, [analiseOriginal]);

  return { analiseCorrigida, loading };
};

/**
 * Componente HOC que garante correção antes do render
 */
export const withCorrecaoAutomatica = (Component) => {
  return function ComponenteCorrigido(props) {
    const { analise, ...outrosProps } = props;
    const { analiseCorrigida, loading } = useAnaliseCorrigida(analise);

    if (loading) {
      return (
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      );
    }

    return <Component {...outrosProps} analise={analiseCorrigida} />;
  };
};

/**
 * Renderizador seguro de campo (sempre corrigido)
 */
export const RenderCampoSeguro = ({ valor, tipo = 'texto' }) => {
  if (!valor) return <span className="text-gray-400">—</span>;

  let valorCorrigido = valor;

  if (tipo === 'tipo_fio') {
    valorCorrigido = corrigirTipoFioDuplicado(valor);
  } else if (tipo === 'texto') {
    valorCorrigido = normalizarTexto(valor);
  }

  return <span>{valorCorrigido}</span>;
};

export default useAnaliseCorrigida;

