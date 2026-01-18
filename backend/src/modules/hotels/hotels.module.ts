import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HotelsService } from './hotels.service';
import { HotelsController } from './hotels.controller';
import { Hotel } from './entities/hotel.entity';
import { RoomsModule } from '../rooms/rooms.module'; // Added this import

@Module({
  imports: [
    TypeOrmModule.forFeature([Hotel]),
    RoomsModule, // Added RoomsModule to imports
  ],
  controllers: [HotelsController],
  providers: [HotelsService],
  exports: [HotelsService],
})
export class HotelsModule { }