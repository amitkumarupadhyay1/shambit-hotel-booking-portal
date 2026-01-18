import { Controller, Get, Query, Param, ParseUUIDPipe } from '@nestjs/common';
import { SearchService } from './search.service';
import { HotelSearchDto } from './dto/hotel-search.dto';
import { HotelAvailabilityDto } from './dto/hotel-availability.dto';
import { PaginatedHotelSearchResult } from './dto/hotel-search-result.dto';
import { HotelDetailDto } from './dto/hotel-detail.dto';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('hotels')
  async searchHotels(@Query() searchDto: HotelSearchDto): Promise<PaginatedHotelSearchResult> {
    return this.searchService.searchHotels(searchDto);
  }

  @Get('hotels/:id/availability')
  async getHotelDetails(
    @Param('id', ParseUUIDPipe) hotelId: string,
    @Query() availabilityDto: HotelAvailabilityDto,
  ): Promise<HotelDetailDto> {
    const checkIn = availabilityDto.checkInDate ? new Date(availabilityDto.checkInDate) : undefined;
    const checkOut = availabilityDto.checkOutDate ? new Date(availabilityDto.checkOutDate) : undefined;
    
    return this.searchService.getHotelDetails(
      hotelId,
      checkIn,
      checkOut,
      availabilityDto.guests,
    );
  }
}