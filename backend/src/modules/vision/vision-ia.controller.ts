import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('vision/ia')
export class VisionIaController {
  @Post('analyze')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, unique + extname(file.originalname));
        },
      }),
    }),
  )
  async analyzeImage(@UploadedFile() file: any) {
    // Aqui você pode chamar o serviço/modelo IA real ou mock
    // Exemplo de resposta mock:
    return {
      success: true,
      achados: [
        { tipo: 'oleosidade', score: 0.8 },
        { tipo: 'descamação', score: 0.6 },
      ],
      alertas: ['Oleosidade excessiva detectada'],
      recomendacoes: [
        'Lavar com shampoo antioleosidade',
        'Consultar profissional',
      ],
      filePath: file.path,
    };
  }
}
