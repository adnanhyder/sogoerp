"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      className="mb-9 flex h-12 items-center gap-4 px-9 text-sm font-medium text-[#777777] hover:text-black"
      onClick={handleLogout}
      type="button"
    >
      <LogOut className="size-[19px]" strokeWidth={1.8} />
      Log Out
    </button>
  );
}
