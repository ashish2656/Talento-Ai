"use client";

import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

export default function PaymentPage() {
	return (
		<main className="flex min-h-screen items-center justify-center bg-[#101113] px-4 py-12">
			<section className="w-full max-w-lg rounded-2xl border border-gray-700 bg-[#18191b] p-8 text-center">
				<Link
					href="/dashboard"
					className="mb-8 inline-flex items-center text-cyan-400 hover:text-cyan-300"
				>
					<ArrowLeftIcon className="mr-2 h-4 w-4" />
					Back to Dashboard
				</Link>
				<h1 className="mb-3 text-2xl font-bold text-white">
					Subscriptions are unavailable
				</h1>
				<p className="text-gray-300">
					Paid plans are not available right now. You can continue using the
					current free features.
				</p>
			</section>
		</main>
	);
}
