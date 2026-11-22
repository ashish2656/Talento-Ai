"use client";

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardDocumentCheckIcon,
  MapIcon,
  BriefcaseIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { getInitialFromName } from "../../../utils/getInitialFromName";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Sidebar({
  user,
  sidebarOpen,
  setSidebarOpen,
  activeTab,
  setActiveTab,
  onProfileClick,
  onLogout,
}) {
  const pathname = usePathname();
  const navigation = [
    { id: "overview", name: "Overview", icon: ChartBarIcon },
    { id: "assessment", name: "Take Assessment", icon: ClipboardDocumentCheckIcon, href: "/assessment" },
    { id: "career-planning", name: "Career Planning", icon: MapIcon, href: "/career" },
    { id: "career", name: "Career Tools", icon: BriefcaseIcon },
    { id: "progress", name: "Progress", icon: ArrowTrendingUpIcon },
    { id: "jobsearch", name: "Job Search", icon: BriefcaseIcon },
  ];

  return (
    <aside className={`compact-sidebar ${sidebarOpen ? "is-open" : "is-collapsed"}`}>
      <div className="sidebar-brand">
        <div className="sidebar-brand-mark">T</div>
        <span className="sidebar-brand-name">TALENTO <strong>AI</strong></span>
        <button
          type="button"
          className="sidebar-collapse"
          onClick={() => setSidebarOpen(false)}
          aria-label="Collapse sidebar"
        >
          <ChevronLeftIcon />
        </button>
      </div>

      <button type="button" className="sidebar-profile" onClick={onProfileClick} title="Open profile">
        <span className="sidebar-avatar">{getInitialFromName(user?.name)}</span>
        <span className="sidebar-username">{user?.name}</span>
      </button>

      <nav className="sidebar-navigation" aria-label="Dashboard navigation">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = !item.href && activeTab === item.id;
          const content = (
            <>
              <Icon className="sidebar-nav-icon" />
              <span className="sidebar-nav-label">{item.name}</span>
            </>
          );

          return item.href ? (
            <Link
              key={item.id}
              href={item.href}
              className={`sidebar-nav-link ${pathname === item.href ? "active" : ""}`}
              aria-current={pathname === item.href ? "page" : undefined}
              title={item.name}
            >
              {content}
            </Link>
          ) : (
            <button
              key={item.id}
              type="button"
              className={`sidebar-nav-link ${active ? "active" : ""}`}
              onClick={() => setActiveTab(item.id)}
              aria-current={active ? "page" : undefined}
              title={item.name}
            >
              {content}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-history">
        <div className="sidebar-history-title">History</div>
        <label className="sidebar-search">
          <MagnifyingGlassIcon />
          <input type="search" placeholder="Search" aria-label="Search history" />
        </label>
        <div className="sidebar-history-links">
          <button type="button">Recent</button>
          <button type="button">Past 7 Days</button>
          <button type="button">Past 30 Days</button>
        </div>
        <button type="button" className="sidebar-logout" onClick={onLogout}>
          <ArrowRightOnRectangleIcon />
          <span>Logout</span>
        </button>
      </div>

      {!sidebarOpen && (
        <button
          type="button"
          className="sidebar-expand"
          onClick={() => setSidebarOpen(true)}
          aria-label="Expand sidebar"
        >
          <ChevronRightIcon />
        </button>
      )}
    </aside>
  );
}
