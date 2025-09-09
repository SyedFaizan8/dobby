export function Card({ children, type, onClick }: { children: React.ReactNode; type: string; onClick?: () => void }) {
    return (
        <div
            onClick={onClick}
            className={` ${type === "folder" ? "cursor-pointer" : ""} bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition flex flex-col items-center text-center min-h-[120px]`}
        >
            {children}
        </div>
    );
}

export function CardContent({ children }: { children: React.ReactNode }) {
    return <div className="flex flex-col items-center gap-2 w-full">{children}</div>;
}