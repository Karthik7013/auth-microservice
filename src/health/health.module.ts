import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HealthController } from "./health.controller";
import { User } from "../users/entities/user.entity";
import { EmailModule } from "../email/email.module";

@Module({
  imports: [TypeOrmModule.forFeature([User]), EmailModule],
  controllers: [HealthController],
  providers: [],
})
export class HealthModule {}
