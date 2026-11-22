import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseConfig } from "@/utils/supabase/env";

export async function POST(req) {
	try {
		const formData = await req.formData();
		const file = formData.get("file");
		const analysisType = formData.get("analysisType") || "resume_optimize";
		const jobRole = formData.get("jobRole") || "Software Engineer";

		if (!file) {
			return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
		}

		// Primary Method: Use FastAPI Backend for processing
		try {
			const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

			const fastApiFormData = new FormData();
			fastApiFormData.append("file", file);
			fastApiFormData.append("job_role", jobRole);

			const endpoints = {
				resume_optimize: `${apiUrl}/api/assessment/resume_optimize/`,
				ats_score: `${apiUrl}/api/assessment/ats_score/`,
				domain_questions: `${apiUrl}/api/assessment/domain_questions/`,
			};

			const endpoint = endpoints[analysisType] || endpoints["resume_optimize"];

			const response = await fetch(endpoint, {
				method: "POST",
				body: fastApiFormData,
			});

			if (response.ok) {
				const result = await response.json();

				return NextResponse.json({
					success: true,
					method: "FastAPI",
					analysisType: analysisType,
					jobRole: jobRole,
					fileName: file.name,
					fileSize: file.size,
					fileType: file.type,
					result: result,
					timestamp: new Date().toISOString(),
				});
			} else {
				console.warn(
					"FastAPI backend failed, falling back to Supabase storage..."
				);
			}
		} catch (fastApiError) {
			console.warn(
				"FastAPI backend unavailable, falling back to Supabase storage:",
				fastApiError.message
			);
		}

		// Fallback Method: Use Supabase Storage (original code)
		const { supabaseUrl, supabaseKey: anonKey } = getSupabaseConfig();
		const serviceRoleKey =
			process.env.SUPABASE_SERVICE_ROLE_KEY ||
			process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

		if (!supabaseUrl || !anonKey) {
			return NextResponse.json(
				{
					error:
						"Supabase configuration missing and FastAPI backend unavailable",
				},
				{ status: 500 }
			);
		}

		if (!serviceRoleKey) {
			return NextResponse.json(
				{
					error:
						"Service role key missing. Please configure SUPABASE_SERVICE_ROLE_KEY in environment variables or ensure FastAPI backend is running on port 8000",
				},
				{ status: 500 }
			);
		}

		// Get the authenticated user from cookies using anon client
		const cookieStore = await cookies();
		const authClient = createServerClient(supabaseUrl, anonKey, {
			cookies: {
				getAll() {
					return cookieStore.getAll();
				},
				setAll() {
					// no-op for API route
				},
			},
		});

		const {
			data: { user },
			error: userError,
		} = await authClient.auth.getUser();
		if (userError || !user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const extension = (file.name?.split(".").pop() || "").toLowerCase();
		const filePath = `${user.id}/${Date.now()}.${extension || "bin"}`;

		// Use service role client to bypass RLS for storage and DB insert
		const serviceClient = createServerClient(supabaseUrl, serviceRoleKey, {
			cookies: {
				getAll() {
					return [];
				},
				setAll() {
					/* no-op */
				},
			},
		});

		// Ensure the canonical private bucket exists (create if missing)
		try {
			const { data: bucketData, error: bucketError } =
				await serviceClient.storage.getBucket("resumes");
			if (bucketError || !bucketData) {
				await serviceClient.storage.createBucket("resumes", {
					public: false,
					fileSizeLimit: 10 * 1024 * 1024,
					allowedMimeTypes: [
						"application/pdf",
						"application/msword",
						"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
						"text/plain",
					],
				});
			}
		} catch (_) {
			// The upload below reports a precise storage error if bucket creation is not permitted.
		}

		const arrayBuffer = await file.arrayBuffer();
		const fileBuffer = Buffer.from(arrayBuffer);

		const { error: uploadError } = await serviceClient.storage
			.from("resumes")
			.upload(filePath, fileBuffer, {
				upsert: true,
				contentType: file.type || "application/octet-stream",
			});

		if (uploadError) {
			return NextResponse.json(
				{ error: `Failed to upload file: ${uploadError.message}` },
				{ status: 500 }
			);
		}

		const { data: publicUrlData } = serviceClient.storage
			.from("resumes")
			.getPublicUrl(filePath);

		const { error: insertError } = await serviceClient
			.from("resumes")
			.insert([
				{
					user_id: user.id,
					filename: filePath,
					original_name: file.name,
					file_size: file.size,
					file_type: file.type,
					content: null,
				},
			]);

		if (insertError) {
			return NextResponse.json(
				{ error: `Failed to save resume metadata: ${insertError.message}` },
				{ status: 500 }
			);
		}

		return NextResponse.json({
			success: true,
			method: "Supabase",
			url: publicUrlData.publicUrl,
			path: filePath,
			fileName: file.name,
			fileSize: file.size,
			fileType: file.type,
			analysisType: analysisType,
			jobRole: jobRole,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("Resume upload error:", error);
		return NextResponse.json(
			{
				error: "Internal server error",
				details: error.message,
			},
			{ status: 500 }
		);
	}
}
