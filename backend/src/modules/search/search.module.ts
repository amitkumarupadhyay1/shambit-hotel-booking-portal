import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Hotel } from '../hotels/entities/hotel.entity';
import { Room } from '../rooms/entities/room.entity';
import { RoomAvailability } from '../availability/entities/room-availability.entity';
import { AvailabilityModule } from '../availability/availability.module';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Hotel, Room, RoomAvailability]),
    AvailabilityModule,
  ],
  providers: [SearchService],
  controllers: [SearchController],
})
export class SearchModule {}