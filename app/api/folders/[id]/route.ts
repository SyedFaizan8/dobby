import { NextResponse } from "next/server";
import prisma from '@/lib/prisma';
import { getUserIdFromReq } from "@/lib/auth";

async function deleteFolderRecursive(folderId: string, userId: string) {
    // 1) find child folders
    const children = await prisma.folder.findMany({ where: { parentId: folderId, userId } });

    // recurse
    for (const child of children) {
        await deleteFolderRecursive(child.id, userId);
    }

    // 2) delete files in this folder
    await prisma.file.deleteMany({ where: { folderId, userId } });

    // 3) delete this folder
    await prisma.folder.delete({ where: { id: folderId } });
}

export async function DELETE(req: Request,
    { params }: { params: { id?: string } | Promise<{ id?: string }> }) {
    try {
        const awaitedParams = (await params) as { id?: string } | undefined;
        const folderId = awaitedParams?.id;
        if (!folderId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

        const userId = await getUserIdFromReq(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const folder = await prisma.folder.findUnique({ where: { id: folderId } });
        if (!folder) return NextResponse.json({ error: "Folder not found" }, { status: 404 });
        if (folder.userId !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await deleteFolderRecursive(folderId, userId);

        return NextResponse.json({ success: true }, { status: 201 });
    } catch (err) {
        console.error("DELETE /api/folders/[id] error:", err);
        return NextResponse.json({ error: "Failed to delete folder" }, { status: 500 });
    }
}
