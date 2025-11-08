import {
  Controller,
  Get,
  Param,
  Post,
  Patch,
  Body,
} from '@nestjs/common';

import { CreateUserUseCase } from '../../application/use-cases/create-user.usecase';
import { UpdateUserUseCase } from '../../application/use-cases/update-user.usecase';
import { GetUserUseCase } from '../../application/use-cases/get-user.usecase';
import { ListUsersUseCase } from '../../application/use-cases/list-users.usecase';

import { CreateUserDto } from '../../application/dto/create-user.dto';
import { UpdateUserDto } from '../../application/dto/update-user.dto';

import {
  ApiTags,
  ApiResponse,
  ApiBearerAuth,
  ApiOperation
} from '@nestjs/swagger';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UserController {
  constructor(
    private readonly createUser: CreateUserUseCase,
    private readonly updateUser: UpdateUserUseCase,
    private readonly getUser: GetUserUseCase,
    private readonly listUsers: ListUsersUseCase,
  ) {}

  // ✅ CREATE USER
  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async create(@Body() body: CreateUserDto) {
    return this.createUser.execute(body);
  }

  // ✅ UPDATE USER
  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing user' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(
    @Param('id') id: string,
    @Body() body: UpdateUserDto
  ) {
    return this.updateUser.execute(id, body);
  }

  // ✅ GET USER BY ID
  @Get(':id')
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async get(@Param('id') id: string) {
    return this.getUser.execute(id);
  }

  // ✅ LIST USERS
  @Get()
  @ApiOperation({ summary: 'List all users' })
  @ApiResponse({ status: 200, description: 'Users listed successfully' })
  async list() {
    return this.listUsers.execute();
  }
}
