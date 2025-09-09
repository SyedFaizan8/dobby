"use client";
import axios from "axios";
import { useState } from "react";
import { useRouter } from 'next/navigation'
import { Eye, EyeClosed } from "lucide-react";

type RegisterForm = {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
};

export default function Register() {
    const [form, setForm] = useState<RegisterForm>({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const [errors, setErrors] = useState<Partial<RegisterForm>>({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const router = useRouter();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const validate = (): boolean => {
        const newErrors: Partial<RegisterForm> = {};

        if (!form.username.trim()) newErrors.username = "Username is required";
        if (!form.email.trim()) {
            newErrors.email = "Email is required";
        } else if (!/\S+@\S+\.\S+/.test(form.email)) {
            newErrors.email = "Email is invalid";
        }
        if (!form.password) {
            newErrors.password = "Password is required";
        } else if (form.password.length < 6) {
            newErrors.password = "Password must be at least 6 characters";
        }
        if (!form.confirmPassword) {
            newErrors.confirmPassword = "Confirm your password";
        } else if (form.confirmPassword !== form.password) {
            newErrors.confirmPassword = "Passwords do not match";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        console.log("Form submitted:", form);

        const { username: name, email, password } = form;
        const response = await axios.post("/api/register", { name, email, password });

        if (response.status !== 201) alert("something went wrong while registering a user");
        else router.push('/');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-200">
            <div className="w-full max-w-md bg-gray-900 rounded-2xl shadow-lg p-8">
                <h1 className="text-2xl font-bold text-center mb-6">Create Account</h1>
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Username */}
                    <div>
                        <label className="block mb-1 text-sm font-medium">Name</label>
                        <input
                            type="text"
                            name="username"
                            value={form.username}
                            onChange={handleChange}
                            placeholder="Enter your Name"
                            className={`w-full px-4 py-2 rounded-lg bg-gray-800 border ${errors.username ? "border-red-500" : "border-gray-700"
                                } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                        />
                        {errors.username && (
                            <p className="text-red-500 text-sm mt-1">{errors.username}</p>
                        )}
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block mb-1 text-sm font-medium">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="Enter your email"
                            className={`w-full px-4 py-2 rounded-lg bg-gray-800 border ${errors.email ? "border-red-500" : "border-gray-700"
                                } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                        />
                        {errors.email && (
                            <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                        )}
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block mb-1 text-sm font-medium">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                placeholder="Enter your password"
                                className={`w-full px-4 py-2 rounded-lg bg-gray-800 border ${errors.password ? "border-red-500" : "border-gray-700"
                                    } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((prev) => !prev)}
                                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-200"
                            >
                                {showPassword ? <Eye /> : <EyeClosed />}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label className="block mb-1 text-sm font-medium">
                            Confirm Password
                        </label>
                        <div className="relative">
                            <input
                                type={showConfirm ? "text" : "password"}
                                name="confirmPassword"
                                value={form.confirmPassword}
                                onChange={handleChange}
                                placeholder="Re-enter your password"
                                className={`w-full px-4 py-2 rounded-lg bg-gray-800 border ${errors.confirmPassword ? "border-red-500" : "border-gray-700"
                                    } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirm((prev) => !prev)}
                                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-200"
                            >
                                {showConfirm ? <Eye /> : <EyeClosed />}
                            </button>
                        </div>
                        {errors.confirmPassword && (
                            <p className="text-red-500 text-sm mt-1">
                                {errors.confirmPassword}
                            </p>
                        )}
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 transition font-medium"
                    >
                        Register
                    </button>
                </form>

                <p className="text-sm text-center text-gray-400 mt-6">
                    Already have an account?{" "}
                    <a href="/login" className="text-indigo-500 hover:underline">
                        Login
                    </a>
                </p>
            </div>
        </div>
    );
}
