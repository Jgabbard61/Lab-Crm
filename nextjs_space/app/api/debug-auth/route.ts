
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();
    
    // Step 1: Check if we can connect to Supabase
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(5);
    
    if (usersError) {
      return NextResponse.json({ 
        success: false, 
        step: 'Supabase connection',
        error: usersError.message 
      });
    }
    
    // Step 2: Try to find user by username (case-insensitive)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email, username, id')
      .ilike('username', username)
      .single();
    
    if (userError) {
      return NextResponse.json({ 
        success: false, 
        step: 'Username lookup',
        error: userError.message,
        allUsers: users?.map(u => ({ username: u.username, email: u.email })) || []
      });
    }
    
    return NextResponse.json({ 
      success: true,
      userData,
      totalUsersInDB: users?.length || 0
    });
    
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
