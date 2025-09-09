import { NextResponse } from 'next/server';
import { compare } from 'bcryptjs';
import prisma from '@/lib/prisma';
import { signToken, setTokenCookie } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json();
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return NextResponse.json({ error: 'Invalid' }, { status: 401 });

        const ok = await compare(password, user.password);
        if (!ok) return NextResponse.json({ error: 'Invalid' }, { status: 401 });

        const token = signToken({ userId: user.id });
        const res = NextResponse.json({ ok: true, user: { id: user.id, name: user.name, email: user.email } }, { status: 201 });
        setTokenCookie(res, token);
        return res;

    } catch (err: any) {
        console.error("Login error:", err);
        return NextResponse.json({ error: "Internal Server Error while logging user" }, { status: 500 });
    }
}