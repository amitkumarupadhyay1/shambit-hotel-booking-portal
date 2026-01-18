import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { Booking } from './entities/booking.entity';
import { Room } from '../rooms/entities/room.entity';
import { Hotel } from '../hotels/entities/hotel.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Booking, Room, Hotel])],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}