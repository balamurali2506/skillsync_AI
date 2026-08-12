export const INTERVIEWER_SYSTEM = `You are the AI interviewer for SkillSync AI, behaving like an experienced human recruiter: professional, calm, friendly, slightly challenging, conversational, patient.

RULES:
1. Ask ONE question at a time. Never multiple questions in one turn.
2. Analyze the candidate's previous answer before choosing the next question.
3. Vague answer → ask a concise follow-up. Strong answer → raise difficulty by 1. Weak answer → lower difficulty by 1. Never jump excessively.
4. Occasionally (not every turn) open speakText with a natural phrase like "That's interesting." / "Let's go a little deeper." / "Thanks. Let's move on."
5. If a resume is provided, ask ONLY about information actually present in it. Never invent companies, projects, skills or achievements.
6. If a job description is provided, prioritize its skills and responsibilities.
7. Do not reveal the scoring system. Do not give detailed feedback mid-interview. Do not give the candidate the answer.
8. Behavioral questions use STAR style. Technical questions progress: fundamentals → practical application → problem solving → challenging.
9. Return ONLY valid JSON, no markdown.`;

export function questionPrompt(ctx) {
  return `Interview config: role=${ctx.targetRole}, type=${ctx.interviewType}, baseDifficulty=${ctx.difficulty}, focus=${ctx.focus || 'general'}, adaptiveDifficulty=${ctx.currentDifficulty}/5.

${ctx.resumeSkills ? `RESUME SKILLS (real, from candidate's resume): ${ctx.resumeSkills}` : 'No resume provided.'}
${ctx.resumeText ? `RESUME EXCERPT:\n${ctx.resumeText}` : ''}
${ctx.jobDescription ? `JOB DESCRIPTION:\n${ctx.jobDescription}` : ''}
${ctx.history ? `RECENT EXCHANGE:\nQ: ${ctx.history.question}\nA: ${ctx.history.answer}\nEval overall: ${ctx.history.overall}/100` : 'This is the opening of the interview.'}

Generate the next question. For "Resume" type, ask about a specific real project/skill from the resume. For "HR"/"Behavioral", use communication/STAR questions. speakText = the exact sentence you would say aloud (include the question).

Return JSON: {"speakText": string, "question": string, "questionType": "technical|hr|behavioral|resume|job", "difficulty": 1-5}`;
}

export function evaluationPrompt({ question, answer, questionType }) {
  return `Question: ${question}
Candidate's spoken answer (transcribed): ${answer}
Question type: ${questionType}

Score every dimension 0-100 fairly for a student/fresher. Detect filler words (um, uh, like, basically, actually). Do not penalize occasional fillers heavily. For behavioral questions check STAR coverage.

Return JSON:
{"evaluation":{"technicalAccuracy":0,"relevance":0,"completeness":0,"communication":0,"confidence":0,"problemSolving":0,"depth":0,"overall":0},
"wentWell":[2 strings],"improve":[2 strings],"idealStructure":string,"recommendedAnswer":string,"fillerWords":[detected fillers]}`;
}

export function reportPrompt(interview) {
  const qa = interview.questions
    .filter((q) => q.answer)
    .map((q, i) => `${i + 1}. Q: ${q.question}\n   A: ${q.answer?.slice(0, 400)}\n   Score: ${q.evaluation?.overall}/100`)
    .join('\n');

  return `Interview: role=${interview.targetRole}, type=${interview.interviewType}.
Q&A history:
${qa}

Produce the final report. Never fabricate candidate information. If data is insufficient, use conservative values.

Return JSON:
{"overallScore":0-100,"readinessLevel":"Beginner|Developing|Interview Ready|Strong Candidate|Exceptional",
"categoryScores":{"technical":0,"communication":0,"confidence":0,"problemSolving":0,"behavioral":0,"roleKnowledge":0},
"communicationAnalysis":{"clarity":0,"conciseness":0,"confidence":0,"fillerWords":[],"averageAnswerDuration":0},
"strengths":[3-5],"weaknesses":[3-5],
"improvementPlan":[{"priority":"HIGH|MEDIUM|LOW","problem":"","whyItMatters":"","howToImprove":"","example":""}],
"coachingSummary":"3-4 sentences","practicePlan":[7 daily practice strings]}`;
}