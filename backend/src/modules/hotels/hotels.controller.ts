import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { HotelsService } from './hotels.service';
import { CreateHotelDto } from './dto/create-hotel.dto';
import { UpdateHotelDto } from './dto/update-hotel.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('hotels')
export class HotelsController {
  constructor(private readonly hotelsService: HotelsService) { }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  create(@Body() createHotelDto: CreateHotelDto, @Request() req) {
    return this.hotelsService.create(createHotelDto, req.user.id);
  }

  // Note: Enhanced onboarding will be implemented in future tasks
  // @Post('onboarding') - Removed old onboarding endpoint

  @Get()
  findAll(
    @Query('city') city?: string,
    @Query('hotelType') hotelType?: string,
  ) {
    return this.hotelsService.findAllPublic({ city, hotelType });
  }

  @Get('my-hotels')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  findMyHotels(@Request() req) {
    return this.hotelsService.findMyHotels(req.user.id);
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.hotelsService.findBySlug(slug);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    const userId = req.user?.id;
    const isAdmin = req.user?.roles?.includes(UserRole.ADMIN);
    return this.hotelsService.findOne(id, userId, isAdmin);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  update(@Param('id') id: string, @Body() updateHotelDto: UpdateHotelDto, @Request() req) {
    return this.hotelsService.update(id, updateHotelDto, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  remove(@Param('id') id: string, @Request() req) {
    return this.hotelsService.remove(id, req.user.id);
  }
}
