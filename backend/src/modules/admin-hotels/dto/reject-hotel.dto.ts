import { IsString, IsNotEmpty, Length } from 'class-validator';

export class RejectHotelDto {
    @IsString()
    @IsNotEmpty()
    @Length(5, 500)
    reason: string;
}
