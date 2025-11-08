import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from '../../domain/repository/user.repository';
// import { UserRepository } from '../../domain/repositories/user.repository';

@Injectable()
export class GetUserUseCase {
  constructor(
      @Inject("USER_REPOSITORY")
      private readonly userRepository: UserRepository) {}

  async execute(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) throw new NotFoundException('User not found');

    return user;
  }
}
