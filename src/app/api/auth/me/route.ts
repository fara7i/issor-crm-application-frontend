import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { handleApiError, unauthorized } from '@/lib/api-error';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);

    if (!user) {
      return unauthorized('Not authenticated');
    }

    return NextResponse.json({
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
