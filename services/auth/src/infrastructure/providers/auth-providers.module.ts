// src/infrastructure/providers/auth-providers.module.ts
import { Module } from '@nestjs/common';

import { AUTH_REPOSITORY } from '../../domain/tokens/auth-repository.token';
import { AuthRepository } from '../repositories/auth.repository';

import { AuthorizeUseCase } from '../../application/use-cases/authorize.usecase';
import { TokenUseCase } from '../../application/use-cases/token.usecase';
import { LoginUseCase } from '../../application/use-cases/login.usecase';
import { RegisterUseCase } from '../../application/use-cases/register.usecase';
import { UserInfoUseCase } from '../../application/use-cases/userinfo.usecase';
import { IntrospectUseCase } from '../../application/use-cases/introspect.usecase';
import { RevokeUseCase } from '../../application/use-cases/revoke.usecase';

import { MongooseSchemasModule } from '../database/database.module';
import { RedisModule } from '../redis/redis.module';
import { JwksModule } from '../jwks/jwks.module';

@Module({
  imports: [
    MongooseSchemasModule, // provides models (User, Client, Token)
    RedisModule,           // provides RedisService
    JwksModule,            // provides JwksService
  ],
  providers: [
    // Register the concrete class so Nest can resolve constructor dependencies
    AuthRepository,

    // Expose same instance under a token for clean DI in other layers
    {
      provide: AUTH_REPOSITORY,
      useExisting: AuthRepository,
    },

    // Use cases (they depend on AUTH_REPOSITORY, RedisService, JwksService)
    AuthorizeUseCase,
    TokenUseCase,
    LoginUseCase,
    RegisterUseCase,
    UserInfoUseCase,
    IntrospectUseCase,
    RevokeUseCase,
  ],
  exports: [
    // Export use-cases for other modules (if needed)
    AuthorizeUseCase,
    TokenUseCase,
    LoginUseCase,
    RegisterUseCase,
    UserInfoUseCase,
    IntrospectUseCase,
    RevokeUseCase,
    // Export the token so other modules can inject the repository via AUTH_REPOSITORY
    AUTH_REPOSITORY,
    // Export AuthRepository for guards
    AuthRepository,
  ],
})
export class AuthProvidersModule {}
