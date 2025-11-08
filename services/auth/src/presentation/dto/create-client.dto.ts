import { IsString, IsArray, IsOptional } from 'class-validator';

export class CreateClientDto {
  @IsString()
  clientId: string;

  @IsString()
  clientName: string;       // ✅ Required

  @IsOptional()
  @IsString()
  clientSecret?: string;

  @IsArray()
  redirectUris: string[];

  @IsOptional()
  @IsArray()
  scopes?: string[];
}
