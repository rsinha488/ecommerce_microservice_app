import { User } from '../entities/user.entity';


export interface UserRepositoryInterface {
    create(user: User): Promise<User>;
    update(id: string, patch: Partial<User>): Promise<User>;
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    findAll(filter: any): Promise<User[]>;
}