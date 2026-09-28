import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { findUserByEmail, updateUserProfile } from '@/lib/db-users';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email || req.nextUrl.searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        dob: user.dob,
        occupation: user.occupation,
        plan: user.plan,
        generationsLimit: user.generationsLimit,
        generationsUsed: user.generationsUsed,
        provider: user.provider,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const email = session?.user?.email || body.email;

    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, dob, occupation, plan } = body;

    const updated = await updateUserProfile(email, {
      name,
      dob,
      occupation,
      plan,
    });

    if (!updated) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Profile updated successfully in MongoDB database',
      user: {
        id: updated._id,
        name: updated.name,
        email: updated.email,
        dob: updated.dob,
        occupation: updated.occupation,
        plan: updated.plan,
        generationsLimit: updated.generationsLimit,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
