import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import type { ICurrentUser } from 'src/common/interfaces/current.user';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  getProfile(@CurrentUser() user: ICurrentUser) {
    return this.profileService.getProfile(user.sub as string);
  }

  @Patch()
  updateProfile(
    @CurrentUser() user: ICurrentUser,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.profileService.updateProfile(
      user.sub as string,
      updateProfileDto,
    );
  }
  @Patch('password')
  changePassword(
    @CurrentUser() user: ICurrentUser,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.profileService.changePassword(
      user.sub as string,
      changePasswordDto,
    );
  }
}
