import type { ReactNode } from "react";

type AuthBackgroundProps = {
  children: ReactNode;
};

export function AuthBackground({ children }: AuthBackgroundProps) {
  return (
    <main className="auth-stage min-h-screen overflow-hidden bg-[#d2d2d2] p-3 sm:p-6">
      <div className="auth-grid" />
      <div className="auth-spark auth-spark-one" />
      <div className="auth-spark auth-spark-two" />
      <div className="auth-spark auth-spark-three" />
      <div className="relative z-10 grid min-h-[calc(100vh-24px)] place-items-center sm:min-h-[calc(100vh-48px)]">
        {children}
      </div>
    </main>
  );
}
