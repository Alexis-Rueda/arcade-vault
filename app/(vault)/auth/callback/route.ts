import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/client-server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const redirectUrl = `${origin}${next}`;
      const response = NextResponse.redirect(redirectUrl);

      // Copiar cookies de la cookieStore a la redirect response
      const cookieStore = await cookies();
      for (const { name, value } of cookieStore.getAll()) {
        response.cookies.set(name, value, { path: '/' });
      }

      return response;
    }
  }

  return NextResponse.redirect(`${origin}/auth`);
}
