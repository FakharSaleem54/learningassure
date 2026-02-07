
/**
 * Test script to verify the robustness of the SSE streaming logic against partial chunks.
 * This simulates how Vercel or other proxies might split a single JSON line into multiple chunks.
 */

const { TransformStream } = require('stream/web');
const { TextEncoder, TextDecoder } = require('util');

async function simulateStreaming(inputChunks, transformStreamLogic) {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const results = [];

    const transformStream = new TransformStream(transformStreamLogic);
    const writer = transformStream.writable.getWriter();
    const reader = transformStream.readable.getReader();

    // Start reading in background
    const readPromise = (async () => {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            results.push(new TextDecoder().decode(value));
        }
    })();

    // Write chunks
    for (const chunkText of inputChunks) {
        await writer.write(encoder.encode(chunkText));
        // Add a small delay if needed
    }
    await writer.close();
    await readPromise;

    return results;
}

// Logic from ai-service.ts (OpenAI-compatible part)
const aiServiceLogic = {
    decoder: new TextDecoder(),
    encoder: new TextEncoder(),
    buffer: '',
    async transform(chunk, controller) {
        this.buffer += this.decoder.decode(chunk, { stream: true });
        const lines = this.buffer.split('\n');
        this.buffer = lines.pop() || '';

        for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue;

            const data = trimmedLine.slice(6);
            if (data === '[DONE]') {
                controller.enqueue(this.encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
                continue;
            }

            try {
                const parsed = JSON.parse(data);
                const token = parsed.choices?.[0]?.delta?.content;
                if (token) {
                    controller.enqueue(this.encoder.encode(`data: ${JSON.stringify({ token })}\n\n`));
                }
            } catch (e) {
                // Skip
            }
        }
    },
    flush(controller) {
        const trimmedLine = this.buffer.trim();
        if (trimmedLine.startsWith('data: ')) {
            const data = trimmedLine.slice(6);
            if (data === '[DONE]') {
                controller.enqueue(this.encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
            } else {
                try {
                    const parsed = JSON.parse(data);
                    const token = parsed.choices?.[0]?.delta?.content;
                    if (token) {
                        controller.enqueue(this.encoder.encode(`data: ${JSON.stringify({ token })}\n\n`));
                    }
                } catch (e) { /* skip */ }
            }
        }
    }
};

async function runTest() {
    console.log("Testing ai-service logic with partial chunks...");

    // Split a logical SSE line into three chunks
    const testChunks = [
        'data: {"choices":[{"delta":{"content":',
        '"Hello" }}]}\n',
        'data: {"choices":[{"delta":{"content":',
        '" world" }}]}\ndata: ',
        '[DONE]\n'
    ];

    const results = await simulateStreaming(testChunks, aiServiceLogic);
    const combined = results.join('');

    console.log("Input Chunks:", JSON.stringify(testChunks));
    console.log("Output Combined:", JSON.stringify(combined));

    const expected = `data: {"token":"Hello"}\n\ndata: {"token":" world"}\n\ndata: {"done":true}\n\n`;
    if (combined === expected) {
        console.log("✅ TEST PASSED: Buffer correctly reassembled chunks.");
    } else {
        console.log("❌ TEST FAILED: Output did not match expected result.");
        console.log("Expected:", JSON.stringify(expected));
    }
}

runTest();
