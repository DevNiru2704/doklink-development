import { LoginRequest, AuthResponse } from '@/types/auth';
import { validateEmail, validatePassword, findUser, verifyPassword, generateToken } from '@/lib/auth';

export async function POST(request: Request): Promise<Response> {
  try {
    const body: LoginRequest = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      const response: AuthResponse = {
        success: false,
        message: 'Email and password are required'
      };
      return Response.json(response, { status: 400 });
    }

    if (!validateEmail(email)) {
      const response: AuthResponse = {
        success: false,
        message: 'Invalid email format'
      };
      return Response.json(response, { status: 400 });
    }

    // Find user
    const user = findUser(email);
    if (!user) {
      const response: AuthResponse = {
        success: false,
        message: 'Invalid email or password'
      };
      return Response.json(response, { status: 401 });
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      const response: AuthResponse = {
        success: false,
        message: 'Invalid email or password'
      };
      return Response.json(response, { status: 401 });
    }

    // Generate token
    const token = generateToken(user.id);

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user;
    const response: AuthResponse = {
      success: true,
      user: userWithoutPassword,
      token
    };

    return Response.json(response);
  } catch (error) {
    console.error('Login error:', error);
    const response: AuthResponse = {
      success: false,
      message: 'Internal server error'
    };
    return Response.json(response, { status: 500 });
  }
}