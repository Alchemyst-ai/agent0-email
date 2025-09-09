import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from './auth';

export function withAuth(handler: (request: NextRequest, user: unknown) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    try {
      const user = await AuthService.getCurrentUser(request);
      
      if (!user) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      return await handler(request, user);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }
  };
}

export function withOptionalAuth(handler: (request: NextRequest, user: unknown) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    try {
      const user = await AuthService.getCurrentUser(request);
      return await handler(request, user);
    } catch (error) {
      console.error('Optional auth middleware error:', error);
      return await handler(request, null);
    }
  };
}
