import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class IntrospectDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsOptional()
  token_type_hint?: 'access_token' | 'refresh_token';
}

