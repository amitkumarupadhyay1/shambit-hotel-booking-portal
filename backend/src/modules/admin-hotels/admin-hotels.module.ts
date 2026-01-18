import { Module } from '@nestjs/common';
import { AdminHotelsService } from './admin-hotels.service';
import { AdminHotelsController } from './admin-hotels.controller';
import { HotelsModule } from '../hotels/hotels.module';

@Module({
    imports: [HotelsModule],
    controllers: [AdminHotelsController],
    providers: [AdminHotelsService],
})
export class AdminHotelsModule { }
