"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../dashboard/components/Sidebar";
import {
	ChartBarIcon,
	ChatBubbleLeftRightIcon,
	BriefcaseIcon,
	ArrowTrendingUpIcon,
} from "@heroicons/react/24/outline";

export default function AssessmentLayout({ children, activeTab: initialActiveTab = "assessment" }) {
	const { user: authUser, loading: authLoading, signOut } = useAuth();
	const [user, setUser] = useState(null);
	const [activeTab, setActiveTab] = useState(initialActiveTab);
	const [isLoading, setIsLoading] = useState(true);
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const router = useRouter();

	useEffect(() => {
		if (authLoading) return; // Wait for auth to load

		if (!authUser) {
			router.push("/login");
			return;
		}

		const userObj = {
			name:
				authUser.user_metadata?.name ||
				authUser.user_metadata?.firstName ||
				authUser.email.split("@")[0],
			email: authUser.email,
			role: authUser.user_metadata?.role || "user",
			avatar: authUser.user_metadata?.avatar_url || "/avatar1.jpg",
		};

		if (userObj.role === "admin") {
			router.push("/admin");
			return;
		}

		// OTP verification check
		if (!authUser.email_confirmed_at) {
			router.push(
				`/verify-otp?email=${encodeURIComponent(authUser.email)}`
			);
			return;
		}

		// Onboarding check
		if (!authUser.user_metadata?.onboarded) {
			router.push("/onboarding");
			return;
		}

		setUser(userObj);
		setIsLoading(false);
	}, [authUser, authLoading, router]);

	const handleLogout = async () => {
		await signOut();
		router.push("/");
	};

	const handleProfileClick = () => {
		router.push("/dashboard?tab=profile");
	};

	const handleTabChange = (tab) => {
		if (tab === "assessment") {
			router.push("/dashboard?tab=assessment");
		} else {
			router.push(`/dashboard?tab=${tab}`);
		}
	};

	if (authLoading || isLoading) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
				<div className="text-white text-xl">Loading...</div>
			</div>
		);
	}

	if (!user) {
		return null;
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
			<div className="flex">
				{/* Sidebar */}
				<Sidebar
					user={user}
					sidebarOpen={sidebarOpen}
					setSidebarOpen={setSidebarOpen}
					activeTab={activeTab}
					setActiveTab={handleTabChange}
					ChartBarIcon={ChartBarIcon}
					ChatBubbleLeftRightIcon={ChatBubbleLeftRightIcon}
					BriefcaseIcon={BriefcaseIcon}
					ArrowTrendingUpIcon={ArrowTrendingUpIcon}
					onProfileClick={handleProfileClick}
					onLogout={handleLogout}
				/>

				{/* Main Content */}
				<div
					className={`assessment-workspace transition-all duration-300 ease-in-out ${sidebarOpen ? "sidebar-open" : "sidebar-collapsed"}`}
				>
					<div className="assessment-workspace-inner">
						{children}
					</div>
				</div>
			</div>
		</div>
	);
}