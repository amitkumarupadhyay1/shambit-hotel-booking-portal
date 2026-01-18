import { Injectable, NotFoundException } from '@nestjs/common';
import { HotelsService } from '../hotels/hotels.service';
import { HotelStatus, Hotel } from '../hotels/entities/hotel.entity';

@Injectable()
export class AdminHotelsService {
    constructor(private readonly hotelsService: HotelsService) { }

    async findByStatus(status: HotelStatus): Promise<Hotel[]> {
        return this.hotelsService.findByStatus(status);
    }

    async approveHotel(id: string): Promise<Hotel> {
        return this.hotelsService.setStatus(id, HotelStatus.APPROVED);
    }

    async rejectHotel(id: string, reason: string): Promise<Hotel> {
        // In a real system, we'd store the rejection reason in a separate table or column
        // For now, we'll just set the status to REJECTED.
        // Note: The reason could be sent as an email to the owner.
        return this.hotelsService.setStatus(id, HotelStatus.REJECTED);
    }
}
