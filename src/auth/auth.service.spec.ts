import { Test, TestingModule } from "@nestjs/testing";
import { ConflictException, UnauthorizedException } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { UsersRepository } from "../users/repositories/users.repository";
import { EmailService } from "../email/email.service";
import { TokenFactory } from "./factories/token.factory";
import { User, UserRole, UserStatus } from "../users/entities/user.entity";

describe("AuthService", () => {
  let service: AuthService;
  let usersRepository: jest.Mocked<UsersRepository>;
  let emailService: jest.Mocked<EmailService>;
  let tokenFactory: jest.Mocked<TokenFactory>;

  const mockUser: Partial<User> = {
    id: "123",
    email: "test@example.com",
    password: "$2b$10$hashedpassword",
    firstName: "Test",
    lastName: "User",
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
    isEmailVerified: true,
    validatePassword: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersRepository,
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
            findById: jest.fn(),
            updateRefreshToken: jest.fn(),
            updateLastLogin: jest.fn(),
            setEmailVerificationToken: jest.fn(),
            findByEmailVerificationToken: jest.fn(),
            verifyEmail: jest.fn(),
            setPasswordResetToken: jest.fn(),
            findByPasswordResetToken: jest.fn(),
            update: jest.fn(),
            clearPasswordResetToken: jest.fn(),
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendVerificationEmail: jest.fn(),
            sendWelcomeEmail: jest.fn(),
            sendPasswordResetEmail: jest.fn(),
          },
        },
        {
          provide: TokenFactory,
          useValue: {
            createTokens: jest.fn(),
            createEmailVerificationToken: jest.fn(),
            getEmailVerificationExpiration: jest.fn(),
            createPasswordResetToken: jest.fn(),
            getPasswordResetExpiration: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersRepository = module.get(UsersRepository);
    emailService = module.get(EmailService);
    tokenFactory = module.get(TokenFactory);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("register", () => {
    const registerDto = {
      email: "newuser@example.com",
      password: "Password123!",
      firstName: "New",
      lastName: "User",
    };

    it("should successfully register a new user", async () => {
      usersRepository.findByEmail.mockResolvedValue(null);
      usersRepository.create.mockResolvedValue(mockUser as User);
      tokenFactory.createEmailVerificationToken.mockReturnValue("token123");
      tokenFactory.getEmailVerificationExpiration.mockReturnValue(new Date());
      emailService.sendVerificationEmail.mockResolvedValue(undefined);

      const result = await service.register(registerDto);

      expect(result).toHaveProperty("message");
      expect(result).toHaveProperty("userId");
      expect(usersRepository.create).toHaveBeenCalledWith(registerDto);
      expect(emailService.sendVerificationEmail).toHaveBeenCalled();
    });

    it("should throw ConflictException if user already exists", async () => {
      usersRepository.findByEmail.mockResolvedValue(mockUser as User);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe("login", () => {
    const loginDto = {
      email: "test@example.com",
      password: "Password123!",
    };

    it("should successfully login a user", async () => {
      const user = {
        ...mockUser,
        validatePassword: jest.fn().mockResolvedValue(true),
      };
      usersRepository.findByEmail.mockResolvedValue(user as User);
      tokenFactory.createTokens.mockReturnValue({
        accessToken: "access_token",
        refreshToken: "refresh_token",
      });

      const result = await service.login(loginDto);

      expect(result).toHaveProperty("accessToken");
      expect(result).toHaveProperty("refreshToken");
      expect(result).toHaveProperty("user");
      expect(usersRepository.updateLastLogin).toHaveBeenCalled();
    });

    it("should throw UnauthorizedException for invalid credentials", async () => {
      usersRepository.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("should throw UnauthorizedException if email not verified", async () => {
      const user = {
        ...mockUser,
        isEmailVerified: false,
        validatePassword: jest.fn().mockResolvedValue(true),
      };
      usersRepository.findByEmail.mockResolvedValue(user as User);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe("verifyEmail", () => {
    it("should successfully verify email", async () => {
      const user = {
        ...mockUser,
        emailVerificationExpires: new Date(Date.now() + 1000000),
      };
      usersRepository.findByEmailVerificationToken.mockResolvedValue(
        user as User,
      );
      emailService.sendWelcomeEmail.mockResolvedValue(undefined);

      const result = await service.verifyEmail("valid_token");

      expect(result).toHaveProperty("message");
      expect(usersRepository.verifyEmail).toHaveBeenCalled();
      expect(emailService.sendWelcomeEmail).toHaveBeenCalled();
    });

    it("should throw error for expired token", async () => {
      const user = {
        ...mockUser,
        emailVerificationExpires: new Date(Date.now() - 1000000),
      };
      usersRepository.findByEmailVerificationToken.mockResolvedValue(
        user as User,
      );

      await expect(service.verifyEmail("expired_token")).rejects.toThrow();
    });
  });

  describe("logout", () => {
    it("should successfully logout user", async () => {
      const result = await service.logout("123");

      expect(result).toHaveProperty("message");
      expect(usersRepository.updateRefreshToken).toHaveBeenCalledWith(
        "123",
        null,
      );
    });
  });
});
