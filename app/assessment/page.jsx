"use client";

import { motion } from "framer-motion";
import {
  CpuChipIcon,
  ChatBubbleLeftRightIcon,
  CodeBracketIcon,
  UserIcon,
  ArrowRightIcon,
  ClockIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import AssessmentLayout from "../components/AssessmentLayout";

export default function AssessmentPage() {
  const assessments = [
    {
      title: "General Aptitude",
      description: "Logical reasoning, problem-solving and analytical skills.",
      icon: CpuChipIcon,
      href: "/assessment/aptitude",
      duration: "15 min",
      questions: "10 questions",
      accent: "cyan",
    },
    {
      title: "Communication",
      description: "Written and verbal communication in workplace situations.",
      icon: ChatBubbleLeftRightIcon,
      href: "/assessment/communication",
      duration: "12 min",
      questions: "10 scenarios",
      accent: "green",
    },
    {
      title: "Technical",
      description: "Programming knowledge and technical problem-solving.",
      icon: CodeBracketIcon,
      href: "/assessment/technical",
      duration: "20 min",
      questions: "10 questions",
      accent: "purple",
    },
    {
      title: "Personality",
      description: "Work style, leadership approach and communication preferences.",
      icon: UserIcon,
      href: "/assessment/personality",
      duration: "12 min",
      questions: "10 questions",
      accent: "amber",
    },
  ];

  const benefits = [
    ["Skill clarity", "Identify strengths and areas to improve."],
    ["Career direction", "Understand which roles fit your profile."],
    ["Interview readiness", "Practice the formats used in evaluations."],
    ["Personal insight", "Build awareness of work preferences."],
  ];

  return (
    <AssessmentLayout>
      <main className="assessment-center">
        <motion.header
          className="assessment-center-header"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <div className="assessment-eyebrow"><span /> ASSESSMENT CENTER</div>
            <h1>Discover your career strengths</h1>
            <p>Choose an assessment to understand your skills and get practical improvement insights.</p>
          </div>
          <Link href="/assessment/results" className="assessment-results-button">
            <ChartBarIcon />
            View results
          </Link>
        </motion.header>

        <section className="assessment-grid" aria-label="Available assessments">
          {assessments.map((assessment, index) => {
            const Icon = assessment.icon;
            return (
              <motion.article
                key={assessment.title}
                className={`assessment-card ${assessment.accent}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06 }}
              >
                <Link href={assessment.href} className="assessment-card-link">
                  <div className="assessment-card-top">
                    <div className="assessment-card-icon"><Icon /></div>
                    <span className="assessment-card-status">Available</span>
                  </div>

                  <div className="assessment-card-copy">
                    <h2>{assessment.title}</h2>
                    <p>{assessment.description}</p>
                  </div>

                  <div className="assessment-card-footer">
                    <div className="assessment-meta">
                      <span><ClockIcon />{assessment.duration}</span>
                      <span>{assessment.questions}</span>
                    </div>
                    <span className="assessment-start">
                      Start assessment <ArrowRightIcon />
                    </span>
                  </div>
                </Link>
              </motion.article>
            );
          })}
        </section>

        <motion.section
          className="assessment-benefits"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div className="assessment-benefits-heading">
            <span className="assessment-section-kicker">WHY ASSESS?</span>
            <h2>Turn results into clear next steps</h2>
          </div>
          <div className="assessment-benefits-grid">
            {benefits.map(([title, description]) => (
              <div className="assessment-benefit" key={title}>
                <span className="assessment-benefit-dot" />
                <div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.section>
      </main>
    </AssessmentLayout>
  );
}
