"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Bell, Search, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { LoadingSpinner } from "./loading-spinner";

type NotificationItem = {
  id: string;
  href: string;
  message: string;
  time: string;
  tone: "created" | "deleted" | "hard" | "updated";
};

type HeaderActionsProps = {
  displayName: string;
  initials: string;
  user: User;
};

function useClickAway<T extends HTMLElement>(onAway: () => void) {
  const ref = useRef<T>(null);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onAway();
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onAway]);

  return ref;
}

function LogoutButton() {
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
      className="flex w-full items-center gap-2 text-sm font-semibold text-red-500 transition hover:text-red-600 disabled:opacity-50"
      disabled={loading}
      onClick={handleLogout}
      type="button"
    >
      {loading ? (
        <LoadingSpinner className="size-4" />
      ) : (
        <LogOut className="size-4" strokeWidth={1.7} />
      )}
      {loading ? "Signing out..." : "Sign out"}
    </button>
  );
}

export function HeaderActions({ displayName, initials, user }: HeaderActionsProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState("");
  const [searching, setSearching] = useState(false);
  const profileRef = useClickAway<HTMLDivElement>(() => setProfileOpen(false));
  const notificationsRef = useClickAway<HTMLDivElement>(() => setNotificationsOpen(false));

  async function openNotifications() {
    const nextOpen = !notificationsOpen;
    setNotificationsOpen(nextOpen);
    setProfileOpen(false);

    if (!nextOpen || notifications.length) {
      return;
    }

    setNotificationsLoading(true);
    setNotificationsError("");

    const response = await fetch("/api/erp/notifications", { cache: "no-store" });
    const payload = (await response.json()) as {
      error?: string;
      notifications?: NotificationItem[];
    };

    setNotificationsLoading(false);

    if (!response.ok) {
      setNotificationsError(payload.error ?? "Unable to load notifications.");
      return;
    }

    setNotifications(payload.notifications ?? []);
  }

  return (
    <div className="flex items-center gap-3">
      <form
        action="/search"
        className="hidden items-center gap-2 rounded-full border border-[#d2d2d2] bg-white px-4 sm:flex"
        onSubmit={() => setSearching(true)}
      >
        {searching ? (
          <LoadingSpinner className="size-4 text-[#777777]" />
        ) : (
          <Search className="size-4 text-[#777777]" strokeWidth={1.7} />
        )}
        <input
          className="h-11 w-48 bg-transparent text-sm text-black outline-none placeholder:text-[#999999]"
          name="q"
          placeholder="Search ERP"
          type="search"
        />
      </form>
      <Link
        aria-label="Search"
        className="grid size-12 place-items-center rounded-full border border-[#d2d2d2] bg-white text-[#343434] transition hover:bg-[#fbfbfb] sm:hidden"
        href="/search"
      >
        <Search className="size-5" strokeWidth={1.7} />
      </Link>

      <div className="relative" ref={notificationsRef}>
        <button
          aria-expanded={notificationsOpen}
          aria-label="Notifications"
          className="grid size-12 place-items-center rounded-full border border-[#d2d2d2] bg-white text-[#343434] transition hover:bg-[#fbfbfb]"
          onClick={openNotifications}
          type="button"
        >
          <Bell className="size-5" strokeWidth={1.7} />
        </button>

        {notificationsOpen ? (
          <div className="absolute right-0 top-14 z-30 w-[320px] rounded-[8px] border border-[#d2d2d2] bg-white p-3 shadow-[0_18px_50px_rgba(0,0,0,0.14)]">
            <div className="mb-2 flex items-center justify-between px-1">
              <p className="text-sm font-bold text-black">Notifications</p>
              {notificationsLoading ? <LoadingSpinner className="text-[#777777]" /> : null}
            </div>
            {notificationsError ? (
              <p className="rounded-[6px] bg-[#fbfbfb] p-3 text-sm font-semibold text-black">
                {notificationsError}
              </p>
            ) : notifications.length ? (
              <div className="max-h-[360px] space-y-2 overflow-y-auto">
                {notifications.map((item) => (
                  <Link
                    className="block rounded-[6px] border border-[#eeeeee] bg-[#fbfbfb] p-3 transition hover:border-black"
                    href={item.href}
                    key={item.id}
                  >
                    <span className="flex items-start gap-3">
                      <span
                        className={`mt-1 size-2.5 rounded-full ${
                          item.tone === "hard" || item.tone === "deleted"
                            ? "bg-red-500"
                            : item.tone === "updated"
                              ? "bg-[#343434]"
                              : "bg-green-600"
                        }`}
                      />
                      <span>
                        <span className="block text-sm font-semibold text-black">{item.message}</span>
                        <span className="mt-1 block text-xs font-medium text-[#777777]">{item.time}</span>
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="rounded-[6px] bg-[#fbfbfb] p-3 text-sm font-semibold text-[#777777]">
                Nothing important yet.
              </p>
            )}
          </div>
        ) : null}
      </div>

      <div className="relative" ref={profileRef}>
        <button
          aria-expanded={profileOpen}
          aria-label="Profile"
          className="grid size-12 place-items-center rounded-full bg-[#d2d2d2] text-sm font-bold text-black transition hover:bg-[#c8c8c8]"
          onClick={() => {
            setProfileOpen((open) => !open);
            setNotificationsOpen(false);
          }}
          type="button"
        >
          {initials}
        </button>

        {profileOpen ? (
          <div className="absolute right-0 top-14 z-30 w-[280px] rounded-[8px] border border-[#d2d2d2] bg-white p-4 shadow-[0_18px_50px_rgba(0,0,0,0.14)]">
            <p className="text-sm font-bold text-black">{displayName}</p>
            <p className="mt-1 break-all text-xs font-medium text-[#777777]">{user.email}</p>
            <div className="my-4 h-px bg-[#eeeeee]" />
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="font-medium text-[#777777]">Role</dt>
                <dd className="mt-1 font-semibold text-black">
                  {String(user.user_metadata?.role ?? "pending_user").replaceAll("_", " ")}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-[#777777]">User ID</dt>
                <dd className="mt-1 break-all font-semibold text-black">{user.id}</dd>
              </div>
              <div>
                <LogoutButton />
              </div>
            </dl>
          </div>
        ) : null}
      </div>
    </div>
  );
}
