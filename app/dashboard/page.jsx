"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import createClientForBrowser from "@/utils/supabase/client";
import { getInitialFromName } from "../../utils/getInitialFromName";
import {
	ChartBarIcon,
	ChatBubbleLeftRightIcon,
	BriefcaseIcon,
	ArrowTrendingUpIcon,
} from "@heroicons/react/24/outline";

// Import modular components
import Sidebar from "./components/Sidebar";
import OverviewTab from "./components/OverviewTab";
import InterviewPrepTab from "./components/InterviewPrepTab";
import CareerToolsTab from "./components/CareerToolsTab";
import ProgressTab from "./components/ProgressTab";
import JobSearchTab from "./components/JobSearchTab";
import ProfilePage from "./components/ProfilePage";
import SubscriptionTab from "./components/SubscriptionTab";

export default function DashboardPage() {
	const [user, setUser] = useState(null);
	const [activeTab, setActiveTab] = useState("overview");
	const [isLoading, setIsLoading] = useState(true);
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const [showProfile, setShowProfile] = useState(false);
	const router = useRouter();

	useEffect(() => {
		const fetchUser = async () => {
			const supabase = createClientForBrowser();
			const { data, error } = await supabase.auth.getUser();
			if (data?.user) {
				const userObj = {
					name: data.user.user_metadata?.name || data.user.user_metadata?.firstName || data.user.email.split('@')[0],
					email: data.user.email,
					role: data.user.user_metadata?.role || "user",
					avatar: data.user.user_metadata?.avatar_url || "/avatar1.jpg",
				};
				if (userObj.role === "admin") {
					router.push("/admin");
					return;
				}
                // OTP verification check
                if (!data.user.email_confirmed_at) {
                  router.push(`/verify-otp?email=${encodeURIComponent(data.user.email)}`);
                  return;
                }
                // Onboarding check
                if (!data.user.user_metadata?.onboarded) {
                  router.push("/onboarding");
                  return;
                }
				setUser(userObj);
				setIsLoading(false);
			} else {
				router.push("/login");
			}
		};
		fetchUser();
	}, [router]);

	const handleLogout = async () => {
		const supabase = createClientForBrowser();
		await supabase.auth.signOut();
		router.push("/");
	};

	const handleProfileClick = () => {
		setShowProfile(true);
	};

	const handleBackToDashboard = () => {
		setShowProfile(false);
	};

	if (isLoading) {
		return (
			<div className="dashboard-loading">
				<div className="dashboard-loading-ring" />
			</div>
		);
	}

	if (!user) return null;

	const sectionTitles = {
		overview: "Overview",
		career: "Career Tools",
		progress: "Progress",
		jobsearch: "Job Search",
		subscription: "Subscription",
	};

	const formattedDate = new Intl.DateTimeFormat("en-US", {
		weekday: "short",
		month: "long",
		day: "numeric",
	}).format(new Date());

	return (
		<div className={`talento-dashboard ${sidebarOpen ? "sidebar-visible" : "sidebar-collapsed"}`}>
			{sidebarOpen && (
				<button
					className="dashboard-mobile-backdrop"
					aria-label="Close navigation"
					onClick={() => setSidebarOpen(false)}
				/>
			)}

			<Sidebar
				user={user}
				sidebarOpen={sidebarOpen}
				setSidebarOpen={setSidebarOpen}
				activeTab={activeTab}
				setActiveTab={setActiveTab}
				ChartBarIcon={ChartBarIcon}
				ChatBubbleLeftRightIcon={ChatBubbleLeftRightIcon}
				BriefcaseIcon={BriefcaseIcon}
				ArrowTrendingUpIcon={ArrowTrendingUpIcon}
				onProfileClick={handleProfileClick}
				onLogout={handleLogout}
			/>

			<main className="dashboard-workspace">
				<header className="dashboard-header">
					<div className="dashboard-header-copy">
						<div className="dashboard-eyebrow">
							<span className="dashboard-status-dot" />
							<span>{sectionTitles[activeTab] || "Dashboard"}</span>
						</div>
						<h1>
							{showProfile ? "Your Profile" : activeTab === "overview" ? `Welcome back, ${user.name}!` : sectionTitles[activeTab]}
						</h1>
						<p>
							{showProfile
								? "Manage your personal information and account preferences."
								: activeTab === "overview"
									? "Here's your progress summary and recent activities."
									: "Stay focused and keep building your career momentum."}
						</p>
					</div>

					<div className="dashboard-header-actions">
						<div className="dashboard-date" aria-label={formattedDate}>{formattedDate}</div>
						<button className="dashboard-icon-button" type="button" aria-label="Notifications">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
								<path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5m6 0a3 3 0 1 1-6 0m6 0H9" />
							</svg>
							<span className="dashboard-notification-dot" />
						</button>
						<button className="dashboard-profile-button" type="button" onClick={handleProfileClick} aria-label="Open profile">
							<span>{getInitialFromName(user.name)}</span>
						</button>
					</div>
				</header>

				<section className="dashboard-content-shell">
					{showProfile ? (
						<ProfilePage user={user} onBack={handleBackToDashboard} />
					) : (
						<>
							{activeTab === "overview" && <OverviewTab user={user} />}
							{activeTab === "career" && <CareerToolsTab />}
							{activeTab === "progress" && <ProgressTab />}
							{activeTab === "jobsearch" && <JobSearchTab />}
							{activeTab === "subscription" && <SubscriptionTab />}
						</>
					)}
				</section>
			</main>
		</div>
	);
}
