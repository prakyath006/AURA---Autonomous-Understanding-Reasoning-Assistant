require('dotenv').config({ path: '.env.local' });
const https = require('https');

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
if (!apiKey) {
    console.error("❌ No API key found in .env.local");
    process.exit(1);
}

console.log("🧪 Testing GEMINI 3 API Connection...\n");

// Test gemini-3-pro-preview (more stable than flash preview)
const testModel = "gemini-3-pro-preview";
console.log(`Testing model: ${testModel}`);

const postData = JSON.stringify({
    contents: [{
        parts: [{
            text: "Hello! Please confirm you are Gemini 3. What generation are you?"
        }]
    }]
});

const options = {
    hostname: 'generativelanguage.googleapis.com',
    port: 443,
    path: `/v1beta/models/${testModel}:generateContent?key=${apiKey}`,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': postData.length
    }
};

const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const response = JSON.parse(data);

            if (response.error) {
                console.error("❌ ERROR:", response.error.message);
                console.error("Status:", response.error.status);
            } else if (response.candidates) {
                console.log("\n✅ SUCCESS! Gemini 3 API is working!\n");
                console.log("Response from Gemini 3:");
                console.log(response.candidates[0].content.parts[0].text);
                console.log("\n🎉 Your app is using GEMINI 3 API!");
            } else {
                console.log("⚠️ Unexpected response:", JSON.stringify(response, null, 2));
            }
        } catch (e) {
            console.error("Parse error:", e.message);
            console.log("Raw response:", data);
        }
    });
});

req.on('error', (e) => {
    console.error("❌ Request error:", e.message);
});

req.write(postData);
req.end();
