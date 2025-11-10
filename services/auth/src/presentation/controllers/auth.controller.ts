import {
  Controller,
  Post,
  Body,
  Get,
  Req,
  Res,
  Query,
  UnauthorizedException,
  HttpCode,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { LoginDto } from '../../application/dto/login.dto';
import { RegisterDto } from '../../application/dto/register.dto';
import { LoginUseCase } from '../../application/use-cases/login.usecase';
import { RegisterUseCase } from '../../application/use-cases/register.usecase';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiCookieAuth,
  ApiQuery,
  ApiProperty,
} from '@nestjs/swagger';

/**
 * Custom exception classes for auth-specific errors with standardized error codes
 */
export class AuthException extends BadRequestException {
  constructor(message: string, public readonly errorCode: string) {
    super({
      statusCode: 400,
      message,
      error: 'Bad Request',
      errorCode,
    });
  }
}

export class AuthUnauthorizedException extends UnauthorizedException {
  constructor(message: string, public readonly errorCode: string) {
    super({
      statusCode: 401,
      message,
      error: 'Unauthorized',
      errorCode,
    });
  }
}

export class AuthConflictException extends ConflictException {
  constructor(message: string, public readonly errorCode: string) {
    super({
      statusCode: 409,
      message,
      error: 'Conflict',
      errorCode,
    });
  }
}

/**
 * Response DTOs for better Swagger documentation
 */
export class AuthSuccessResponse {
  @ApiProperty({ example: true, description: 'Indicates if the operation was successful' })
  success: boolean;
}

export class LoginResponse extends AuthSuccessResponse {
  @ApiProperty({
    example: 'abc123def456...',
    description: 'Session ID for the authenticated user session'
  })
  session_id: string;

  @ApiProperty({
    example: 'user-uuid-123',
    description: 'Unique identifier of the authenticated user'
  })
  user_id: string;
}

export class RegisterResponse extends AuthSuccessResponse {
  @ApiProperty({
    type: 'object',
    properties: {
      id: { type: 'string', example: 'user-uuid-123' },
      email: { type: 'string', example: 'john.doe@example.com' },
      profile: {
        type: 'object',
        properties: {
          name: { type: 'string', example: 'John Doe' }
        }
      }
    }
  })
  user: {
    id: string;
    email: string;
    name: string;
    profile?: Record<string, any>;
  };
}

export class SessionResponse {
  @ApiProperty({ example: true, description: 'Whether the session is valid' })
  valid: boolean;

  @ApiProperty({
    type: 'object',
    properties: {
      id: { type: 'string', example: 'session-uuid-123' },
      user: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'user-uuid-123' },
          email: { type: 'string', example: 'john.doe@example.com' },
          name: { type: 'string', example: 'John Doe' }
        }
      }
    }
  })
  session: {
    user: {
      id: string;
      email: string;
      name?: string;
    };
    sessionId: string;
  };
}

export class LogoutResponse extends AuthSuccessResponse {
  @ApiProperty({
    example: 'Logged out successfully',
    description: 'Confirmation message for successful logout'
  })
  message: string;
}

export class ErrorResponse {
  @ApiProperty({ example: 400, description: 'HTTP status code' })
  statusCode: number;

  @ApiProperty({ example: 'Bad Request', description: 'Error type' })
  error: string;

  @ApiProperty({
    example: 'AUTH001',
    description: 'Specific error code for the authentication operation'
  })
  errorCode: string;

  @ApiProperty({
    example: 'Invalid email or password provided',
    description: 'Detailed error message'
  })
  message: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly registerUseCase: RegisterUseCase,
  ) {}

  /**
   * Authenticates a user with email and password credentials.
   *
   * This endpoint performs the following operations:
   * 1. Validates the provided email and password against stored user credentials
   * 2. Creates a new session in Redis with user information and roles
   * 3. Sets an HTTP-only session cookie for subsequent authenticated requests
   * 4. Returns session and user identifiers for client-side state management
   *
   * @param loginDto - Contains validated email and password from request body
   * @param res - Express response object for setting cookies
   * @returns LoginResponse with session details and success confirmation
   * @throws AuthUnauthorizedException with AUTH001 error code for invalid credentials
   */
  @Post('login')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Authenticate user credentials',
    description: 'Validates user email/password and establishes authenticated session with secure cookie'
  })
  @ApiBody({
    type: LoginDto,
    description: 'User authentication credentials',
    examples: {
      'demo-user': {
        summary: 'Demo user authentication',
        description: 'Login using demo account credentials',
        value: {
          email: 'demo@example.com',
          password: 'demo123'
        }
      },
      'regular-user': {
        summary: 'Regular user authentication',
        description: 'Login with standard user account',
        value: {
          email: 'user@example.com',
          password: 'password123'
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Authentication successful - session established',
    type: LoginResponse
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication failed due to invalid credentials',
    type: ErrorResponse,
    schema: {
      example: {
        statusCode: 401,
        error: 'Unauthorized',
        errorCode: 'AUTH001',
        message: 'Invalid email or password provided'
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Request validation failed',
    type: ErrorResponse,
    schema: {
      example: {
        statusCode: 400,
        error: 'Bad Request',
        errorCode: 'AUTH002',
        message: 'Email and password are required'
      }
    }
  })
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response): Promise<LoginResponse> {
    try {
      const result = await this.loginUseCase.execute(loginDto.email, loginDto.password);

      // Set secure HTTP-only session cookie
      res.cookie('session_id', result.sessionId, {
        httpOnly: true, // Prevents JavaScript access for security
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        sameSite: 'lax', // CSRF protection while allowing normal navigation
        maxAge: 3600000, // 1 hour expiration
        path: '/', // Available across entire domain
      });
      console.log('++++++++++++++++++++++++++++++++>', JSON.stringify(result, null, 2));

      return {
        success: true,
        session_id: result.sessionId,
        user_id: result.userId,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw new AuthUnauthorizedException('Invalid email or password provided', 'AUTH001');
      }
      throw error;
    }
  }

  /**
   * Creates a new user account with email, password, and optional profile information.
   *
   * This endpoint performs the following operations:
   * 1. Validates the provided email format and password strength
   * 2. Checks for existing users with the same email address
   * 3. Hashes the password using bcrypt for secure storage
   * 4. Creates user profile with provided information (name, etc.)
   * 5. Stores the user in the database with appropriate roles
   * 6. Returns user information (excluding sensitive data like password hash)
   *
   * @param registerDto - Contains validated registration data (email, password, name)
   * @returns RegisterResponse with user details and success confirmation
   * @throws AuthConflictException with AUTH003 error code if user already exists
   * @throws AuthException with AUTH004 error code for validation failures
   */
  @Post('register')
  @ApiOperation({
    summary: 'Create new user account',
    description: 'Registers a new user with email, password, and optional profile information'
  })
  @ApiBody({
    type: RegisterDto,
    description: 'User registration data',
    examples: {
      'complete-registration': {
        summary: 'Complete user registration',
        description: 'Register with full profile information',
        value: {
          email: 'john.doe@example.com',
          password: 'securePassword123',
          name: 'John Doe'
        }
      },
      'minimal-registration': {
        summary: 'Minimal user registration',
        description: 'Register with only required fields',
        value: {
          email: 'jane@example.com',
          password: 'password123',
          name: 'Jane'
        }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'User account created successfully',
    type: RegisterResponse
  })
  @ApiResponse({
    status: 409,
    description: 'User with this email already exists',
    type: ErrorResponse,
    schema: {
      example: {
        statusCode: 409,
        error: 'Conflict',
        errorCode: 'AUTH003',
        message: 'User with this email already exists'
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Request validation failed',
    type: ErrorResponse,
    schema: {
      example: {
        statusCode: 400,
        error: 'Bad Request',
        errorCode: 'AUTH004',
        message: 'Email format is invalid or password too weak'
      }
    }
  })
  async register(@Body() registerDto: RegisterDto): Promise<RegisterResponse> {
    try {
      const user = await this.registerUseCase.execute(registerDto);

      return {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          profile: user.profile,
        },
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw new AuthConflictException('User with this email already exists', 'AUTH003');
      }
      throw error;
    }
  }

  /**
   * Check session endpoint
   */
  @Get('session')
  @ApiCookieAuth('session_id')
  @ApiOperation({
    summary: 'Validate user session',
    description: 'Validates the current user session from the session_id cookie'
  })
  @ApiResponse({
    status: 200,
    description: 'Session is valid',
    schema: {
      type: 'object',
      properties: {
        valid: { type: 'boolean', example: true },
        session: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'session-uuid' },
            user: {
              type: 'object',
              properties: {
                id: { type: 'string', example: 'user-uuid' },
                email: { type: 'string', example: 'john.doe@example.com' },
                name: { type: 'string', example: 'John Doe' }
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or missing session',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'No session found' }
      }
    }
  })
  async getSession(@Req() req: Request) {
    const sessionId = req.cookies?.session_id;

    if (!sessionId) {
      throw new UnauthorizedException('No session found');
    }

    const session = await this.loginUseCase.getSession(sessionId);

    if (!session) {
      throw new UnauthorizedException('Invalid session');
    }

    return {
      valid: true,
      session,
    };
  }

  /**
   * Logout endpoint
   */
  @Post('logout')
  @HttpCode(200)
  @ApiCookieAuth('session_id')
  @ApiOperation({
    summary: 'User logout',
    description: 'Destroys the current user session and clears the session cookie'
  })
  @ApiResponse({
    status: 200,
    description: 'Logout successful',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Logged out successfully' }
      }
    }
  })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const sessionId = req.cookies?.session_id;

    if (sessionId) {
      await this.loginUseCase.destroySession(sessionId);
    }

    res.clearCookie('session_id');

    return {
      success: true,
      message: 'Logged out successfully',
    };
  }

  /**
   * Login page for OAuth2 flow
   */
  @Get('login-page')
  @ApiOperation({
    summary: 'OAuth2 login page',
    description: 'Serves the login page for OAuth2 authorization flow'
  })
  @ApiQuery({ name: 'client_id', required: true, description: 'OAuth2 client identifier' })
  @ApiQuery({ name: 'redirect_uri', required: true, description: 'Redirect URI after authorization' })
  @ApiQuery({ name: 'state', required: false, description: 'OAuth2 state parameter' })
  @ApiQuery({ name: 'scope', required: false, description: 'Requested OAuth2 scopes' })
  @ApiQuery({ name: 'code_challenge', required: false, description: 'PKCE code challenge' })
  @ApiQuery({ name: 'code_challenge_method', required: false, description: 'PKCE code challenge method' })
  @ApiResponse({
    status: 200,
    description: 'Login page HTML',
    content: {
      'text/html': {
        schema: { type: 'string' }
      }
    }
  })
  async loginPage(
    @Query('client_id') clientId: string,
    @Query('redirect_uri') redirectUri: string,
    @Query('state') state: string,
    @Query('scope') scope: string,
    @Query('code_challenge') codeChallenge: string,
    @Query('code_challenge_method') codeChallengeMethod: string,
    @Res() res: Response,
  ) {
    // In production, this would render an HTML login form
    // For now, return a simple HTML page
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Login - E-Commerce OAuth</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .container {
            background: white;
            padding: 2rem;
            border-radius: 10px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            max-width: 400px;
            width: 100%;
          }
          h1 {
            margin-top: 0;
            color: #333;
            text-align: center;
          }
          .form-group {
            margin-bottom: 1rem;
          }
          label {
            display: block;
            margin-bottom: 0.5rem;
            color: #555;
            font-weight: 500;
          }
          input {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-size: 1rem;
            box-sizing: border-box;
          }
          button {
            width: 100%;
            padding: 0.75rem;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 5px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            margin-top: 1rem;
          }
          button:hover {
            background: #5568d3;
          }
          .register-link {
            text-align: center;
            margin-top: 1rem;
            color: #666;
          }
          .register-link a {
            color: #667eea;
            text-decoration: none;
          }
          .error {
            color: red;
            margin-top: 0.5rem;
            display: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🔐 Login</h1>
          <form id="loginForm">
            <div class="form-group">
              <label for="email">Email</label>
              <input type="email" id="email" name="email" required />
            </div>
            <div class="form-group">
              <label for="password">Password</label>
              <input type="password" id="password" name="password" required />
            </div>
            <div class="error" id="error"></div>
            <button type="submit">Login</button>
          </form>
          <div class="register-link">
            Don't have an account? <a href="/auth/register-page">Register</a>
          </div>
        </div>
        <script>
          document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const errorDiv = document.getElementById('error');

            try {
              const response = await fetch('/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
              });

              const data = await response.json();

              if (response.ok) {
                // Redirect to authorization endpoint
                const params = new URLSearchParams({
                  client_id: '${clientId}',
                  redirect_uri: '${redirectUri}',
                  response_type: 'code',
                  scope: '${scope}',
                  state: '${state}',
                  ${codeChallenge ? `code_challenge: '${codeChallenge}',` : ''}
                  ${codeChallengeMethod ? `code_challenge_method: '${codeChallengeMethod}',` : ''}
                });
                window.location.href = '/authorize?' + params.toString();
              } else {
                errorDiv.textContent = data.message || 'Login failed';
                errorDiv.style.display = 'block';
              }
            } catch (error) {
              errorDiv.textContent = 'An error occurred';
              errorDiv.style.display = 'block';
            }
          });
        </script>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }
}
