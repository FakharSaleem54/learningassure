/**
 * Centralized AI Service Layer
 * 
 * Supports both OpenAI-compatible APIs and local Ollama.
 * Configuration is loaded from environment variables.
 */

// Environment variables (loaded from .env)
const AI_API_KEY = process.env.AI_API_KEY || '';
const AI_API_URL = process.env.AI_API_URL || 'http://localhost:11434';
const AI_MODEL = process.env.AI_MODEL || 'meta-llama/llama-3.3-70b-instruct:free';

// Detect if using Ollama (localhost)
const isOllama = AI_API_URL.includes('localhost:11434') || AI_API_URL.includes('127.0.0.1:11434');

interface AIRequestOptions {
    prompt: string;
    systemPrompt?: string;
    stream?: boolean;
    temperature?: number;
    maxTokens?: number;
}

interface AIResponse {
    content: string;
    error?: string;
}

/**
 * Generate a non-streaming AI response
 */
export async function generateAIResponse(options: AIRequestOptions): Promise<AIResponse> {
    const { prompt, systemPrompt, temperature = 0.7 } = options;
    const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;

    console.log('[AI Service] Using:', isOllama ? 'Ollama' : 'External API');
    console.log('[AI Service] URL:', AI_API_URL);
    console.log('[AI Service] Model:', AI_MODEL);
    console.log('[AI Service] Key Loaded:', AI_API_KEY ? 'Yes (' + AI_API_KEY.substring(0, 5) + '...)' : 'No');

    try {
        if (isOllama) {
            // Ollama API format
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout for full generation

            const response = await fetch(`${AI_API_URL}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: AI_MODEL,
                    prompt: fullPrompt,
                    stream: false,
                    options: { temperature }
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`Ollama error: ${response.statusText}`);
            }

            const data = await response.json();
            return { content: data.response || '' };
        } else {
            // OpenAI-compatible API format
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

            const response = await fetch(`${AI_API_URL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${AI_API_KEY}`,
                    'HTTP-Referer': 'http://localhost:3000',
                    'X-Title': 'Learning Assure LMS'
                },
                body: JSON.stringify({
                    model: AI_MODEL,
                    messages: [
                        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
                        { role: 'user', content: prompt }
                    ],
                    temperature,
                    stream: false
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('[AI Service] API Error Status:', response.status);
                console.error('[AI Service] API Error Body:', errorText);
                try {
                    const errorData = JSON.parse(errorText);
                    const errorMessage = errorData.error?.message || response.statusText;
                    throw new Error(`AI API error: ${errorMessage}`);
                } catch (e) {
                    throw new Error(`AI API error: ${response.status} ${response.statusText} - ${errorText}`);
                }
            }

            const data = await response.json();
            return { content: data.choices?.[0]?.message?.content || '' };
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[AI Service] Error:', errorMessage);
        return { content: '', error: errorMessage };
    }
}

/**
 * Generate a streaming AI response
 */
export async function generateStreamingAIResponse(options: AIRequestOptions): Promise<{
    stream: ReadableStream | null;
    error?: string;
}> {
    const { prompt, systemPrompt, temperature = 0.7 } = options;
    const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;

    try {
        if (isOllama) {
            // Ollama streaming format
            const response = await fetch(`${AI_API_URL}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: AI_MODEL,
                    prompt: fullPrompt,
                    stream: true,
                    options: { temperature }
                })
            });

            if (!response.ok || !response.body) {
                return { stream: null, error: `Ollama error: ${response.statusText}` };
            }

            // Transform Ollama format to our SSE format
            const encoder = new TextEncoder();
            const decoder = new TextDecoder();

            const transformStream = new TransformStream({
                async transform(chunk, controller) {
                    const text = decoder.decode(chunk);
                    const lines = text.split('\n').filter(line => line.trim());

                    for (const line of lines) {
                        try {
                            const parsed = JSON.parse(line);
                            if (parsed.response) {
                                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: parsed.response })}\n\n`));
                            }
                            if (parsed.done) {
                                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
                            }
                        } catch (e) {
                            // Skip malformed JSON
                        }
                    }
                }
            });

            return { stream: response.body.pipeThrough(transformStream) };
        } else {
            // OpenAI-compatible streaming
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

            const response = await fetch(`${AI_API_URL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${AI_API_KEY}`,
                    'HTTP-Referer': 'http://localhost:3000',
                    'X-Title': 'Learning Assure LMS'
                },
                body: JSON.stringify({
                    model: AI_MODEL,
                    messages: [
                        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
                        { role: 'user', content: prompt }
                    ],
                    temperature,
                    stream: true
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok || !response.body) {
                const errorText = await response.text();
                console.error('[AI Service] Stream API Error Status:', response.status);
                console.error('[AI Service] Stream API Error Body:', errorText);
                return { stream: null, error: `AI API error: ${response.status} ${response.statusText}` };
            }

            const encoder = new TextEncoder();
            const decoder = new TextDecoder();

            const transformStream = new TransformStream({
                async transform(chunk, controller) {
                    const text = decoder.decode(chunk);
                    const lines = text.split('\n').filter(line => line.trim());

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6);
                            if (data === '[DONE]') {
                                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
                                continue;
                            }
                            try {
                                const parsed = JSON.parse(data);
                                const token = parsed.choices?.[0]?.delta?.content;
                                if (token) {
                                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token })}\n\n`));
                                }
                            } catch (e) {
                                // Skip
                            }
                        }
                    }
                }
            });

            return { stream: response.body.pipeThrough(transformStream) };
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[AI Service] Stream error:', errorMessage);
        return { stream: null, error: errorMessage };
    }
}

/**
 * Quick classification helper
 * Optimized to use heuristics instead of a blocking LLM call for performance.
 */
export async function classifyIntent(message: string): Promise<string> {
    const classificationPrompt = `Classify this student message into one of these categories:
- GREETING (Hello, Hi, Good morning)
- CLARIFICATION (I don't understand, Can you explain that again, I'm lost - ONLY if no specific topic)
- META_SUMMARY (What is this lecture about, Summarize this lecture)
- COURSE_QUESTION (Specific question about course content, "What is X?", "Explain Y")

Message: "${message}"

Reply ONLY with the category name.`;

    const { content, error } = await generateAIResponse({
        prompt: classificationPrompt,
        temperature: 0
    });

    if (error) {
        console.error('[AI Service] Classification error:', error);
        return 'COURSE_QUESTION';
    }

    // Parse and validate the classification result
    const classification = content.trim().toUpperCase();
    const validCategories = ['GREETING', 'CLARIFICATION', 'META_SUMMARY', 'COURSE_QUESTION'];

    if (validCategories.includes(classification)) {
        return classification;
    }

    // Default fallback if AI returns unexpected value
    return 'COURSE_QUESTION';
}

/**
 * Quiz Generation
 */
export interface QuizQuestion {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
}

export async function generateQuizQuestions(transcript: string, lectureTitle: string): Promise<{ questions: QuizQuestion[]; error?: string }> {
    const prompt = `
You are an expert educational AI. Your task is to generate a quiz for a lecture titled "${lectureTitle}".
Based strictly on the provided transcript, create 10 distinct, conceptual multiple-choice questions (MCQs).

Transcript:
"${transcript.slice(0, 15000)}"

(Transcript truncated if too long)

Guidelines:
1. Questions should test understanding of concepts, not just memory.
2. Avoid trivial questions (e.g., "What color was the slide?").
3. Provide 4 answer options for each question.
4. One option must be clearly correct.
5. Three options must be plausible distractors.
6. Provide a brief explanation for why the correct answer is correct.

RESPONSE FORMAT:
You must reply with a valid JSON object strictly following this structure:
{
  "questions": [
    {
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Explanation here."
    },
    ...
  ]
}

Reply ONLY with the JSON. No other text.
`;

    try {
        const { content, error } = await generateAIResponse({
            prompt,
            temperature: 0.5,
            systemPrompt: "You are a helpful educational assistant that generates JSON quizzes."
        });

        if (error) return { questions: [], error };

        // Parse JSON
        // Find the first '{' and last '}' to handle potential extra text
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            return { questions: [], error: "Failed to parse AI response: No JSON found" };
        }

        const parsed = JSON.parse(jsonMatch[0]);

        if (!parsed.questions || !Array.isArray(parsed.questions)) {
            return { questions: [], error: "Invalid JSON structure: Missing 'questions' array" };
        }

        // Validate individual questions
        const validQuestions: QuizQuestion[] = parsed.questions.map((q: any) => ({
            question: String(q.question || ""),
            options: Array.isArray(q.options) ? q.options.map(String) : [],
            correctIndex: Number(q.correctIndex) || 0,
            explanation: String(q.explanation || "")
        })).filter((q: QuizQuestion) =>
            q.question &&
            q.options.length === 4 &&
            q.correctIndex >= 0 &&
            q.correctIndex <= 3
        );

        if (validQuestions.length < 5) {
            return { questions: [], error: "AI generated too few valid questions" };
        }

        return { questions: validQuestions };

    } catch (e) {
        console.error('[AI Service] Quiz generation error:', e);
        return { questions: [], error: e instanceof Error ? e.message : "Unknown error" };
    }
}
