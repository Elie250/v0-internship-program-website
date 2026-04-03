import { supabaseAdmin } from '@/lib/supabase';
import bcrypt from 'bcrypt';

export async function POST(req: Request) {
  const body = await req.json();
  const { firstName, lastName, email, password, ...otherFields } = body;

  if (!firstName || !lastName || !email || !password) {
    return new Response(JSON.stringify({ message: 'Missing required fields' }), { status: 400 });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  const { data, error } = await supabaseAdmin
    .from('applications')
    .insert([{
      first_name: firstName,
      last_name: lastName,
      full_name: `${firstName} ${lastName}`,
      email,
      password: hashedPassword,
      status: 'Pending',  // default status
      ...otherFields
    }]);

  if (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: 'Failed to save registration' }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true, message: 'Registration saved successfully' }), { status: 200 });
}