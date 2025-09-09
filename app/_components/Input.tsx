export default function Input({
    value,
    onChange,
    placeholder,
    className = "",
    type = "text",
}: {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    className?: string;
    type?: string;
}) {
    return (
        <input
            type={type}
            className={`w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${className}`}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
        />
    );
}