"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LockKeyhole, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { LoadingSpinner } from "./loading-spinner";

type LoginFormProps = {
  initialEmail?: string;
  notice?: string;
};

function getInitialLoginState(initialEmail: string) {
  if (typeof window === "undefined") {
    return {
      email: initialEmail,
      password: "",
      remember: false,
    };
  }

  const pendingSignup = window.sessionStorage.getItem("sogoerp.pendingSignup");
  const rememberedEmail = window.localStorage.getItem("sogoerp.rememberedEmail");

  if (pendingSignup) {
    window.sessionStorage.removeItem("sogoerp.pendingSignup");

    try {
      const parsed = JSON.parse(pendingSignup) as {
        email?: string;
        password?: string;
      };

      return {
        email: parsed.email ?? "",
        password: parsed.password ?? "",
        remember: true,
      };
    } catch {
      return {
        email: initialEmail,
        password: "",
        remember: false,
      };
    }
  }

  return {
    email: initialEmail || rememberedEmail || "",
    password: "",
    remember: Boolean(!initialEmail && rememberedEmail),
  };
}

export function LoginForm({ initialEmail = "", notice = "" }: LoginFormProps) {
  const router = useRouter();
  const initialState = getInitialLoginState(initialEmail);
  const [email, setEmail] = useState(initialState.email);
  const [password, setPassword] = useState(initialState.password);
  const [remember, setRemember] = useState(initialState.remember);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setLoading(false);
      const message = signInError.message.toLowerCase();

      setError(
        message.includes("invalid login credentials")
          ? "Invalid login credentials. If this account was just registered, Supabase may still require email confirmation. Turn off Confirm email, then register again."
          : signInError.message,
      );
      return;
    }

    if (remember) {
      window.localStorage.setItem("sogoerp.rememberedEmail", email);
    } else {
      window.localStorage.removeItem("sogoerp.rememberedEmail");
    }

    setSuccess("Login approved. Opening dashboard.");
    window.setTimeout(() => {
      router.push("/dashboard");
      router.refresh();
    }, 650);
  }

  return (
    <form className="mt-9 max-w-md space-y-4" onSubmit={handleSubmit}>
      {notice || error || success ? (
        <div
          aria-label={error || success || notice}
          className={`auth-phone-signal ${
            error ? "auth-ios-alert-error" : "auth-ios-alert-success"
          }`}
        >
          <span className="auth-ios-alert-light" />
        </div>
      ) : null}

      {notice || error || success ? (
        <p className="auth-form-message">{error || success || notice}</p>
      ) : null}

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
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter password"
            required
            type="password"
            value={password}
          />
        </span>
      </label>

      <div className="flex items-center justify-between py-1 text-sm">
        <label className="flex items-center gap-2 font-medium text-[#343434]">
          <input
            checked={remember}
            className="size-4 accent-black"
            onChange={(event) => setRemember(event.target.checked)}
            type="checkbox"
          />
          Remember me
        </label>
        <a className="font-semibold text-black" href="/forgot-password">
          Forgot password?
        </a>
      </div>

      <button
        className="flex h-12 w-full items-center justify-center gap-2 rounded-[6px] bg-black px-5 text-sm font-bold text-white transition hover:bg-[#343434] disabled:cursor-wait disabled:bg-[#343434]"
        disabled={loading}
        type="submit"
      >
        {loading ? <LoadingSpinner /> : null}
        {loading ? "Processing login" : "Login"}
        {loading ? null : <ArrowRight className="size-4" />}
      </button>
    </form>
  );
}
