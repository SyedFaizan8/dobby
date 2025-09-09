import { NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import prisma from '@/lib/prisma';
import { setTokenCookie, signToken } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, email, password } = body;
        if (!name || !email || !password) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) return NextResponse.json({ error: 'Email taken' }, { status: 409 });

        const hashed = await hash(password, 10);
        const user = await prisma.user.create({ data: { name, email, password: hashed } });

        const token = signToken({ userId: user.id });
        const res = NextResponse.json({ ok: true, user: { id: user.id, name: user.name, email: user.email } }, { status: 201 });

        setTokenCookie(res, token);
        return res;
    } catch (err: any) {
        console.error("Registration error:", err);
        return NextResponse.json({ error: "Internal Server Error while registering user" }, { status: 500 });
    }
}