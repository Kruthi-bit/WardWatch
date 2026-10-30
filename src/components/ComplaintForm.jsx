import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
    ArrowRight,
    Building2,
    Camera,
    CheckCircle2,
    FileText,
    Mail,
    MapPin,
    Phone,
    Sparkles,
    User,
} from "lucide-react";
import { addComplaint } from "../services/complaintService";
import LocationPickerMap from "./LocationPickerMap";

function ComplaintForm() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const initialCategory = searchParams.get("category") || "";

    const [fullName, setFullName] = useState("");
    const [fullNameError, setFullNameError] = useState("");

    const [mobileNumber, setMobileNumber] = useState("");
    const [mobileNumberError, setMobileNumberError] = useState("");

    const [email, setEmail] = useState("");
    const [emailError, setEmailError] = useState("");

    const [ward, setWard] = useState("");
    const [wardError, setWardError] = useState("");

    const [category, setCategory] = useState(initialCategory);
    const [categoryError, setCategoryError] = useState("");

    const [location, setLocation] = useState("");
    const [locationError, setLocationError] = useState("");

    const [coords, setCoords] = useState({
        lat: 12.9784,
        lng: 77.6408,
    });

    const [description, setDescription] = useState("");
    const [descriptionError, setDescriptionError] = useState("");

    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [imageError, setImageError] = useState("");

    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [submittedComplaint, setSubmittedComplaint] = useState(null);

    // Auto-fill the details of the logged-in user.
    useEffect(() => {
        const storedUser = localStorage.getItem("user");

        if (!storedUser) {
            setIsLoggedIn(false);
            return;
        }

        try {
            const user = JSON.parse(storedUser);

            const savedMobile = String(
                user.mobile_number || user.mobileNumber || ""
            )
                .replace(/\D/g, "")
                .slice(-10);

            setFullName(user.full_name || user.fullName || "");
            setMobileNumber(savedMobile);
            setEmail(user.email || "");
            setWard(user.ward || "");
            setIsLoggedIn(true);
        } catch (error) {
            console.error("Unable to read logged-in user:", error);
            localStorage.removeItem("user");
            setIsLoggedIn(false);
        }
    }, []);

    // Read category from the URL.
    useEffect(() => {
        const categoryFromUrl = searchParams.get("category");

        if (categoryFromUrl) {
            setCategory(categoryFromUrl);
        }
    }, [searchParams]);

    // Remove the old temporary image URL.
    useEffect(() => {
        return () => {
            if (imagePreview?.startsWith("blob:")) {
                URL.revokeObjectURL(imagePreview);
            }
        };
    }, [imagePreview]);

    function handleLocationSelect(locationData) {
        setCoords({
            lat: locationData.lat,
            lng: locationData.lng,
        });

        if (locationData.address) {
            setLocation(locationData.address);
            setLocationError("");
        }

        if (
            locationData.ward &&
            (!ward || ward === "Select your ward")
        ) {
            setWard(locationData.ward);
            setWardError("");
        }
    }

    function handleImageChange(event) {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        const allowedTypes = [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp",
        ];

        if (!allowedTypes.includes(file.type)) {
            setImage(null);
            setImagePreview(null);
            setImageError("Please upload a JPG, PNG or WEBP image");
            event.target.value = "";
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setImage(null);
            setImagePreview(null);
            setImageError("Image size must be less than 5MB");
            event.target.value = "";
            return;
        }

        setImage(file);
        setImageError("");

        const reader = new FileReader();

        reader.onloadend = () => {
            setImagePreview(reader.result);
        };

        reader.onerror = () => {
            setImageError("Unable to read the selected image.");
            setImage(null);
            setImagePreview("");
        };

        reader.readAsDataURL(file);
    }

    function validateForm() {
        let isValid = true;

        if (!fullName.trim()) {
            setFullNameError("Please enter your full name");
            isValid = false;
        } else {
            setFullNameError("");
        }

        if (!mobileNumber.trim()) {
            setMobileNumberError("Please enter your mobile number");
            isValid = false;
        } else if (!/^\d{10}$/.test(mobileNumber)) {
            setMobileNumberError("Mobile number must be 10 digits");
            isValid = false;
        } else {
            setMobileNumberError("");
        }

        if (!email.trim()) {
            setEmailError("Please enter your email");
            isValid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setEmailError("Please enter a valid email address");
            isValid = false;
        } else {
            setEmailError("");
        }

        if (!ward || ward === "Select your ward") {
            setWardError("Please select your ward");
            isValid = false;
        } else {
            setWardError("");
        }

        if (!category || category === "Select category") {
            setCategoryError("Please select a complaint category");
            isValid = false;
        } else {
            setCategoryError("");
        }

        if (!location.trim()) {
            setLocationError("Please enter the complaint location");
            isValid = false;
        } else {
            setLocationError("");
        }

        if (!description.trim()) {
            setDescriptionError("Please describe the issue");
            isValid = false;
        } else {
            setDescriptionError("");
        }

        return isValid;
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setSubmitError("");

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        try {
            const duplicateResponse = await fetch(
                `http://localhost:5000/api/complaints/duplicates/check?ward=${encodeURIComponent(
                    ward
                )}&category=${encodeURIComponent(category)}`
            );

            if (duplicateResponse.ok) {
                const duplicates = await duplicateResponse.json();

                if (duplicates.length > 0) {
                    const duplicate = duplicates[0];

                    const upvoteExisting = window.confirm(
                        `A similar complaint already exists (${duplicate.id}) at ${duplicate.location}.\n\nClick OK to upvote it.\nClick Cancel to submit a new complaint anyway.`
                    );

                    if (upvoteExisting) {
                        const upvoteResponse = await fetch(
                            `http://localhost:5000/api/complaints/${duplicate.rawId}/upvote`,
                            { method: "POST" }
                        );

                        if (!upvoteResponse.ok) {
                            throw new Error("Unable to upvote complaint");
                        }

                        alert(`Upvoted ${duplicate.id} successfully`);
                        navigate(
                            `/mycomplaints?search=${encodeURIComponent(duplicate.id)}`
                        );
                        return;
                    }
                }
            }
        } catch (duplicateError) {
            console.error("Duplicate check failed:", duplicateError);
        }

        try {
            const newRecord = await addComplaint({
                fullName: fullName.trim(),
                mobileNumber: mobileNumber.trim(),
                email: email.trim(),
                ward,
                category,
                location: location.trim(),
                lat: coords.lat,
                lng: coords.lng,
                description: description.trim(),
                imageUrl: imagePreview,
            });

            if (!newRecord) {
                throw new Error("Complaint could not be registered");
            }

            setSubmittedComplaint(newRecord);
        } catch (error) {
            console.error("Complaint submission error:", error);
            setSubmitError(
                "Unable to register the complaint. Make sure the backend server is running."
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 px-6 py-10">
            <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-8 shadow-xl md:p-10">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">
                            Report Civic Issue
                        </h1>

                        <p className="mt-1 text-slate-500">
                            Fill in the details below. AI triage will
                            automatically analyse your complaint.
                        </p>
                    </div>

                    <div className="hidden items-center gap-2 rounded-full bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-600 sm:flex">
                        <Sparkles size={16} />
                        AI Triage Active
                    </div>
                </div>

                {isLoggedIn && (
                    <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                        Your registered details were filled automatically.
                    </div>
                )}

                <form onSubmit={handleSubmit} className="mt-8">
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Full name */}
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Full Name
                            </label>

                            <div className="relative">
                                <User
                                    size={20}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                />

                                <input
                                    type="text"
                                    placeholder="Enter your full name"
                                    value={fullName}
                                    onChange={(event) => {
                                        setFullName(event.target.value);
                                        setFullNameError("");
                                    }}
                                    className="w-full rounded-lg border border-slate-300 py-3 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            {fullNameError && (
                                <p className="mt-1 text-xs text-red-500">
                                    {fullNameError}
                                </p>
                            )}
                        </div>

                        {/* Mobile number */}
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Mobile Number
                            </label>

                            <div className="relative">
                                <Phone
                                    size={20}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                />

                                <input
                                    type="tel"
                                    placeholder="Enter 10-digit mobile number"
                                    value={mobileNumber}
                                    readOnly={isLoggedIn}
                                    onChange={(event) => {
                                        const value = event.target.value;

                                        if (/^\d{0,10}$/.test(value)) {
                                            setMobileNumber(value);
                                            setMobileNumberError("");
                                        }
                                    }}
                                    className={`w-full rounded-lg border border-slate-300 py-3 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500 ${isLoggedIn
                                        ? "cursor-not-allowed bg-slate-100 text-slate-600"
                                        : "bg-white"
                                        }`}
                                />
                            </div>

                            {mobileNumberError && (
                                <p className="mt-1 text-xs text-red-500">
                                    {mobileNumberError}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="mt-6 grid gap-6 md:grid-cols-2">
                        {/* Email */}
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Email Address
                            </label>

                            <div className="relative">
                                <Mail
                                    size={20}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                />

                                <input
                                    type="email"
                                    placeholder="Enter your email address"
                                    value={email}
                                    onChange={(event) => {
                                        setEmail(event.target.value);
                                        setEmailError("");
                                    }}
                                    className="w-full rounded-lg border border-slate-300 py-3 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            {emailError && (
                                <p className="mt-1 text-xs text-red-500">
                                    {emailError}
                                </p>
                            )}
                        </div>

                        {/* Ward */}
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Select Ward
                            </label>

                            <div className="relative">
                                <Building2
                                    size={20}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                />

                                <select
                                    value={ward}
                                    onChange={(event) => {
                                        setWard(event.target.value);
                                        setWardError("");
                                    }}
                                    className="w-full rounded-lg border border-slate-300 py-3 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">Select your ward</option>
                                    <option value="Indiranagar">Indiranagar</option>
                                    <option value="Yelahanka">Yelahanka</option>
                                    <option value="Hebbal">Hebbal</option>
                                    <option value="Malleshwaram">Malleshwaram</option>
                                    <option value="Rajajinagar">Rajajinagar</option>
                                    <option value="Jayanagar">Jayanagar</option>
                                    <option value="Basavanagudi">Basavanagudi</option>
                                    <option value="BTM Layout">BTM Layout</option>
                                    <option value="Koramangala">Koramangala</option>
                                    <option value="HSR Layout">HSR Layout</option>
                                    <option value="Whitefield">Whitefield</option>
                                </select>
                            </div>

                            {wardError && (
                                <p className="mt-1 text-xs text-red-500">
                                    {wardError}
                                </p>
                            )}
                        </div>

                        {/* Category */}
                        <div className="md:col-span-2">
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Complaint Category
                            </label>

                            <div className="relative">
                                <FileText
                                    size={20}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                />

                                <select
                                    value={category}
                                    onChange={(event) => {
                                        setCategory(event.target.value);
                                        setCategoryError("");
                                    }}
                                    className="w-full rounded-lg border border-slate-300 py-3 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">Select category</option>
                                    <option value="Pothole">Pothole</option>
                                    <option value="Garbage">Garbage</option>
                                    <option value="Water Leakage">
                                        Water Leakage
                                    </option>
                                    <option value="Street Light">
                                        Street Light
                                    </option>
                                    <option value="Drainage">Drainage</option>
                                    <option value="Road Damage">
                                        Road Damage
                                    </option>
                                    <option value="Others">Others</option>
                                </select>
                            </div>

                            {categoryError && (
                                <p className="mt-1 text-xs text-red-500">
                                    {categoryError}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Map and location */}
                    <div className="mt-6">
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Issue Location (Pinpoint on Map)
                        </label>

                        <LocationPickerMap
                            selectedWard={ward}
                            onLocationSelect={handleLocationSelect}
                            initialLat={coords.lat}
                            initialLng={coords.lng}
                            initialAddress={location}
                        />

                        <div className="mt-3">
                            <div className="relative">
                                <MapPin
                                    size={20}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                />

                                <input
                                    type="text"
                                    placeholder="Street name, landmark, building or house number"
                                    value={location}
                                    onChange={(event) => {
                                        setLocation(event.target.value);
                                        setLocationError("");
                                    }}
                                    className="w-full rounded-lg border border-slate-300 py-3 pl-11 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            {locationError && (
                                <p className="mt-1 text-xs text-red-500">
                                    {locationError}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="mt-6">
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Complaint Description
                        </label>

                        <div className="relative">
                            <FileText
                                size={20}
                                className="absolute left-4 top-4 text-gray-400"
                            />

                            <textarea
                                rows={4}
                                value={description}
                                onChange={(event) => {
                                    setDescription(event.target.value);
                                    setDescriptionError("");
                                }}
                                placeholder="Describe the issue, severity, landmark or possible hazard..."
                                className="w-full resize-none rounded-lg border border-slate-300 py-3 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        {descriptionError && (
                            <p className="mt-1 text-xs text-red-500">
                                {descriptionError}
                            </p>
                        )}
                    </div>

                    {/* Image upload */}
                    <div className="mt-6">
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Upload Proof Photo (Optional)
                        </label>

                        <label className="flex h-36 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 transition hover:border-indigo-500 hover:bg-indigo-50">
                            {imagePreview ? (
                                <div className="flex items-center gap-4 p-2">
                                    <img
                                        src={imagePreview}
                                        alt="Complaint preview"
                                        className="h-24 w-32 rounded-lg border border-slate-200 object-cover"
                                    />

                                    <div className="text-left">
                                        <p className="text-sm font-semibold text-slate-800">
                                            {image?.name || "Image uploaded"}
                                        </p>

                                        <p className="mt-1 text-xs text-indigo-600">
                                            Click to change photo
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <Camera
                                        size={32}
                                        className="mb-2 text-indigo-600"
                                    />

                                    <p className="text-sm font-medium text-slate-700">
                                        Click to upload an image
                                    </p>

                                    <p className="mt-1 text-xs text-gray-400">
                                        JPG, PNG or WEBP (Maximum 5MB)
                                    </p>
                                </>
                            )}

                            <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handleImageChange}
                                className="hidden"
                            />
                        </label>

                        {imageError && (
                            <p className="mt-1 text-xs text-red-500">
                                {imageError}
                            </p>
                        )}
                    </div>

                    {submitError && (
                        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                            {submitError}
                        </div>
                    )}

                    {/* Submit button */}
                    <div className="mt-8">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 text-base font-bold text-white shadow-lg transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <>
                                    <Sparkles
                                        className="animate-spin"
                                        size={18}
                                    />
                                    Analysing and registering...
                                </>
                            ) : (
                                <>
                                    <Sparkles size={18} />
                                    Submit Complaint (AI Triage)
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* Confirmation modal */}
            {submittedComplaint && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-lg rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                            <CheckCircle2 size={28} />
                        </div>

                        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-600">
                            <Sparkles size={13} />
                            AI Triage Complete (
                            {submittedComplaint.aiConfidence || "92%"})
                        </span>

                        <h2 className="mt-3 text-2xl font-bold text-slate-900">
                            Complaint Registered!
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Your complaint has been logged and assigned to
                            the relevant department.
                        </p>

                        <div className="mt-5 space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm">
                            <div className="flex justify-between border-b border-slate-200/60 pb-2">
                                <span className="font-medium text-slate-500">
                                    Ticket ID
                                </span>

                                <span className="font-mono font-bold text-indigo-600">
                                    {submittedComplaint.id}
                                </span>
                            </div>

                            <div className="flex justify-between border-b border-slate-200/60 pb-2">
                                <span className="font-medium text-slate-500">
                                    Assigned Department
                                </span>

                                <span className="text-right font-semibold text-slate-800">
                                    {submittedComplaint.department}
                                </span>
                            </div>

                            <div className="flex justify-between border-b border-slate-200/60 pb-2">
                                <span className="font-medium text-slate-500">
                                    Priority
                                </span>

                                <span
                                    className={`rounded px-2 py-0.5 text-xs font-bold ${submittedComplaint.priority ===
                                        "Critical"
                                        ? "bg-red-100 text-red-700"
                                        : submittedComplaint.priority ===
                                            "High"
                                            ? "bg-orange-100 text-orange-700"
                                            : submittedComplaint.priority ===
                                                "Low"
                                                ? "bg-green-100 text-green-700"
                                                : "bg-amber-100 text-amber-700"
                                        }`}
                                >
                                    {submittedComplaint.priority}
                                </span>
                            </div>

                            <div className="flex justify-between border-b border-slate-200/60 pb-2">
                                <span className="font-medium text-slate-500">
                                    Ward
                                </span>

                                <span className="font-semibold text-slate-800">
                                    {submittedComplaint.ward}
                                </span>
                            </div>

                            <div className="flex justify-between gap-4">
                                <span className="font-medium text-slate-500">
                                    Location
                                </span>

                                <span
                                    className="max-w-[250px] truncate text-right font-semibold text-slate-800"
                                    title={submittedComplaint.location}
                                >
                                    {submittedComplaint.location}
                                </span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                navigate(
                                    `/mycomplaints?search=${encodeURIComponent(
                                        submittedComplaint.id
                                    )}`
                                )
                            }
                            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-indigo-700"
                        >
                            Track Complaint
                            <ArrowRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ComplaintForm;