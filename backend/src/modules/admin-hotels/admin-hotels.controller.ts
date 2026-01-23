import {
    Controller,
    Get,
    Put,
    Param,
    Body,
    Query,
    UseGuards,
} from '@nestjs/common';
import { AdminHotelsService } from './admin-hotels.service';
import { HotelStatus } from '../hotels/entities/hotel.entity';
import { OnboardingStatus } from '../hotels/interfaces/enhanced-hotel.interface';
import { RejectHotelDto } from './dto/reject-hotel.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('admin/hotels')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminHotelsController {
    constructor(private readonly adminHotelsService: AdminHotelsService) { }

    @Get()
    findByStatus(@Query('status') status: HotelStatus = HotelStatus.PENDING) {
        return this.adminHotelsService.findByStatus(status);
    }

    @Get('enhanced')
    findEnhancedByStatus(@Query('status') status: OnboardingStatus = OnboardingStatus.IN_PROGRESS) {
        return this.adminHotelsService.findEnhancedByStatus(status);
    }

    @Put(':id/approve')
    approveHotel(@Param('id') id: string) {
        return this.adminHotelsService.approveHotel(id);
    }

    @Put('enhanced/:id/approve')
    approveEnhancedHotel(@Param('id') id: string) {
        return this.adminHotelsService.approveEnhancedHotel(id);
    }

    @Put(':id/reject')
    rejectHotel(@Param('id') id: string, @Body() dto: RejectHotelDto) {
        return this.adminHotelsService.rejectHotel(id, dto.reason);
    }

    @Put('enhanced/:id/reject')
    rejectEnhancedHotel(@Param('id') id: string, @Body() dto: RejectHotelDto) {
        return this.adminHotelsService.rejectEnhancedHotel(id, dto.reason);
    }
}
