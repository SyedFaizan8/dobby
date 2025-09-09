"use client";

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import {
    Search,
    LogOut,
    Folder as FolderIcon,
    Trash,
    Plus,
    Upload as UploadIcon,
    Menu,
    X,
} from "lucide-react";
import {
    upload,
    ImageKitAbortError,
    ImageKitInvalidRequestError,
    ImageKitServerError,
    ImageKitUploadNetworkError,
} from "@imagekit/next";
import { useRouter } from "next/navigation";
import Button from "../_components/Button";
import Input from "../_components/Input";
import { Card, CardContent } from "../_components/Card";
import Image from "next/image";
import Link from "next/link";

/* ---------- Types ---------- */

type FileNode = {
    id: string;
    name: string;
    type: "image";
    url: string;
    imagekitFileId?: string;
    folderId?: string | null;
    createdAt?: string;
};

type FolderNode = {
    id: string;
    name: string;
    type: "folder";
    children: Array<FileNode | FolderNode>;
};

/* ---------- Axios default config ---------- */
axios.defaults.withCredentials = true;

/* ---------- Dashboard component ---------- */
export default function Dashboard() {
    const [items, setItems] = useState<Array<FolderNode | FileNode>>([]);
    // currentPath stores folder objects (refs will be rebuilt after fetch)
    const [currentPath, setCurrentPath] = useState<FolderNode[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState("");

    // UI state
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [createFolderOpen, setCreateFolderOpen] = useState(false);
    const [uploadOpen, setUploadOpen] = useState(false);
    const [creatingName, setCreatingName] = useState("");
    const [uploadName, setUploadName] = useState("");
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const router = useRouter();

    // Current view items (either root or contents of last folder in path)
    const currentItems =
        currentPath.length > 0 ? currentPath[currentPath.length - 1].children : items;

    // Filtered by search
    const filteredItems = currentItems.filter((it) =>
        it.name.toLowerCase().includes(search.toLowerCase())
    );

    const normalizedUploadName = uploadName.trim().toLowerCase();
    const isDuplicate = !!currentItems.find(
        (it) => it.name.trim().toLowerCase() === normalizedUploadName && normalizedUploadName !== ""
    );


    // ---------------- Helper functions (tree utils) ----------------

    // find a node (folder or file) in the items tree by id
    function findNodeById(
        nodes: Array<FolderNode | FileNode>,
        id: string
    ): FolderNode | FileNode | undefined {
        for (const n of nodes) {
            if (n.id === id) return n;
            if (n.type === "folder") {
                const found = findNodeById(n.children, id);
                if (found) return found;
            }
        }
        return undefined;
    }

    // find folder node only (ensures type === 'folder')
    function findFolderById(
        nodes: Array<FolderNode | FileNode>,
        id: string
    ): FolderNode | undefined {
        const node = findNodeById(nodes, id);
        return node && (node as any).type === "folder" ? (node as FolderNode) : undefined;
    }

    // Rebuild currentPath from saved ids and NEW items tree
    function rebuildCurrentPathFromIds(
        nodes: Array<FolderNode | FileNode>,
        ids: string[]
    ): FolderNode[] {
        const path: FolderNode[] = [];
        let levelItems = nodes;
        for (const id of ids) {
            const folder = findFolderById(levelItems, id);
            if (!folder) break; // stop if folder no longer exists
            path.push(folder);
            levelItems = folder.children;
        }
        return path;
    }

    // ---------------- Fetch functions ----------------
    async function fetchDashboardAndKeepPath() {
        // capture currentPath ids (so we can rebuild the new path after fetch)
        const pathIds = currentPath.map((p) => p.id);
        try {
            setLoading(true);
            const res = await axios.get("/api/dashboard");
            if (res?.data?.name) setName(res.data.name);
            const newItems = res?.data?.items || [];
            setItems(newItems);

            // rebuild currentPath from ids using fresh newItems
            if (pathIds.length > 0) {
                const rebuilt = rebuildCurrentPathFromIds(newItems, pathIds);
                setCurrentPath(rebuilt);
            } else {
                setCurrentPath([]);
            }
        } catch (err) {
            console.error("Failed to fetch dashboard:", err);
            // keep old state if fetch fails
        } finally {
            setLoading(false);
        }
    }

    // initial load
    useEffect(() => {
        fetchDashboardAndKeepPath();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ---------------- Navigation helpers ----------------

    // when opening a folder, find the fresh folder object from current items
    function openFolder(folder: FolderNode) {
        // folder may be stale object passed from UI; find the up-to-date object by id
        const fresh = findFolderById(items, folder.id);
        if (fresh) {
            setCurrentPath((p) => [...p, fresh]);
        } else {
            // as fallback, re-fetch and then open (ensures sync)
            (async () => {
                await fetchDashboardAndKeepPath();
                const f = findFolderById(items, folder.id);
                if (f) setCurrentPath((p) => [...p, f]);
            })();
        }
    }

    function goBack() {
        setCurrentPath((p) => p.slice(0, -1));
    }

    // ---------------- Mutations ----------------

    // Create folder -> refetch and rebuild path
    async function handleCreateFolder() {
        const name = creatingName.trim();
        if (!name) return;
        try {
            const parentId =
                currentPath.length > 0 ? currentPath[currentPath.length - 1].id : undefined;
            await axios.post("/api/folders", { name, parentId });
            setCreatingName("");
            setCreateFolderOpen(false);
            await fetchDashboardAndKeepPath(); // <-- keep path synced
        } catch (err) {
            console.error("Create folder failed", err);
        }
    }

    // Upload flow -> ImageKit upload + save metadata -> refetch + rebuild path
    async function handleUpload() {
        if (!uploadName.trim()) return alert("Please provide a name for the image.");
        if (currentItems.find((it) => it.name.trim().toLowerCase() === uploadName.trim().toLowerCase())) {
            return alert("An item with this name already exists in this folder.");
        }
        const input = fileInputRef.current;
        if (!input || !input.files || input.files.length === 0)
            return alert("Select a file to upload.");

        const file = input.files[0];

        // get auth params
        let auth;
        try {
            const res = await fetch("/api/imagekit-auth");
            if (!res.ok) throw new Error("ImageKit auth failed");
            auth = await res.json();
        } catch (err) {
            console.error("Auth error", err);
            return;
        }

        setUploadProgress(0);

        try {
            const response = await upload({
                expire: auth.expire,
                token: auth.token,
                signature: auth.signature,
                publicKey: auth.publicKey,
                file,
                fileName: file.name,
                folder: "/dobby_images",
                onProgress: (evt) => {
                    setUploadProgress((evt.loaded / (evt.total || 1)) * 100);
                },
            });

            const { fileId, url } = response;
            const folderId =
                currentPath.length > 0 ? currentPath[currentPath.length - 1].id : null;

            await axios.post("/api/files", {
                fileId,
                url,
                name: uploadName.trim(),
                folderId,
            });

            setUploadName("");
            if (fileInputRef.current) fileInputRef.current.value = "";
            setUploadOpen(false);
            setUploadProgress(0);

            // refetch and rebuild path so nested view updates instantly
            await fetchDashboardAndKeepPath();
        } catch (err: any) {
            if (err instanceof ImageKitAbortError) console.error("Upload aborted", err);
            else if (err instanceof ImageKitInvalidRequestError)
                console.error("Invalid request", err.message);
            else if (err instanceof ImageKitUploadNetworkError)
                console.error("Network", err.message);
            else if (err instanceof ImageKitServerError) console.error("Server", err.message);
            else console.error("Upload error", err);
            setUploadProgress(0);
        }
    }

    // Delete file -> refetch & rebuild
    async function handleDeleteFile(id: string) {
        if (!confirm("Delete this file? This cannot be undone.")) return;
        try {
            await axios.delete(`/api/files/${id}`);
            // refetch to sync tree and path
            await fetchDashboardAndKeepPath();
        } catch (err) {
            console.error("Delete file failed", err);
        }
    }

    // Delete folder -> refetch & rebuild (reset current path if needed)
    async function handleDeleteFolder(id: string) {
        if (!confirm("Delete this folder and all its contents? This cannot be undone.")) return;
        try {
            await axios.delete(`/api/folders/${id}`);
            // If the deleted folder is in currentPath, go back to root (or rebuild)
            const pathIds = currentPath.map((p) => p.id);
            if (pathIds.includes(id)) {
                setCurrentPath([]);
            }
            await fetchDashboardAndKeepPath();
        } catch (err) {
            console.error("Delete folder failed", err);
        }
    }

    // logout
    const logout = async () => {
        try {
            // your logout endpoint
            await axios.post("/api/logout");
            router.push("/login");
        } catch (e) {
            console.error("LOGGING OUT ERROR:", e);
            alert("something went wrong while logging out");
        }
    };

    // Utility: render item tile (unchanged)
    function renderTile(item: FolderNode | FileNode) {
        if (item.type === "folder") {
            return (
                <Card key={item.id} type={item.type} onClick={() => openFolder(item)}>
                    <CardContent>
                        <div className="text-black flex items-center justify-center w-12 h-12 rounded-md bg-gray-100">
                            <FolderIcon className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div className="w-full">
                            <div className="text-sm font-medium truncate">{item.name}</div>
                            <div className="flex items-center justify-between mt-2">
                                <button
                                    className="cursor-pointer text-xs text-red-500 hover:text-red-700"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteFolder(item.id);
                                    }}
                                >
                                    <Trash className="inline w-3 h-3 mr-1" /> Delete
                                </button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            );
        } else {
            return (
                <Card key={item.id} type={item.type}>
                    <CardContent>
                        <div className="text-black  flex items-center justify-center w-12 h-12 rounded-md bg-gray-100">
                            <Image src={item.url} alt="image" width={400} height={400} />
                        </div>
                        <div className="w-full">
                            <div className="text-sm font-medium truncate">{item.name}</div>
                            <div className="flex items-center justify-between mt-2">
                                <button
                                    className="cursor-pointer text-xs text-red-500 hover:text-red-700"
                                    onClick={() => handleDeleteFile(item.id)}
                                >
                                    <Trash className="inline w-3 h-3 mr-1" /> Delete
                                </button>
                                <Link
                                    href={item.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs text-gray-500 hover:underline"
                                >
                                    View
                                </Link>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            );
        }
    }

    // ---------------- Render ----------------
    return (
        <div className="text-black  h-screen flex flex-col bg-gray-50">
            {/* NAVBAR */}
            <header className="w-full border-b bg-white shadow-sm">
                <div className="mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="h-14 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button
                                className="md:hidden inline-flex items-center justify-center p-2 rounded-md hover:bg-gray-100"
                                onClick={() => setMobileMenuOpen((s) => !s)}
                                aria-label="menu"
                            >
                                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </button>

                            <div className="text-blue-600 font-semibold text-lg select-none">DOBBY Storage</div>
                        </div>

                        {/* center search (hidden on very small screens) */}
                        <div className="hidden sm:flex sm:flex-1 sm:justify-center px-4">
                            <div className="w-full max-w-xl flex items-center gap-2">
                                <Search className="w-6 h-6 text-gray-500" />
                                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search images or folders..." />
                            </div>
                        </div>

                        {/* right controls */}
                        <div className="flex items-center gap-3">
                            <div className="hidden sm:flex items-center gap-3">
                                <span className="text-sm font-medium text-gray-700">{name}</span>
                                <Button variant="outline" size="sm" onClick={logout}>
                                    <LogOut className="w-4 h-4 mr-2" /> Logout
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* mobile menu content */}
                    {mobileMenuOpen && (
                        <div className="md:hidden py-2">
                            <div className="space-y-2">
                                <div className="px-2">
                                    <div className="flex items-center gap-2">
                                        <Search className="w-6 h-6 text-gray-500" />
                                        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." />
                                    </div>
                                </div>
                                <div className="px-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">{name}</span>
                                        <Button variant="ghost" size="sm" onClick={() => alert("logout")}>
                                            <LogOut className="w-4 h-4 mr-2" /> Logout
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            {/* MAIN */}
            <main className="flex-1 overflow-hidden">
                <div className="h-full flex flex-col px-4 sm:px-6 lg:px-8 py-4">
                    {/* path & actions */}
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            {currentPath.length > 0 && (
                                <button onClick={goBack} className="text-sm text-gray-600 hover:underline">
                                    ← Back
                                </button>
                            )}
                            <div className="text-sm text-gray-600 truncate">/{currentPath.map((p) => p.name).join("/") || "Home"}</div>
                        </div>

                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => setCreateFolderOpen(true)}>
                                <Plus className="w-4 h-4 mr-2" /> Create Folder
                            </Button>
                            <Button variant="solid" size="sm" onClick={() => setUploadOpen(true)}>
                                <UploadIcon className="w-4 h-4 mr-2" /> Upload Image
                            </Button>
                        </div>
                    </div>

                    {/* grid */}
                    <div className="flex-1 overflow-auto">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {loading && <div className="col-span-full text-center py-12">Loading...</div>}

                            {!loading && filteredItems.length === 0 && (
                                <div className="col-span-full text-center text-gray-500 py-12">No items found</div>
                            )}

                            {!loading &&
                                filteredItems.map((item) => {
                                    return renderTile(item as any);
                                })}
                        </div>
                    </div>
                </div>
            </main>

            {/* Create Folder Modal */}
            {createFolderOpen && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-semibold">Create Folder</h3>
                            <button onClick={() => setCreateFolderOpen(false)} className="p-1 rounded hover:bg-gray-100">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-3">
                            <Input value={creatingName} onChange={(e) => setCreatingName(e.target.value)} placeholder="Folder name" />
                            <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="sm" onClick={() => setCreateFolderOpen(false)}>
                                    Cancel
                                </Button>
                                <Button variant="solid" size="sm" onClick={handleCreateFolder}>
                                    Create
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Upload Modal */}
            {uploadOpen && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4">
                    <div className="bg-white rounded-lg max-w-md w-full p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-semibold">Upload Image</h3>
                            <button onClick={() => setUploadOpen(false)} className="cursor-pointer p-1 rounded hover:bg-gray-100">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700">Image name (required)</label>
                            <Input value={uploadName} onChange={(e) => setUploadName(e.target.value)} placeholder="e.g. bach-2025" />

                            {isDuplicate && (
                                <p className="text-sm text-red-600 mt-1">An item with this name already exists in this folder.</p>
                            )}

                            <input ref={fileInputRef} type="file" accept="image/*" className="w-full" />
                            {uploadProgress > 0 && (
                                <div className="w-full bg-gray-100 rounded overflow-hidden">
                                    <div style={{ width: `${uploadProgress}%` }} className="h-2 bg-blue-600 transition-all" />
                                </div>
                            )}
                            <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="sm" onClick={() => setUploadOpen(false)}>
                                    Cancel
                                </Button>

                                {/* disable if duplicate OR currently uploading */}
                                <Button
                                    variant="solid"
                                    size="sm"
                                    onClick={handleUpload}
                                    disabled={isDuplicate || uploadProgress > 0}
                                >
                                    <UploadIcon className="w-4 h-4 mr-2" /> Upload
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
