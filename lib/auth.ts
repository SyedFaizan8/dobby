import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';


const JWT_SECRET = process.env.JWT_SECRET!;


export function signToken(payload: object) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}


export function verifyToken(token: string) {
    try {
        return jwt.verify(token, JWT_SECRET) as any;
    } catch (e) {
        return null;
    }
}


export function getUserIdFromReq(req: Request) {
    const cookie = req.headers.get('cookie') || '';
    const match = cookie.match(/token=([^;]+)/);
    if (!match) return null;
    const payload = verifyToken(match[1]);
    return payload?.userId ?? null;
}


export function setTokenCookie(res: NextResponse, token: string) {
    res.cookies.set({ name: 'token', value: token, httpOnly: true, path: '/', sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
}