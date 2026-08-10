import { Controller, Get } from '@nestjs/common';

import { DEMO_USER_ID } from '../common/constants/current-user.constant';
import { AccountsService } from './accounts.service';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  // TODO(auth): thay DEMO_USER_ID bằng userId lấy từ JWT (req.user.id) khi có xác thực thật.
  private readonly userId = DEMO_USER_ID;

  @Get()
  findAll() {
    return this.accountsService.findAll(this.userId);
  }
}
