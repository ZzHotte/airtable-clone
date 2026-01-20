"use client";

import { signOut, useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

export function TopBar() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const userInitial =
    session?.user?.name?.[0]?.toUpperCase() ?? session?.user?.email?.[0]?.toUpperCase() ?? "W";

  return (
    <div className="w-full h-14 bg-white border-b border-gray-200 flex items-center px-4 z-10 relative">
      {/* Left: Hamburger + Logo */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Hamburger Menu */}
        <button
          type="button"
          className="flex items-center justify-center w-8 h-8 rounded hover:bg-gray-100 transition-colors"
          aria-label="Menu"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M1 4h14M1 8h14M1 12h14"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {/* Airtable Logo */}
        <div className="flex items-center gap-2">
          <svg
            width="24"
            height="20"
            viewBox="0 0 200 170"
            style={{ shapeRendering: "geometricPrecision" }}
            xmlns="http://www.w3.org/2000/svg"
          >
            <g>
              <path
                fill="rgb(255, 186, 5)"
                d="M90.0389,12.3675 L24.0799,39.6605 C20.4119,41.1785 20.4499,46.3885 24.1409,47.8515 L90.3759,74.1175 C96.1959,76.4255 102.6769,76.4255 108.4959,74.1175 L174.7319,47.8515 C178.4219,46.3885 178.4609,41.1785 174.7919,39.6605 L108.8339,12.3675 C102.8159,9.8775 96.0559,9.8775 90.0389,12.3675"
              />
              <path
                fill="rgb(57, 202, 255)"
                d="M105.3122,88.4608 L105.3122,154.0768 C105.3122,157.1978 108.4592,159.3348 111.3602,158.1848 L185.1662,129.5368 C186.8512,128.8688 187.9562,127.2408 187.9562,125.4288 L187.9562,59.8128 C187.9562,56.6918 184.8092,54.5548 181.9082,55.7048 L108.1022,84.3528 C106.4182,85.0208 105.3122,86.6488 105.3122,88.4608"
              />
              <path
                fill="rgb(220, 4, 59)"
                d="M88.0781,91.8464 L66.1741,102.4224 L63.9501,103.4974 L17.7121,125.6524 C14.7811,127.0664 11.0401,124.9304 11.0401,121.6744 L11.0401,60.0884 C11.0401,58.9104 11.6441,57.8934 12.4541,57.1274 C12.7921,56.7884 13.1751,56.5094 13.5731,56.2884 C14.6781,55.6254 16.2541,55.4484 17.5941,55.9784 L87.7101,83.7594 C91.2741,85.1734 91.5541,90.1674 88.0781,91.8464"
              />
              <path
                fill="rgba(0, 0, 0, 0.25)"
                d="M88.0781,91.8464 L66.1741,102.4224 L12.4541,57.1274 C12.7921,56.7884 13.1751,56.5094 13.5731,56.2884 C14.6781,55.6254 16.2541,55.4484 17.5941,55.9784 L87.7101,83.7594 C91.2741,85.1734 91.5541,90.1674 88.0781,91.8464"
              />
            </g>
          </svg>
          <span
            className="text-[15px] font-medium text-[#011435]"
            style={{
              fontFamily:
                '"HaasText", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
            }}
          >
            Airtable
          </span>
        </div>
      </div>

      {/* Center: Search */}
      <div className="flex-1 flex justify-center px-4">
        <div className="relative w-full max-w-[400px]">
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M7 12A5 5 0 1 0 7 2a5 5 0 0 0 0 10zM11 11l3 3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search..."
            className="w-full h-8 pl-9 pr-20 bg-gray-50 border border-gray-200 rounded-md text-sm text-[#011435] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            style={{
              fontFamily:
                '"HaasText", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
            }}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
            ctrl K
          </div>
        </div>
      </div>

      {/* Right: Help + Notifications + User */}
      <div className="flex items-center gap-2 flex-shrink-0 relative" ref={menuRef}>
        {/* Help */}
        <a
          href="#"
          className="flex items-center gap-1.5 px-2 py-1.5 text-sm text-[#011435] hover:bg-gray-100 rounded transition-colors"
          style={{
            fontFamily:
              '"HaasText", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="M8 11V8M8 5h.01"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <span>Help</span>
        </a>

        {/* Notifications */}
        <button
          type="button"
          className="flex items-center justify-center w-8 h-8 rounded hover:bg-gray-100 transition-colors"
          aria-label="Notifications"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M8 2a4 4 0 0 0-4 4v3.586l-1.707 1.707A1 1 0 0 0 3 13h10a1 1 0 0 0 .707-1.707L12 9.586V6a4 4 0 0 0-4-4zM8 15a2 2 0 0 1-2-2h4a2 2 0 0 1-2 2z"
              fill="currentColor"
            />
          </svg>
        </button>

        {/* User Avatar */}
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          onClick={() => setOpen((prev) => !prev)}
        >
          {session?.user?.image ? (
            <img
              src={session.user.image}
              alt={session.user.name ?? ""}
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            userInitial
          )}
        </button>

        {/* Account dropdown */}
        {open && (
          <div
            className="absolute right-0 top-11 w-72 bg-white rounded-lg shadow-lg border border-gray-200 py-3 z-20"
            role="menu"
          >
            {/* Header */}
            <div className="px-4 pb-3 border-b border-gray-200">
              <p
                className="text-sm font-semibold text-[#011435]"
                style={{
                  fontFamily:
                    '"HaasText", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
                }}
              >
                {session?.user?.name ?? "Account"}
              </p>
              <p className="text-xs text-gray-600 truncate">
                {session?.user?.email ?? "email@example.com"}
              </p>
            </div>

            {/* Menu groups */}
            <div className="py-1 text-sm text-[#011435]">
              {/* Account */}
              <MenuItem icon="user">Account</MenuItem>
              <MenuItem icon="groups" rightBadge={<Badge text="Business" color="bg-blue-100" />}>
                Manage groups
              </MenuItem>
              <MenuItem icon="bell" rightChevron>
                Notification preferences
              </MenuItem>
              <MenuItem icon="language" rightChevron>
                Language preferences
              </MenuItem>
              <MenuItem
                icon="appearance"
                rightBadge={<Badge text="Beta" color="bg-amber-100" />}
                rightChevron
              >
                Appearance
              </MenuItem>

              <Divider />

              <MenuItem icon="mail">Contact sales</MenuItem>
              <MenuItem icon="star">Upgrade</MenuItem>
              <MenuItem icon="share">Tell a friend</MenuItem>

              <Divider />

              <MenuItem icon="link">Integrations</MenuItem>
              <MenuItem icon="tool">Builder hub</MenuItem>

              <Divider />

              <MenuItem icon="trash">Trash</MenuItem>
              <MenuItem
                icon="logout"
                isDestructive
                onClick={() => {
                  setOpen(false);
                  void signOut({ callbackUrl: "/" });
                }}
              >
                Log out
              </MenuItem>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

type MenuItemProps = {
  icon:
    | "user"
    | "groups"
    | "bell"
    | "language"
    | "appearance"
    | "mail"
    | "star"
    | "share"
    | "link"
    | "tool"
    | "trash"
    | "logout";
  children: React.ReactNode;
  rightBadge?: React.ReactNode;
  rightChevron?: boolean;
  isDestructive?: boolean;
  onClick?: () => void;
};

function MenuItem({
  icon,
  children,
  rightBadge,
  rightChevron,
  isDestructive,
  onClick,
}: MenuItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full px-4 py-1.5 flex items-center justify-between hover:bg-gray-100 transition-colors ${
        isDestructive ? "text-red-600" : "text-[#011435]"
      }`}
      role="menuitem"
    >
      <div className="flex items-center gap-3">
        <span className="text-gray-600">
          <MenuIcon type={icon} />
        </span>
        <span
          className="text-sm"
          style={{
            fontFamily:
              '"HaasText", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
          }}
        >
          {children}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {rightBadge}
        {rightChevron && (
          <svg
            width="14"
            height="14"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M6 3.5l4 4.5-4 4.5"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
    </button>
  );
}

function Divider() {
  return <div className="my-1 border-t border-gray-200 mx-4" />;
}

type BadgeProps = { text: string; color: string };

function Badge({ text, color }: BadgeProps) {
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs text-[#011435] ${color}`}
      style={{
        fontFamily:
          '"HaasText", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
      }}
    >
      {text}
    </span>
  );
}

type MenuIconProps = { type: MenuItemProps["icon"] };

function MenuIcon({ type }: MenuIconProps) {
  switch (type) {
    case "user":
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="8" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3" />
          <path
            d="M3.5 13c.7-1.8 2.3-3 4.5-3s3.8 1.2 4.5 3"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        </svg>
      );
    case "groups":
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="5" cy="6" r="2" stroke="currentColor" strokeWidth="1.3" />
          <circle cx="11" cy="5" r="1.7" stroke="currentColor" strokeWidth="1.3" />
          <path
            d="M2.5 12c.5-1.4 1.6-2.3 3-2.3s2.5.9 3 2.3"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
          <path
            d="M9.5 11.8c.5-1 1.3-1.6 2.4-1.6.6 0 1.1.2 1.6.5"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        </svg>
      );
    case "bell":
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M8 2a3.5 3.5 0 0 0-3.5 3.5V8L3 9.7A.8.8 0 0 0 3.7 11h8.6a.8.8 0 0 0 .7-1.3L11.5 8V5.5A3.5 3.5 0 0 0 8 2z"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M9.5 12.5A1.75 1.75 0 0 1 8 13.5 1.75 1.75 0 0 1 6.5 12.5"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        </svg>
      );
    case "language":
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" />
          <path d="M2.5 8h11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          <path
            d="M8 2c1.3 1.7 2 3.6 2 6 0 2.4-.7 4.3-2 6-1.3-1.7-2-3.6-2-6 0-2.4.7-4.3 2-6z"
            stroke="currentColor"
            strokeWidth="1.3"
          />
        </svg>
      );
    case "appearance":
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M3 3h10v10H3z"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M3 9h4.5A3.5 3.5 0 0 0 11 5.5V3"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        </svg>
      );
    case "mail":
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M3 4.5l5 3 5-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
    case "star":
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M8 2.2l1.4 3 3.3.4-2.4 2.4.6 3.3L8 10.4 5.1 11.3l.6-3.3L3.3 5.6l3.3-.4L8 2.2z"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "share":
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="4" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.3" />
          <circle cx="12" cy="4" r="1.5" stroke="currentColor" strokeWidth="1.3" />
          <circle cx="12" cy="12" r="1.5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M5.3 7l5-2.2M5.3 9l5 2.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
    case "link":
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M6.5 9.5l3-3M4.5 10.5l-1 1a2.5 2.5 0 0 0 3.5 3.5l1-1M11.5 5.5l1-1a2.5 2.5 0 0 0-3.5-3.5l-1 1"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        </svg>
      );
    case "tool":
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M3 9l4 4 6-6-1.8-1.8M4.5 4.5L3.3 3.3"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="10.5" cy="5.5" r="2" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      );
    case "trash":
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M3.5 5.5l.5 7A1.5 1.5 0 0 0 5.5 14h5a1.5 1.5 0 0 0 1.5-1.5l.5-7M2.5 4h11M6.5 4v-1a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "logout":
      return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M7 3H4.5A1.5 1.5 0 0 0 3 4.5v7A1.5 1.5 0 0 0 4.5 13H7"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
          <path
            d="M9.5 11.5L13 8l-3.5-3.5M6.5 8H13"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    default:
      return null;
  }
}
