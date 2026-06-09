import Link from "next/link";
import { ArrowRight, Gauge, LockKeyhole, Mail } from "lucide-react";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#d2d2d2] p-3 sm:p-6">
      <section className="grid w-full max-w-[1080px] overflow-hidden rounded-[10px] border border-white bg-white shadow-[0_22px_80px_rgba(52,52,52,0.12)] lg:grid-cols-[0.95fr_1.05fr]">
        <div className="hidden border-r border-[#d2d2d2] bg-[#fbfbfb] p-9 lg:flex lg:flex-col lg:justify-between">
          <Link className="flex items-center gap-3" href="/">
            <div className="grid size-8 place-items-center rounded-[6px] bg-black text-white">
              <Gauge className="size-5" strokeWidth={2.4} />
            </div>
            <span className="text-[17px] font-bold tracking-[-0.01em] text-black">
              SOGOERP
            </span>
          </Link>

          <div>
            <p className="text-sm font-medium text-[#777777]">GPS Tracking ERP</p>
            <h1 className="mt-3 max-w-sm text-[38px] font-bold leading-[1.05] tracking-[-0.02em] text-black">
              Control operations from one calm workspace.
            </h1>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {["Sales", "Service", "Finance"].map((item) => (
              <div
                className="rounded-[8px] border border-[#d2d2d2] bg-white p-4 text-sm font-semibold text-black"
                key={item}
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 sm:p-10 lg:p-14">
          <div className="mb-10 flex items-center justify-between lg:hidden">
            <Link className="flex items-center gap-3" href="/">
              <div className="grid size-8 place-items-center rounded-[6px] bg-black text-white">
                <Gauge className="size-5" strokeWidth={2.4} />
              </div>
              <span className="text-[17px] font-bold tracking-[-0.01em] text-black">
                SOGOERP
              </span>
            </Link>
          </div>

          <div className="max-w-md">
            <p className="text-sm font-medium text-[#777777]">Welcome back</p>
            <h2 className="mt-2 text-[32px] font-bold tracking-[-0.02em] text-black">
              Login to your account
            </h2>
          </div>

          <form className="mt-9 max-w-md space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-black">Email</span>
              <span className="flex h-12 items-center gap-3 rounded-[6px] border border-[#d2d2d2] bg-white px-4 text-[#777777] focus-within:border-black">
                <Mail className="size-5" strokeWidth={1.8} />
                <input
                  className="w-full bg-transparent text-sm text-black outline-none placeholder:text-[#999999]"
                  placeholder="admin@sogoerp.com"
                  type="email"
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-black">Password</span>
              <span className="flex h-12 items-center gap-3 rounded-[6px] border border-[#d2d2d2] bg-white px-4 text-[#777777] focus-within:border-black">
                <LockKeyhole className="size-5" strokeWidth={1.8} />
                <input
                  className="w-full bg-transparent text-sm text-black outline-none placeholder:text-[#999999]"
                  placeholder="Enter password"
                  type="password"
                />
              </span>
            </label>

            <div className="flex items-center justify-between py-1 text-sm">
              <label className="flex items-center gap-2 font-medium text-[#343434]">
                <input className="size-4 accent-black" type="checkbox" />
                Remember me
              </label>
              <a className="font-semibold text-black" href="#">
                Forgot password?
              </a>
            </div>

            <button
              className="flex h-12 w-full items-center justify-center gap-2 rounded-[6px] bg-black px-5 text-sm font-bold text-white transition hover:bg-[#343434]"
              type="button"
            >
              Login
              <ArrowRight className="size-4" />
            </button>
          </form>

          <p className="mt-8 text-sm text-[#777777]">
            New to SOGOERP?{" "}
            <Link className="font-bold text-black" href="/signup">
              Create an account
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
