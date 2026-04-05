import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { hashPassword } from '@/auth/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, username, password, role = 'secretariat' } = body;

    // Validation
    if (!firstName || !lastName || !email || !username || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: (users, { eq, or }) => or(
        eq(users.email, email),
        eq(users.username, username)
      ),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email or username already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const newUser = await db.insert(users).values({
      firstName,
      lastName,
      email,
      username,
      passwordHash,
      role: role as any,
      isActive: true,
    }).returning();

    return NextResponse.json(
      {
        success: true,
        message: 'User created successfully',
        user: {
          id: newUser[0]?.id,
          email: newUser[0]?.email,
          username: newUser[0]?.username,
          firstName: newUser[0]?.firstName,
          lastName: newUser[0]?.lastName,
          role: newUser[0]?.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'An error occurred during registration' },
      { status: 500 }
    );
  }
}
