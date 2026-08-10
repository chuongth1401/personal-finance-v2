import { Controller, Get } from '@nestjs/common';

import { DEMO_USER_ID } from '../common/constants/current-user.constant';
import { CategoriesService } from './categories.service';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  // TODO(auth): thay DEMO_USER_ID bằng userId lấy từ JWT (req.user.id) khi có xác thực thật.
  private readonly userId = DEMO_USER_ID;

  @Get()
  findAll() {
    return this.categoriesService.findAll(this.userId);
  }
}
