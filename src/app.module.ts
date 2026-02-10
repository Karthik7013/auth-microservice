import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ThrottlerModule } from "@nestjs/throttler";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { EmailModule } from "./email/email.module";
import { HealthModule } from "./health/health.module";
import { LoggerModule } from "./common/logger/logger.module";
import { typeOrmConfig } from "./config/typeorm.config";

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: typeOrmConfig,
      inject: [ConfigService],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      // Rate limiting for sensitive endpoints (auth, password reset, etc.)
      {
        ttl: 300000, // 5 minutes
        limit: 5, // 5 requests per 5 minutes
      },
      // Rate limiting for general endpoints
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

    // Feature modules
    AuthModule,
    UsersModule,
    EmailModule,
    HealthModule,
    LoggerModule,
  ],
})
export class AppModule {}
