import { Injectable } from '@nestjs/common';
import { User } from '../entities/user.entity';


@Injectable()
export class UserDomainService {
validateNewUser(user: User) {
if (!user.email) throw new Error('Email required');
if (!user.name || user.name.length < 2) throw new Error('Name too short');
}
}