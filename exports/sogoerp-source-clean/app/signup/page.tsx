import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthBackground } from "../_components/auth-background";
import { BrandLogo } from "../_components/brand-logo";
import { IphoneFrame } from "../_components/iphone-frame";
import { SignupForm } from "../_components/signup-form";
import { createClient } from "@/lib/supabase/server";

export default async function SignupPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <AuthBackground>
      <section className="auth-content grid w-full max-w-[1180px] items-center gap-8 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="order-2 w-full lg:order-1 lg:border-r-[20px] lg:border-[#000000] lg:pr-10">
          <IphoneFrame>
            <div className="auth-form-panel">
              <BrandLogo className="mb-8" href="/login" />

              <div className="max-w-md">
                <p className="text-sm font-medium text-[#777777]">Start your workspace</p>
                <h1 className="mt-2 text-[30px] font-bold tracking-[-0.02em] text-black sm:text-[32px]">
                  Create your ERP account
                </h1>
              </div>

              <SignupForm />

              <p className="mt-8 text-sm text-[#777777]">
                Already have an account?{" "}
                <Link className="font-bold text-black" href="/login">
                  Login
                </Link>
              </p>
            </div>
          </IphoneFrame>
        </div>

        <div className="order-1 hidden min-h-[680px] p-3 lg:flex lg:flex-col lg:justify-between lg:pl-10">
          <BrandLogo href="/login" />

          <div className="auth-info-box p-6">
            <p className="text-sm font-medium text-[#777777]">Workspace setup</p>
            <p className="mt-3 text-[42px] font-bold leading-none tracking-[-0.02em] text-black">
              01
            </p>
          </div>

          <div className="auth-info-box auth-copy-text">
            <h2 className="max-w-sm text-[38px] font-bold leading-[1.05] tracking-[-0.02em] text-black">
              Built for teams that install, monitor, and bill fleets.
            </h2>
            <div className="mt-8 grid grid-cols-2 gap-2">
              {["Users", "Vehicles", "Invoices", "Tickets"].map((item) => (
                <div
                  className="rounded-[8px] border border-black/15 p-4 text-sm font-semibold text-black"
                  key={item}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </AuthBackground>
  );
}
