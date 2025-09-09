import { getUserIdFromReq } from "@/lib/auth";
import { IMAGEKIT_PRIVATE_KEY, IMAGEKIT_PUBLIC_KEY } from "@/lib/constants";
import { getUploadAuthParams } from "@imagekit/next/server"
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const userId = getUserIdFromReq(req);
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { token, expire, signature } = getUploadAuthParams({
            privateKey: IMAGEKIT_PRIVATE_KEY,
            publicKey: IMAGEKIT_PUBLIC_KEY,
        })

        return NextResponse.json({ token, expire, signature, publicKey: IMAGEKIT_PUBLIC_KEY }, { status: 201 })
    } catch (err: any) {
        console.error("ImageKit error:", err);
        return NextResponse.json({ error: "Internal Server Error in ImageKit" }, { status: 500 });
    }
}