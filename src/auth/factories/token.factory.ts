import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { v4 as uuidv4 } from "uuid";

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Factory pattern for creating different types of tokens
 */
@Injectable()
export class TokenFactory {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Create access token
   */
  createAccessToken(payload: TokenPayload): string {
    return this.jwtService.sign(payload, {
      secret: this.configService.get("JWT_ACCESS_SECRET"),
      expiresIn: this.configService.get("JWT_ACCESS_EXPIRATION") || "15m",
    });
  }

  /**
   * Create refresh token
   */
  createRefreshToken(payload: TokenPayload): string {
    return this.jwtService.sign(payload, {
      secret: this.configService.get("JWT_REFRESH_SECRET"),
      expiresIn: this.configService.get("JWT_REFRESH_EXPIRATION") || "7d",
    });
  }

  /**
   * Create both access and refresh tokens
   */
  createTokens(payload: TokenPayload): Tokens {
    return {
      accessToken: this.createAccessToken(payload),
      refreshToken: this.createRefreshToken(payload),
    };
  }

  /**
   * Verify access token
   */
  verifyAccessToken(token: string): TokenPayload {
    return this.jwtService.verify(token, {
      secret: this.configService.get("JWT_ACCESS_SECRET"),
    });
  }

  /**
   * Verify refresh token
   */
  verifyRefreshToken(token: string): TokenPayload {
    return this.jwtService.verify(token, {
      secret: this.configService.get("JWT_REFRESH_SECRET"),
    });
  }

  /**
   * Create email verification token
   */
  createEmailVerificationToken(): string {
    return uuidv4();
  }

  /**
   * Create password reset token
   */
  createPasswordResetToken(): string {
    return uuidv4();
  }

  /**
   * Calculate email verification expiration
   */
  getEmailVerificationExpiration(): Date {
    const expirationHours = 24;
    return new Date(Date.now() + expirationHours * 60 * 60 * 1000);
  }

  /**
   * Calculate password reset expiration
   */
  getPasswordResetExpiration(): Date {
    const expirationHours = 1;
    return new Date(Date.now() + expirationHours * 60 * 60 * 1000);
  }
}
