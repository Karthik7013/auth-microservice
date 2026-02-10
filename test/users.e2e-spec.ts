import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import { AuthService } from "../src/auth/auth.service";

describe("UsersController (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

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

  describe("GET /users/me", () => {
    it("should return user profile with valid token", async () => {
      // Register and login
      await request(app.getHttpServer())
        .post("/auth/register")
        .send({
          email: "profile@example.com",
          password: "StrongPass123!",
          name: "Profile User",
        })
        .expect(201);

      const loginRes = await request(app.getHttpServer())
        .post("/auth/login")
        .send({ email: "profile@example.com", password: "StrongPass123!" })
        .expect(201);

      const token = loginRes.body.access_token;

      const res = await request(app.getHttpServer())
        .get("/users/me")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(res.body).toHaveProperty("email", "profile@example.com");
      expect(res.body).toHaveProperty("name", "Profile User");
      expect(res.body).toHaveProperty("id");
    });

    it("should return 401 without token", async () => {
      const res = await request(app.getHttpServer())
        .get("/users/me")
        .expect(401);

      expect(res.body).toHaveProperty("message");
      expect(res.body.message).toContain("Unauthorized");
    });

    it("should return 401 with invalid token", async () => {
      const res = await request(app.getHttpServer())
        .get("/users/me")
        .set("Authorization", "Bearer invalid-token")
        .expect(401);

      expect(res.body).toHaveProperty("message");
      expect(res.body.message).toContain("Unauthorized");
    });
  });

  describe("PATCH /users/:id", () => {
    let userId: string;
    let token: string;

    beforeEach(async () => {
      // Register and login
      await request(app.getHttpServer())
        .post("/auth/register")
        .send({
          email: "update@example.com",
          password: "StrongPass123!",
          name: "Update User",
        })
        .expect(201);

      const loginRes = await request(app.getHttpServer())
        .post("/auth/login")
        .send({ email: "update@example.com", password: "StrongPass123!" })
        .expect(201);

      token = loginRes.body.access_token;

      // Get user ID
      const profileRes = await request(app.getHttpServer())
        .get("/users/me")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      userId = profileRes.body.id;
    });

    it("should update user profile", async () => {
      const updateData = { name: "Updated Name" };

      const res = await request(app.getHttpServer())
        .patch(`/users/${userId}`)
        .set("Authorization", `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(res.body).toHaveProperty("message", "User updated successfully");
      expect(res.body).toHaveProperty("id", userId);
    });

    it("should update user email", async () => {
      const updateData = { email: "updated@example.com" };

      const res = await request(app.getHttpServer())
        .patch(`/users/${userId}`)
        .set("Authorization", `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(res.body).toHaveProperty("message", "User updated successfully");
      expect(res.body).toHaveProperty("email", "updated@example.com");
    });

    it("should return 400 for invalid email format", async () => {
      const updateData = { email: "invalid-email" };

      const res = await request(app.getHttpServer())
        .patch(`/users/${userId}`)
        .set("Authorization", `Bearer ${token}`)
        .send(updateData)
        .expect(400);

      expect(res.body).toHaveProperty("message");
      expect(res.body.message).toContain("email");
    });

    it("should return 401 without token", async () => {
      const updateData = { name: "Updated Name" };

      const res = await request(app.getHttpServer())
        .patch(`/users/${userId}`)
        .send(updateData)
        .expect(401);

      expect(res.body).toHaveProperty("message");
      expect(res.body.message).toContain("Unauthorized");
    });

    it("should return 403 for updating another user", async () => {
      // Register another user
      await request(app.getHttpServer())
        .post("/auth/register")
        .send({
          email: "other@example.com",
          password: "StrongPass123!",
          name: "Other User",
        })
        .expect(201);

      const otherLoginRes = await request(app.getHttpServer())
        .post("/auth/login")
        .send({ email: "other@example.com", password: "StrongPass123!" })
        .expect(201);

      const otherToken = otherLoginRes.body.access_token;

      // Get other user ID
      const otherProfileRes = await request(app.getHttpServer())
        .get("/users/me")
        .set("Authorization", `Bearer ${otherToken}`)
        .expect(200);

      const otherUserId = otherProfileRes.body.id;

      const updateData = { name: "Hacked Name" };

      const res = await request(app.getHttpServer())
        .patch(`/users/${userId}`)
        .set("Authorization", `Bearer ${otherToken}`)
        .send(updateData)
        .expect(403);

      expect(res.body).toHaveProperty("message");
      expect(res.body.message).toContain("Forbidden");
    });
  });

  describe("PATCH /users/:id/password", () => {
    let userId: string;
    let token: string;

    beforeEach(async () => {
      // Register and login
      await request(app.getHttpServer())
        .post("/auth/register")
        .send({
          email: "password@example.com",
          password: "StrongPass123!",
          name: "Password User",
        })
        .expect(201);

      const loginRes = await request(app.getHttpServer())
        .post("/auth/login")
        .send({ email: "password@example.com", password: "StrongPass123!" })
        .expect(201);

      token = loginRes.body.access_token;

      // Get user ID
      const profileRes = await request(app.getHttpServer())
        .get("/users/me")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      userId = profileRes.body.id;
    });

    it("should update password successfully", async () => {
      const passwordData = {
        oldPassword: "StrongPass123!",
        newPassword: "NewStrongPass123!",
      };

      const res = await request(app.getHttpServer())
        .patch(`/users/${userId}/password`)
        .set("Authorization", `Bearer ${token}`)
        .send(passwordData)
        .expect(200);

      expect(res.body).toHaveProperty(
        "message",
        "Password updated successfully",
      );
    });

    it("should return 400 for invalid old password", async () => {
      const passwordData = {
        oldPassword: "WrongPassword!",
        newPassword: "NewStrongPass123!",
      };

      const res = await request(app.getHttpServer())
        .patch(`/users/${userId}/password`)
        .set("Authorization", `Bearer ${token}`)
        .send(passwordData)
        .expect(400);

      expect(res.body).toHaveProperty("message");
      expect(res.body.message).toContain("Invalid old password");
    });

    it("should return 400 for weak new password", async () => {
      const passwordData = {
        oldPassword: "StrongPass123!",
        newPassword: "weak",
      };

      const res = await request(app.getHttpServer())
        .patch(`/users/${userId}/password`)
        .set("Authorization", `Bearer ${token}`)
        .send(passwordData)
        .expect(400);

      expect(res.body).toHaveProperty("message");
      expect(res.body.message).toContain("password");
    });

    it("should return 401 without token", async () => {
      const passwordData = {
        oldPassword: "StrongPass123!",
        newPassword: "NewStrongPass123!",
      };

      const res = await request(app.getHttpServer())
        .patch(`/users/${userId}/password`)
        .send(passwordData)
        .expect(401);

      expect(res.body).toHaveProperty("message");
      expect(res.body.message).toContain("Unauthorized");
    });
  });

  describe("DELETE /users/:id", () => {
    let userId: string;
    let token: string;

    beforeEach(async () => {
      // Register and login
      await request(app.getHttpServer())
        .post("/auth/register")
        .send({
          email: "delete@example.com",
          password: "StrongPass123!",
          name: "Delete User",
        })
        .expect(201);

      const loginRes = await request(app.getHttpServer())
        .post("/auth/login")
        .send({ email: "delete@example.com", password: "StrongPass123!" })
        .expect(201);

      token = loginRes.body.access_token;

      // Get user ID
      const profileRes = await request(app.getHttpServer())
        .get("/users/me")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      userId = profileRes.body.id;
    });

    it("should delete user successfully", async () => {
      const res = await request(app.getHttpServer())
        .delete(`/users/${userId}`)
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(res.body).toHaveProperty("message", "User deleted successfully");

      // Verify user is deleted
      await request(app.getHttpServer())
        .get("/users/me")
        .set("Authorization", `Bearer ${token}`)
        .expect(401);
    });

    it("should return 401 without token", async () => {
      const res = await request(app.getHttpServer())
        .delete(`/users/${userId}`)
        .expect(401);

      expect(res.body).toHaveProperty("message");
      expect(res.body.message).toContain("Unauthorized");
    });

    it("should return 403 for deleting another user", async () => {
      // Register another user
      await request(app.getHttpServer())
        .post("/auth/register")
        .send({
          email: "other-delete@example.com",
          password: "StrongPass123!",
          name: "Other Delete User",
        })
        .expect(201);

      const otherLoginRes = await request(app.getHttpServer())
        .post("/auth/login")
        .send({ email: "other-delete@example.com", password: "StrongPass123!" })
        .expect(201);

      const otherToken = otherLoginRes.body.access_token;

      // Get other user ID
      const otherProfileRes = await request(app.getHttpServer())
        .get("/users/me")
        .set("Authorization", `Bearer ${otherToken}`)
        .expect(200);

      const otherUserId = otherProfileRes.body.id;

      const res = await request(app.getHttpServer())
        .delete(`/users/${userId}`)
        .set("Authorization", `Bearer ${otherToken}`)
        .expect(403);

      expect(res.body).toHaveProperty("message");
      expect(res.body.message).toContain("Forbidden");
    });
  });
});
