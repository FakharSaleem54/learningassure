
const apiKey = "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";
const url = "https://openrouter.ai/api/v1/chat/completions";
const model = "xiaomi/mimo-v2-flash:free";

async function testAI() {
    console.log("Testing OpenRouter connection...");
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
                messages: [{ role: "user", content: "Say hello!" }]
            })
        });

        console.log("Status:", response.status);
        const text = await response.text();
        console.log("Response Body:", text);

    } catch (error) {
        console.error("Fetch error:", error);
    }
}

testAI();
