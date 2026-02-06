require('dotenv').config({ path: '.env.local' });
const https = require('https');

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
if (!apiKey) {
    console.error("❌ No API key found in .env.local");
    process.exit(1);
}
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (json.error) {
                console.log("ERROR:", json.error.message);
                return;
            }

            if (json.models) {
                console.log("=== ALL GEMINI MODELS ===\n");

                const geminiModels = json.models
                    .filter(m => m.name.includes('gemini'))
                    .map(m => m.name.replace('models/', ''));

                // Look for Gemini 3.x models
                const gemini3 = geminiModels.filter(m =>
                    m.includes('3.') || m.includes('3-') || m.includes('gemini-3')
                );

                // Look for Gemini 2.x models
                const gemini2 = geminiModels.filter(m =>
                    m.includes('2.') || m.includes('2-') || m.includes('gemini-2')
                );

                console.log("🔍 GEMINI 3.x MODELS:");
                if (gemini3.length > 0) {
                    gemini3.forEach(m => console.log("  ✅", m));
                } else {
                    console.log("  ❌ No Gemini 3.x models found");
                }

                console.log("\n🔍 GEMINI 2.x MODELS:");
                gemini2.forEach(m => console.log("  ✅", m));

                console.log("\n📋 ALL GEMINI MODELS:");
                geminiModels.forEach(m => console.log("  -", m));
            }
        } catch (e) {
            console.log("Parse error:", e.message);
        }
    });
}).on('error', (e) => {
    console.error("Error:", e.message);
});
