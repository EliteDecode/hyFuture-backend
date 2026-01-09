import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { LettersService } from './letters.service';
import { CreateGuestLetterDto, CreateLetterDto } from './dto/create-letter.dto';
import { UpdateLetterDto } from './dto/update-letter.dto';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import type { ICurrentUser } from 'src/common/interfaces/current.user';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AdminJwtAuthGuard } from 'src/common/guards/admin-jwt-auth.guard';
import { LETTERS_CONSTANTS } from './constants/letters.constants';
import { LetterStatus } from '@prisma/client';
@Controller('letters')
export class LettersController {
  constructor(private readonly lettersService: LettersService) { }

  @Throttle({
    default: {
      limit: LETTERS_CONSTANTS.MAX_GUEST_LETTER_ATTEMPTS,
      ttl: LETTERS_CONSTANTS.GUEST_LETTER_TTL_MS,
    },
  })
  @Post('guest')
  async createGuestLetter(@Body() createLetterDto: CreateGuestLetterDto) {
    //Create Letter (email sent automatically by service if sendImmediately is true)
    const letter = await this.lettersService.createLetterFromDto(
      createLetterDto,
      undefined,
      false,
    );
    return letter;
  }

  @Throttle({
    default: {
      limit: LETTERS_CONSTANTS.MAX_AUTHENTICATED_LETTER_ATTEMPTS,
      ttl: LETTERS_CONSTANTS.AUTHENTICATED_LETTER_TTL_MS,
    },
  })
  @UseGuards(JwtAuthGuard)
  @Post()
  async createAuthenticatedLetter(
    @Body() createLetterDto: CreateLetterDto,
    @CurrentUser() user: ICurrentUser,
  ) {
    //Create Letter (email sent automatically by service if sendImmediately is true)
    const letter = await this.lettersService.createLetterFromDto(
      createLetterDto,
      user.sub,
      false,
    );
    return letter;
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getAllLetters(
    @CurrentUser() user: ICurrentUser,
    @Query('status') status?: string,
  ) {
    const letterStatus = status as LetterStatus | undefined;
    const letters = await this.lettersService.getLettersByUserId(
      user.sub,
      letterStatus,
    );
    return letters;
  }

  // Public endpoints (no auth) to view public letters
  @Get('public/all')
  async getAllPublicLetters() {
    const letters = await this.lettersService.getPublicLetters();
    return letters;
  }

  @Get('public/:id')
  async getPublicLetterById(@Param('id') id: string) {
    const letter = await this.lettersService.getPublicLetterById(id);
    return letter;
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getLetterById(
    @Param('id') id: string,
    @CurrentUser() user: ICurrentUser,
  ) {
    const letter = await this.lettersService.getLetterByIdWithDeliveryCheck(
      id,
      user.sub,
    );
    return letter;
  }

  @UseGuards(JwtAuthGuard)
  @Post('draft')
  async createDraft(
    @Body() createLetterDto: CreateLetterDto,
    @CurrentUser() user: ICurrentUser,
  ) {
    const draft = await this.lettersService.createDraft(
      createLetterDto,
      user.sub,
    );
    return draft;
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async updateDraft(
    @Param('id') id: string,
    @Body() updateLetterDto: UpdateLetterDto,
    @CurrentUser() user: ICurrentUser,
  ) {
    const updatedDraft = await this.lettersService.updateDraft(
      id,
      user.sub,
      updateLetterDto,
    );
    return updatedDraft;
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteLetter(
    @Param('id') id: string,
    @CurrentUser() user: ICurrentUser,
  ) {
    return await this.lettersService.deleteLetterWithDeliveryCheck(
      id,
      user.sub,
    );
  }

  // Admin Routes
  @UseGuards(AdminJwtAuthGuard)
  @Get('admin/stats')
  async getAdminStats() {
    return this.lettersService.getAdminStats();
  }

  @UseGuards(AdminJwtAuthGuard)
  @Get('admin/all')
  async getAdminLetters(@Query('status') status?: string) {
    const letterStatus = status as LetterStatus | undefined;
    return this.lettersService.getAdminLetters(letterStatus);
  }

  @UseGuards(AdminJwtAuthGuard)
  @Post('admin/migrate-encryption')
  async migrateEncryption() {
    return this.lettersService.encryptExistingLetters();
  }
}
