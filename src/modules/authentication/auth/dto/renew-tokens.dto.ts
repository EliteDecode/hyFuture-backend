import { IsNotEmpty, IsString } from 'class-validator';

export class RenewTokensDto {
  @IsString()
  @IsNotEmpty({ message: 'Refresh token is required' })
  refreshToken: string;
}

