// app/api/dashboard/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromReq } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const userId = await getUserIdFromReq(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const [folders, files, user] = await Promise.all([
            prisma.folder.findMany({ where: { userId } }),
            prisma.file.findMany({ where: { userId } }),
            prisma.user.findUnique({ where: { id: userId } }),
        ]);
        const map = new Map<string, any>();
        folders.forEach((f) => map.set(f.id, { ...f, type: "folder", children: [] }));

        const roots: any[] = [];

        for (const f of folders) {
            const node = map.get(f.id);
            if (f.parentId && map.has(f.parentId)) {
                map.get(f.parentId).children.push(node);
            } else {
                roots.push(node);
            }
        }

        const rootFiles: any[] = [];
        for (const file of files) {
            const fileNode = {
                id: file.id,
                name: file.name,
                type: "image",
                url: file.url,
                imagekitFileId: file.imagekitFileId,
                folderId: file.folderId,
                createdAt: file.createdAt,
            };

            if (file.folderId && map.has(file.folderId)) {
                map.get(file.folderId).children.push(fileNode);
            } else {
                rootFiles.push(fileNode);
            }
        }

        const rootItems = [...roots, ...rootFiles];

        return NextResponse.json({ items: rootItems, name: user?.name ?? null }, { status: 201 });
    } catch (err) {
        console.error("GET /api/dashboard error:", err);
        return NextResponse.json({ error: "Failed to fetch dashboard" }, { status: 500 });
    }
}
