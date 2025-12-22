import {
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
  IsEmail,
  IsOptional,
  IsArray,
  ValidateNested,
  IsEnum,
  IsDateString,
  IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AttachmentType } from '@prisma/client';
import { IsBoolean } from 'class-validator';

// DTO for attachment
export class AttachmentDto {
  @IsUrl({}, { message: 'Please provide a valid file URL' })
  @IsNotEmpty()
  fileUrl: string;

  @IsEnum(AttachmentType, {
    message: 'Attachment type must be IMAGE, VIDEO, AUDIO, or DOCUMENT',
  })
  @IsNotEmpty()
  type: AttachmentType;
}

// Base DTO for creating a letter (used by authenticated users)
export class CreateLetterDto {
  @IsString()
  @IsOptional()
  @MaxLength(200, {
    message: 'Subject must not exceed 200 characters',
  })
  subject?: string;

  @IsString()
  @IsOptional()
  @MaxLength(10000, {
    message: 'Content must not exceed 10,000 characters when provided',
  })
  content?: string;

  @IsEmail({}, { message: 'Please provide a valid recipient email address' })
  @IsNotEmpty({ message: 'Recipient email is required' })
  recipientEmail: string;

  @IsString()
  @IsOptional()
  recipientName: string;

  @IsDateString(
    {},
    {
      message:
        'Please provide a valid delivery date in ISO 8601 format (e.g., 2026-12-25T10:00:00Z)',
    },
  )
  @IsNotEmpty({ message: 'Delivery date is required' })
  deliveryDate: string; // ISO 8601 format

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments?: AttachmentDto[];

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @IsString()
  @IsOptional()
  draftId?: string; // Optional: ID of draft to delete when creating this letter
}

// DTO for guest users (includes sender email)
export class CreateGuestLetterDto extends CreateLetterDto {
  @IsEmail({}, { message: 'Please provide a valid sender email address' })
  @IsNotEmpty({ message: 'Sender email is required for guest letters' })
  senderEmail: string;

  @IsString()
  @IsOptional()
  senderName?: string; // Optional signature for the letter
}
