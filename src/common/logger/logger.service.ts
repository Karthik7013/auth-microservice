import { Injectable, LoggerService, Scope } from "@nestjs/common";
import * as winston from "winston";
import * as Sentry from "@sentry/node";

@Injectable({ scope: Scope.TRANSIENT })
export class WinstonLoggerService implements LoggerService {
  private readonly logger: winston.Logger;

  constructor() {
    const isDevelopment = process.env.NODE_ENV === "development";

    this.logger = winston.createLogger({
      level: isDevelopment ? "debug" : "info",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      defaultMeta: { service: "nestjs-auth-microservice" },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
          ),
        }),
      ],
    });

    // Add file transports for production
    if (!isDevelopment) {
      this.logger.add(
        new winston.transports.File({
          filename: "logs/error.log",
          level: "error",
        }),
      );
      this.logger.add(
        new winston.transports.File({
          filename: "logs/combined.log",
        }),
      );
    }

    // Initialize Sentry in production
    if (!isDevelopment && process.env.SENTRY_DSN) {
      Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV,
        tracesSampleRate: 1.0,
      });
    }
  }

  log(message: string, ...args: any[]) {
    this.logger.info(message, args);
  }

  error(message: string, ...args: any[]) {
    this.logger.error(message, args);
    if (!(process.env.NODE_ENV === "development") && process.env.SENTRY_DSN) {
      Sentry.captureException(new Error(message));
    }
  }

  warn(message: string, ...args: any[]) {
    this.logger.warn(message, args);
  }

  debug(message: string, ...args: any[]) {
    this.logger.debug(message, args);
  }

  verbose(message: string, ...args: any[]) {
    this.logger.verbose(message, args);
  }
}
