import { NextRequest } from 'next/server';
import { findRelevantChunks } from '@/lib/ai/vector-store';
import { prisma } from '@/lib/prisma';
import { generateAIResponse, generateStreamingAIResponse, classifyIntent } from '@/lib/ai/ai-service';
import { AIContextBuilder } from '@/lib/ai/context-builder';

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

1. CLASSIFY EVERY USER QUESTION INTO ONE OF THREE CATEGORIES:

A) DIRECTLY IN-TOPIC
   - The question is explicitly about concepts, examples, steps, or explanations
     present in the lecture.

B) CONTEXTUALLY RELATED
   - The question is not explicitly covered in the lecture
     BUT is clearly linked to:
       • terminology used in the lecture
       • prerequisites or foundational concepts
       • logical extensions needed for understanding the lecture
       • definitions of terms mentioned in the lecture

C) UNRELATED
   - The question has no meaningful academic or conceptual connection
     to the lecture or course subject.

2. RESPONSE BEHAVIOR:

IF (A – Directly In-Topic):
→ Answer fully using lecture-specific context.

IF (B – Contextually Related):
→ Answer clearly and helpfully.
→ You MAY use general domain knowledge.
→ Explicitly connect the explanation back to the lecture topic.

IF (C – Unrelated):
→ Politely refuse and redirect the student to lecture-relevant questions.

3. DEFINITIONS & MEANINGS (HIGH PRIORITY):
- If a user asks the meaning, definition, or explanation of any term that:
  - appears in the lecture, OR
  - is commonly associated with the lecture topic,
  YOU MUST answer it.

4. HALLUCINATION PREVENTION:
- Never invent lecture content.
- If something is not in the lecture, do NOT claim it was taught.
- Use phrases like:
  “This concept helps you understand the lecture, even though it isn’t explicitly covered.”

5. RESPONSE STYLE:
- Speak directly to the student.
- No meta commentary (e.g., “Based on the provided content…”).
- Be precise, instructional, and subject-aware.

6. REFUSAL STYLE (ONLY FOR UNRELATED QUESTIONS):
- Keep it short and polite.
- Example:
  “That question isn’t related to this lecture. Try asking about concepts connected to the current topic.”

ABSOLUTE RULE:
If a question is related or helps understanding the lecture,
you MUST answer it.
Refusal is allowed ONLY for clearly unrelated questions.`;
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

            // Wrap the stream to save the final message
            const encoder = new TextEncoder();
            let fullAnswer = '';

            const wrappedStream = new TransformStream({
                async transform(chunk, controller) {
                    const text = new TextDecoder().decode(chunk);

                    // Extract tokens from the stream
                    const lines = text.split('\n').filter(line => line.startsWith('data: '));
                    for (const line of lines) {
                        try {
                            const parsed = JSON.parse(line.slice(6));
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
                            // Pass through the chunk
                        }
                    }
                    controller.enqueue(chunk);
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
