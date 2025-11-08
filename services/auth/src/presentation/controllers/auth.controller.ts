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
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { LoginDto } from '../../application/dto/login.dto';
import { RegisterDto } from '../../application/dto/register.dto';
import { LoginUseCase } from '../../application/use-cases/login.usecase';
import { RegisterUseCase } from '../../application/use-cases/register.usecase';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly registerUseCase: RegisterUseCase,
  ) {}

  /**
   * User login endpoint
   */
  @Post('login')
  @HttpCode(200)
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.loginUseCase.execute(loginDto.email, loginDto.password);

    // Set session cookie
    res.cookie('session_id', result.sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600000, // 1 hour
    });

    return {
      success: true,
      session_id: result.sessionId,
      user_id: result.userId,
    };
  }

  /**
   * User registration endpoint
   */
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    const user = await this.registerUseCase.execute(registerDto);

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        profile: user.profile,
      },
    };
  }

  /**
   * Check session endpoint
   */
  @Get('session')
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

