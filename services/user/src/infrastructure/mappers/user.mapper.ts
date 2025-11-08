import { User } from '../../domain/entities/user.entity';


export class UserMapper {
    static toDomain(raw: any): User | null {
        if (!raw) return null;
        return new User(
            raw._id?.toString() ?? raw.id,
            raw.name,
            raw.email,
            raw.passwordHash,
            raw.createdAt,
            raw.updatedAt,
        );
    }

    static toResponse(user: User) {
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt,
        };
    }
}