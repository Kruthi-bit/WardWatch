import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mail,
  Phone,
  ShieldCheck,
  User,
} from "lucide-react";

function RegisterForm() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: "",
    mobile_number: "",
    email: "",
    ward: "",
  });

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previousFormData) => ({
      ...previousFormData,
      [name]: value,
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

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

      if (!response.ok) {
        throw new Error(
          data.message || "Registration failed"
        );
      }

      const registeredUser = data.user || {
        full_name: formData.full_name,
        mobile_number: formData.mobile_number,
        email: formData.email,
        ward: formData.ward,
      };

      localStorage.setItem(
        "user",
        JSON.stringify(registeredUser)
      );

      alert("Registration successful!");

      navigate("/", { replace: true });
    } catch (error) {
      console.error("Registration error:", error);

      alert(
        error.message || "Unable to connect to server"
      );
    } finally {
      setIsSubmitting(false);
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
              Register to file and track civic
              complaints.
            </p>

            <form onSubmit={handleRegister}>
              {/* Full Name */}
              <div className="mt-7">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Full name
                </label>

                <div className="flex items-center rounded-lg border border-slate-300 bg-white focus-within:border-indigo-600 focus-within:ring-1 focus-within:ring-indigo-600">
                  <User
                    className="ml-3 text-slate-400"
                    size={20}
                  />

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

                <div className="flex items-center rounded-lg border border-slate-300 bg-white focus-within:border-indigo-600 focus-within:ring-1 focus-within:ring-indigo-600">
                  <Phone
                    className="ml-3 text-slate-400"
                    size={20}
                  />

                  <input
                    type="tel"
                    name="mobile_number"
                    value={formData.mobile_number}
                    onChange={handleChange}
                    placeholder="Enter 10-digit mobile number"
                    pattern="[0-9]{10}"
                    maxLength={10}
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

                <div className="flex items-center rounded-lg border border-slate-300 bg-white focus-within:border-indigo-600 focus-within:ring-1 focus-within:ring-indigo-600">
                  <Mail
                    className="ml-3 text-slate-400"
                    size={20}
                  />

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
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                >
                  <option value="">
                    Select your ward
                  </option>

                  <option value="Jayanagar">
                    Jayanagar
                  </option>

                  <option value="Indiranagar">
                    Indiranagar
                  </option>

                  <option value="Rajajinagar">
                    Rajajinagar
                  </option>

                  <option value="HSR Layout">
                    HSR Layout
                  </option>

                  <option value="BTM Layout">
                    BTM Layout
                  </option>
                </select>
              </div>

              {/* Register Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-6 w-full rounded-lg bg-indigo-600 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-400"
              >
                {isSubmitting
                  ? "Registering..."
                  : "Register"}
              </button>
            </form>

            {/* Login Link */}
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
