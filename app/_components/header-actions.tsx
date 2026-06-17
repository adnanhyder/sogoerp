"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Bell, Search, LogOut, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { LoadingSpinner } from "./loading-spinner";

type NotificationItem = {
  id: string;
  href: string;
  message: string;
  time: string;
  rawTime: string;
  tone: "created" | "deleted" | "hard" | "updated" | "followup";
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
  const [unseenCount, setUnseenCount] = useState(0);
  const [toasts, setToasts] = useState<{ id: string; message: string; href: string }[]>([]);
  const [lastOpened, setLastOpened] = useState<string | null>(null);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  
  const profileRef = useClickAway<HTMLDivElement>(() => setProfileOpen(false));
  const notificationsRef = useClickAway<HTMLDivElement>(() => setNotificationsOpen(false));
  const prevNotificationsRef = useRef<NotificationItem[]>([]);

  // Load lastOpened timestamp from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      setLastOpened(localStorage.getItem("lastOpenedNotifications") || "");
    }
  }, []);

  // Request browser notification permissions on mount, then fire for any pending follow-ups
  useEffect(() => {
    async function requestAndFireInitial() {
      if (typeof window === "undefined" || !("Notification" in window)) return;
      if (Notification.permission === "default") {
        await Notification.requestPermission();
      }
    }
    requestAndFireInitial();
  }, []);

  async function fetchNotificationsAndCount() {
    try {
      const response = await fetch("/api/erp/notifications", { cache: "no-store" });
      if (response.ok) {
        const payload = (await response.json()) as {
          notifications?: NotificationItem[];
          unseenCount?: number;
        };
        const newNotifications = payload.notifications ?? [];
        const newCount = payload.unseenCount ?? 0;

        setNotifications(newNotifications);
        setUnseenCount(newCount);

        // Check if there are new notifications relative to lastOpened
        if (newNotifications.length > 0) {
          const latestTime = newNotifications[0].rawTime;
          const savedLastOpened = typeof window !== "undefined" ? localStorage.getItem("lastOpenedNotifications") : null;
          
          if (!savedLastOpened || new Date(latestTime).getTime() > new Date(savedLastOpened).getTime()) {
            setHasNewNotifications(true);
          } else {
            setHasNewNotifications(false);
          }
        } else {
          setHasNewNotifications(false);
        }

        const prev = prevNotificationsRef.current;
        const isFirstLoad = prev.length === 0;

        // Helper: fire a Windows native notification
        function fireWindowsNotification(item: NotificationItem) {
          if (typeof window === "undefined" || !("Notification" in window) || Notification.permission !== "granted") return;
          try {
            const title =
              item.tone === "followup"
                ? "⚡ SogoERP — Follow-up Due"
                : item.tone === "hard"
                ? "📅 SogoERP — Meeting Due"
                : item.tone === "deleted"
                ? "🗑️ SogoERP — Record Deleted"
                : item.tone === "updated"
                ? "✏️ SogoERP — Record Updated"
                : "✅ SogoERP — New Record";

            new Notification(title, {
              body: item.message,
              tag: item.id,
              requireInteraction: item.tone === "followup" || item.tone === "hard",
            });
          } catch (e) {
            console.error("Failed to trigger native notification", e);
          }
        }

        // Helper: add a slide-in toast
        function fireToast(item: NotificationItem, duration = 8000) {
          setToasts((prevToasts) => {
            if (prevToasts.some((t) => t.id === item.id)) return prevToasts;
            return [...prevToasts, { id: item.id, message: item.message, href: item.href }];
          });
          setTimeout(() => {
            setToasts((prevToasts) => prevToasts.filter((t) => t.id !== item.id));
          }, duration);
        }

        const firedKey = "sogoerp_notified_followups";
        const alreadyFired = new Set(
          typeof window !== "undefined" ? (sessionStorage.getItem(firedKey) || "").split(",").filter(Boolean) : []
        );

        if (isFirstLoad) {
          // On first load: fire Windows notifications + toasts for ALL unseen follow-ups
          // Use sessionStorage to avoid re-firing the same follow-ups on page refresh
          const followUpItems = newNotifications.filter(
            (item) => item.tone === "followup" && !alreadyFired.has(item.id)
          );

          followUpItems.forEach((item) => {
            fireWindowsNotification(item);
            fireToast(item, 8000);
            alreadyFired.add(item.id);
          });

          if (typeof window !== "undefined" && followUpItems.length > 0) {
            sessionStorage.setItem(firedKey, [...alreadyFired].join(","));
          }
        } else {
          // On subsequent polls: fire for ALL brand-new notifications (any type)
          const newItems = newNotifications.filter((item) => !prev.some((p) => p.id === item.id));

          newItems.forEach((item) => {
            fireToast(item, 8000);
            fireWindowsNotification(item);

            if (item.tone === "followup" && typeof window !== "undefined") {
              alreadyFired.add(item.id);
              sessionStorage.setItem(firedKey, [...alreadyFired].join(","));
            }
          });
        }
        prevNotificationsRef.current = newNotifications;
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  }

  useEffect(() => {
    fetchNotificationsAndCount();
    const interval = setInterval(fetchNotificationsAndCount, 30000);
    return () => clearInterval(interval);
  }, []);

  async function openNotifications() {
    const nextOpen = !notificationsOpen;
    setNotificationsOpen(nextOpen);
    setProfileOpen(false);

    if (nextOpen) {
      setNotificationsLoading(true);
      setNotificationsError("");

      await fetchNotificationsAndCount();

      setNotificationsLoading(false);

      // Save the current timestamp as the last opened time
      if (typeof window !== "undefined") {
        const nowStr = new Date().toISOString();
        localStorage.setItem("lastOpenedNotifications", nowStr);
        setLastOpened(nowStr);
        setHasNewNotifications(false);
      }
    }
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
          className="relative grid size-12 place-items-center rounded-full border border-[#d2d2d2] bg-white text-[#343434] transition hover:bg-[#fbfbfb]"
          onClick={openNotifications}
          type="button"
        >
          <Bell className="size-5" strokeWidth={1.7} />
          {unseenCount > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white shadow-md ring-2 ring-white animate-marker-blink">
              {unseenCount}
            </span>
          ) : hasNewNotifications ? (
            <span className="absolute right-0.5 top-0.5 size-3 rounded-full bg-red-500 ring-2 ring-white animate-marker-blink" />
          ) : null}
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
                    onClick={async () => {
                      if (item.tone === "followup") {
                        try {
                          await fetch("/api/erp/notifications/read", {
                            body: JSON.stringify({ id: item.id }),
                            headers: { "Content-Type": "application/json" },
                            method: "POST",
                          });
                          setUnseenCount((prev) => Math.max(0, prev - 1));
                          setNotifications((prev) => prev.filter((n) => n.id !== item.id));
                        } catch (err) {
                          console.error("Failed to mark notification as read:", err);
                        }
                      }
                      setNotificationsOpen(false);
                    }}
                  >
                    <span className="flex items-start gap-3">
                      <span
                        className={`mt-1 size-2.5 rounded-full ${
                          item.tone === "followup"
                            ? "bg-[#FAC54D]"
                            : item.tone === "hard" || item.tone === "deleted"
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

      {/* Floating Toast Notification Container */}
      <div className="fixed bottom-6 right-6 z-[99999] flex flex-col gap-3 w-full max-w-[360px] pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex w-full items-start gap-3 rounded-[16px] border-2 border-[#FAC54D] bg-white p-4 shadow-[0_20px_50px_rgba(0,0,0,0.15)] animate-toast-in"
          >
            <div className="relative flex h-3 w-3 mt-1.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </div>
            <div className="flex-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#b58b29] block mb-1">
                Urgent Action Required
              </span>
              <p className="text-sm font-bold text-gray-900 leading-snug">
                {toast.message}
              </p>
              {toast.href && (
                <Link
                  href={toast.href}
                  onClick={() => {
                    setToasts((prev) => prev.filter((t) => t.id !== toast.id));
                  }}
                  className="mt-2.5 inline-block text-xs font-extrabold text-black underline hover:text-gray-700"
                >
                  View Details →
                </Link>
              )}
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-gray-400 hover:text-gray-900 transition-colors shrink-0"
              type="button"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
