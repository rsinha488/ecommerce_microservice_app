import { Injectable, ConflictException, Inject } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { AUTH_REPOSITORY } from '../../domain/tokens/auth-repository.token';
import type { AuthRepositoryInterface } from '../../domain/interfaces/auth-repository.interface';

@Injectable()
export class RegisterUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY)
    private readonly authRepo: AuthRepositoryInterface,
  ) {}

  async execute(data: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    profile?: Record<string, any>;
  }) {
    // Check if user already exists
    const existingUser = await this.authRepo.findUserByEmail(data.email);
    
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Create profile object
    const profile: Record<string, any> = {
      ...(data.profile || {}),
    };

    if (data.firstName) {
      profile.firstName = data.firstName;
      profile.given_name = data.firstName;
    }

    if (data.lastName) {
      profile.lastName = data.lastName;
      profile.family_name = data.lastName;
    }

    if (data.firstName || data.lastName) {
      profile.name = [data.firstName, data.lastName].filter(Boolean).join(' ');
    }

    // Create user
    const user = await this.authRepo.createUser({
      email: data.email,
      passwordHash,
      roles: ['user'],
      profile,
    });

    return {
      id: user._id.toString(),
      email: user.email,
      profile: user.profile,
    };
  }
}

