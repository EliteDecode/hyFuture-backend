import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  Matches,
  Length,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';


export class RegisterUserDto {
  @IsString()
  @IsOptional()
  @MinLength(2, {
    message: 'Name must be at least 2 characters',
  })
  @MaxLength(100, {
    message: 'Name must not be more than 100 characters',
  })
  name?: string;

  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8, {
    message: 'Password must be at least 8 characters',
  })
  @MaxLength(100, {
    message: 'Password must not be more than 100 characters',
  })
  password: string;
}

export class LoginUserDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class CheckInvitationDto {
  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'Invitation code must be 6 digits' })
  @Matches(/^\d{6}$/, { message: 'Invitation code must be 6 numeric digits' })
  invitationCode: string;
}

export class CompleteRegistrationDto extends RegisterUserDto {
  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'Invitation code must be 6 digits' })
  @Matches(/^\d{6}$/, { message: 'Invitation code must be 6 numeric digits' })
  invitationCode: string;
}

export class VerifyAuthCodeDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  code: string;
}

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty()
  email: string;
}

export class ResetPasswordDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8, {
    message: 'Password must be at least 8 characters',
  })
  @MaxLength(100, {
    message: 'Password must not be more than 100 characters',
  })
  password: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8, {
    message: 'Confirm password must be at least 8 characters',
  })
  @MaxLength(100, {
    message: 'Confirm password must not be more than 100 characters',
  })
  confirmPassword: string;

  @IsString()
  @IsNotEmpty()
  code: string;
}

export class ResendAuthCodeDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty()
  email: string;
}

