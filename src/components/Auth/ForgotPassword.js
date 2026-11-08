import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const API_URL = "https://cecb.lk/backend/api/auth.php";

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setSuccess(null);

    if (!email.trim()) {
      setMessage("Please enter your email address.");
      setSuccess(false);
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(
        API_URL,
        {
          action: "forgotPassword",
          email: email.trim(),
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      setMessage(res.data?.message || "If email exists, reset link sent.");
      setSuccess(Boolean(res.data?.success));
    } catch (err) {
      console.error("Forgot password error:", err);

      const apiMessage =
        err.response?.data?.message ||
        err.response?.data?.debug?.error ||
        "Something went wrong. Please try again later.";

      setMessage(apiMessage);
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 px-4">
      <div className="w-full max-w-md bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl p-8">
        
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img
            src="https://www.cecberp.lk/tax_invoice/logo-01.png"
            alt="CECB Logo"
            className="h-24 drop-shadow-md"
          />
        </div>

        <h2 className="text-3xl font-bold text-center text-gray-800">
          Forgot Password
        </h2>

        <p className="text-center text-gray-500 mb-6">
          Enter your email to receive a password reset link
        </p>

        {/* Alert */}
        {message && (
          <div
            className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${
              success
                ? "bg-green-100 text-green-700 border border-green-200"
                : "bg-red-100 text-red-700 border border-red-200"
            }`}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Email Input */}
          <div className="mb-4 relative">
            <Mail
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              disabled={loading}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        {/* Back to Login */}
        <div className="mt-4 text-center text-sm text-gray-600">
          Remember your password?{" "}
          <Link
            to="/login"
            className="text-blue-600 font-medium hover:underline"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;