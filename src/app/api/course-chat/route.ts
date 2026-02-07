import { NextRequest } from 'next/server';
import { findRelevantChunks } from '@/lib/ai/vector-store';
import { prisma } from '@/lib/prisma';
import { generateAIResponse, generateStreamingAIResponse, classifyIntent } from '@/lib/ai/ai-service';
import { AIContextBuilder } from '@/lib/ai/context-builder';

export const runtime = 'nodejs';
export const maxDuration = 60; // Allow 60 seconds for AI processing

export async function POST(req: NextRequest) {
    try {
        const { question, courseId, currentLectureTitle, currentLectureId, stream = false } = await req.json();

        if (!question || !courseId) {
            return new Response(JSON.stringify({ error: 'Missing question or courseId' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 1. Classify Intent using centralized AI service
        const intent = await classifyIntent(question);

        // Handle quick responses (no streaming needed)
        if (intent.includes('GREETING')) {
            const answer = "Hello! I am your AI Course Assistant. I'm here to help you understand the course material. You can ask me to summarize lectures or explain specific concepts.";
            await saveMessages(courseId, question, answer);
            return new Response(JSON.stringify({ answer, context: [] }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Build prompt based on intent
        let systemPrompt = '';
        let contextText = '';
        let contextTitles: string[] = [];

        if (intent.includes('META_SUMMARY') && currentLectureTitle && currentLectureId) {
            // Use the new AIContextBuilder for full lesson context
            const lessonContext = await AIContextBuilder.getLessonContext(currentLectureId);

            if (!lessonContext || !lessonContext.combinedContext) {
                const answer = "I don't have enough content to summarize this specific lecture yet.";
                await saveMessages(courseId, question, answer);
                return new Response(JSON.stringify({ answer, context: [] }), {
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            contextText = lessonContext.combinedContext;
            contextTitles = [currentLectureTitle];
            systemPrompt = `You are a helpful teaching assistant. Summarize the following lecture content using simple language and examples.`;
        } else {
            // COURSE_QUESTION or CLARIFICATION
            const meaningfulChunks = await findRelevantChunks(question, courseId);

            if (meaningfulChunks.length > 0) {
                contextTitles = meaningfulChunks.map((c: { lectureTitle: string }) => c.lectureTitle);
                contextText = meaningfulChunks.map((c: { chunkText: string }) => c.chunkText).join("\n\n---\n\n");
            } else if (currentLectureId) {
                // FALLBACK: If RAG finds nothing, use the current lecture's full context
                console.log('Chat: RAG returned no results, falling back to current lecture context.');
                const lessonContext = await AIContextBuilder.getLessonContext(currentLectureId);
                if (lessonContext && lessonContext.combinedContext) {
                    contextText = lessonContext.combinedContext;
                    contextTitles = [currentLectureTitle || 'Current Lecture'];
                }
            }

            const isAmbiguous = intent.includes('CLARIFICATION') && !intent.includes('QUESTION');
            if (isAmbiguous && !contextText) {
                const answer = "I'd be happy to help clarify. Could you specify which topic or concept you're finding difficult?";
                await saveMessages(courseId, question, answer);
                return new Response(JSON.stringify({ answer, context: [] }), {
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            systemPrompt = `You are an AI Course Assistant inside an LMS.

Your job is to help students understand the current lecture while allowing
reasonable, academically related questions.

PRIMARY CONTEXT SOURCES:
- Lecture notes
- Video transcript
- Course subject metadata

INTELLIGENCE RULESET (CRITICAL):

1. CLASSIFY USER QUESTIONS:

A) IN-TOPIC / RELATED:
   - Explicitly about the lecture or general logical extensions (definitions, prerequisites, mapped concepts).

B) GENERAL KNOWLEDGE / CONTEXTUAL:
   - Math, science, or logic questions that might not be *explicitly* in the transcript but are valid educational queries.
   - General pleasantries or small talk.

C) COMPLETELY UNRELATED:
   - Questions about unrelated pop culture, sports, or topics completely disconnected from education/learning.

2. RESPONSE BEHAVIOR:

IF (A – In-Topic):
→ Answer fully using lecture context.

IF (B – General/Contextual):
→ Answer helpfuly. You MAY use general knowledge.
→ If it's a specific math/logic question (e.g. "adding -1 and -1"), ANSWER IT. Do not refuse valid educational questions just because they aren't in the transcript.
→ Briefly mention if it's outside the specific lecture scope, but provide the answer.

IF (C – Completely Unrelated):
→ Politely steer back to the topic.

3. HALLUCINATION PREVENTION:
- Do not claim the *lecture* said something if it didn't. Use general knowledge phrases like "Generally in this field..." or "In mathematics..."

4. ABSOLUTE RULE:
- BE HELPFUL. If a student asks a valid question (even if slightly off-topic), answer it.
- Do not be robotic or overly restrictive.

5. REFUSAL STYLE:
- Only refuse if the question is harmful, offensive, or completely incoherent.
- For merely off-topic but harmless questions, give a short answer and bridge back to the lesson.`;
        }

        const fullPrompt = `Lecture Content:
${contextText}

Question: ${question}

Answer:`;

        // Save student message first
        await prisma.chatMessage.create({
            data: { courseId, sender: 'student', messageText: question }
        });

        // STREAMING RESPONSE
        if (stream) {
            const { stream: aiStream, error } = await generateStreamingAIResponse({
                prompt: fullPrompt,
                systemPrompt
            });

            if (error || !aiStream) {
                const errorMsg = error || 'Failed to generate response';
                return new Response(JSON.stringify({ error: errorMsg }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            // Wrap the stream to save the final message and add metadata
            const encoder = new TextEncoder();
            const decoder = new TextDecoder();
            let fullAnswer = '';
            let buffer = '';

            const wrappedStream = new TransformStream({
                async transform(chunk, controller) {
                    buffer += decoder.decode(chunk, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        const trimmedLine = line.trim();
                        if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue;

                        try {
                            const data = trimmedLine.slice(6);
                            const parsed = JSON.parse(data);

                            if (parsed.token) {
                                fullAnswer += parsed.token;
                            }

                            if (parsed.done) {
                                // Save AI response when streaming completes
                                await prisma.chatMessage.create({
                                    data: { courseId, sender: 'ai', messageText: fullAnswer }
                                });
                                // Add context info to done message
                                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, context: contextTitles })}\n\n`));
                                return;
                            }
                        } catch (e) {
                            // Pass through the line if it's not valid JSON but still starts with data:
                        }
                        controller.enqueue(encoder.encode(line + '\n'));
                    }
                },
                async flush(controller) {
                    if (buffer.trim()) {
                        controller.enqueue(encoder.encode(buffer));
                    }
                }
            });

            return new Response(aiStream.pipeThrough(wrappedStream), {
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive'
                }
            });
        }

        // NON-STREAMING RESPONSE
        const { content, error } = await generateAIResponse({
            prompt: fullPrompt,
            systemPrompt
        });

        if (error) {
            return new Response(JSON.stringify({ error }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        await prisma.chatMessage.create({
            data: { courseId, sender: 'ai', messageText: content }
        });

        return new Response(JSON.stringify({ answer: content, context: contextTitles }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Chat API Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
        return new Response(JSON.stringify({ error: errorMessage }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// Helper function to save messages
async function saveMessages(courseId: string, question: string, answer: string) {
    await prisma.chatMessage.create({
        data: { courseId, sender: 'student', messageText: question }
    });
    await prisma.chatMessage.create({
        data: { courseId, sender: 'ai', messageText: answer }
    });
}
