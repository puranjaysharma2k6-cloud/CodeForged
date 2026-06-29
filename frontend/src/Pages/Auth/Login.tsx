import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { useAuth } from "../../context/AuthContext";
import "./auth.css";
import config from "../../config";

const LoginSchema = z.object({
  email: z.email("Please enter a valid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters"),
});

type LoginFormData = z.infer<typeof LoginSchema>;

export default function Login() {
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
     console.log(location.state);
  const from =
    (location.state as { from?: string })?.from ||
    "/";

  const {
    register,
    handleSubmit,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm<LoginFormData>({
    resolver: zodResolver(LoginSchema),
  });

  async function onSubmit(data: LoginFormData) {
    setError("");

    try {
              const response = await fetch(`${config.apiUrl}/api/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

      if (!response.ok) {
        throw new Error("Invalid credentials");
      }

      const {
        token,
        refreshToken,
      } = await response.json();

      login(token, refreshToken);

      navigate(from, {
        replace: true,
      });

    } catch {
      setError(
        "Invalid email or password. Please try again."
      );
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">

        <h1 className="auth-title">
          Welcome back
        </h1>

        <p className="auth-subtitle">
          Login to your account
        </p>

        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="auth-form"
        >
          <div className="form-group">
            <label htmlFor="email">
              Email
            </label>

            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              {...register("email")}
            />

            {errors.email && (
              <p className="auth-error">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">
              Password
            </label>

            <input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register("password")}
            />

            {errors.password && (
              <p className="auth-error">
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Logging in..."
              : "Login"}
          </button>
        </form>

        <p className="auth-switch">
          Don't have an account?{" "}
          <Link to="/auth/register">
            Register
          </Link>
        </p>

      </div>
    </div>
  );
}