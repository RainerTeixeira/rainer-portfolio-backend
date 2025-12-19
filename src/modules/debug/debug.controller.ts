import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DynamoDBService } from '../../database/dynamodb/dynamodb.service';

@ApiTags('debug')
@Controller('debug')
export class DebugController {
  constructor(private readonly dynamoService: DynamoDBService) {}

  @Get('users')
  @ApiOperation({ summary: 'Debug - Testar scan direto de usuários' })
  async debugUsers() {
    try {
      console.log('DebugController.debugUsers - starting scan...');
      const users = await this.dynamoService.scan({}, 'portfolio-backend-table-users');
      console.log('DebugController.debugUsers - users found:', users.length);
      return {
        success: true,
        count: users.length,
        data: users,
        message: 'Scan direto do DynamoDB'
      };
    } catch (error) {
      console.error('DebugController.debugUsers - error:', error);
      return {
        success: false,
        error: error.message,
        message: 'Erro no scan direto'
      };
    }
  }
}