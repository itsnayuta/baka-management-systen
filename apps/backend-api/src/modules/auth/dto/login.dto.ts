import { IsEmail, IsNotEmpty, IsString, MinLength, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@company.vn', description: 'Email đăng nhập' })
  @IsEmail({}, { message: 'Email không đúng định dạng.' })
  email!: string;

  @ApiProperty({ example: 'Admin123@', description: 'Mật khẩu' })
  @IsString()
  @MinLength(6, { message: 'Mật khẩu phải tối thiểu 6 ký tự.' })
  password!: string;

  @ApiProperty({
    example: 'management-portal',
    description: 'Cổng truy cập đăng nhập: employee-portal hoặc management-portal',
    enum: ['employee-portal', 'management-portal'],
  })
  @IsString()
  @IsIn(['employee-portal', 'management-portal'], {
    message: 'Portal phải là employee-portal hoặc management-portal.',
  })
  portal!: 'employee-portal' | 'management-portal';
}

