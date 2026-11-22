import { useState } from "react";
import { Mail, Phone, ShieldCheck, User } from "lucide-react";
import { Link } from "react-router-dom";

function RegisterForm() {
  const [formData, setFormData] = useState({
    full_name: "",
    mobile_number: "",
    email: "",
    ward: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        "http://localhost:5000/api/users/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (response.ok) {
        alert("Registration successful!");

        setFormData({
          full_name: "",
          mobile_number: "",
          email: "",
          ward: "",
        });
      } else {
        alert(data.message || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      alert("Unable to connect to server");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-6xl">
        {/* Logo */}
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

        {/* Registration Card */}
        <div className="mt-8 flex min-h-[650px] items-center justify-center">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              Resident Registration
            </p>

            <h2 className="mt-2 text-3xl font-bold text-slate-900">
              Create your account
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Register to file and track civic complaints.
            </p>

            {/* FORM START */}
            <form onSubmit={handleRegister}>
              {/* Full Name */}
              <div className="mt-7">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Full name
                </label>

                <div className="flex items-center rounded-lg border border-slate-300 bg-white">
                  <User className="ml-3 text-slate-400" size={20} />

                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    required
                    className="w-full rounded-lg px-3 py-3 outline-none"
                  />
                </div>
              </div>

              {/* Mobile Number */}
              <div className="mt-5">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Mobile number
                </label>

                <div className="flex items-center rounded-lg border border-slate-300 bg-white">
                  <Phone className="ml-3 text-slate-400" size={20} />

                  <input
                    type="tel"
                    name="mobile_number"
                    value={formData.mobile_number}
                    onChange={handleChange}
                    placeholder="Enter mobile number"
                    required
                    className="w-full rounded-lg px-3 py-3 outline-none"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="mt-5">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Email address
                </label>

                <div className="flex items-center rounded-lg border border-slate-300 bg-white">
                  <Mail className="ml-3 text-slate-400" size={20} />

                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter email address"
                    required
                    className="w-full rounded-lg px-3 py-3 outline-none"
                  />
                </div>
              </div>

              {/* Ward */}
              <div className="mt-5">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Select ward
                </label>

                <select
                  name="ward"
                  value={formData.ward}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 outline-none"
                >
                  <option value="">Select your ward</option>
                  <option value="Ward 1">Ward 1</option>
                  <option value="Ward 2">Ward 2</option>
                  <option value="Ward 3">Ward 3</option>
                </select>
              </div>

              {/* Register Button */}
              <button
                type="submit"
                className="mt-6 w-full rounded-lg bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Register
              </button>
            </form>
            {/* FORM END */}

            {/* Login */}
            <p className="mt-6 text-center text-sm text-slate-500">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterForm;