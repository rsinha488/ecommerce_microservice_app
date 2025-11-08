import { IsString, IsOptional } from 'class-validator';

export class TokenDto {
  @IsString()
  grant_type!: string;
  @IsOptional()
  @IsString()
  code?: string;
  @IsOptional()
  @IsString()
  redirect_uri?: string;
  @IsOptional()
  @IsString()
  code_verifier?: string;
  @IsOptional()
  @IsString()
  refresh_token?: string;
}
