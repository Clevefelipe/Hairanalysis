import { Injectable } from '@nestjs/common';

@Injectable()
export class HistoryAiService {
  buildStraighteningExplanation(_service: any, _baseResult: any) {
    return {
      reasons: ['Explicação indisponível (stub).'],
      warnings: [],
    };
  }
}
