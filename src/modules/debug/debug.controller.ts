/**
 * Debug Controller for testing DynamoDB
 */

import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DynamoDBService } from '../../database/dynamodb/dynamodb.service';

@ApiTags('debug')
@Controller('debug')
export class DebugController {
  constructor(private readonly dynamoService: DynamoDBService) {}

  @Get('posts')
  async testPosts() {
    try {
      console.log('Debug: Testing posts scan...');
      const posts = await this.dynamoService.scan({}, 'portfolio-backend-table-posts');
      console.log('Debug: Posts found:', posts.length);
      return {
        success: true,
        message: 'Debug posts scan',
        data: posts,
        count: posts.length
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Debug: Error scanning posts:', error);
      return {
        success: false,
        message: 'Error scanning posts',
        error: message
      };
    }
  }

  @Get('categories')
  async testCategories() {
    try {
      console.log('Debug: Testing categories scan...');
      const categories = await this.dynamoService.scan({}, 'portfolio-backend-table-categories');
      console.log('Debug: Categories found:', categories.length);
      return {
        success: true,
        message: 'Debug categories scan',
        data: categories,
        count: categories.length
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Debug: Error scanning categories:', error);
      return {
        success: false,
        message: 'Error scanning categories',
        error: message
      };
    }
  }
}