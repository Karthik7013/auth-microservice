import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User, UserStatus } from "../entities/user.entity";
import { CreateUserDto } from "../dto/create-user.dto";
import { UpdateUserDto } from "../dto/create-user.dto";

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.repository.create(createUserDto);
    return this.repository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.repository.find();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({ where: { email, deleted: false } });
  }

  async findByEmailVerificationToken(token: string): Promise<User | null> {
    return this.repository.findOne({
      where: { emailVerificationToken: token, deleted: false },
    });
  }

  async findByPasswordResetToken(token: string): Promise<User | null> {
    return this.repository.findOne({
      where: { passwordResetToken: token, deleted: false },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    await this.repository.update(id, updateUserDto);
    return this.findById(id);
  }

  async updateRefreshToken(
    userId: string,
    refreshToken: string | null,
  ): Promise<void> {
    await this.repository.update(userId, { refreshToken });
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.repository.update(userId, { lastLoginAt: new Date() });
  }

  async remove(id: string): Promise<void> {
    await this.repository.update(id, {
      deleted: true,
      deletedAt: new Date(),
      deletedBy: "system",
    });
  }

  async hardDelete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async findById(id: string): Promise<User | null> {
    return this.repository.findOne({ where: { id, deleted: false } });
  }

  async findAllWithDeleted(): Promise<User[]> {
    return this.repository.find();
  }

  async setEmailVerificationToken(
    userId: string,
    token: string,
    expires: Date,
  ): Promise<void> {
    await this.repository.update(userId, {
      emailVerificationToken: token,
      emailVerificationExpires: expires,
    });
  }

  async verifyEmail(userId: string): Promise<void> {
    await this.repository.update(userId, {
      isEmailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null,
      status: UserStatus.ACTIVE,
    });
  }

  async setPasswordResetToken(
    userId: string,
    token: string,
    expires: Date,
  ): Promise<void> {
    await this.repository.update(userId, {
      passwordResetToken: token,
      passwordResetExpires: expires,
    });
  }

  async clearPasswordResetToken(userId: string): Promise<void> {
    await this.repository.update(userId, {
      passwordResetToken: null,
      passwordResetExpires: null,
    });
  }
}
