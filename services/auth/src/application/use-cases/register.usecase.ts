import { Injectable, ConflictException, Inject, BadRequestException } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { AUTH_REPOSITORY } from '../../domain/tokens/auth-repository.token';
import type { AuthRepositoryInterface } from '../../domain/interfaces/auth-repository.interface';

/**
 * Register Use Case
 *
 * Handles user registration and account creation.
 * This use case encapsulates the business logic for creating new user accounts,
 * including input validation, duplicate checking, password hashing, and profile creation.
 *
 * Business Rules:
 * - Email must be unique and valid format
 * - Password must meet minimum security requirements
 * - First name and last name are optional but recommended
 * - Profile information is stored alongside user data
 * - Default role is 'user' for all new registrations
 * - Passwords are hashed using bcrypt with salt rounds of 10
 */
@Injectable()
export class RegisterUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY)
    private readonly authRepo: AuthRepositoryInterface,
  ) {}

  /**
   * Execute user registration
   *
   * Creates a new user account with the provided information.
   * Performs validation, duplicate checking, and secure password storage.
   *
   * @param data - Registration data containing email, password, and optional profile information
   * @returns Promise containing the created user's public information
   * @throws ConflictException - When a user with the same email already exists
   * @throws BadRequestException - When input validation fails
   */
  async execute(data: {
    email: string;
    password: string;
    name: string;
    firstName?: string;
    lastName?: string;
    profile?: Record<string, any>;
  }): Promise<{
    id: string;
    email: string;
    name: string;
    profile: Record<string, any>;
  }> {
    // Input validation
    if (!data.email || typeof data.email !== 'string' || data.email.trim().length === 0) {
      throw new BadRequestException('Email is required and must be a non-empty string');
    }

    if (!data.password || typeof data.password !== 'string' || data.password.length === 0) {
      throw new BadRequestException('Password is required and must be a non-empty string');
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email.trim())) {
      throw new BadRequestException('Invalid email format');
    }

    // Password strength validation
    if (data.password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters long');
    }

    // Optional name validation (if provided)
    if (data.firstName && (typeof data.firstName !== 'string' || data.firstName.trim().length === 0)) {
      throw new BadRequestException('First name must be a non-empty string if provided');
    }

    if (data.lastName && (typeof data.lastName !== 'string' || data.lastName.trim().length === 0)) {
      throw new BadRequestException('Last name must be a non-empty string if provided');
    }

    const normalizedEmail = data.email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await this.authRepo.findUserByEmail(normalizedEmail);

    if (existingUser) {
      throw new ConflictException('A user with this email address already exists');
    }

    // Hash password with bcrypt
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Create profile object with validation
    const profile: Record<string, any> = {
      ...(data.profile || {}),
    };

    // Add name fields if provided
    if (data.firstName && data.firstName.trim()) {
      const trimmedFirstName = data.firstName.trim();
      profile.firstName = trimmedFirstName;
      profile.given_name = trimmedFirstName; // OAuth compatibility
    }

    if (data.lastName && data.lastName.trim()) {
      const trimmedLastName = data.lastName.trim();
      profile.lastName = trimmedLastName;
      profile.family_name = trimmedLastName; // OAuth compatibility
    }

    // Create full name if both first and last names are provided
    if (profile.firstName && profile.lastName) {
      profile.name = `${profile.firstName} ${profile.lastName}`;
    } else if (profile.firstName) {
      profile.name = profile.firstName;
    } else if (profile.lastName) {
      profile.name = profile.lastName;
    }

    // Set default profile values
    profile.createdAt = new Date().toISOString();
    profile.isActive = true;

    // Create user in repository
    const user = await this.authRepo.createUser({
      email: normalizedEmail,
      name: data.name,
      passwordHash,
      roles: ['user'], // Default role for new users
      profile,
    });

    // Return public user information (exclude sensitive data)
    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      profile: {
        ...user.profile,
        // Exclude any sensitive profile information if needed
      },
    };
  }
}

