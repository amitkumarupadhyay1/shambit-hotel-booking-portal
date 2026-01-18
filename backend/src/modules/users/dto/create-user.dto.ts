import { IsEmail, IsString, IsOptional, IsEnum, IsArray, MinLength, MaxLength, Matches } from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Matches(/^[a-zA-Z\s'-]+$/, { message: 'Name can only contain letters, spaces, hyphens, and apostrophes' })
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
    { message: 'Password must contain uppercase, lowercase, number, and special character' }
  )
  password: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[\d\s\-()]+$/, { message: 'Invalid phone number' })
  phone?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(UserRole, { each: true })
  roles?: UserRole[];
}