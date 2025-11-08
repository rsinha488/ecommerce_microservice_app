import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsObject } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsString()
  @IsOptional()
  name: string;

  // @IsString()
  // @IsOptional()
  // lastName?: string;

  @IsObject()
  @IsOptional()
  profile?: Record<string, any>;
}

