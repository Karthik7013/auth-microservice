import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  UseGuards,
  Request,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { UsersService } from "./users.service";
import { UpdateUserDto, UserResponseDto } from "./dto/create-user.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("users")
@Controller("users")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth("JWT-auth")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("me")
  @ApiOperation({ summary: "Get current user profile" })
  @ApiResponse({
    status: 200,
    description: "User profile retrieved successfully",
    type: UserResponseDto,
  })
  async getProfile(@Request() req): Promise<Partial<UserResponseDto>> {
    const user = await this.usersService.findById(req.user.userId);
    return this.usersService.sanitizeUser(user);
  }

  @Put("me")
  @ApiOperation({ summary: "Update current user profile" })
  @ApiResponse({
    status: 200,
    description: "User profile updated successfully",
    type: UserResponseDto,
  })
  async updateProfile(
    @Request() req,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<Partial<UserResponseDto>> {
    const user = await this.usersService.update(req.user.userId, updateUserDto);
    return this.usersService.sanitizeUser(user);
  }

  @Delete("me")
  @ApiOperation({ summary: "Delete current user account" })
  @ApiResponse({
    status: 200,
    description: "User account deleted successfully",
  })
  async deleteAccount(
    @Request() req,
  ): Promise<{ message: string; deleted: boolean }> {
    await this.usersService.remove(req.user.userId);
    return { message: "Account deleted successfully", deleted: true };
  }
}
