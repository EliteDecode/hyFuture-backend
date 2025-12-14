import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class DeleteAccountDto {
  @IsString()
  @IsNotEmpty({ message: 'Password is required to delete account' })
  @MinLength(8, {
    message: 'Password must be at least 8 characters',
  })
  password: string;
}

