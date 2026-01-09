import { Body, Controller, Delete, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import type { ICurrentUser } from 'src/common/interfaces/current.user';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { UsersService } from './users.service';
import { AdminJwtAuthGuard } from 'src/common/guards/admin-jwt-auth.guard';
import { Get } from '@nestjs/common';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @UseGuards(JwtAuthGuard)
  @Throttle({
    default: { limit: 10, ttl: 60000 }, // 10 requests per minute
  })
  @UseGuards(JwtAuthGuard)
  @Throttle({
    default: { limit: 3, ttl: 60000 }, // 3 requests per minute (sensitive operation)
  })
  @Delete('account')
  async deleteAccount(
    @Body() deleteAccountDto: DeleteAccountDto,
    @CurrentUser() user: ICurrentUser,
  ) {
    return this.usersService.deleteAccount(
      user.sub as string,
      deleteAccountDto.password,
    );
  }

  @UseGuards(AdminJwtAuthGuard)
  @Get('admin/all')
  async getAllUsers() {
    const users = await this.usersService.getAllUsers();
    return {
      users,
      count: users.length,
    };
  }
}
