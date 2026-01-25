
const apiKey = "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";
const url = "https://openrouter.ai/api/v1/chat/completions";
const model = "xiaomi/mimo-v2-flash:free";

async function testAIStream() {
    console.log("Testing OpenRouter STREAM connection...");
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "Test Script"
            },
            body: JSON.stringify({
                model: model,
                messages: [{ role: "user", content: "Tell me a short joke." }],
                stream: true
            })
        });

        console.log("Status:", response.status);

        if (!response.ok) {
            console.log("Error Body:", await response.text());
            return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            console.log("Received chunk length:", chunk.length);
            // console.log(chunk); // Uncomment to see raw data
        }
        console.log("Stream finished successfully.");

    } catch (error) {
        console.error("Fetch error:", error);
    }
}

testAIStream();
