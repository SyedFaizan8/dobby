export default function Button({
    children,
    onClick,
    variant = "solid",
    size = "md",
    className = "",
    disabled = false
}: {
    children: React.ReactNode;
    onClick?: () => void;
    variant?: "solid" | "outline" | "ghost";
    size?: "sm" | "md";
    className?: string;
    disabled?: boolean;
}) {
    const base = "cursor-pointer inline-flex items-center justify-center rounded-md font-medium transition";
    const variants: Record<string, string> = {
        solid: "bg-blue-600 text-white hover:bg-blue-700",
        outline: "border border-gray-300 text-gray-700 hover:bg-gray-50",
        ghost: "text-gray-600 hover:text-gray-800",
    };
    const sizes: Record<string, string> = {
        sm: "px-2 py-1 text-sm",
        md: "px-4 py-2 text-sm",
    };
    return (
        <button disabled={disabled} onClick={onClick} className={`${base} ${variants[variant]} ${sizes[size]} ${className} ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}>
            {children}
        </button>
    );
}