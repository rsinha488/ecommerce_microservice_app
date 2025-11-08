export class UserMapper {
  static toDomain(doc: any) {
    return {
      id: doc._id.toString(),
      email: doc.email,
      passwordHash: doc.passwordHash,
      roles: doc.roles,
    };
  }

  static toPersistence(user: any) {
    return {
      email: user.email,
      passwordHash: user.passwordHash,
      roles: user.roles,
    };
  }
}
