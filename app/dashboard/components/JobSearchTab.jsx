"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { BriefcaseIcon } from "@heroicons/react/24/outline";
import { useAuth } from "../../context/AuthContext";
import { useRequestCache, useDebounce } from "../../hooks/useCache";
import { useRouter } from "next/navigation";

export default function JobSearchTab() {
	const { user, supabase } = useAuth();
	const { cachedFetch, invalidateCache } = useRequestCache();
	const [query, setQuery] = useState("");
	const [location, setLocation] = useState("");
	const [results, setResults] = useState([]);
	const [hasSearched, setHasSearched] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
	const [selectedJob, setSelectedJob] = useState(null);
	const [showJobModal, setShowJobModal] = useState(false);
	const [searchHistory, setSearchHistory] = useState([]);
	const [savedJobs, setSavedJobs] = useState([]);
	const [savedJobsCache, setSavedJobsCache] = useState(null); // Cache for saved jobs
	const [activeJobTab, setActiveJobTab] = useState("search"); // 'search' or 'saved'
	const [categories, setCategories] = useState([]);
	const [selectedCategories, setSelectedCategories] = useState([]); // multi-select
	const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
	const [jobLimit, setJobLimit] = useState(20); // Add missing jobLimit state
	const [jobTypes] = useState([
		{ value: "full_time", label: "Full Time" },
		{ value: "part_time", label: "Part Time" },
		{ value: "contract", label: "Contract" },
		{ value: "freelance", label: "Freelance" },
		{ value: "internship", label: "Internship" },
		{ value: "other", label: "Other" },
	]);
	const [selectedJobTypes, setSelectedJobTypes] = useState([]); // multi-select
	const [showJobTypeDropdown, setShowJobTypeDropdown] = useState(false);
	const categoryDropdownRef = useRef(null);
	const jobTypeDropdownRef = useRef(null);
	const [supabaseLoading, setSupabaseLoading] = useState(false);
	const [supabaseError, setSupabaseError] = useState("");
	const [supabaseSuccess, setSupabaseSuccess] = useState("");

	// Debounce search query to prevent excessive API calls
	const debouncedQuery = useDebounce(query, 500);
	const debouncedLocation = useDebounce(location, 500);

	// Fetch categories from Remotive API
	useEffect(() => {
		fetch("https://remotive.com/api/remote-jobs/categories")
			.then((res) => res.json())
			.then((data) => setCategories(data.jobs || []))
			.catch(() => setCategories([]));
	}, []);

	// Load search history and saved jobs from localStorage
	useEffect(() => {
		const hist = JSON.parse(localStorage.getItem("jobSearchHistory") || "[]");
		setSearchHistory(hist);
		const saved = JSON.parse(localStorage.getItem("savedJobs") || "[]");
		setSavedJobs(saved);
	}, []);

	// Save search history to localStorage
	useEffect(() => {
		localStorage.setItem("jobSearchHistory", JSON.stringify(searchHistory));
	}, [searchHistory]);

	// Save saved jobs to localStorage
	useEffect(() => {
		localStorage.setItem("savedJobs", JSON.stringify(savedJobs));
	}, [savedJobs]);

	// Fetch saved jobs from API with caching
	const fetchSavedJobs = useCallback(async () => {
		if (!user) {
			setSupabaseError("You must be logged in to view saved jobs.");
			return;
		}

		// Use cached data if available
		if (savedJobsCache && Date.now() - savedJobsCache.timestamp < 2 * 60 * 1000) { // 2 minutes cache
			setSavedJobs(savedJobsCache.data);
			return;
		}

		setSupabaseLoading(true);
		setSupabaseError("");

		try {
			const response = await fetch('/api/saved-jobs');
			const result = await response.json();

			if (!response.ok) {
				setSupabaseError(result.error || "Failed to fetch saved jobs.");
				return;
			}

			const jobsData = result.data || [];
			setSavedJobs(jobsData);
			setSavedJobsCache({
				data: jobsData,
				timestamp: Date.now()
			});
		} catch (error) {
			console.error("Fetch saved jobs error:", error);
			setSupabaseError("Failed to fetch saved jobs.");
		} finally {
			setSupabaseLoading(false);
		}
	}, [user, savedJobsCache]);

	useEffect(() => {
		if (activeJobTab === "saved") {
			fetchSavedJobs();
		}
	}, [activeJobTab]);

	const addToHistory = (q, l, c, t) => {
		if (!q && !l && (!c || c.length === 0) && (!t || t.length === 0)) return;
		const exists = searchHistory.some(
			(h) =>
				h.query === q &&
				h.location === l &&
				JSON.stringify(h.categories) === JSON.stringify(c) &&
				JSON.stringify(h.jobTypes) === JSON.stringify(t)
		);
		if (!exists) {
			const newHist = [
				{ query: q, location: l, categories: c, jobTypes: t },
				...searchHistory,
			].slice(0, 8);
			setSearchHistory(newHist);
		}
	};

	const handleSearch = useCallback(async (
		e,
		fromHistory = false,
		histQuery = "",
		histLocation = "",
		histCategories = [],
		histJobTypes = []
	) => {
		if (e) e.preventDefault();
		const q = fromHistory ? histQuery : query;
		const l = fromHistory ? histLocation : location;
		const c = fromHistory ? histCategories : selectedCategories;
		const t = fromHistory ? histJobTypes : selectedJobTypes;

		// Don't search if no query and no location
		if (!q.trim() && !l.trim()) return;

		setLoading(true);
		setHasSearched(true);
		setError(null);
		setResults([]);
		setSupabaseError(""); // Clear any previous save errors
		setSupabaseSuccess(""); // Clear any previous save success messages
		addToHistory(q, l, c, t);

		let apiUrl = `/api/jobs?query=${encodeURIComponent(
			q
		)}&location=${encodeURIComponent(l)}&limit=${jobLimit}`;
		if (c && c.length > 0) {
			apiUrl += c.map((cat) => `&category=${encodeURIComponent(cat)}`).join("");
		}

		// Create cache parameters
		const searchParams = { q, l, c, t, limit: jobLimit };

		try {
			const { response, data } = await cachedFetch(apiUrl, {}, searchParams);

			let jobs = data.results || [];
			if (t && t.length > 0)
				jobs = jobs.filter((j) => t.includes((j.job_type || "").toLowerCase()));

			if (!response.ok || data.error) {
				setError(data.error || "Failed to fetch jobs.");
				setResults([]);
			} else {
				setResults(jobs.map((j) => ({ ...j, fullDescription: j.description })));
			}
		} catch (err) {
			console.error("Search error:", err);
			setError(err instanceof Error ? err.message : "Failed to connect to server.");
			setResults([]);
		} finally {
			setLoading(false);
		}
	}, [query, location, selectedCategories, selectedJobTypes, jobLimit, cachedFetch]);

	const handleLoadMore = () => {
		setJobLimit((prev) => prev + 20);
		setTimeout(() => handleSearch(), 0);
	};

	const handleSaveJob = async (job) => {
		if (!user) {
			setSupabaseError("You must be logged in to save jobs.");
			return;
		}

		setSupabaseError("");
		setSupabaseSuccess("");
		setSupabaseLoading(true);

		try {
			const searchParams = {
				query,
				location,
				categories: selectedCategories,
				jobTypes: selectedJobTypes,
			};

			const response = await fetch('/api/saved-jobs', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					job_data: job,
					search_params: searchParams,
				}),
			});

			const result = await response.json();

			if (!response.ok) {
				setSupabaseError(result.error || 'Failed to save job');
			} else {
				// Invalidate cache and refresh saved jobs
				setSavedJobsCache(null);
				setSupabaseSuccess("Job saved successfully!");
				// Auto-clear success message after 3 seconds
				setTimeout(() => setSupabaseSuccess(""), 3000);
			}
		} catch (error) {
			console.error("Save job error:", error);
			setSupabaseError(`Failed to save job: ${error.message}`);
		} finally {
			setSupabaseLoading(false);
		}
	};

	const handleRemoveSavedJob = async (jobUrl) => {
		if (!user) {
			setSupabaseError("You must be logged in.");
			return;
		}

		setSupabaseError("");
		setSupabaseLoading(true);

		try {
			const response = await fetch('/api/saved-jobs', {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ jobUrl }),
			});

			const result = await response.json();

			if (!response.ok) {
				setSupabaseError(result.error || "Failed to remove job.");
			} else {
				// Invalidate cache and refresh saved jobs
				setSavedJobsCache(null);
				fetchSavedJobs();
			}
		} catch (error) {
			console.error('Error removing job:', error);
			setSupabaseError("Failed to remove job.");
		} finally {
			setSupabaseLoading(false);
		}
	};

	const handleCategoryChange = (slug) => {
		setSelectedCategories((prev) =>
			prev.includes(slug) ? prev.filter((c) => c !== slug) : [...prev, slug]
		);
	};
	const handleJobTypeChange = (value) => {
		setSelectedJobTypes((prev) =>
			prev.includes(value) ? prev.filter((j) => j !== value) : [...prev, value]
		);
	};

	// Close dropdowns on outside click
	useEffect(() => {
		const handleClick = (e) => {
			if (
				categoryDropdownRef.current &&
				!categoryDropdownRef.current.contains(e.target)
			)
				setShowCategoryDropdown(false);
			if (
				jobTypeDropdownRef.current &&
				!jobTypeDropdownRef.current.contains(e.target)
			)
				setShowJobTypeDropdown(false);
		};
		document.addEventListener("mousedown", handleClick);
		return () => document.removeEventListener("mousedown", handleClick);
	}, []);

	const popularLocations = [
		"Worldwide",
		"Anywhere",
		"United States",
		"Europe",
		"India",
		"Canada",
		"United Kingdom",
		"Australia",
		"Asia",
		"Africa",
		"South America",
		"Remote",
		// Major Indian cities
		"Mumbai",
		"Delhi",
		"Bangalore",
		"Hyderabad",
		"Chennai",
		"Pune",
		"Kolkata",
		"Ahmedabad",
		"Jaipur",
		"Surat",
		"Lucknow",
		"Indore",
		"Bhopal",
		"Nagpur",
		"Patna",
		"Chandigarh",
		"Coimbatore",
		"Kochi",
		"Noida",
		"Gurgaon",
		"Thane",
		"Visakhapatnam",
		"Vadodara",
		"Ludhiana",
		"Agra",
		"Nashik",
		"Faridabad",
		"Meerut",
		"Rajkot",
		"Varanasi",
	];

	const filteredLocationSuggestions = location
		? popularLocations.filter((loc) =>
			loc.toLowerCase().includes(location.toLowerCase())
		)
		: popularLocations;

	return (
		<div className="job-search-page">
			<div className="job-search-content">
				{/* Header */}
				<div className="job-search-header">
					<div className="job-search-heading">
						<div className="job-search-icon">
							<BriefcaseIcon />
						</div>
						<div>
							<span className="job-search-eyebrow">OPPORTUNITIES</span>
							<h2>Find your next opportunity</h2>
							<p>Search remote roles by title, skill, location, and employment type.</p>
						</div>
					</div>
				</div>

				<div className="job-search-tabs" role="tablist" aria-label="Job listings">
					<button
						type="button"
						role="tab"
						aria-selected={activeJobTab === "search"}
						onClick={() => setActiveJobTab("search")}
						className={activeJobTab === "search" ? "active" : ""}
					>
						Search Jobs
					</button>
					<button
						type="button"
						role="tab"
						aria-selected={activeJobTab === "saved"}
						onClick={() => setActiveJobTab("saved")}
						className={activeJobTab === "saved" ? "active" : ""}
					>
						Saved Jobs{savedJobs.length > 0 && <span>{savedJobs.length}</span>}
					</button>
				</div>
				{activeJobTab === "search" && (
					<>
						<div className="job-search-panel">
							<form
								onSubmit={handleSearch}
								className="job-search-form"
							>
								<input
									type="text"
									aria-label="Job title or keywords"
									placeholder="Job title or keywords"
									value={query}
									onChange={(e) => setQuery(e.target.value)}
									className="job-search-field"
								/>
								<div className="relative">
									<input
										type="text"
										aria-label="Location"
										placeholder="Location (optional)"
										value={location}
										onChange={(e) => {
											setLocation(e.target.value);
											setShowLocationSuggestions(true);
										}}
										onFocus={() => setShowLocationSuggestions(true)}
										onBlur={() =>
											setTimeout(() => setShowLocationSuggestions(false), 150)
										}
										className="job-search-field w-full"
									/>
									{showLocationSuggestions &&
										filteredLocationSuggestions.length > 0 && (
											<ul className="job-search-dropdown absolute left-0 right-0 z-20 max-h-48 overflow-y-auto">
												{filteredLocationSuggestions.map((loc, idx) => (
													<li
														key={loc}
														onMouseDown={() => {
															setLocation(loc);
															setShowLocationSuggestions(false);
														}}
														className="cursor-pointer"
													>
														{loc}
													</li>
												))}
											</ul>
										)}
								</div>
								{/* Multi-select categories */}
								<div className="relative" ref={categoryDropdownRef}>
									<button
										type="button"
										onClick={() => setShowCategoryDropdown((v) => !v)}
										className="job-search-filter"
									>
										{selectedCategories.length === 0
											? "All Categories"
											: selectedCategories
												.map(
													(slug) =>
														categories.find((c) => c.slug === slug)?.name || slug
												)
												.join(", ")}
									</button>
									{showCategoryDropdown && (
										<ul className="job-search-dropdown absolute left-0 right-0 z-20 max-h-48 overflow-y-auto p-2">
											{categories.map((cat) => (
												<li
													key={cat.slug}
													className="job-search-dropdown-option"
												>
													<input
														type="checkbox"
														checked={selectedCategories.includes(cat.slug)}
														onChange={() => handleCategoryChange(cat.slug)}
													/>
													<span>{cat.name}</span>
												</li>
											))}
										</ul>
									)}
								</div>
								{/* Multi-select job types */}
								<div className="relative" ref={jobTypeDropdownRef}>
									<button
										type="button"
										onClick={() => setShowJobTypeDropdown((v) => !v)}
										className="job-search-filter"
									>
										{selectedJobTypes.length === 0
											? "All Job Types"
											: selectedJobTypes
												.map(
													(val) =>
														jobTypes.find((j) => j.value === val)?.label || val
												)
												.join(", ")}
									</button>
									{showJobTypeDropdown && (
										<ul className="job-search-dropdown absolute left-0 right-0 z-20 max-h-48 overflow-y-auto p-2">
											{jobTypes.map((jt) => (
												<li
													key={jt.value}
													className="job-search-dropdown-option"
												>
													<input
														type="checkbox"
														checked={selectedJobTypes.includes(jt.value)}
														onChange={() => handleJobTypeChange(jt.value)}
													/>
													<span>{jt.label}</span>
												</li>
											))}
										</ul>
									)}
								</div>
								<button
									type="submit"
									className="job-search-submit"
									disabled={loading}
								>
									{loading ? "Searching..." : "Search"}
								</button>
							</form>
						</div>


						{error && <div className="job-search-message error" role="alert">{error}</div>}
						{supabaseError && <div className="job-search-message error" role="alert">{supabaseError}</div>}
						{supabaseSuccess && <div className="job-search-message success" role="status">{supabaseSuccess}</div>}
						<div>
							{loading && (
								<motion.div
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									className="flex items-center justify-center py-12"
								>
									<div className="flex flex-col items-center gap-4">
										<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
										<p className="text-cyan-400 font-medium">Searching for opportunities...</p>
									</div>
								</motion.div>
							)}
							{!loading && hasSearched && results.length === 0 && !error && (
								<motion.div
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									className="job-search-empty"
								>
									<BriefcaseIcon className="w-16 h-16 text-gray-500 mx-auto mb-4" />
									<p className="text-gray-400 text-lg font-medium mb-2">No jobs found</p>
									<p className="text-gray-500">Try adjusting your search terms or location</p>
								</motion.div>
							)}
							{!loading && !hasSearched && (
								<div className="job-search-empty">
									<BriefcaseIcon className="w-12 h-12 text-cyan-400 mx-auto mb-3" />
									<p className="text-gray-200 text-base font-semibold mb-1">Start with a role or skill</p>
									<p className="text-gray-500 text-sm">Add a keyword or location above to see matching opportunities.</p>
								</div>
							)}
							{results.length > 0 && (
								<>
									<div className="job-results-heading">
										<strong>{results.length} opportunities</strong>
										<span>Remote roles from Remotive</span>
									</div>
									<ul className="job-results-grid">
										{results.map((job, idx) => (
											<motion.li
												key={idx}
												initial={{ opacity: 0, y: 20 }}
												animate={{ opacity: 1, y: 0 }}
												transition={{
													duration: 0.4,
													delay: idx * 0.05,
													type: "spring",
													damping: 25,
													stiffness: 120
												}}
												className="job-result-card group relative"
											>
												{/* Subtle background gradient on hover */}
												<div className="job-result-hover" />

												<div className="relative z-10">
													<div className="job-result-header">
														<div className="flex-1">
															<h3 className="job-result-title">
																{job.title}
															</h3>
															<div className="job-result-meta">
																<span className="font-semibold text-gray-300">{job.company}</span>
																<span>•</span>
																<span className="text-cyan-400">{job.location}</span>
																{job.job_type && (
																	<>
																		<span>•</span>
																		<span className="px-2 py-1 bg-cyan-600/20 text-cyan-300 rounded-full text-xs font-medium">
																			{job.job_type.replace("_", " ").toUpperCase()}
																		</span>
																	</>
																)}
															</div>
														</div>

														<button
															onClick={(e) => {
																e.stopPropagation();
																handleSaveJob(job);
															}}
															disabled={supabaseLoading}
															className="job-save-button"
														>
															{supabaseLoading ? "Saving..." : "Save Job"}
														</button>
													</div>

													<p className="job-result-description">
														{job.description}
													</p>

													<div className="job-result-footer">
														<button
															onClick={(e) => {
																e.preventDefault();
																setSelectedJob(job);
																setShowJobModal(true);
															}}
															className="job-apply-button"
														>
															View Details & Apply
														</button>

														{job.salary && (
															<div className="text-right">
																<span className="text-green-400 font-bold text-lg">{job.salary}</span>
																<div className="text-xs text-gray-500">Salary</div>
															</div>
														)}
													</div>
												</div>
											</motion.li>
										))}
									</ul>
									<button
										onClick={handleLoadMore}
										className="mt-4 px-6 py-2 bg-cyan-400 text-black rounded font-semibold hover:bg-cyan-300"
									>
										Load More
									</button>
								</>
							)}
						</div>
					</>
				)}
				{activeJobTab === "saved" && (
					<div className="job-saved-panel">
						<div className="job-results-heading">
							<strong>Saved opportunities</strong>
							<span>Keep track of roles you want to revisit.</span>
						</div>
						{supabaseLoading && (
							<div className="job-search-empty">Loading saved jobs...</div>
						)}
						{supabaseError && (
							<div className="job-search-message error" role="alert">{supabaseError}</div>
						)}
						{!supabaseLoading && savedJobs.length === 0 && !supabaseError && (
							<div className="job-search-empty">
								<BriefcaseIcon className="w-12 h-12 text-gray-500 mx-auto mb-3" />
								<p className="text-gray-200 text-base font-semibold mb-1">No saved jobs yet</p>
								<p className="text-gray-500 text-sm">Save a role from your search results and it will appear here.</p>
							</div>
						)}
						{!supabaseLoading && savedJobs.length > 0 && (
							<ul className="space-y-4">
								{savedJobs.map((row, idx) => (
									<li
										key={row.id || idx}
										className="job-result-card saved-job-card"
									>
										<h3 className="text-lg font-semibold text-white">
											{row.job_data?.title}
										</h3>
										<p className="text-gray-300 text-sm">
											{row.job_data?.company} - {row.job_data?.location}
										</p>
										<p className="text-gray-400 text-sm mb-2">
											{row.job_data?.description}
										</p>
										<div className="text-xs text-cyan-300 mb-2">
											<span className="font-semibold">Search Params:</span>{" "}
											{row.search_params?.query &&
												`Keyword: ${row.search_params.query}, `}{" "}
											{row.search_params?.location &&
												`Location: ${row.search_params.location}, `}{" "}
											{row.search_params?.categories?.length > 0 &&
												`Categories: ${row.search_params.categories.join(
													", "
												)}, `}{" "}
											{row.search_params?.jobTypes?.length > 0 &&
												`Job Types: ${row.search_params.jobTypes.join(", ")}`}
										</div>
										<div className="flex gap-4">
											<a
												href="#"
												onClick={(e) => {
													e.preventDefault();
													setSelectedJob(row.job_data);
													setShowJobModal(true);
												}}
												className="text-cyan-400 hover:underline font-sans"
											>
												View & Apply
											</a>
											<button
												onClick={() => handleRemoveSavedJob(row.job_data?.url)}
												className="ml-2 px-3 py-1 bg-red-700 text-white rounded hover:bg-red-600 text-xs font-sans"
											>
												Remove
											</button>
										</div>
									</li>
								))}
							</ul>
						)}
					</div>
				)}
				{/* Job Details Modal */}
				{showJobModal && selectedJob && (
					<div className="job-details-overlay">
						<div className="job-details-modal">
							<button
								onClick={() => setShowJobModal(false)}
								className="absolute top-2 right-2 text-gray-400 hover:text-cyan-400 text-2xl font-bold"
								aria-label="Close"
							>
								&times;
							</button>
							<h2 className="text-2xl font-bold text-white mb-2">
								{selectedJob.title}
							</h2>
							<p className="text-cyan-300 font-semibold mb-1">
								{selectedJob.company} - {selectedJob.location}{" "}
								{selectedJob.job_type
									? `| ${selectedJob.job_type.replace("_", " ")}`
									: ""}
							</p>
							<div
								className="text-gray-200 text-sm mb-4 prose prose-invert max-w-none"
								style={{ maxHeight: "300px", overflowY: "auto" }}
								dangerouslySetInnerHTML={{
									__html: selectedJob.fullDescription || selectedJob.description,
								}}
							/>
							<a
								href={selectedJob.url}
								target="_blank"
								rel="noopener noreferrer"
								className="inline-block bg-cyan-400 text-black px-6 py-2 rounded font-semibold hover:bg-cyan-300 transition-colors mt-2"
							>
								Apply
							</a>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
