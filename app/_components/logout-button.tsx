"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { LoadingSpinner } from "./loading-spinner";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      className="mb-9 flex h-12 items-center gap-4 px-9 text-sm font-medium text-[#777777] hover:text-black disabled:cursor-wait disabled:opacity-70"
      disabled={loading}
      onClick={handleLogout}
      type="button"
    >
      {loading ? <LoadingSpinner className="size-[19px]" /> : <LogOut className="size-[19px]" strokeWidth={1.8} />}
      {loading ? "Logging out" : "Log Out"}
    </button>
  );
}
