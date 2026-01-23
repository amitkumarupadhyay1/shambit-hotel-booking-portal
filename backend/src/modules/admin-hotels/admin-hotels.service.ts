import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HotelStatus, Hotel } from '../hotels/entities/hotel.entity';
import { EnhancedHotel } from '../hotels/entities/enhanced-hotel.entity';
import { OnboardingStatus } from '../hotels/interfaces/enhanced-hotel.interface';

@Injectable()
export class AdminHotelsService {
    constructor(
        @InjectRepository(Hotel)
        private hotelRepository: Repository<Hotel>,
        @InjectRepository(EnhancedHotel)
        private enhancedHotelRepository: Repository<EnhancedHotel>,
    ) { }

    async findByStatus(status: HotelStatus): Promise<Hotel[]> {
        return this.hotelRepository.find({
            where: { status },
            relations: ['owner', 'rooms'],
        });
    }

    async findEnhancedByStatus(status: OnboardingStatus): Promise<EnhancedHotel[]> {
        return this.enhancedHotelRepository.find({
            where: { onboardingStatus: status },
            relations: ['enhancedRooms'],
        });
    }

    async approveHotel(id: string): Promise<Hotel> {
        const hotel = await this.hotelRepository.findOne({
            where: { id },
            relations: ['owner', 'rooms'],
        });

        if (!hotel) {
            throw new NotFoundException('Hotel not found');
        }

        hotel.status = HotelStatus.APPROVED;
        return this.hotelRepository.save(hotel);
    }

    async approveEnhancedHotel(id: string): Promise<EnhancedHotel> {
        const hotel = await this.enhancedHotelRepository.findOne({
            where: { id },
            relations: ['enhancedRooms'],
        });

        if (!hotel) {
            throw new NotFoundException('Enhanced hotel not found');
        }

        hotel.onboardingStatus = OnboardingStatus.COMPLETED;
        return this.enhancedHotelRepository.save(hotel);
    }

    async rejectHotel(id: string, reason: string): Promise<Hotel> {
        const hotel = await this.hotelRepository.findOne({
            where: { id },
            relations: ['owner', 'rooms'],
        });

        if (!hotel) {
            throw new NotFoundException('Hotel not found');
        }

        hotel.status = HotelStatus.REJECTED;
        // In a real system, we'd store the rejection reason in a separate table or column
        // Note: The reason could be sent as an email to the owner.
        return this.hotelRepository.save(hotel);
    }

    async rejectEnhancedHotel(id: string, reason: string): Promise<EnhancedHotel> {
        const hotel = await this.enhancedHotelRepository.findOne({
            where: { id },
            relations: ['enhancedRooms'],
        });

        if (!hotel) {
            throw new NotFoundException('Enhanced hotel not found');
        }

        hotel.onboardingStatus = OnboardingStatus.REJECTED;
        // Store rejection reason in quality metrics or separate field
        return this.enhancedHotelRepository.save(hotel);
    }
}
