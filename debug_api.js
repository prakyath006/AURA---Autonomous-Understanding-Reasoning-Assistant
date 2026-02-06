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
            if (json.models) {
                console.log("Available Models:");
                json.models.forEach(m => console.log(m.name));
            } else {
                console.log("No models found or error structure:", json);
            }
        } catch (e) {
            console.log("Raw Body (parse error):", data);
        }
    });
}).on('error', (e) => {
    console.error("Error:", e);
});
