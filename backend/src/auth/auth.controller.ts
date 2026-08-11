import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';

import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponse, AuthUser } from './interfaces/auth-response.interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: RegisterDto): Promise<AuthResponse> {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(dto);
  }

  /**
   * JWT access-token thuần là stateless - không có gì để thu hồi phía server.
   * Endpoint tồn tại để client có nơi gọi khi đăng xuất (và làm chỗ mở rộng
   * sau này, vd. audit log/token blocklist) mà không đổi API contract.
   * @Public() vì client có thể gọi logout ngay cả khi token đã hết hạn/không
   * hợp lệ - bắt buộc xác thực ở đây sẽ khiến logout thất bại đúng lúc cần nó nhất.
   */
  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(): void {}

  @Get('me')
  getMe(@CurrentUser() userId: string): Promise<AuthUser> {
    return this.authService.getCurrentUser(userId);
  }
}
