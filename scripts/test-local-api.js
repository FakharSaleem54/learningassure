
const url = "http://localhost:3000/api/course-chat";

async function testLocalAPI() {
    console.log("Testing LOCAL API endpoint...");
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                question: "Hello assistant",
                courseId: "test-course-id",
                stream: false
            })
        });

        console.log("Status:", response.status);
        const text = await response.text();
        console.log("Response Body:", text);

    } catch (error) {
        console.error("Fetch error:", error);
    }
}

testLocalAPI();
