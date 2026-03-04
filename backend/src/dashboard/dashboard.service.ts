import { Injectable } from '@nestjs/common';
import { clientes } from '../clientes/clientes.store';
import { analises } from '../analises/analises.store';
import { evolucoes } from '../evolucoes/evolucoes.store';

@Injectable()
export class DashboardService {
  obterResumoAdmin() {
    return {
      totalClientes: clientes.length,
      totalAnalises: analises.length,
      totalEvolucoes: evolucoes.length,
    };
  }
}
