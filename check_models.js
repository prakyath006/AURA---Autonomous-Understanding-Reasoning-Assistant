// Get full list of available Gemini models
const apiKey = "AIzaSyAK1Bi4lml1gxz3be-3W5by-V1S_zdNQx4";

console.log("🔍 Fetching all available Gemini models...\n");

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

fetch(url)
    .then(res => res.json())
    .then(data => {
        if (data.error) {
            console.error("❌ API Error:", data.error.message);
        } else if (data.models) {
            console.log("✅ Available Models:\n");

            // Filter for vision-capable models
            const visionModels = data.models.filter(m =>
                m.supportedGenerationMethods?.includes('generateContent') &&
                m.name.toLowerCase().includes('gemini')
            );

            visionModels.forEach(m => {
                const name = m.name.replace('models/', '');
                const vision = m.supportedGenerationMethods?.includes('generateContent') ? '📷' : '';
                console.log(`  ${vision} ${name}`);
            });

            console.log("\n💡 Recommended for AURA (vision + fast):");
            const recommended = visionModels
                .filter(m => m.name.includes('flash') || m.name.includes('pro'))
                .slice(0, 3);

            recommended.forEach(m => {
                console.log(`  - ${m.name.replace('models/', '')}`);
            });
        }
    })
    .catch(err => {
        console.error("❌ Error:", err.message);
    });
