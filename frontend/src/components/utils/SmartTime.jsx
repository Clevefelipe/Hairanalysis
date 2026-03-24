// SmartTime - Sistema Inteligente de Sincronização de Data e Hora
// Analyzer SDM IA — Diagnóstico Inteligente

import { format, parseISO, formatISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * SmartTime - Gerenciador inteligente de data e hora
 * Sincroniza automaticamente com o dispositivo local do usuário
 */
class SmartTimeManager {
  constructor() {
    this.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    this.locale = 'pt-BR';
    this.dateFormat = 'dd/MM/yyyy';
    this.timeFormat = 'HH:mm';
    this.dateTimeFormat = "dd/MM/yyyy 'às' HH:mm";
    
  }

  /**
   * Retorna a data/hora atual do dispositivo local
   */
  now() {
    return new Date();
  }

  /**
   * Formata uma data no padrão brasileiro
   * @param {Date|string} date - Data a ser formatada
   * @param {string} pattern - Padrão de formatação (opcional)
   */
  format(date, pattern = null) {
    try {
      // Se for string ISO, converter para Date
      let dateObj;
      if (typeof date === 'string') {
        // Garantir que está tratando como UTC se vier do servidor
        dateObj = new Date(date);
      } else {
        dateObj = date;
      }

      const formatPattern = pattern || this.dateTimeFormat;
      return format(dateObj, formatPattern, { locale: ptBR });
    } catch (error) {
      return 'Data inválida';
    }
  }

  /**
   * Formata apenas a data (sem hora)
   */
  formatDate(date) {
    return this.format(date, this.dateFormat);
  }

  /**
   * Formata apenas a hora (sem data)
   */
  formatTime(date) {
    return this.format(date, this.timeFormat);
  }

  /**
   * Formata data e hora no padrão completo
   */
  formatDateTime(date) {
    return this.format(date, this.dateTimeFormat);
  }

  /**
   * Formata para padrão extenso (usado em PDFs)
   */
  formatDateTimeFull(date) {
    return this.format(date, "dd 'de' MMMM 'de' yyyy");
  }

  /**
   * Converte uma data para ISO string mantendo timezone local
   */
  toISO(date) {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return dateObj.toISOString();
    } catch (error) {
      return null;
    }
  }

  /**
   * Calcula diferença entre duas datas em dias
   */
  diffInDays(date1, date2) {
    const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
    const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
    const diffTime = Math.abs(d2 - d1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Adiciona dias a uma data
   */
  addDays(date, days) {
    const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
    const result = new Date(dateObj);
    result.setDate(result.getDate() + days);
    return result;
  }

  /**
   * Retorna data para input[type="date"] (YYYY-MM-DD)
   */
  toInputDate(date = null) {
    const d = date ? (typeof date === 'string' ? new Date(date) : date) : new Date();
    return format(d, 'yyyy-MM-dd');
  }

  /**
   * Converte input[type="date"] para Date
   */
  fromInputDate(inputDate) {
    return new Date(inputDate);
  }

  /**
   * Verifica se uma data é válida
   */
  isValid(date) {
    try {
      const d = typeof date === 'string' ? new Date(date) : date;
      return d instanceof Date && !isNaN(d.getTime());
    } catch {
      return false;
    }
  }

  /**
   * Retorna informações sobre o timezone
   */
  getTimezoneInfo() {
    const now = new Date();
    const offset = -now.getTimezoneOffset();
    const hours = Math.floor(Math.abs(offset) / 60);
    const minutes = Math.abs(offset) % 60;
    const sign = offset >= 0 ? '+' : '-';
    
    return {
      timezone: this.timezone,
      offset: `GMT${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
      offsetMinutes: offset
    };
  }

  /**
   * Formata data relativa (ex: "há 2 horas", "ontem")
   */
  formatRelative(date) {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now - dateObj;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'agora há pouco';
    if (diffMins < 60) return `há ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
    if (diffHours < 24) return `há ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    if (diffDays === 1) return 'ontem';
    if (diffDays < 7) return `há ${diffDays} dias`;
    if (diffDays < 30) return `há ${Math.floor(diffDays / 7)} semana${Math.floor(diffDays / 7) > 1 ? 's' : ''}`;
    if (diffDays < 365) return `há ${Math.floor(diffDays / 30)} mês${Math.floor(diffDays / 30) > 1 ? 'es' : ''}`;
    return `há ${Math.floor(diffDays / 365)} ano${Math.floor(diffDays / 365) > 1 ? 's' : ''}`;
  }

  /**
   * Debug: mostra informações de uma data
   */
  debugDate(date, label = 'Data') {
    const d = typeof date === 'string' ? new Date(date) : date;
  }
}

// Instância global
let smartTimeInstance = null;

export function initSmartTime() {
  if (typeof window !== 'undefined' && !smartTimeInstance) {
    smartTimeInstance = new SmartTimeManager();
  }
  return smartTimeInstance;
}

export function getSmartTime() {
  if (!smartTimeInstance) {
    return initSmartTime();
  }
  return smartTimeInstance;
}

// Exportar funções utilitárias
export const formatDateTime = (date) => getSmartTime().formatDateTime(date);
export const formatDate = (date) => getSmartTime().formatDate(date);
export const formatTime = (date) => getSmartTime().formatTime(date);
export const formatDateTimeFull = (date) => getSmartTime().formatDateTimeFull(date);

export default SmartTimeManager;

