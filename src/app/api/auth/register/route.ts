import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail, createUser } from '@/lib/db-users';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, dob, occupation } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    const newUser = await createUser({
      name: name || 'Athlete User',
      email,
      password,
      dob: dob || '',
      occupation: occupation || '',
      provider: 'credentials',
    });

    return NextResponse.json(
      {
        message: 'Account created successfully',
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          dob: newUser.dob,
          occupation: newUser.occupation,
          plan: newUser.plan,
          generationsLimit: newUser.generationsLimit,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create account' },
      { status: 500 }
    );
  }
}
