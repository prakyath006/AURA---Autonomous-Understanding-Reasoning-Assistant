const https = require('https');

const apiKey = "AIzaSyDTX9bEWY7adlosQNPCJZLJY7yTrSbUVWg";
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
                console.log("=== AVAILABLE GEMINI MODELS ===\n");

                const geminiModels = json.models
                    .filter(m => m.name.includes('gemini'))
                    .map(m => m.name.replace('models/', ''));

                geminiModels.forEach(name => console.log(name));

                console.log("\n=== RECOMMENDED FOR AURA (FAST) ===\n");
                const flashModels = geminiModels.filter(m =>
                    m.includes('flash') || m.includes('2.0')
                );
                flashModels.slice(0, 3).forEach(name => console.log("✅", name));
            }
        } catch (e) {
            console.log("Parse error:", e.message);
            console.log("Raw:", data.substring(0, 500));
        }
    });
}).on('error', (e) => {
    console.error("Error:", e.message);
});
