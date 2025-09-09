import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import * as jose from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function middleware(req: NextRequest) {
    const token = req.cookies.get("token")?.value;
    const { pathname } = req.nextUrl;

    // Function to verify token
    async function verifyJWT(token: string) {
        try {
            await jose.jwtVerify(token, secret);
            return true;
        } catch (err) {
            return false;
        }
    }

    const isAuthRoute = pathname === "/login" || pathname === "/register" || pathname === "/";
    const isDashboardRoute = pathname.startsWith("/dashboard");

    if (token && isAuthRoute) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    if (!token && (isDashboardRoute || pathname === "/")) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    if (token && (isDashboardRoute || pathname === "/")) {
        const valid = await verifyJWT(token);
        if (!valid) {
            const response = NextResponse.redirect(new URL("/login", req.url));
            response.cookies.delete("token");
            return response;
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/", "/login", "/register", "/dashboard/:path*"],
};
