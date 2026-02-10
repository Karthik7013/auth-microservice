import { Controller, Get, Res, HttpStatus } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiTags } from "@nestjs/swagger";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../users/entities/user.entity";

@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(
    private readonly configService: ConfigService,
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  @Get("/")
  async getHealth(@Res() res) {
    try {
      // Check database connection
      const dbStatus = await this.dataSource
        .query("SELECT 1")
        .then(() => "healthy")
        .catch(() => "unhealthy");

      // Check user table availability
      const userCount = await this.userRepository
        .count()
        .then((count) => (count > 0 ? "available" : "empty"))
        .catch(() => "unavailable");

      res.status(HttpStatus.OK).json({
        status: "success",
        message: "Service is healthy",
        timestamp: new Date().toISOString(),
        environment: this.configService.get("NODE_ENV"),
        uptime: process.uptime(),
        database: {
          status: dbStatus,
          userTable: userCount,
        },
        memory: {
          usage: process.memoryUsage(),
        },
        nodeVersion: process.version,
      });
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: "error",
        message: "Service is unhealthy",
        timestamp: new Date().toISOString(),
        error: error.message,
      });
    }
  }
}
