import { ConfigService } from "@nestjs/config";
import { Logger } from "@nestjs/common";

export function validateEnvironment(configService: ConfigService): void {
  const logger = new Logger("EnvironmentValidation");
  const errors: string[] = [];

  // Validate FRONTEND_URLS
  const frontendUrls = configService.get("FRONTEND_URLS");
  if (!frontendUrls) {
    errors.push("FRONTEND_URLS is required");
  } else {
    const urls = frontendUrls.split(",");
    for (const url of urls) {
      if (
        !/^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/\S*)?$/i.test(url.trim())
      ) {
        errors.push(`Invalid frontend URL: ${url}`);
      }
    }
  }

  // Validate JWT secrets
  const jwtAccessSecret = configService.get("JWT_ACCESS_SECRET");
  const jwtRefreshSecret = configService.get("JWT_REFRESH_SECRET");

  if (!jwtAccessSecret || jwtAccessSecret.length < 32) {
    errors.push(
      "JWT_ACCESS_SECRET is required and must be at least 32 characters long",
    );
  }

  if (!jwtRefreshSecret || jwtRefreshSecret.length < 32) {
    errors.push(
      "JWT_REFRESH_SECRET is required and must be at least 32 characters long",
    );
  }

  // Validate database configuration
  const dbHost = configService.get("DATABASE_HOST");
  const dbPort = configService.get("DATABASE_PORT");
  const dbUsername = configService.get("DATABASE_USERNAME");
  const dbPassword = configService.get("DATABASE_PASSWORD");
  const dbName = configService.get("DATABASE_NAME");

  if (!dbHost) errors.push("DATABASE_HOST is required");
  if (!dbPort) errors.push("DATABASE_PORT is required");
  if (!dbUsername) errors.push("DATABASE_USERNAME is required");
  if (!dbPassword) errors.push("DATABASE_PASSWORD is required");
  if (!dbName) errors.push("DATABASE_NAME is required");

  // Validate email configuration
  const smtpHost = configService.get("SMTP_HOST");
  const smtpPort = configService.get("SMTP_PORT");
  const smtpUser = configService.get("SMTP_USER");
  const smtpPassword = configService.get("SMTP_PASSWORD");
  const emailFrom = configService.get("EMAIL_FROM");

  if (!smtpHost) errors.push("SMTP_HOST is required");
  if (!smtpPort) errors.push("SMTP_PORT is required");
  if (!smtpUser) errors.push("SMTP_USER is required");
  if (!smtpPassword) errors.push("SMTP_PASSWORD is required");
  if (!emailFrom) errors.push("EMAIL_FROM is required");

  // Validate PORT
  const port = configService.get("PORT");
  if (
    !port ||
    isNaN(Number(port)) ||
    Number(port) < 1 ||
    Number(port) > 65535
  ) {
    errors.push("PORT must be a valid number between 1 and 65535");
  }

  // Validate NODE_ENV
  const nodeEnv = configService.get("NODE_ENV");
  if (!nodeEnv || !["development", "production", "test"].includes(nodeEnv)) {
    errors.push("NODE_ENV must be one of: development, production, test");
  }

  // Validate BCRYPT_ROUNDS
  const bcryptRounds = configService.get("BCRYPT_ROUNDS");
  if (
    !bcryptRounds ||
    isNaN(Number(bcryptRounds)) ||
    Number(bcryptRounds) < 8 ||
    Number(bcryptRounds) > 16
  ) {
    errors.push("BCRYPT_ROUNDS must be a number between 8 and 16");
  }

  if (errors.length > 0) {
    logger.error("Environment validation failed:");
    errors.forEach((error) => logger.error(`  - ${error}`));
    throw new Error(
      `Environment validation failed with ${errors.length} errors`,
    );
  }

  logger.log("Environment validation passed successfully");
}
