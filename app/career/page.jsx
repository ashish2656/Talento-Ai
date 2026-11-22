"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AcademicCapIcon,
  BriefcaseIcon,
  FlagIcon,
  ChartBarIcon,
  DocumentTextIcon,
  SparklesIcon,
  ArrowRightIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import AssessmentLayout from "../components/AssessmentLayout";

const CAREER_STEPS = [
  {
    step: "01",
    title: "Self-Assessment",
    description: "Understand your strengths, interests and skills.",
    action: { label: "Take Assessment", href: "/assessment" },
    icon: AcademicCapIcon,
  },
  {
    step: "02",
    title: "Explore Career Paths",
    description: "Discover roles and industries that match your profile.",
    icon: BriefcaseIcon,
  },
  {
    step: "03",
    title: "Set Goals",
    description: "Define clear short-term and long-term milestones.",
    icon: FlagIcon,
  },
  {
    step: "04",
    title: "Track Progress",
    description: "Monitor results and improve with every step.",
    icon: ChartBarIcon,
  },
];

const CAREER_PATHS = [
  "Software Engineer",
  "Data Scientist",
  "Product Manager",
  "Digital Marketer",
  "Financial Analyst",
  "UX/UI Designer",
  "Mechanical Engineer",
  "Entrepreneur",
];

export default function CareerPage() {
  const router = useRouter();
  const [activeTool, setActiveTool] = useState("ats");
  const [file, setFile] = useState(null);
  const [jobRole, setJobRole] = useState("Software Engineer");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [selectedPath, setSelectedPath] = useState("");
  const [completedSteps, setCompletedSteps] = useState([]);

  useEffect(() => {
    try {
      const savedPath = localStorage.getItem("talento:selected-career-path");
      const savedSteps = JSON.parse(localStorage.getItem("talento:career-steps") || "[]");
      if (savedPath) {
        setSelectedPath(savedPath);
        setJobRole(savedPath);
      }
      if (Array.isArray(savedSteps)) setCompletedSteps(savedSteps);
    } catch {
      setCompletedSteps([]);
    }
  }, []);

  const handleFileChange = (event) => {
    const nextFile = event.target.files?.[0] || null;
    if (!nextFile) {
      setFile(null);
      return;
    }

    const validExtension = /\.(pdf|docx)$/i.test(nextFile.name);
    if (!validExtension) {
      setFile(null);
      setError("Please upload a PDF or DOCX resume.");
      return;
    }

    if (nextFile.size > 10 * 1024 * 1024) {
      setFile(null);
      setError("Resume must be 10MB or smaller.");
      return;
    }

    setFile(nextFile);
    setResult(null);
    setError("");
  };

  const toggleCareerStep = (stepNumber) => {
    const nextSteps = completedSteps.includes(stepNumber)
      ? completedSteps.filter((step) => step !== stepNumber)
      : [...completedSteps, stepNumber].sort();
    setCompletedSteps(nextSteps);
    localStorage.setItem("talento:career-steps", JSON.stringify(nextSteps));
  };

  const selectCareerPath = (path) => {
    setSelectedPath(path);
    setJobRole(path);
    localStorage.setItem("talento:selected-career-path", path);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) {
      setError("Please upload a resume file (PDF or DOCX).");
      return;
    }

    setLoading(true);
    setResult(null);
    setError("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("job_role", jobRole);

    try {
      const endpoint = activeTool === "ats"
        ? "/api/assessment/ats_score/"
        : "/api/assessment/resume_optimize/";
      const response = await fetch(endpoint, { method: "POST", body: formData });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Something went wrong.");
      } else if (activeTool === "ats") {
        const analysis = data.analysis || data.result || "";
        const scoreMatch = typeof analysis === "string"
          ? analysis.match(/ATS(?:\s*Score)?\s*[:|-]?\s*(\d{1,3})(?:\s*\/\s*100)?/i)
          : null;
        setResult({
          kind: "ats",
          score: scoreMatch ? Math.min(Number(scoreMatch[1]), 100) : null,
          analysis: typeof analysis === "string" ? analysis : JSON.stringify(analysis, null, 2),
        });
      } else {
        setResult({
          kind: "optimizer",
          analysis: typeof (data.result || data) === "string"
            ? (data.result || data)
            : JSON.stringify(data.result || data, null, 2),
        });
      }
    } catch (requestError) {
      setError("Failed to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AssessmentLayout activeTab="career-planning">
      <main className="career-planning-page">
        {loading && (
          <div className="career-loading-overlay">
            <div className="career-loading-card">
              <span className="career-loading-ring" />
              <strong>Analyzing Resume</strong>
              <p>Preparing your career insights...</p>
            </div>
          </div>
        )}

        <header className="career-header">
          <div>
            <div className="career-eyebrow"><span /> CAREER PLANNING</div>
            <h1>Build a clear career direction</h1>
            <p>Move from self-discovery to focused, measurable career action.</p>
          </div>
          <button type="button" onClick={() => router.push("/assessment")} className="career-header-action">
            Start assessment <ArrowRightIcon />
          </button>
        </header>

        <section className="career-steps-section">
          <div className="career-section-heading">
            <div>
              <span>YOUR ROADMAP</span>
              <h2>Plan in four focused steps</h2>
            </div>
            <span className="career-progress-label">{completedSteps.length} of 4 completed</span>
          </div>

          <div className="career-steps-grid">
            {CAREER_STEPS.map((item) => {
              const Icon = item.icon;
              const stepNumber = Number(item.step);
              const completed = completedSteps.includes(stepNumber);
              return (
                <article
                  className={`career-step-card ${completed ? "completed" : ""}`}
                  key={item.step}
                  onClick={() => toggleCareerStep(stepNumber)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      toggleCareerStep(stepNumber);
                    }
                  }}
                >
                  <div className="career-step-top">
                    <div className="career-step-icon"><Icon /></div>
                    <span>{item.step}</span>
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  {item.action && (
                    <button type="button" onClick={() => router.push(item.action.href)} className="career-step-link">
                      {item.action.label} <ArrowRightIcon />
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        <div className="career-content-grid">
          <section className="career-paths-panel">
            <div className="career-panel-heading">
              <div>
                <span>OPPORTUNITIES</span>
                <h2>Popular career paths</h2>
              </div>
              <BriefcaseIcon />
            </div>
            <div className="career-path-list">
              {CAREER_PATHS.map((path) => (
                <button
                  type="button"
                  key={path}
                  className={selectedPath === path ? "active" : ""}
                  onClick={() => selectCareerPath(path)}
                >
                  {path}
                </button>
              ))}
            </div>
          </section>

          <section className="career-next-panel">
            <div className="career-panel-heading">
              <div>
                <span>NEXT STEPS</span>
                <h2>Recommended actions</h2>
              </div>
              <CheckCircleIcon />
            </div>
            <div className="career-next-list">
              <div><span>1</span><p>Take assessments to identify strengths.</p></div>
              <div><span>2</span><p>Research roles and industries of interest.</p></div>
              <div><span>3</span><p>Set measurable goals and review them weekly.</p></div>
              <div><span>4</span><p>Track progress and celebrate milestones.</p></div>
            </div>
          </section>
        </div>

        <section className="career-tools-panel">
          <div className="career-panel-heading">
            <div>
              <span>CAREER TOOLS</span>
              <h2>Resume intelligence</h2>
            </div>
            <DocumentTextIcon />
          </div>

          <div className="career-tool-tabs">
            <button type="button" className={activeTool === "ats" ? "active" : ""} onClick={() => setActiveTool("ats")}>ATS Score</button>
            <button type="button" className={activeTool === "optimizer" ? "active" : ""} onClick={() => setActiveTool("optimizer")}>Resume Optimizer</button>
          </div>

          <form onSubmit={handleSubmit} className="career-tool-form">
            <label>
              <span>Resume file</span>
              <div className="career-file-input">
                <DocumentTextIcon />
                <input type="file" accept=".pdf,.docx" onChange={handleFileChange} />
                <small>{file ? file.name : "PDF or DOCX"}</small>
              </div>
            </label>

            <label>
              <span>Target job role</span>
              <input type="text" value={jobRole} onChange={(event) => setJobRole(event.target.value)} placeholder="Software Engineer" />
            </label>

            <button type="submit" className="career-analyze-button" disabled={loading || !file}>
              <SparklesIcon />
              {loading ? "Processing..." : activeTool === "ats" ? "Get ATS Score" : "Optimize Resume"}
            </button>
          </form>

          {error && <div className="career-error">{error}</div>}

          {result && (
            <div className="career-result-panel">
              {result.kind === "ats" ? (
                <>
                  <div className="career-score">
                    <span>ATS Analysis</span>
                    {result.score !== null ? (
                      <strong>{result.score}<small>/100</small></strong>
                    ) : (
                      <strong className="career-score-text">Detailed</strong>
                    )}
                  </div>
                  <pre>{result.analysis}</pre>
                </>
              ) : (
                <>
                  <h3>Resume Optimization Suggestions</h3>
                  <pre>{result.analysis}</pre>
                </>
              )}
            </div>
          )}
        </section>
      </main>
    </AssessmentLayout>
  );
}
