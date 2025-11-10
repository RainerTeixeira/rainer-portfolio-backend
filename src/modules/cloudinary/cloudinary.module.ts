/**
 * Módulo de Cloudinary
 * 
 * Módulo NestJS para integração com Cloudinary.
 * 
 * @module modules/cloudinary/cloudinary.module
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CloudinaryService } from './cloudinary.service.js';
import { CloudinaryController } from './cloudinary.controller.js';

@Module({
  imports: [ConfigModule],
  controllers: [CloudinaryController],
  providers: [CloudinaryService],
  exports: [CloudinaryService],
})
export class CloudinaryModule {}

