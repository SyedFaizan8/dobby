import { NextResponse } from 'next/server';

export async function POST() {
    try {
        const res = NextResponse.json({ ok: true }, { status: 201 });
        res.cookies.set({ name: 'token', value: '', maxAge: 0, path: '/' });
        return res;
    } catch (err: any) {
        console.error("logout error:", err);
        return NextResponse.json({ error: "Internal Server Error while logging out" }, { status: 500 });
    }
}