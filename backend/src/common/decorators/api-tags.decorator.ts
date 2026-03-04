import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

export const ApiAuthTag = () => applyDecorators(ApiTags('auth'));
export const ApiVisionTag = () => applyDecorators(ApiTags('vision'));
export const ApiHistoryTag = () => applyDecorators(ApiTags('history'));
export const ApiKnowledgeTag = () => applyDecorators(ApiTags('knowledge'));
export const ApiStraighteningTag = () =>
  applyDecorators(ApiTags('straightening'));
export const ApiClientsTag = () => applyDecorators(ApiTags('clients'));
export const ApiSalonTag = () => applyDecorators(ApiTags('salon'));

export const ApiStandardResponse = (description: string) =>
  applyDecorators(
    ApiResponse({ status: 200, description }),
    ApiResponse({ status: 400, description: 'Bad Request' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 403, description: 'Forbidden' }),
    ApiResponse({ status: 500, description: 'Internal Server Error' }),
  );

export const ApiStandardOperation = (summary: string, description?: string) =>
  applyDecorators(
    ApiOperation({ summary, description }),
    ApiStandardResponse(description || summary),
  );
