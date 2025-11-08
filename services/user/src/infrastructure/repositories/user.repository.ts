import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserModel, UserDocument } from '../database/user.schema';
import { User } from '../../domain/entities/user.entity';
import { UserMapper } from '../mappers/user.mapper';

@Injectable()
export class UserRepository {
  constructor(
    @InjectModel(UserModel.name) private userModel: Model<UserDocument>,
  ) {}

  async create(user: User): Promise<User> {
    const created = await this.userModel.create(user as any);
    return UserMapper.toDomain(created.toObject())!;
  }

  async update(id: string, patch: Partial<User>): Promise<User | null> {
    const updated = await this.userModel
      .findByIdAndUpdate(id, patch, { new: true })
      .lean();

    return UserMapper.toDomain(updated);
  }

  async findById(id: string): Promise<User | null> {
    const found = await this.userModel.findById(id).lean();
    return UserMapper.toDomain(found);
  }

  async findByEmail(email: string): Promise<User | null> {
    const found = await this.userModel.findOne({ email }).lean();
    return UserMapper.toDomain(found);
  }

  async findAll(filter: any = {}): Promise<User[]> {
    const rows = await this.userModel.find(filter).lean();
    return rows.map((r) => UserMapper.toDomain(r)!);
  }
}
