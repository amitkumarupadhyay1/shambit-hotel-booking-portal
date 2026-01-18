import { IsString, IsNotEmpty, IsOptional, IsNumber, IsUUID, IsDateString, IsEmail, IsPhoneNumber, Min, Max, Length } from 'class-validator';

export class CreateBookingDto {
  @IsDateString()
  @IsNotEmpty()
  checkInDate: string;

  @IsDateString()
  @IsNotEmpty()
  checkOutDate: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  @Max(20)
  adults: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(10)
  children?: number;

  @IsString()
  @IsNotEmpty()
  @Length(2, 255)
  guestName: string;

  @IsEmail()
  @IsNotEmpty()
  guestEmail: string;

  @IsString()
  @IsNotEmpty()
  @Length(10, 20)
  guestPhone: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  roomPrice: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  taxes?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  fees?: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  totalAmount: number;

  @IsString()
  @IsOptional()
  specialRequests?: string;

  @IsUUID()
  @IsOptional()
  customerId?: string;

  @IsUUID()
  @IsNotEmpty()
  hotelId: string;

  @IsUUID()
  @IsNotEmpty()
  roomId: string;
}