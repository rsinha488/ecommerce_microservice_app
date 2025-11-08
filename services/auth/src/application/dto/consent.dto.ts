import { IsNotEmpty, IsString, IsArray, IsOptional } from 'class-validator';

export class ConsentDto {
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @IsArray()
  @IsOptional()
  approvedScopes?: string[];

  @IsString()
  @IsNotEmpty()
  action: 'approve' | 'deny';
}

