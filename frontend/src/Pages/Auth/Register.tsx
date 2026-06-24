import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { useAuth } from "../../context/AuthContext";
import "./auth.css";

const RegisterSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(20, "Username must be at most 20 characters"),

    email: z
      .string()
      .email("Please enter a valid email"),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters"),

    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

type RegisterFormData = z.infer<typeof RegisterSchema>;

export default function Register() {
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const {
    register, handleSubmit,formState: { errors,  isSubmitting,}, 
    } = useForm<RegisterFormData>({resolver: zodResolver(RegisterSchema),});

  async function onSubmit(data: RegisterFormData) {
    setError("");

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: data.username,
          email: data.email,
          password: data.password,
        }),
      });

      if (!response.ok) {
        throw new Error("Registration failed");
      }

      const { token, refreshToken } = await response.json();

      login(token, refreshToken);

      navigate("/dashboard", {
        replace: true,
      });
    } catch {
      setError(
        "Registration failed. Please recheck your credentials or try a different email."
      );
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">
          Create account
        </h1>

        <p className="auth-subtitle">
          Join and start competing
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
            <label htmlFor="username">
              Username
            </label>

            <input
              id="username"
              type="text"
              placeholder="your_handle"
              {...register("username")}
            />

            {errors.username && (
              <p className="auth-error">
                {errors.username.message}
              </p>
            )}
          </div>

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

          <div className="form-group">
            <label htmlFor="confirm">
              Confirm Password
            </label>

            <input
              id="confirm"
              type="password"
              placeholder="••••••••"
              {...register("confirm")}
            />

            {errors.confirm && (
              <p className="auth-error">
                {errors.confirm.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Creating account..."
              : "Register"}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account?{" "}
          <Link to="/auth/login">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}