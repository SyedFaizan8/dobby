import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserIdFromReq } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const userId = getUserIdFromReq(req);
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { fileId, url, name, folderId } = await req.json();
        if (!fileId || !url || !name) {
            return NextResponse.json({ error: "fileId, url and name are required" }, { status: 400 });
        }

        const file = await prisma.file.create({
            data: {
                name,
                imagekitFileId: fileId,
                url,
                userId,
                folderId: folderId || null
            }
        });
        return NextResponse.json({ file }, { status: 201 });
    } catch (err: any) {
        console.error("file creation error:", err);
        return NextResponse.json({ error: "Internal Server Error while creating file in db" }, { status: 500 });
    }
}