import { IsString, IsOptional } from 'class-validator';

export class AuthorizeDto {
  @IsString()
  response_type!: string;

  @IsString()
  client_id!: string;

  @IsString()
  redirect_uri!: string;

  @IsOptional()
  @IsString()
  scope?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  code_challenge?: string;

  @IsOptional()
  @IsString()
  code_challenge_method?: string;
}
