/* eslint-disable @typescript-eslint/prefer-promise-reject-errors, @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger } from '@nestjs/common';
import PDFDocument = require('pdfkit');
import type { ReportPayload } from './report.types';

@Injectable()
export class ReportsWorker {
  private readonly logger = new Logger(ReportsWorker.name);
  private readonly fontSize = 11;
  private readonly colorTitle = '#0f172a';
  private readonly colorText = '#111111';
  private readonly colorMuted = '#4b5563';

  async renderPdf(payload: ReportPayload): Promise<Buffer> {
    const doc = new PDFDocument({ size: 'A4', margin: 36 });
    const chunks: Buffer[] = [];
    return await new Promise<Buffer>((resolve, reject) => {
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => {
        this.logger.error(`Erro ao renderizar PDF: ${err}`);
        reject(err);
      });

      this.renderHeader(doc, payload);
      this.renderAptidao(doc, payload);
      this.renderPerfil(doc, payload);
      this.renderAlisamentos(doc, payload);
      this.renderTratamentosSalao(doc, payload);
      this.renderHomeCare(doc, payload);
      this.renderCouroCabeludo(doc, payload);
      this.renderManutencao(doc, payload);
      this.renderNeutralizacao(doc, payload);
      this.renderCronograma(doc, payload);
      this.renderCuidados(doc, payload);
      this.renderAlertas(doc, payload);

      doc.end();
    });
  }

  private renderPerfil(doc: PDFKit.PDFDocument, payload: ReportPayload) {
    doc
      .fillColor(this.colorTitle)
      .fontSize(14)
      .text('Perfil do Fio', { underline: true });
    const p = payload.perfil;
    if (!p) {
      doc.fontSize(11).fillColor('#777').text('Não informado.');
      doc.fillColor('#000');
      doc.moveDown();
      return;
    }
    doc.fontSize(this.fontSize).fillColor(this.colorText);
    doc.text(`Tipo: ${p.tipo || 'N/A'}`);
    doc.text(`Volume: ${p.volume || 'N/A'}`);
    doc.text(`Estrutura: ${p.estrutura || 'N/A'}`);
    if (p.danos) {
      doc.text(`Danos térmicos: ${p.danos.termico ? 'Sim' : 'Não'}`);
      doc.text(`Danos mecânicos: ${p.danos.mecanico ? 'Sim' : 'Não'}`);
      doc.text(`Danos químicos: ${p.danos.quimico ? 'Sim' : 'Não'}`);
    }
    doc.moveDown();

    // Notas técnicas do perfil
    doc.fillColor(this.colorTitle).fontSize(12).text('Notas Técnicas');
    doc
      .fillColor(this.colorMuted)
      .fontSize(10)
      .text(
        '- Avaliar corte químico e elasticidade antes de qualquer química.',
      );
    if (p.danos?.termico || p.danos?.mecanico || p.danos?.quimico)
      doc
        .fontSize(10)
        .text(
          '- Priorizar reconstrução e selagem cuticular antes de procedimentos agressivos.',
        );
    else
      doc
        .fontSize(10)
        .text('- Manter rotina de hidratação e proteção térmica preventiva.');
    doc.fillColor(this.colorText);
    doc.moveDown();
  }

  private renderHeader(doc: PDFKit.PDFDocument, payload: ReportPayload) {
    const title = payload?.salao?.nome
      ? `Relatório Capilar — ${payload.salao.nome}`
      : 'Relatório Capilar';
    doc.fillColor(this.colorTitle).fontSize(18).text(title);
    doc.moveDown(0.4);

    const bloco = [
      `Cliente: ${payload?.cliente?.nome || 'N/A'}`,
      `Profissional: ${payload?.profissional || 'N/A'}`,
      payload?.dataAnalise
        ? `Data: ${new Date(payload.dataAnalise).toLocaleDateString()}`
        : undefined,
      payload?.salao?.nome ? `Salão: ${payload.salao.nome}` : undefined,
    ].filter(Boolean);

    bloco.forEach((line) =>
      doc
        .fillColor(this.colorText)
        .fontSize(11)
        .text(line as string),
    );
    doc.moveDown(0.8);
  }

  private renderAptidao(doc: PDFKit.PDFDocument, payload: ReportPayload) {
    doc.fontSize(14).text('Sumário Executivo - Aptidão', { underline: true });
    const apt = payload.aptidao;
    if (apt) {
      doc.fontSize(12).text(`Status: ${apt.status}`);
      doc.fontSize(11).text(`Justificativa: ${apt.justificativa || '-'}`);
    } else {
      doc.fontSize(11).fillColor('#777').text('Sem decisão registrada.');
      doc.fillColor('#000');
    }
    if (payload.sumario) {
      doc.moveDown(0.3);
      doc.fontSize(11).text(`Notas: ${payload.sumario}`);
    }
    doc.moveDown();
  }

  private renderAlisamentos(doc: PDFKit.PDFDocument, payload: ReportPayload) {
    doc
      .fontSize(14)
      .text('Alisamentos (catálogo do salão)', { underline: true });
    const lista = payload.protocolos?.alisamentos || [];
    if (!lista.length) {
      doc
        .fontSize(11)
        .fillColor('#777')
        .text('Nenhum alisamento cadastrado disponível.');
      doc.fillColor('#000');
      doc.moveDown();
      return;
    }
    lista.forEach((item) => {
      doc.fontSize(12).text(`${item.nome} — ${item.aptidao}`);
      doc.fontSize(11).text(`Justificativa: ${item.justificativa || '-'}`);
      doc.moveDown(0.4);
    });
    doc.moveDown();
  }

  private renderTratamentosSalao(
    doc: PDFKit.PDFDocument,
    payload: ReportPayload,
  ) {
    doc
      .fillColor(this.colorTitle)
      .fontSize(14)
      .text('Tratamentos no Salão', { underline: true });
    const lista = [...(payload.protocolos?.tratamentosSalao || [])].sort(
      (a: any, b: any) => {
        const order = { Alta: 1, Media: 2, Baixa: 3 } as Record<string, number>;
        return (order[a?.prioridade] || 9) - (order[b?.prioridade] || 9);
      },
    );
    if (!lista.length) {
      doc.fontSize(11).fillColor('#777').text('Nenhum tratamento definido.');
      doc.fillColor('#000');
      doc.moveDown();
      return;
    }
    lista.forEach((item) => {
      const prioridade = item as any;
      const priLabel = prioridade?.prioridade
        ? ` · Prioridade: ${prioridade.prioridade}`
        : '';
      doc
        .fillColor(this.colorText)
        .fontSize(12)
        .text(`${item.tipo}${priLabel}`);
      doc.fontSize(11).text(item.descricao || '-');
      doc.fillColor('#000');
      doc.moveDown(0.4);
    });
    doc.moveDown();

    // Notas técnicas salão
    doc.fillColor(this.colorTitle).fontSize(12).text('Notas Técnicas (Salão)');
    doc
      .fillColor(this.colorMuted)
      .fontSize(10)
      .text('- Executar teste de mecha e selagem cuticular prévia.');
    doc
      .fontSize(10)
      .text('- Ajustar pausa e temperatura conforme sensibilidade do fio.');
    doc.fillColor(this.colorText);
    doc.moveDown();
  }

  private renderHomeCare(doc: PDFKit.PDFDocument, payload: ReportPayload) {
    const lista = payload.protocolos?.homeCare || [];
    if (!lista.length) return;
    doc
      .fillColor(this.colorTitle)
      .fontSize(14)
      .text('Home Care', { underline: true });
    lista.forEach((item) => {
      doc.fillColor(this.colorText).fontSize(12).text(item.tipo);
      doc.fontSize(11).text(item.descricao || '-');
      if (item.intervaloDias)
        doc
          .fontSize(10)
          .fillColor('#555')
          .text(`Aplicar a cada ~${item.intervaloDias} dias.`);
      if ((item as any)?.modoUso)
        doc
          .fontSize(10)
          .fillColor('#555')
          .text(`Modo de uso: ${(item as any).modoUso}`);
      doc.fillColor('#000');
      doc.moveDown(0.4);
    });
    doc.moveDown();

    // Notas técnicas home care
    doc
      .fillColor(this.colorTitle)
      .fontSize(12)
      .text('Notas Técnicas (Home Care)');
    doc
      .fillColor(this.colorMuted)
      .fontSize(10)
      .text(
        '- Usar proteção térmica antes de fontes de calor e evitar água muito quente.',
      );
    doc
      .fontSize(10)
      .text(
        '- Respeitar tempo de pausa dos produtos e enxágue completo para não sobrecarregar o fio.',
      );
    doc.fillColor(this.colorText);
    doc.moveDown();
  }

  private renderCouroCabeludo(doc: PDFKit.PDFDocument, payload: ReportPayload) {
    const cuidados = payload.protocolos?.couroCabeludo || [];
    if (!cuidados.length) return;
    doc.fontSize(14).text('Cuidados com Couro Cabeludo', { underline: true });
    cuidados.forEach((c) => doc.fontSize(11).text(`- ${c}`));
    doc.moveDown();
  }

  private renderManutencao(doc: PDFKit.PDFDocument, payload: ReportPayload) {
    const m = payload.protocolos?.manutencao;
    if (!m) return;
    doc.fontSize(14).text('Manutenção e Retornos', { underline: true });
    if (m.tratamentosDias)
      doc
        .fontSize(11)
        .text(`Revisar tratamentos em ~${m.tratamentosDias} dias.`);
    if (m.alisamentoDias)
      doc
        .fontSize(11)
        .text(`Retorno seguro para alisamento em ~${m.alisamentoDias} dias.`);
    if (m.acompanhamentoDias)
      doc
        .fontSize(11)
        .text(`Acompanhamento/checagem em ~${m.acompanhamentoDias} dias.`);
    doc.moveDown();
  }

  private renderNeutralizacao(doc: PDFKit.PDFDocument, payload: ReportPayload) {
    doc.fontSize(14).text('Neutralização', { underline: true });
    const neu = payload.protocolos?.neutralizacao;
    if (!neu) {
      doc.fontSize(11).fillColor('#777').text('Não informado.');
      doc.fillColor('#000');
      doc.moveDown();
      return;
    }
    doc.fontSize(12).text(neu.obrigatoria ? 'Obrigatória' : 'Dispensável');
    doc.fontSize(11).text(`Justificativa: ${neu.justificativa || '-'}`);
    if (neu.produto) doc.text(`Produto: ${neu.produto}`);
    if (neu.tempo) doc.text(`Tempo de ação: ${neu.tempo}`);
    doc
      .fontSize(10)
      .fillColor('#555')
      .text(
        'Regra: obrigatória se pH alcalino, cutícula aberta, elasticidade alterada ou instabilidade pós-química; dispensável se já neutralizado ou produto acidificante.',
      );
    doc.fillColor('#000');
    doc.moveDown();
  }

  private renderCronograma(doc: PDFKit.PDFDocument, payload: ReportPayload) {
    doc
      .fontSize(14)
      .text('Cronograma / Intervalos Seguros', { underline: true });
    const cronograma = payload.protocolos?.cronograma || [];
    if (!cronograma.length) {
      doc.fontSize(11).fillColor('#777').text('Não definido.');
      doc.fillColor('#000');
      doc.moveDown();
      return;
    }
    cronograma.forEach((item) => {
      doc.fontSize(12).text(`Semana ${item.semana}: ${item.foco}`);
      doc.fontSize(11).text(item.observacoes || '-');
      doc.moveDown(0.6);
    });
    doc.moveDown();
  }

  private renderCuidados(doc: PDFKit.PDFDocument, payload: ReportPayload) {
    const cuidados = payload.cuidadosPrePos || [];
    if (!cuidados.length) return;
    doc.fontSize(14).text('Cuidados Pré/Pós', { underline: true });
    cuidados.forEach((c) => doc.fontSize(11).text(`- ${c}`));
    doc.moveDown();
  }

  private renderAlertas(doc: PDFKit.PDFDocument, payload: ReportPayload) {
    const alertas = payload.alertas || [];
    if (!alertas.length) return;
    doc.fontSize(14).text('Alertas / Encaminhamentos', { underline: true });
    alertas.forEach((a) => doc.fontSize(11).text(`- ${a}`));
    doc.moveDown();
    doc
      .fontSize(10)
      .fillColor('#555')
      .text(
        'Sistema estético assistido por IA. Não substitui avaliação médica ou dermatológica.',
      );
    doc.fillColor('#000');
    doc.moveDown();
  }
}
