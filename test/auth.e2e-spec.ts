import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import { AuthService } from "../src/auth/auth.service";

describe("AuthController (e2e)", () => {
  let app: INestApplication;
  let authService: AuthService;
  let allowedOrigins: string[];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    authService = moduleFixture.get(AuthService);
    app = moduleFixture.createNestApplication();

    // Apply global validation pipe
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("POST /auth/register - should register a new user", async () => {
    const email = "test@example.com";
    const password = "StrongPass123!";
    const name = "Test User";

    const res = await request(app.getHttpServer())
      .post("/auth/register")
      .send({ email, password, name })
      .expect(201);

    expect(res.body).toHaveProperty("message");
    expect(res.body.message).toBe("User created successfully");
    expect(res.body).toHaveProperty("userId");
  });

  it("POST /auth/register - should fail if email already exists", async () => {
    const email = "test@example.com";
    const password = "AnotherPass123!";
    const name = "Another User";

    const res = await request(app.getHttpServer())
      .post("/auth/register")
      .send({ email, password, name })
      .expect(409);

    expect(res.body).toHaveProperty("statusCode", 409);
    expect(res.body).toHaveProperty("message");
  });

  it("POST /auth/login - should return an access token", async () => {
    const email = "test@example.com";
    const password = "StrongPass123!";

    const res = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email, password })
      .expect(201);

    expect(res.body).toHaveProperty("access_token");
    expect(res.body.access_token).toBeTruthy();
  });

  it("POST /auth/login - should fail with unauthorized for invalid credentials", async () => {
    const email = "test@example.com";
    const password = "WrongPassword!";

    const res = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email, password })
      .expect(401);

    expect(res.body).toHaveProperty("message");
    expect(res.body.message).toContain("Unauthorized");
  });

  it("POST /auth/refresh - should refresh the access token", async () => {
    // First obtain a token via login
    const loginRes = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: "test@example.com", password: "StrongPass123!" })
      .expect(201);

    const refreshToken = loginRes.body.refresh_token;

    const res = await request(app.getHttpServer())
      .post("/auth/refresh")
      .send({ refresh_token: refreshToken })
      .expect(201);

    expect(res.body).toHaveProperty("access_token");
  });

  it("GET /users/me - should return the authenticated user profile", async () => {
    // Obtain token
    const loginRes = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: "test@example.com", password: "StrongPass123!" })
      .expect(201);

    const token = loginRes.body.access_token;

    const res = await request(app.getHttpServer())
      .get("/users/me")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(res.body).toHaveProperty("email", "test@example.com");
    expect(res.body).toHaveProperty("name");
  });

  it("PATCH /users/:id - should update user password", async () => {
    // Get user id from profile
    const profileRes = await request(app.getHttpServer())
      .get("/users/me")
      .expect(200);

    const userId = profileRes.body.userId;
    const oldPassword = "StrongPass123!";
    const newPassword = "NewStrongPass123!";

    const res = await request(app.getHttpServer())
      .patch(`/users/${userId}/password`)
      .send({ oldPassword, newPassword })
      .expect(200);

    expect(res.body).toHaveProperty("message", "Password updated successfully");
  });

  it("POST /auth/logout - should invalidate the token", async () => {
    const loginRes = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: "test@example.com", password: "StrongPass123!" })
      .expect(201);

    const token = loginRes.body.access_token;

    const res = await request(app.getHttpServer())
      .post("/auth/logout")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(res.body).toHaveProperty("message", "Logged out successfully");
  });
});
