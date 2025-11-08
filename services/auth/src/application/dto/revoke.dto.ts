import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class RevokeDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsOptional()
  token_type_hint?: 'access_token' | 'refresh_token';
}

