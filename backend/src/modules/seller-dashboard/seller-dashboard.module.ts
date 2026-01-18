import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Hotel } from '../hotels/entities/hotel.entity';
import { Room } from '../rooms/entities/room.entity';
import { RoomAvailability } from '../availability/entities/room-availability.entity';
import { AvailabilityModule } from '../availability/availability.module';
import { SellerDashboardService } from './seller-dashboard.service';
import { SellerDashboardController } from './seller-dashboard.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Hotel, Room, RoomAvailability]),
    AvailabilityModule,
  ],
  providers: [SellerDashboardService],
  controllers: [SellerDashboardController],
})
export class SellerDashboardModule {}