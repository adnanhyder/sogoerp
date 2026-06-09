"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { LoadingSpinner } from "./loading-spinner";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });

    setLoading(false);
    setMessage(
      error
        ? error.message
        : "Password reset email sent. Check your inbox for the reset link.",
    );
  }

  return (
    <form className="mt-9 max-w-md space-y-4" onSubmit={handleSubmit}>
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

      {message ? <p className="auth-form-message">{message}</p> : null}

      <button
        className="flex h-12 w-full items-center justify-center gap-2 rounded-[6px] bg-black px-5 text-sm font-bold text-white transition hover:bg-[#343434] disabled:cursor-wait disabled:bg-[#343434]"
        disabled={loading}
        type="submit"
      >
        {loading ? <LoadingSpinner /> : null}
        {loading ? "Sending link" : "Send Reset Link"}
      </button>
    </form>
  );
}
