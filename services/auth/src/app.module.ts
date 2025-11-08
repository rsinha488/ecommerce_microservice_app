import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import authConfig from './config/auth.config';

import { MongooseModule } from '@nestjs/mongoose';

import { RedisModule } from './infrastructure/redis/redis.module';
import { JwksModule } from './infrastructure/jwks/jwks.module';

import { OidcController } from './presentation/controllers/oidc.controller';
import { AdminController } from './presentation/controllers/admin.controller';

import { MongooseSchemasModule } from './infrastructure/database/database.module';

// ✅ This module MUST provide:
// - AUTH_REPOSITORY binding
// - UseCases (AuthorizeUseCase, TokenUseCase)
import { AuthProvidersModule } from './infrastructure/providers/auth-providers.module';

@Module({
  imports: [
    // ✅ Global Config
    ConfigModule.forRoot({
      isGlobal: true,
      load: [authConfig],
    }),

    // ✅ MongoDB connection
    MongooseModule.forRoot(process.env.MONGO_URI!),

    // ✅ Mongo schemas (Users, Clients, RefreshTokens)
    MongooseSchemasModule,

    // ✅ Redis (authorization codes, sessions, PKCE)
    RedisModule,

    // ✅ JWKS (private/public key store, signing)
    JwksModule,

    // ✅ Provides all auth-related DI providers
    AuthProvidersModule,
  ],

  // ✅ OIDC controller + admin API (key rotation, client mgmt, introspect, etc.)
  controllers: [OidcController, AdminController],

  // ✅ No providers here — use dedicated providers module
  providers: [],
})
export class AppModule {}
