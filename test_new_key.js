require('dotenv').config({ path: '.env.local' });
// Test the new API key
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

if (!apiKey) {
    console.error("❌ No API key found in .env.local");
    process.exit(1);
}

console.log("🧪 Testing NEW Gemini API Key...");
console.log("Key:", apiKey.substring(0, 10) + "..." + apiKey.substring(apiKey.length - 4));

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

fetch(url)
    .then(res => res.json())
    .then(data => {
        if (data.error) {
            console.error("❌ API Error:", data.error.message);
            console.error("Status:", data.error.status);
            console.error("\n⚠️ This API key is NOT working!");
        } else if (data.models) {
            console.log("✅ API Key is valid!\n");
            console.log("📋 Available Models:");

            // Show models that work with vision
            const visionModels = data.models
                .filter(m => m.name.includes('gemini'))
                .slice(0, 10);

            visionModels.forEach(m => {
                const name = m.name.replace('models/', '');
                console.log(`  - ${name}`);
            });

            // Check which models from our code are available
            console.log("\n🎯 Checking models used in AURA:");
            const ourModels = [
                "gemini-2.0-flash-exp",
                "gemini-1.5-flash",
                "gemini-1.5-flash-8b",
                "gemini-1.5-pro"
            ];

            ourModels.forEach(modelName => {
                const exists = data.models.some(m => m.name === `models/${modelName}`);
                const status = exists ? "✅" : "❌";
                console.log(`  ${status} ${modelName}`);
            });
        }
    })
    .catch(err => {
        console.error("❌ Network Error:", err.message);
    });
