import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, username } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Sign up with Supabase Auth
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username || email.split('@')[0],
        },
      },
    });

    if (signUpError) {
      return NextResponse.json(
        { error: signUpError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Create user record in users table
    const { error: insertError } = await supabase.from('users').insert({
      id: authData.user.id,
      email,
      username: username || email.split('@')[0],
      role: 'user',
    });

    if (insertError) {
      // ✅ HIPAA FIX: Don't log PHI
      // Don't fail the signup if the user record creation fails
      // The auth user was created successfully
    }

    return NextResponse.json(
      {
        success: true,
        user: authData.user,
        session: authData.session,
      },
      { status: 201 }
    );
  } catch (error: any) {
    // ✅ HIPAA FIX: Don't log PHI
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
      );
  }
}
