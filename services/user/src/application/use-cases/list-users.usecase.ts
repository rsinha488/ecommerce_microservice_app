import { Inject, Injectable } from '@nestjs/common';
import { UserRepository } from '../../infrastructure/repositories/user.repository';
// import { UserRepository } from '../../domain/repositories/user.repository';

@Injectable()
export class ListUsersUseCase {
  constructor(
    @Inject("USER_REPOSITORY")
    private readonly userRepository: UserRepository) { }

  async execute() {
    return await this.userRepository.findAll();
  }
}
