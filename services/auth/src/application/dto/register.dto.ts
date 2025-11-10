import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Data Transfer Object for user registration requests.
 *
 * This DTO validates and structures the data required for creating new user accounts.
 * It ensures that required fields are provided and meet validation criteria, while
 * allowing optional profile information to be included.
 *
 * Validation Rules:
 * - Email must be a valid email format and unique
 * - Email cannot be empty
 * - Password must be a string between 8-128 characters with strength requirements
 * - Password cannot be empty
 * - Name is optional but recommended for user identification
 * - Profile is optional and can contain additional user information
 */
export class RegisterDto {
  /**
   * User's email address for account creation.
   * Must be a valid, unique email format and is required for registration.
   *
   * @example "john.doe@example.com"
   */
  @ApiProperty({
    description: 'User email address for account creation',
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
   * User's password for account security.
   * Must be a strong password with minimum length and complexity requirements.
   *
   * @example "SecurePassword123!"
   */
  @ApiProperty({
    description: 'User password for account security',
    example: 'SecurePassword123!',
    minLength: 8,
    maxLength: 128,
    format: 'password',
  })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(128, { message: 'Password cannot exceed 128 characters' })
  password: string;

  /**
   * User's display name.
   * Optional but recommended for better user identification and personalization.
   *
   * @example "John Doe"
   */
  @ApiPropertyOptional({
    description: 'User display name for personalization',
    example: 'John Doe',
    minLength: 1,
    maxLength: 100,
  })
  @IsString({ message: 'Name must be a string' })
  @IsOptional()
  @MaxLength(100, { message: 'Name cannot exceed 100 characters' })
  name?: string;

  /**
   * Additional user profile information.
   * Optional flexible object for storing extended user data like preferences,
   * avatar URLs, bio, etc.
   *
   * @example { "avatar": "https://example.com/avatar.jpg", "bio": "Software developer" }
   */
  @ApiPropertyOptional({
    description: 'Additional user profile information',
    example: { avatar: 'https://example.com/avatar.jpg', bio: 'Software developer' },
    type: 'object',
    additionalProperties: true,
  })
  @IsObject({ message: 'Profile must be an object' })
  @IsOptional()
  profile?: Record<string, any>;
}

