import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsDateString,
  MaxLength,
  ValidateNested,
  IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum BroadcastEmailType {
  WAITLIST = 'waitlist',
  GENERAL = 'general',
  PERSONAL = 'personal'
}

export class ActionButtonDto {
  @IsString()
  @IsNotEmpty({ message: 'Intro text is required' })
  introText: string;

  @IsString()
  @IsNotEmpty({ message: 'Button text is required' })
  buttonText: string;

  @IsUrl({}, { message: 'URL must be a valid URL' })
  @IsNotEmpty({ message: 'URL is required' })
  url: string;
}

export class CreateBroadcastEmailDto {
  @IsEnum(BroadcastEmailType, {
    message: 'Type must be either "waitlist", "general", or "personal"',
  })
  @IsNotEmpty({ message: 'Type is required' })
  type: BroadcastEmailType;

  @IsString()
  @IsNotEmpty({ message: 'Subject is required' })
  @MaxLength(200, { message: 'Subject must not exceed 200 characters' })
  subject: string;

  @IsString()
  @IsNotEmpty({ message: 'Message is required' })
  message: string; // HTML content

  @IsDateString(
    {},
    {
      message:
        'Delivery date must be a valid ISO 8601 date string (e.g., 2026-12-25T10:00:00Z)',
    },
  )
  @IsOptional()
  deliveryDate?: string; // Optional ISO 8601 format

  @ValidateNested()
  @Type(() => ActionButtonDto)
  @IsOptional()
  actionButton?: ActionButtonDto; // Optional action button
}
