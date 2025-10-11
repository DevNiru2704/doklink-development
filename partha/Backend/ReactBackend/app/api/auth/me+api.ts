import { AuthResponse } from '@/types/auth';
import { verifyToken, findUserById } from '@/lib/auth';

export async function GET(request: Request): Promise<Response> {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const response: AuthResponse = {
        success: false,
        message: 'No token provided'
      };
      return Response.json(response, { status: 401 });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const payload = verifyToken(token);
    
    if (!payload) {
      const response: AuthResponse = {
        success: false,
        message: 'Invalid token'
      };
      return Response.json(response, { status: 401 });
    }

    const user = findUserById(payload.userId);
    if (!user) {
      const response: AuthResponse = {
        success: false,
        message: 'User not found'
      };
      return Response.json(response, { status: 404 });
    }

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user;
    const response: AuthResponse = {
      success: true,
      user: userWithoutPassword
    };

    return Response.json(response);
  } catch (error) {
    console.error('Me endpoint error:', error);
    const response: AuthResponse = {
      success: false,
      message: 'Internal server error'
    };
    return Response.json(response, { status: 500 });
  }
}
