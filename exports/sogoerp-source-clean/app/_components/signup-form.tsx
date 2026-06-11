"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LockKeyhole, Mail, User } from "lucide-react";
import { LoadingSpinner } from "./loading-spinner";

export function SignupForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const response = await fetch("/api/auth/signup", {
      body: JSON.stringify({
        email,
        fullName,
        password,
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
    const result = (await response.json()) as { error?: string; ok?: boolean };

    if (!response.ok || result.error) {
      setLoading(false);
      const errorMessage = result.error ?? "Unable to create account.";
      const isRateLimit = errorMessage
        .toLowerCase()
        .includes("rate limit");

      setError(
        isRateLimit
          ? "Supabase email rate limit exceeded. Turn off email confirmation in Supabase Auth settings, then try again."
          : errorMessage,
      );
      return;
    }
    
    window.sessionStorage.setItem(
      "sogoerp.pendingSignup",
      JSON.stringify({ email, password }),
    );
    setSuccess("Account created. Taking you to login.");
    window.setTimeout(() => {
      router.push("/login?registered=1");
      router.refresh();
    }, 900);
  }

  return (
    <form className="mt-9 max-w-md space-y-4" onSubmit={handleSubmit}>
      {error || success ? (
        <div
          aria-label={error || success}
          className={`auth-phone-signal ${
            error ? "auth-ios-alert-error" : "auth-ios-alert-success"
          }`}
        >
          <span className="auth-ios-alert-light" />
        </div>
      ) : null}

      {error || success ? (
        <p className="auth-form-message">{error || success}</p>
      ) : null}

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-black">Full name</span>
        <span className="flex h-12 items-center gap-3 rounded-[6px] border border-[#d2d2d2] bg-white px-4 text-[#777777] focus-within:border-black">
          <User className="size-5" strokeWidth={1.8} />
          <input
            className="w-full bg-transparent text-sm text-black outline-none placeholder:text-[#999999]"
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Your name"
            required
            type="text"
            value={fullName}
          />
        </span>
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-black">Email</span>
        <span className="flex h-12 items-center gap-3 rounded-[6px] border border-[#d2d2d2] bg-white px-4 text-[#777777] focus-within:border-black">
          <Mail className="size-5" strokeWidth={1.8} />
          <input
            className="w-full bg-transparent text-sm text-black outline-none placeholder:text-[#999999]"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="admin@sogoerp.com"
            required
            type="email"
            value={email}
          />
        </span>
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-black">Password</span>
        <span className="flex h-12 items-center gap-3 rounded-[6px] border border-[#d2d2d2] bg-white px-4 text-[#777777] focus-within:border-black">
          <LockKeyhole className="size-5" strokeWidth={1.8} />
          <input
            className="w-full bg-transparent text-sm text-black outline-none placeholder:text-[#999999]"
            minLength={8}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Create password"
            required
            type="password"
            value={password}
          />
        </span>
      </label>

      <button
        className="flex h-12 w-full items-center justify-center gap-2 rounded-[6px] bg-black px-5 text-sm font-bold text-white transition hover:bg-[#343434] disabled:cursor-wait disabled:bg-[#343434]"
        disabled={loading}
        type="submit"
      >
        {loading ? <LoadingSpinner /> : null}
        {loading ? "Processing account" : "Create Account"}
        {loading ? null : <ArrowRight className="size-4" />}
      </button>
    </form>
  );
}
