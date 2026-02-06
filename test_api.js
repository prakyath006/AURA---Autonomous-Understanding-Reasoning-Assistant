// Quick test script to verify Gemini API key works
const apiKey = "AIzaSyAK1Bi4lml1gxz3be-3W5by-V1S_zdNQx4";

console.log("🧪 Testing Gemini API Key...");
console.log("Key:", apiKey.substring(0, 10) + "..." + apiKey.substring(apiKey.length - 4));

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

fetch(url)
    .then(res => res.json())
    .then(data => {
        if (data.error) {
            console.error("❌ API Error:", data.error.message);
            console.error("Status:", data.error.status);
        } else if (data.models) {
            console.log("✅ API Key is valid!");
            console.log("\n📋 Available Models:");
            data.models.forEach(m => {
                console.log("  -", m.name);
            });
        } else {
            console.log("⚠️ Unexpected response:", data);
        }
    })
    .catch(err => {
        console.error("❌ Network Error:", err.message);
    });
