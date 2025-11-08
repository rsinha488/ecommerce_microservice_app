export class TokenMapper {
  static toDomain(doc: any) {
    return {
      accessToken: doc.accessToken,
      refreshToken: doc.refreshToken,
      expiresAt: doc.expiresAt,
      clientId: doc.clientId,
      userId: doc.userId,
    };
  }

  static toPersistence(token: any) {
    return {
      accessToken: token.accessToken,
      refreshToken: token.refreshToken,
      expiresAt: token.expiresAt,
      clientId: token.clientId,
      userId: token.userId,
    };
  }
}
