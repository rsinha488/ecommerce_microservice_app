import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserRepository } from '../../domain/repository/user.repository';

@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject("USER_REPOSITORY")
    private readonly userRepository: UserRepository,
  ) {}

  async execute(id: string, payload: UpdateUserDto) {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException('User not found');

    return await this.userRepository.update(id, payload);
  }
}
