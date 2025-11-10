import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { JwksService } from '../../infrastructure/jwks/jwks.service';
import { AUTH_REPOSITORY } from '../../domain/tokens/auth-repository.token';
import type { AuthRepositoryInterface } from '../../domain/interfaces/auth-repository.interface';

@Injectable()
export class UserInfoUseCase {
  constructor(
    private readonly jwks: JwksService,
    @Inject(AUTH_REPOSITORY)
    private readonly authRepo: AuthRepositoryInterface,
  ) {}

  async execute(accessToken: string) {
    try {
      // Verify the access token
      const publicJwks = this.jwks.getPublicJwks();
      const publicKey = publicJwks.keys[0];

      const { jwtVerify, importJWK } = await import('jose');
      const { payload } = await jwtVerify(accessToken, await importJWK(publicKey, 'RS256'), {
        issuer: process.env.JWT_ISS || 'http://localhost:4000',
      });

      if (!payload.sub) {
        throw new UnauthorizedException('Invalid token');
      }

      // Get user info from database
      const user = await this.authRepo.findUserById(payload.sub as string);

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Build userinfo response based on scopes
      const userInfo: Record<string, any> = {
        sub: user._id.toString(),
      };

      // Add profile claims
      if (user.profile) {
        if (user.profile.name) userInfo.name = user.profile.name;
        if (user.profile.given_name) userInfo.given_name = user.profile.given_name;
        if (user.profile.family_name) userInfo.family_name = user.profile.family_name;
        if (user.profile.middle_name) userInfo.middle_name = user.profile.middle_name;
        if (user.profile.nickname) userInfo.nickname = user.profile.nickname;
        if (user.profile.preferred_username) userInfo.preferred_username = user.profile.preferred_username;
        if (user.profile.profile) userInfo.profile = user.profile.profile;
        if (user.profile.picture) userInfo.picture = user.profile.picture;
        if (user.profile.website) userInfo.website = user.profile.website;
        if (user.profile.gender) userInfo.gender = user.profile.gender;
        if (user.profile.birthdate) userInfo.birthdate = user.profile.birthdate;
        if (user.profile.zoneinfo) userInfo.zoneinfo = user.profile.zoneinfo;
        if (user.profile.locale) userInfo.locale = user.profile.locale;
      }

      // Add email claim
      if (user.email) {
        userInfo.email = user.email;
        userInfo.email_verified = user.emailVerified || false;
      }

      // Add phone claims
      if (user.phone) {
        userInfo.phone_number = user.phone;
        userInfo.phone_number_verified = user.phoneVerified || false;
      }

      // Add address
      if (user.address) {
        userInfo.address = user.address;
      }

      return userInfo;
    } catch (error) {
      throw new UnauthorizedException('Invalid access token');
    }
  }


}

