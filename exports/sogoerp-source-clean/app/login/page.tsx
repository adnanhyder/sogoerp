import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthBackground } from "../_components/auth-background";
import { BrandLogo } from "../_components/brand-logo";
import { IphoneFrame } from "../_components/iphone-frame";
import { LoginForm } from "../_components/login-form";
import { createClient } from "@/lib/supabase/server";

type LoginPageProps = {
  searchParams?: Promise<{
    confirmed?: string;
    email?: string;
    registered?: string;
    verify?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const params = await searchParams;

  if (user) {
    redirect("/dashboard");
  }
  

  return (
    <AuthBackground>
      <section className="auth-content grid w-full max-w-[1180px] items-center gap-8 lg:grid-cols-[0.92fr_1.08fr]">
        <div
          className="hidden min-h-[600px] p-3 pr-10 lg:flex lg:flex-col lg:justify-between w-full"
            style={{
              clipPath: "url(#notched-card)",
              backgroundColor: "#ffffff",
            }}
          >
          <svg width="0" height="0" style={{ position: "absolute", overflow: "hidden" }}>
            <defs>
              <clipPath id="notched-card" clipPathUnits="objectBoundingBox">
              <path d="M0.032,0 L0.62,0 Q0.635,0 0.644,0.008 L0.718,0.057 Q0.727,0.065 0.742,0.065 L0.968,0.065 Q1,0.065 1,0.095 L1,0.968 Q1,1 0.968,1 L0.032,1 Q0,1 0,0.968 L0,0.032 Q0,0 0.032,0 Z" />
              </clipPath>
            </defs>
          </svg>
          <BrandLogo className="mt-[30px] ml-[25px]" href="/login" />

          <div className="auth-info-box auth-copy-text">
            <p className="text-sm font-medium text-[#777777]">GPS Tracking ERP</p>
            <h1 className="mt-3 max-w-sm text-[58px] font-bold leading-[1.05] tracking-[-0.02em] text-black">
              Control operations from one calm workspace.
            </h1>
            <div className="mt-8 grid grid-cols-3 gap-2">
              {["Sales", "Service", "Finance"].map((item) => (
                <div
                  className="rounded-[8px] bg-[#000000] border border-black/15 p-4 text-sm font-semibold text-[#ffffff]"
                  key={item}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="w-full lg:pl-10 lg:border-l-[20px] border-[#000000]">
          <IphoneFrame>
            <div className="auth-form-panel">
              <BrandLogo className="mb-8" href="/login" />

              <div className="max-w-md">
                <p className="text-sm font-medium text-[#777777]">Welcome back</p>
                <h2 className="mt-2 text-[30px] font-bold tracking-[-0.02em] text-black sm:text-[32px]">
                  Login to your account
                </h2>
              </div>

              <LoginForm
                initialEmail={params?.email ?? ""}
                notice={
                  params?.registered
                    ? "Account created. Your credentials are filled. Choose Remember me for future sign-ins."
                    : params?.confirmed
                      ? "Email confirmed. You can login now."
                      : ""
                }
              />

              <p className="mt-8 text-sm text-[#777777]">
                New to SOGOERP?{" "}
                <Link className="font-bold text-black" href="/signup">
                  Create an account
                </Link>
              </p>
            </div>
          </IphoneFrame>
        </div>
      </section>
    </AuthBackground>
  );
}
