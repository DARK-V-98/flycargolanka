// This API route is intentionally left blank and is not used.
// The NIC upload functionality has been moved to the client-side
// in /src/app/book/verify-nic/page.tsx to resolve Vercel build issues.

import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  return NextResponse.json({ error: 'This API route is not in use.' }, { status: 404 });
}
