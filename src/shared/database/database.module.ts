import { Module } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { MyLoggerModule } from 'src/shared/my-logger/my-logger.module';

@Module({
  providers: [DatabaseService],
  exports: [DatabaseService],
  imports: [MyLoggerModule],
})
export class DatabaseModule {}
