import { RegisterRequest, AuthResponse } from '@/types/auth';
import { validateEmail, validatePassword, createUser, generateToken } from '@/lib/auth';

export async function POST(request: Request): Promise<Response> {
  try {
    const body: RegisterRequest = await request.json();
    const { name, email, password } = body;

    // Validate input
    if (!name || !email || !password) {
      const response: AuthResponse = {
        success: false,
        message: 'Name, email, and password are required'
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

    if (!validatePassword(password)) {
      const response: AuthResponse = {
        success: false,
        message: 'Password must be at least 6 characters long'
      };
      return Response.json(response, { status: 400 });
    }

    // Create user
    try {
      const user = await createUser(name, email, password);
      
      // Generate token
      const token = generateToken(user.id);

      // Return user data (without password)
      const { password: _, ...userWithoutPassword } = user;
      const response: AuthResponse = {
        success: true,
        user: userWithoutPassword,
        token
      };

      return Response.json(response, { status: 201 });
    } catch (error) {
      if (error instanceof Error && error.message === 'User already exists') {
        const response: AuthResponse = {
          success: false,
          message: 'User already exists with this email'
        };
        return Response.json(response, { status: 409 });
      }
      throw error;
    }
  } catch (error) {
    console.error('Registration error:', error);
    const response: AuthResponse = {
      success: false,
      message: 'Internal server error'
    };
    return Response.json(response, { status: 500 });
  }
}
