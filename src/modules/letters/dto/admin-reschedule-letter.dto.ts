import { IsNotEmpty, IsDateString, IsBoolean, IsOptional } from 'class-validator';

export class AdminRescheduleLetterDto {
  @IsDateString(
    {},
    {
      message:
        'Please provide a valid delivery date in ISO 8601 format (e.g., 2026-12-27T10:00:00Z)',
    },
  )
  @IsNotEmpty({ message: 'Delivery date is required' })
  deliveryDate: string;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}
