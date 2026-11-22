// Simple Assessment Storage Utilities
import createClientForBrowser from '@/utils/supabase/client';

export class AssessmentDataStore {
    constructor() {
        this.supabase = createClientForBrowser();
        this.sessionData = {
            startTime: null,
            responses: [],
            jobRole: null,
            assessmentType: null
        };
    }

    // Start a new assessment session
    async startSession(assessmentType, jobRole = null) {
        this.sessionData = {
            startTime: new Date(),
            responses: [],
            jobRole,
            assessmentType
        };

        return true;
    }

    // Record a question response
    recordResponse({
        questionNumber,
        questionText,
        questionOptions,
        userAnswer,
        correctAnswer,
        isCorrect,
        timeTaken,
        category = null
    }) {
        const response = {
            questionNumber,
            questionText,
            questionOptions,
            userAnswer,
            correctAnswer,
            isCorrect,
            timeTaken,
            category,
            answeredAt: new Date()
        };

        this.sessionData.responses.push(response);
        return response;
    }

    // Complete and save the session
    async completeSession(userId) {
        if (!this.sessionData.responses.length) {
            throw new Error('No responses to save.');
        }

        const totalQuestions = this.sessionData.responses.length;
        const correctAnswers = this.sessionData.responses.filter(r => r.isCorrect).length;
        const score = Math.round((correctAnswers / totalQuestions) * 100);
        const totalTime = this.sessionData.startTime
            ? Math.max(0, Math.floor((new Date() - this.sessionData.startTime) / 1000))
            : 0;

        // Determine level based on score
        let level = 'Beginner';
        if (score >= 80) level = 'Expert';
        else if (score >= 60) level = 'Intermediate';
        else if (score >= 40) level = 'Novice';

        try {
            // Insert assessment result
            const { data: resultData, error: resultError } = await this.supabase
                .from('assessment_results')
                .insert([{
                    user_id: userId,
                    assessment_type: this.sessionData.assessmentType,
                    job_role: this.sessionData.jobRole,
                    score: score,
                    level: level,
                    number_of_questions: totalQuestions,
                    correct_answers: correctAnswers,
                    time_taken: totalTime,
                    questions_data: this.sessionData.responses,
                    completed_at: new Date().toISOString()
                }])
                .select()
                .single();

            if (resultError) {
                const localRecord = {
                    id: `local-${Date.now()}`,
                    user_id: userId,
                    assessment_type: this.sessionData.assessmentType,
                    job_role: this.sessionData.jobRole,
                    score,
                    level,
                    number_of_questions: totalQuestions,
                    correct_answers: correctAnswers,
                    time_taken: totalTime,
                    questions_data: this.sessionData.responses,
                    completed_at: new Date().toISOString(),
                    stored_locally: true,
                };
                saveLocalAssessmentResult(userId, localRecord);
                console.warn('Assessment saved locally because Supabase storage failed:', resultError.message);

                const completedAssessmentType = this.sessionData.assessmentType;
                this.sessionData = {
                    startTime: null,
                    responses: [],
                    jobRole: null,
                    assessmentType: null
                };

                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('talento:assessment-completed', {
                        detail: { assessmentType: completedAssessmentType, score, level }
                    }));
                }

                return {
                    success: true,
                    data: localRecord,
                    score,
                    level,
                    totalQuestions,
                    correctAnswers,
                    totalTime,
                    storedLocally: true,
                };
            }

            const completedAssessmentType = this.sessionData.assessmentType;

            // Reset session
            this.sessionData = {
                startTime: null,
                responses: [],
                jobRole: null,
                assessmentType: null
            };

            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('talento:assessment-completed', {
                    detail: {
                        assessmentType: completedAssessmentType,
                        score,
                        level,
                    }
                }));
            }

            return {
                success: true,
                data: resultData,
                score,
                level,
                totalQuestions,
                correctAnswers,
                totalTime
            };

        } catch (error) {
            console.error('Error completing assessment session:', error);
            throw error;
        }
    }

    // Get current session progress
    getProgress() {
        const totalQuestions = this.sessionData.responses.length;
        const correctAnswers = this.sessionData.responses.filter(r => r.isCorrect).length;

        return {
            totalQuestions,
            correctAnswers,
            accuracy: totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0,
            responses: this.sessionData.responses
        };
    }
}

const LOCAL_ASSESSMENT_KEY = 'talento:assessment-results';

function getLocalAssessmentResults(userId) {
    if (typeof window === 'undefined') return [];

    try {
        const allResults = JSON.parse(localStorage.getItem(LOCAL_ASSESSMENT_KEY) || '{}');
        return Array.isArray(allResults[userId]) ? allResults[userId] : [];
    } catch {
        return [];
    }
}

function saveLocalAssessmentResult(userId, result) {
    if (typeof window === 'undefined') return;

    try {
        const allResults = JSON.parse(localStorage.getItem(LOCAL_ASSESSMENT_KEY) || '{}');
        const userResults = Array.isArray(allResults[userId]) ? allResults[userId] : [];
        allResults[userId] = [result, ...userResults].slice(0, 100);
        localStorage.setItem(LOCAL_ASSESSMENT_KEY, JSON.stringify(allResults));
    } catch (error) {
        console.error('Could not save assessment locally:', error);
    }
}

export function getStoredAssessmentResults(userId) {
    return getLocalAssessmentResults(userId);
}

export async function getMergedAssessmentResults(userId) {
    const supabase = createClientForBrowser();
    const { data, error } = await supabase
        .from('assessment_results')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false });

    const remoteResults = !error && Array.isArray(data) ? data : [];
    const localResults = getLocalAssessmentResults(userId);
    const merged = new Map();

    [...remoteResults, ...localResults].forEach((result) => {
        const key = `${result.assessment_type || result.assessmentType || 'unknown'}:${result.completed_at || result.created_at || result.id || ''}`;
        if (!merged.has(key)) merged.set(key, result);
    });

    return Array.from(merged.values()).sort((a, b) =>
        new Date(b.completed_at || b.created_at || 0) - new Date(a.completed_at || a.created_at || 0)
    );
}

// Helper functions for simple assessment data retrieval
export async function getUserAssessmentResults(userId) {
    return await getMergedAssessmentResults(userId);
}

export async function getUserProgress(userId) {
    const supabase = createClientForBrowser();

    const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

export async function getAssessmentStats(userId) {
    const supabase = createClientForBrowser();

    // Get assessment results
    const { data: results, error: resultError } = await supabase
        .from('assessment_results')
        .select('assessment_type, job_role, score, level, number_of_questions, correct_answers, completed_at')
        .eq('user_id', userId);

    const mergedResults = await getMergedAssessmentResults(userId);

    // Get progress data
    const { data: progress, error: progressError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId);

    if (progressError) throw progressError;

    return {
        results: mergedResults,
        progress: progressError ? [] : (progress || [])
    };
}

// Simple assessment result storage function
export async function storeAssessmentResult({
    userId,
    assessmentType,
    score,
    level,
    numQuestions,
    jobRole = null,
    responses = []
}) {
    const supabase = createClientForBrowser();

    // Calculate correct answers
    const correctAnswers = responses.filter(r => r.isCorrect).length;

    // Store in assessment_results table
    const { data, error } = await supabase
        .from('assessment_results')
        .insert([{
            user_id: userId,
            assessment_type: assessmentType,
            job_role: jobRole,
            score,
            level,
            number_of_questions: numQuestions,
            correct_answers: correctAnswers,
            questions_data: responses,
            completed_at: new Date().toISOString()
        }])
        .select()
        .single();

    if (error) {
        const localRecord = {
            id: `local-${Date.now()}`,
            user_id: userId,
            assessment_type: assessmentType,
            job_role: jobRole,
            score,
            level,
            number_of_questions: numQuestions,
            correct_answers: correctAnswers,
            questions_data: responses,
            completed_at: new Date().toISOString(),
            stored_locally: true,
        };
        saveLocalAssessmentResult(userId, localRecord);

        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('talento:assessment-completed', {
                detail: { assessmentType, score, level }
            }));
        }

        return {
            success: true,
            data: localRecord,
            score,
            level,
            correctAnswers,
            totalQuestions: numQuestions,
            storedLocally: true,
        };
    }

    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('talento:assessment-completed', {
            detail: { assessmentType, score, level }
        }));
    }

    return {
        success: true,
        data,
        score,
        level,
        correctAnswers,
        totalQuestions: numQuestions
    };
}