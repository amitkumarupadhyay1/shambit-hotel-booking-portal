import { PartialType } from '@nestjs/mapped-types';
import { CreateEnhancedHotelDto } from './create-enhanced-hotel.dto';

export class UpdateEnhancedHotelDto extends PartialType(CreateEnhancedHotelDto) {}