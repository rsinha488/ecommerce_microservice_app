import { Injectable, UnauthorizedException, Inject, BadRequestException } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { AUTH_REPOSITORY } from '../../domain/tokens/auth-repository.token';
import type { AuthRepositoryInterface } from '../../domain/interfaces/auth-repository.interface';
import { RedisService } from '../../infrastructure/redis/redis.service';
import crypto from 'crypto';

/**
 * Login Use Case
 *
 * Handles user authentication and session management.
 * This use case encapsulates the business logic for user login,
 * including credential validation, password verification, and session creation.
 *
 * Business Rules:
 * - Email must be provided and valid format
 * - Password must be provided
 * - User must exist in the system
 * - Password must match the stored hash
 * - Session is created with 1-hour expiration
 * - Session contains user ID, email, roles, and profile information
 */
@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY)
    private readonly authRepo: AuthRepositoryInterface,
    private readonly redis: RedisService,
  ) {}

  /**
   * Execute user login
   *
   * Validates user credentials and creates a new session upon successful authentication.
   *
   * @param email - User's email address (must be valid format and non-empty)
   * @param password - User's password (must be non-empty)
   * @returns Promise containing session ID, user ID, and user profile data
   * @throws UnauthorizedException - When credentials are invalid or user not found
   * @throws BadRequestException - When input validation fails
   */
  async execute(email: string, password: string): Promise<{
    sessionId: string;
    userId: string;
    user: {
      id: string;
      email: string;
      name: string;
      profile?: any;
      role?: string;
    }
  }> {
    // Input validation
    if (!email || typeof email !== 'string' || email.trim().length === 0) {
      throw new BadRequestException('Email is required and must be a non-empty string');
    }

    if (!password || typeof password !== 'string' || password.length === 0) {
      throw new BadRequestException('Password is required and must be a non-empty string');
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      throw new BadRequestException('Invalid email format');
    }

    // Find user by email
    const user = await this.authRepo.findUserByEmail(email.trim().toLowerCase());

    if (!user) {
      // Use generic message to prevent user enumeration attacks
      throw new UnauthorizedException('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      // Use generic message to prevent user enumeration attacks
      throw new UnauthorizedException('Invalid email or password');
    }

    // Create session
    const sessionId = crypto.randomBytes(32).toString('hex');
    const sessionKey = `auth:session:${sessionId}`;

    // Store session data in Redis with expiration
    const sessionData = {
      userId: user._id.toString(),
      email: user.email,
      roles: user.roles,
      profile: user.profile,
      createdAt: Date.now(),
      expiresAt: Date.now() + (3600 * 1000), // 1 hour from now
    };

    await this.redis.getClient().set(
      sessionKey,
      JSON.stringify(sessionData),
      'EX',
      3600, // 1 hour expiration
    );

    // Determine user role
    const role = user.roles?.includes('admin') ? 'admin' : 'user';

    return {
      sessionId,
      userId: user._id.toString(),
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.profile?.name || user.email.split('@')[0],
        profile: user.profile,
        role: role,
      },
    };
  }

  /**
   * Retrieve session data by session ID
   *
   * @param sessionId - The session identifier
   * @returns Session data or null if session doesn't exist or expired
   */
  async getSession(sessionId: string): Promise<any | null> {
    if (!sessionId || typeof sessionId !== 'string') {
      return null;
    }

    const sessionKey = `auth:session:${sessionId}`;
    const raw = await this.redis.getClient().get(sessionKey);

    if (!raw) {
      return null;
    }

    try {
      const sessionData = JSON.parse(raw);

      // Check if session has expired
      if (sessionData.expiresAt && sessionData.expiresAt < Date.now()) {
        // Clean up expired session
        await this.destroySession(sessionId);
        return null;
      }

      return sessionData;
    } catch (error) {
      // Invalid session data format
      console.warn('Invalid session data format for session:', sessionId);
      await this.destroySession(sessionId);
      return null;
    }
  }

  /**
   * Destroy a user session
   *
   * @param sessionId - The session identifier to destroy
   */
  async destroySession(sessionId: string): Promise<void> {
    if (!sessionId || typeof sessionId !== 'string') {
      return;
    }

    const sessionKey = `auth:session:${sessionId}`;
    await this.redis.getClient().del(sessionKey);
  }
}

