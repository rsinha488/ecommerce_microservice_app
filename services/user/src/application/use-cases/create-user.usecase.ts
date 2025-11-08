import { Injectable, Inject } from '@nestjs/common';
import { User } from '../../domain/entities/user.entity';
import { UserRepositoryInterface } from '../../domain/interfaces/user-repository.interface';
import { CreateUserDto } from '../dto/create-user.dto';
import bcrypt from 'bcryptjs';


@Injectable()
export class CreateUserUseCase {
    constructor(
        @Inject('USER_REPOSITORY') private repo: UserRepositoryInterface,
    ) { }


    async execute(dto: CreateUserDto) {
        const hash = await bcrypt.hash(dto.password, 10);
        const user = new User('', dto.name, dto.email, hash);
        return this.repo.create(user);
    }
}