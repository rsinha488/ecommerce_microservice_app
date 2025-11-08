import { User } from '../entities/user.entity';

export abstract class UserRepository {
    abstract create(data: Partial<User>): Promise<User>;
    abstract findById(id: string): Promise<User | null>;
    abstract findByEmail(email: string): Promise<User | null>;
    abstract findAll(): Promise<User[]>;
    abstract update(id: string, data: Partial<User>): Promise<User>;
    abstract delete(id: string): Promise<void>;
}
