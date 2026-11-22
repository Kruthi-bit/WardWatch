import { useState } from "react";
import { Lock, Phone, ShieldCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

function LoginForm() {
    const [mobileNumber, setMobileNumber] = useState("");
    const navigate = useNavigate();

    const handleLogin = async () => {
        if (!mobileNumber.trim()) {
            alert("Please enter your mobile number");
            return;
        }

        try {
            const response = await fetch(
                "http://localhost:5000/api/users/login",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        mobile_number: mobileNumber.trim(),
                    }),
                }
            );

            const data = await response.json();

            if (response.ok) {
                alert("Login successful");

                localStorage.setItem(
                    "user",
                    JSON.stringify(data.user)
                );

                navigate("/");
            } else {
                alert(data.message || "Login failed");
            }
        } catch (error) {
            console.error("Login error:", error);
            alert("Unable to connect to server");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 px-6 py-8">
            <div className="mx-auto max-w-6xl">

                {/* WardWatch logo */}
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white">
                        <ShieldCheck size={22} />
                    </div>

                    <div>
                        <h1 className="text-lg font-bold text-slate-900">
                            WardWatch
                        </h1>

                        <p className="text-xs text-slate-500">
                            Civic Complaint and Resolution Portal
                        </p>
                    </div>
                </div>

                {/* Login card */}
                <div className="flex min-h-[600px] items-center justify-center">
                    <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">

                        <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                            Resident Login
                        </p>

                        <h2 className="mt-2 text-3xl font-bold text-slate-900">
                            Welcome back
                        </h2>

                        <p className="mt-2 text-sm text-slate-500">
                            Sign in using your mobile number to track your complaints.
                        </p>

                        {/* Mobile number */}
                        <div className="mt-7">
                            <label
                                htmlFor="mobile"
                                className="mb-2 block text-sm font-medium text-slate-700"
                            >
                                Mobile number
                            </label>

                            <div className="flex items-center rounded-lg border border-slate-300 px-3 focus-within:border-indigo-600">
                                <Phone
                                    size={18}
                                    className="text-slate-400"
                                />

                                <input
                                    id="mobile"
                                    type="tel"
                                    placeholder="Enter your mobile number"
                                    value={mobileNumber}
                                    onChange={(e) =>
                                        setMobileNumber(e.target.value)
                                    }
                                    className="w-full px-3 py-3 text-sm text-slate-800 outline-none"
                                />
                            </div>
                        </div>

                        {/* Login button */}
                        <button
                            type="button"
                            onClick={handleLogin}
                            className="mt-5 w-full rounded-lg bg-indigo-600 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
                        >
                            Login
                        </button>

                        {/* Divider */}
                        <div className="my-6 flex items-center gap-3">
                            <div className="h-px flex-1 bg-slate-200"></div>

                            <span className="text-xs text-slate-400">
                                OR
                            </span>

                            <div className="h-px flex-1 bg-slate-200"></div>
                        </div>

                        {/* Guest button */}
                        <button
                            type="button"
                            onClick={() => navigate("/complaint")}
                            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                            <Lock size={17} />
                            Continue as guest
                        </button>

                        <p className="mt-6 text-center text-sm text-slate-500">
                            Don&apos;t have an account?{" "}
                            <Link
                                to="/register"
                                className="font-semibold text-indigo-600 hover:text-indigo-700"
                            >
                                Register
                            </Link>
                        </p>

                    </div>
                </div>
            </div>
        </div>
    );
}

export default LoginForm;