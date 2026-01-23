import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminHotelsService } from './admin-hotels.service';
import { AdminHotelsController } from './admin-hotels.controller';
import { Hotel } from '../hotels/entities/hotel.entity';
import { EnhancedHotel } from '../hotels/entities/enhanced-hotel.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Hotel, EnhancedHotel]),
    ],
    controllers: [AdminHotelsController],
    providers: [AdminHotelsService],
})
export class AdminHotelsModule { }
