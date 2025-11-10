import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Data Transfer Object for user login requests.
 *
 * This DTO validates and structures the data required for user authentication.
 * It ensures that both email and password are provided and meet basic validation criteria.
 *
 * Validation Rules:
 * - Email must be a valid email format
 * - Email cannot be empty
 * - Password must be a string between 8-128 characters
 * - Password cannot be empty
 */
export class LoginDto {
  /**
   * User's email address used for authentication.
   * Must be a valid email format and is required for login.
   *
   * @example "john.doe@example.com"
   */
  @ApiProperty({
    description: 'User email address for authentication',
    example: 'john.doe@example.com',
    format: 'email',
    minLength: 5,
    maxLength: 254, // RFC 5321 limit
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  @MaxLength(254, { message: 'Email address is too long' })
  email: string;

  /**
   * User's password for authentication.
   * Must be a non-empty string with minimum length requirements.
   *
   * @example "securePassword123"
   */
  @ApiProperty({
    description: 'User password for authentication',
    example: 'securePassword123',
    minLength: 8,
    maxLength: 128,
    format: 'password',
  })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(128, { message: 'Password cannot exceed 128 characters' })
  password: string;
}

