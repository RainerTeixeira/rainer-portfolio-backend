import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { MongoClient, Db, Document, Collection } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({
  path: path.join(process.cwd(), '.env'),
  override: true,
});

class EnvUtil {
  static get(key: string, defaultValue?: string): string {
    return process.env[key] || defaultValue || '';
  }

  static getNumber(key: string, defaultValue?: number): number {
    const value = process.env[key];
    if (!value) return defaultValue || 0;
    const num = parseInt(value, 10);
    return isNaN(num) ? (defaultValue || 0) : num;
  }

  static getBoolean(key: string, defaultValue?: boolean): boolean {
    const value = process.env[key];
    if (!value) return defaultValue || false;
    return value.toLowerCase() === 'true';
  }
}

@Injectable()
export class MongoDBService implements OnModuleInit {
  private readonly logger = new Logger(MongoDBService.name);
  private client: MongoClient;
  private db: Db;

  constructor() {}

  async onModuleInit(): Promise<void> {
    const dbProvider = EnvUtil.get('DATABASE_PROVIDER', 'PRISMA');
    if (dbProvider !== 'PRISMA') {
      this.logger.log('MongoDB skipped (DATABASE_PROVIDER is not "PRISMA")');
      return;
    }

    await this.connect();
  }

  async connect(): Promise<void> {
    try {
      const uri = EnvUtil.get('DATABASE_URL');
      const dbName = EnvUtil.get('MONGODB_DB_NAME');

      if (!uri) {
        throw new Error('DATABASE_URL is not defined');
      }

      this.client = new MongoClient(uri);
      await this.client.connect();
      this.db = this.client.db(dbName);

      this.logger.log(`Connected to MongoDB: ${dbName}`);
    } catch (error) {
      this.logger.error('Failed to connect to MongoDB', error);
      throw error;
    }
  }

  getDatabase(): Db {
    if (!this.db) {
      throw new Error('MongoDB not connected. Call connect() first.');
    }
    return this.db;
  }

  getCollection<T extends Document>(name: string): Collection<T> {
    return this.getDatabase().collection<T>(name);
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.logger.log('Disconnected from MongoDB');
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.db.admin().ping();
      return true;
    } catch (error) {
      this.logger.error('MongoDB health check failed', error);
      return false;
    }
  }
}
