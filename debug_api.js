const https = require('https');

const apiKey = "AIzaSyA4L_ZSvIYgAIdU-DspTkPWdj689RAmsT0";
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
