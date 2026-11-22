export async function POST() {
	return Response.json(
		{ success: false, error: "Paid subscriptions are currently unavailable." },
		{ status: 503 }
	);
}
