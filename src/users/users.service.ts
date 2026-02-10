import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { UsersRepository } from "./repositories/users.repository";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/create-user.dto";
import { User } from "./entities/user.entity";

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.usersRepository.findByEmail(
      createUserDto.email,
    );

    if (existingUser) {
      throw new ConflictException("User with this email already exists");
    }

    return this.usersRepository.create(createUserDto);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.findAll();
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findByEmail(email);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    return this.usersRepository.update(user.id, updateUserDto);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findById(id);
    await this.usersRepository.remove(user.id);
  }

  async hardDelete(id: string): Promise<void> {
    const user = await this.findById(id);
    await this.usersRepository.hardDelete(user.id);
  }

  // Helper method to exclude sensitive fields
  sanitizeUser(user: User): Partial<User> {
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
