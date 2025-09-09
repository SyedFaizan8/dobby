import { NextResponse } from "next/server";
import prisma from '@/lib/prisma';
import { getUserIdFromReq } from "@/lib/auth";
import imagekit from "@/lib/imagekit";


export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

        const userId = await getUserIdFromReq(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const existing = await prisma.file.findUnique({ where: { id }, select: { imagekitFileId: true, userId: true } });
        if (!existing) return NextResponse.json({ error: "File not found" }, { status: 404 });

        if (existing.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        await prisma.file.delete({ where: { id } });

        await imagekit.deleteFile(existing.imagekitFileId);

        return NextResponse.json({ success: true }, { status: 201 });
    } catch (err) {
        console.error("DELETE /api/files/[id] error:", err);
        return NextResponse.json({ error: "Failed to delete file" }, { status: 500 });
    }
}
