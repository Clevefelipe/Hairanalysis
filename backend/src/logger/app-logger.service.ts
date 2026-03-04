import { Injectable, Logger, LoggerService } from '@nestjs/common';

@Injectable()
export class AppLogger extends Logger implements LoggerService {}
