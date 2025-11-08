export class User {
  constructor(
    public readonly id: string,
    public email: string,
    public passwordHash: string,
    public roles: string[] = [],
    public profile: Record<string, any> = {},
    public createdAt?: Date,
    public updatedAt?: Date
  ) {}
}
