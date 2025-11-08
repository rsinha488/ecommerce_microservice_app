import { IsString, IsEmail, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {

    @ApiProperty({ example: 'John Doe' })
    @IsString()
    @MinLength(2)
    name!: string;

    @IsEmail()

    @ApiProperty({ example: 'john@example.com' })
    email!: string;

    @IsString()
    @MinLength(6)
    @ApiProperty({ example: 'Secret@123' })
    password!: string;
}
