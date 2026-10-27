import { Module, ValidationPipe } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { APP_PIPE } from '@nestjs/core';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { DatabaseModule } from './database/database.module.js';
import { MeetingsModule } from './meetings/meetings.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    CqrsModule.forRoot(),
    DatabaseModule,
    UsersModule,
    AuthModule,
    MeetingsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({ whitelist: true }),
    },
  ],
})
export class AppModule {}
