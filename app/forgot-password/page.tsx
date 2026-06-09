import Link from "next/link";
import { Gauge } from "lucide-react";
import { AuthBackground } from "../_components/auth-background";
import { ForgotPasswordForm } from "../_components/forgot-password-form";
import { IphoneFrame } from "../_components/iphone-frame";

export default function ForgotPasswordPage() {
  return (
    <AuthBackground>
      <section className="auth-content grid w-full max-w-[1180px] items-center gap-8 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="hidden min-h-[680px] border-r border-black/15 p-3 pr-10 lg:flex lg:flex-col lg:justify-between">
          <Link className="flex items-center gap-3" href="/login">
            <div className="grid size-8 place-items-center rounded-[6px] bg-black text-white">
              <Gauge className="size-5" strokeWidth={2.4} />
            </div>
            <span className="text-[17px] font-bold tracking-[-0.01em] text-black">
              SOGOERP
            </span>
          </Link>

          <div className="auth-copy-text">
            <p className="text-sm font-medium text-[#777777]">Account Recovery</p>
            <h1 className="mt-3 max-w-sm text-[38px] font-bold leading-[1.05] tracking-[-0.02em] text-black">
              Reset access without breaking flow.
            </h1>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {["Secure", "Email", "Auth"].map((item) => (
              <div
                className="auth-ghost-card rounded-[8px] border border-black/15 p-4 text-sm font-semibold text-black"
                key={item}
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="w-full lg:pl-10">
          <IphoneFrame>
            <div className="auth-form-panel">
              <Link className="mb-8 flex items-center gap-3" href="/login">
                <div className="grid size-8 place-items-center rounded-[6px] bg-black text-white">
                  <Gauge className="size-5" strokeWidth={2.4} />
                </div>
                <span className="text-[17px] font-bold tracking-[-0.01em] text-black">
                  SOGOERP
                </span>
              </Link>

              <div className="max-w-md">
                <p className="text-sm font-medium text-[#777777]">Forgot password</p>
                <h1 className="mt-2 text-[30px] font-bold tracking-[-0.02em] text-black sm:text-[32px]">
                  Recover your account
                </h1>
              </div>

              <ForgotPasswordForm />

              <p className="mt-8 text-sm text-[#777777]">
                Remembered it?{" "}
                <Link className="font-bold text-black" href="/login">
                  Login
                </Link>
              </p>
            </div>
          </IphoneFrame>
        </div>
      </section>
    </AuthBackground>
  );
}
