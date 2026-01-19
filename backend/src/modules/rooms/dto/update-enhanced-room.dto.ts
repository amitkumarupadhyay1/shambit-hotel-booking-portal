import { PartialType } from '@nestjs/mapped-types';
import { CreateEnhancedRoomDto } from './create-enhanced-room.dto';

export class UpdateEnhancedRoomDto extends PartialType(CreateEnhancedRoomDto) {}