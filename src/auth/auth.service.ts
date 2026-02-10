import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { UsersRepository } from "../users/repositories/users.repository";
import { EmailService } from "../email/email.service";
import { TokenFactory, TokenPayload } from "./factories/token.factory";
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from "./dto/auth.dto";
import { User } from "../users/entities/user.entity";

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly emailService: EmailService,
    private readonly tokenFactory: TokenFactory,
  ) {}

  /**
   * Register a new user
   */
  async register(registerDto: RegisterDto) {
    // Check if user already exists
    const existingUser = await this.usersRepository.findByEmail(
      registerDto.email,
    );

    if (existingUser) {
      throw new ConflictException("User with this email already exists");
    }

    // Create user
    const user = await this.usersRepository.create({
      email: registerDto.email,
      password: registerDto.password,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
    });

    // Generate email verification token
    const verificationToken = this.tokenFactory.createEmailVerificationToken();
    const verificationExpires =
      this.tokenFactory.getEmailVerificationExpiration();

    await this.usersRepository.setEmailVerificationToken(
      user.id,
      verificationToken,
      verificationExpires,
    );

    // Send verification email
    await this.emailService.sendVerificationEmail(
      user.email,
      verificationToken,
    );

    return {
      message:
        "Registration successful! Please check your email to verify your account.",
      userId: user.id,
    };
  }

  /**
   * Login user
   */
  async login(loginDto: LoginDto) {
    // Find user
    const user = await this.usersRepository.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Validate password
    const isPasswordValid = await user.validatePassword(loginDto.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      throw new UnauthorizedException(
        "Please verify your email before logging in",
      );
    }

    // Check if account is active
    if (user.status !== "active") {
      throw new UnauthorizedException("Account is not active");
    }

    // Generate tokens
    const tokens = await this.generateTokensForUser(user);

    // Update last login
    await this.usersRepository.updateLastLogin(user.id);

    // Store refresh token
    const hashedRefreshToken = await bcrypt.hash(tokens.refreshToken, 10);
    await this.usersRepository.updateRefreshToken(user.id, hashedRefreshToken);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: this.sanitizeUser(user),
    };
  }

  /**
   * Refresh access token
   */
  async refreshTokens(userId: string, refreshToken: string) {
    // Find user
    const user = await this.usersRepository.findById(userId);

    if (!user || !user.refreshToken) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    // Verify refresh token
    const isRefreshTokenValid = await bcrypt.compare(
      refreshToken,
      user.refreshToken,
    );

    if (!isRefreshTokenValid) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    // Generate new tokens
    const tokens = await this.generateTokensForUser(user);

    // Update refresh token
    const hashedRefreshToken = await bcrypt.hash(tokens.refreshToken, 10);
    await this.usersRepository.updateRefreshToken(user.id, hashedRefreshToken);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  /**
   * Logout user
   */
  async logout(userId: string) {
    await this.usersRepository.updateRefreshToken(userId, null);
    return { message: "Logged out successfully" };
  }

  /**
   * Verify email
   */
  async verifyEmail(token: string) {
    const user = await this.usersRepository.findByEmailVerificationToken(token);

    if (!user) {
      throw new BadRequestException("Invalid verification token");
    }

    // Check if token is expired
    if (user.emailVerificationExpires < new Date()) {
      throw new BadRequestException("Verification token has expired");
    }

    // Verify email
    await this.usersRepository.verifyEmail(user.id);

    // Send welcome email
    await this.emailService.sendWelcomeEmail(
      user.email,
      user.firstName || "User",
    );

    return { message: "Email verified successfully! You can now login." };
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(email: string) {
    const user = await this.usersRepository.findByEmail(email);

    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (user.isEmailVerified) {
      throw new BadRequestException("Email is already verified");
    }

    // Generate new verification token
    const verificationToken = this.tokenFactory.createEmailVerificationToken();
    const verificationExpires =
      this.tokenFactory.getEmailVerificationExpiration();

    await this.usersRepository.setEmailVerificationToken(
      user.id,
      verificationToken,
      verificationExpires,
    );

    // Send verification email
    await this.emailService.sendVerificationEmail(
      user.email,
      verificationToken,
    );

    return { message: "Verification email sent successfully" };
  }

  /**
   * Forgot password - send reset email
   */
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.usersRepository.findByEmail(
      forgotPasswordDto.email,
    );

    if (!user) {
      // Return success even if user not found (security best practice)
      return {
        message:
          "If an account exists with this email, a password reset link has been sent.",
      };
    }

    // Generate password reset token
    const resetToken = this.tokenFactory.createPasswordResetToken();
    const resetExpires = this.tokenFactory.getPasswordResetExpiration();

    await this.usersRepository.setPasswordResetToken(
      user.id,
      resetToken,
      resetExpires,
    );

    // Send password reset email
    await this.emailService.sendPasswordResetEmail(user.email, resetToken);

    return {
      message:
        "If an account exists with this email, a password reset link has been sent.",
    };
  }

  /**
   * Reset password
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const user = await this.usersRepository.findByPasswordResetToken(
      resetPasswordDto.token,
    );

    if (!user) {
      throw new BadRequestException("Invalid or expired reset token");
    }

    // Check if token is expired
    if (user.passwordResetExpires < new Date()) {
      throw new BadRequestException("Reset token has expired");
    }

    // Hash the new password before updating
    const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, 10);

    // Update password with hashed version
    await this.usersRepository.update(user.id, {
      password: hashedPassword,
    });

    // Clear reset token
    await this.usersRepository.clearPasswordResetToken(user.id);

    // Clear refresh token (logout from all devices)
    await this.usersRepository.updateRefreshToken(user.id, null);

    return {
      message:
        "Password reset successfully. Please login with your new password.",
    };
  }

  /**
   * Helper method to generate tokens for user
   */
  private async generateTokensForUser(user: User) {
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    return this.tokenFactory.createTokens(payload);
  }

  /**
   * Helper method to remove sensitive fields
   */
  private sanitizeUser(user: User) {
    const {
      password,
      refreshToken,
      emailVerificationToken,
      passwordResetToken,
      ...sanitized
    } = user;
    return sanitized;
  }
}
