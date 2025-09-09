import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserIdFromReq } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const userId = getUserIdFromReq(req);
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { name, parentId } = await req.json();
        if (!name || typeof name !== "string") {
            return NextResponse.json({ error: "Folder name is required" }, { status: 400 });
        }

        let path: string | undefined = undefined;
        if (parentId) {
            const parent = await prisma.folder.findUnique({ where: { id: parentId } });
            if (!parent) {
                return NextResponse.json({ error: "Parent folder not found" }, { status: 404 });
            }
            path = parent.path ? `${parent.path}/${name}` : `/${parent.name}/${name}`;
        } else {
            path = `/${name}`;
        }

        const folder = await prisma.folder.create({
            data: {
                name,
                userId,
                parentId: parentId || null,
                path,
            },
        });

        return NextResponse.json({ ...folder }, { status: 201 });

    } catch (err: any) {
        console.error("folder error:", err);
        return NextResponse.json({ error: "Internal Server Error while creating folder" }, { status: 500 });
    }
}