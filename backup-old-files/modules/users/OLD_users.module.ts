import { Module } from '@nestjs/common';
import { UsersService } from '../services/users.service';
import { UsersController } from '../controllers/users.controller';
import { DatabaseModule } from '../database/database.module';
import { USERS_REPOSITORY_TOKEN } from '../../database/tokens';

@Module({
  imports: [DatabaseModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    {
      provide: USERS_REPOSITORY_TOKEN,
      useExisting: USERS_REPOSITORY_TOKEN,
    },
  ],
  exports: [UsersService],
})
export class UsersModule {}
