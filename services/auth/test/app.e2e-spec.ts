import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Connection, connect } from 'mongoose';

/**
 * End-to-End Authentication Tests
 *
 * Comprehensive test suite for authentication endpoints including:
 * - User registration with validation
 * - User login with session management
 * - Session validation and logout
 * - Error handling for various scenarios
 * - Edge cases and security validations
 */
describe('Authentication System (e2e)', () => {
  let app: INestApplication<App>;
  let mongoServer: MongoMemoryServer;
  let mongoConnection: Connection;

  // Test data
  const testUser = {
    email: 'test@example.com',
    password: 'testPassword123',
    name: 'Test User',
  };

  const invalidCredentials = {
    email: 'wrong@example.com',
    password: 'wrongpassword',
  };

  beforeAll(async () => {
    // Start in-memory MongoDB server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    // Connect to the in-memory database
    mongoConnection = (await connect(mongoUri)).connection;

    // Set environment variables for the test
    process.env.MONGODB_URI = mongoUri;
    process.env.REDIS_URL = 'redis://localhost:6379'; // Use a mock or skip Redis in tests
  });

  afterAll(async () => {
    // Clean up database connection
    if (mongoConnection) {
      await mongoConnection.close();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  beforeEach(async () => {
    // Clear all collections before each test
    if (mongoConnection && mongoConnection.db) {
      const collections = mongoConnection.db.collections;
      for (const collection of Object.values(collections)) {
        await collection.deleteMany({});
      }
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  /**
   * User Registration Tests
   */
  describe('/auth/register (POST)', () => {
    it('should successfully register a new user', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.user).toHaveProperty('id');
          expect(res.body.user.email).toBe(testUser.email);
          expect(res.body.user.profile.name).toBe(testUser.name);
          expect(res.body.user).not.toHaveProperty('password'); // Password should not be returned
        });
    });

    it('should reject registration with existing email', async () => {
      // First registration
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201);

      // Second registration with same email
      return request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(409)
        .expect((res) => {
          expect(res.body.errorCode).toBe('AUTH003');
          expect(res.body.message).toContain('already exists');
        });
    });

    it('should reject registration with invalid email format', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          ...testUser,
          email: 'invalid-email',
        })
        .expect(400);
    });

    it('should reject registration with weak password', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          ...testUser,
          password: '123',
        })
        .expect(400);
    });

    it('should reject registration with missing required fields', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: testUser.email,
          // Missing password and name
        })
        .expect(400);
    });
  });

  /**
   * User Login Tests
   */
  describe('/auth/login (POST)', () => {
    beforeEach(async () => {
      // Ensure test user exists
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser);
    });

    it('should successfully login with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body).toHaveProperty('session_id');
          expect(res.body).toHaveProperty('user_id');
          expect(res.headers['set-cookie']).toBeDefined();
          expect(res.headers['set-cookie'][0]).toContain('session_id=');
        });
    });

    it('should reject login with invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send(invalidCredentials)
        .expect(401)
        .expect((res) => {
          expect(res.body.errorCode).toBe('AUTH001');
          expect(res.body.message).toContain('Invalid email or password');
        });
    });

    it('should reject login with missing fields', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          // Missing password
        })
        .expect(400);
    });

    it('should reject login with wrong password', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        })
        .expect(401)
        .expect((res) => {
          expect(res.body.errorCode).toBe('AUTH001');
        });
    });
  });

  /**
   * Session Management Tests
   */
  describe('/auth/session (GET)', () => {
    let sessionCookie: string;

    beforeEach(async () => {
      // Register and login to get session
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser);

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      sessionCookie = loginResponse.headers['set-cookie'][0];
    });

    it('should validate active session', () => {
      return request(app.getHttpServer())
        .get('/auth/session')
        .set('Cookie', sessionCookie)
        .expect(200)
        .expect((res) => {
          expect(res.body.valid).toBe(true);
          expect(res.body.session).toHaveProperty('user');
          expect(res.body.session.user.email).toBe(testUser.email);
          expect(res.body.session).toHaveProperty('sessionId');
        });
    });

    it('should reject request without session cookie', () => {
      return request(app.getHttpServer())
        .get('/auth/session')
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toContain('No session found');
        });
    });

    it('should reject request with invalid session cookie', () => {
      return request(app.getHttpServer())
        .get('/auth/session')
        .set('Cookie', 'session_id=invalid-session-id')
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toContain('Invalid session');
        });
    });
  });

  /**
   * Logout Tests
   */
  describe('/auth/logout (POST)', () => {
    let sessionCookie: string;

    beforeEach(async () => {
      // Register and login to get session
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser);

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      sessionCookie = loginResponse.headers['set-cookie'][0];
    });

    it('should successfully logout and clear session', () => {
      return request(app.getHttpServer())
        .post('/auth/logout')
        .set('Cookie', sessionCookie)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.message).toContain('Logged out successfully');
          expect(res.headers['set-cookie'][0]).toContain('session_id=;');
        });
    });

    it('should handle logout without active session gracefully', () => {
      return request(app.getHttpServer())
        .post('/auth/logout')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.message).toContain('Logged out successfully');
        });
    });
  });

  /**
   * Integration Flow Tests
   */
  describe('Complete Authentication Flow', () => {
    it('should complete full registration -> login -> session check -> logout cycle', async () => {
      const uniqueEmail = `integration-${Date.now()}@example.com`;

      // 1. Register
      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: uniqueEmail,
          password: 'integrationPass123',
          name: 'Integration Test User',
        })
        .expect(201);

      expect(registerResponse.body.success).toBe(true);

      // 2. Login
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: uniqueEmail,
          password: 'integrationPass123',
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      const sessionCookie = loginResponse.headers['set-cookie'][0];

      // 3. Check session
      const sessionResponse = await request(app.getHttpServer())
        .get('/auth/session')
        .set('Cookie', sessionCookie)
        .expect(200);

      expect(sessionResponse.body.valid).toBe(true);
      expect(sessionResponse.body.session.user.email).toBe(uniqueEmail);

      // 4. Logout
      const logoutResponse = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Cookie', sessionCookie)
        .expect(200);

      expect(logoutResponse.body.success).toBe(true);

      // 5. Verify session is invalidated
      await request(app.getHttpServer())
        .get('/auth/session')
        .set('Cookie', sessionCookie)
        .expect(401);
    });
  });

  /**
   * Security Tests
   */
  describe('Security Validations', () => {
    it('should prevent SQL injection attempts in email field', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: "'; DROP TABLE users; --",
          password: 'password123',
        })
        .expect(401); // Should fail authentication, not cause SQL error
    });

    it('should handle very long input strings', () => {
      const longString = 'a'.repeat(10000);

      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: `${longString}@example.com`,
          password: 'password123',
          name: longString,
        })
        .expect(400); // Should be rejected due to validation constraints
    });

    it('should reject requests with malformed JSON', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .set('Content-Type', 'application/json')
        .send('{invalid json')
        .expect(400);
    });
  });
});
