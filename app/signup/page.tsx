import Link from "next/link";
import { ArrowRight, Building2, Gauge, LockKeyhole, Mail, User } from "lucide-react";

export default function SignupPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#d2d2d2] p-3 sm:p-6">
      <section className="grid w-full max-w-[1080px] overflow-hidden rounded-[10px] border border-white bg-white shadow-[0_22px_80px_rgba(52,52,52,0.12)] lg:grid-cols-[1.05fr_0.95fr]">
        <div className="p-6 sm:p-10 lg:p-14">
          <Link className="mb-10 flex items-center gap-3" href="/">
            <div className="grid size-8 place-items-center rounded-[6px] bg-black text-white">
              <Gauge className="size-5" strokeWidth={2.4} />
            </div>
            <span className="text-[17px] font-bold tracking-[-0.01em] text-black">
              SOGOERP
            </span>
          </Link>

          <div className="max-w-md">
            <p className="text-sm font-medium text-[#777777]">Start your workspace</p>
            <h1 className="mt-2 text-[32px] font-bold tracking-[-0.02em] text-black">
              Create your ERP account
            </h1>
          </div>

          <form className="mt-9 max-w-md space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-black">Full name</span>
              <span className="flex h-12 items-center gap-3 rounded-[6px] border border-[#d2d2d2] bg-white px-4 text-[#777777] focus-within:border-black">
                <User className="size-5" strokeWidth={1.8} />
                <input
                  className="w-full bg-transparent text-sm text-black outline-none placeholder:text-[#999999]"
                  placeholder="Your name"
                  type="text"
                />
              </span>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-black">Company</span>
              <span className="flex h-12 items-center gap-3 rounded-[6px] border border-[#d2d2d2] bg-white px-4 text-[#777777] focus-within:border-black">
                <Building2 className="size-5" strokeWidth={1.8} />
                <input
                  className="w-full bg-transparent text-sm text-black outline-none placeholder:text-[#999999]"
                  placeholder="GPS business name"
                  type="text"
                />
              </span>
            </label>

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
                  placeholder="Create password"
                  type="password"
                />
              </span>
            </label>

            <button
              className="flex h-12 w-full items-center justify-center gap-2 rounded-[6px] bg-black px-5 text-sm font-bold text-white transition hover:bg-[#343434]"
              type="button"
            >
              Create Account
              <ArrowRight className="size-4" />
            </button>
          </form>

          <p className="mt-8 text-sm text-[#777777]">
            Already have an account?{" "}
            <Link className="font-bold text-black" href="/login">
              Login
            </Link>
          </p>
        </div>

        <div className="hidden border-l border-[#d2d2d2] bg-[#fbfbfb] p-9 lg:flex lg:flex-col lg:justify-between">
          <div className="rounded-[8px] border border-[#d2d2d2] bg-white p-6">
            <p className="text-sm font-medium text-[#777777]">Workspace setup</p>
            <p className="mt-3 text-[42px] font-bold leading-none tracking-[-0.02em] text-black">
              01
            </p>
          </div>

          <div>
            <h2 className="max-w-sm text-[38px] font-bold leading-[1.05] tracking-[-0.02em] text-black">
              Built for teams that install, monitor, and bill fleets.
            </h2>
            <div className="mt-8 grid grid-cols-2 gap-2">
              {["Users", "Vehicles", "Invoices", "Tickets"].map((item) => (
                <div
                  className="rounded-[8px] border border-[#d2d2d2] bg-white p-4 text-sm font-semibold text-black"
                  key={item}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
