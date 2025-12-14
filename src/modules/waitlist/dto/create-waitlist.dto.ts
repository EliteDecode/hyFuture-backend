import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateWaitlistDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  @MinLength(1, { message: 'Name must have at least 1 character' })
  @MaxLength(100, { message: 'Name must not exceed 100 characters' })
  name: string;
}
