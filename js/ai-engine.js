/* ==========================================================================
   StudySnap AI - AI & Intelligent Sandbox Engine
   ========================================================================== */

const aiEngine = {
    apiKey: studySnapUtils.safeStorage.getItem('studysnap_openai_key') === 'SANDBOX' ? '' : (studySnapUtils.safeStorage.getItem('studysnap_openai_key') || ''),
    sandboxMode: (!studySnapUtils.safeStorage.getItem('studysnap_openai_key') || studySnapUtils.safeStorage.getItem('studysnap_openai_key') === 'SANDBOX') && !studySnapUtils.safeStorage.getItem('studysnap_tavily_key', '') && !studySnapUtils.safeStorage.getItem('studysnap_firecrawl_key', '') && !studySnapUtils.safeStorage.getItem('studysnap_gemini_key', '') && !studySnapUtils.safeStorage.getItem('studysnap_groq_key', ''),
    tavilyKey: studySnapUtils.safeStorage.getItem('studysnap_tavily_key', ''),
    tavilyMode: !!studySnapUtils.safeStorage.getItem('studysnap_tavily_key', ''),
    firecrawlKey: studySnapUtils.safeStorage.getItem('studysnap_firecrawl_key', ''),
    firecrawlMode: !!studySnapUtils.safeStorage.getItem('studysnap_firecrawl_key', ''),
    geminiKey: studySnapUtils.safeStorage.getItem('studysnap_gemini_key', ''),
    geminiMode: !!studySnapUtils.safeStorage.getItem('studysnap_gemini_key', ''),
    groqKey: studySnapUtils.safeStorage.getItem('studysnap_groq_key', ''),
    groqMode: !!studySnapUtils.safeStorage.getItem('studysnap_groq_key', ''),

    setApiKey(key) {
        const cleanKey = key ? key.trim() : '';
        this.apiKey = cleanKey;
        if (cleanKey !== '') {
            studySnapUtils.safeStorage.setItem('studysnap_openai_key', cleanKey);
            this.sandboxMode = false;
        } else {
            studySnapUtils.safeStorage.setItem('studysnap_openai_key', 'SANDBOX');
            this.apiKey = '';
            this.sandboxMode = !this.tavilyKey && !this.firecrawlKey && !this.geminiKey;
        }
    },

    setTavilyKey(key) {
        const cleanKey = key ? key.trim() : '';
        this.tavilyKey = cleanKey;
        this.tavilyMode = !!cleanKey;
        studySnapUtils.safeStorage.setItem('studysnap_tavily_key', cleanKey);
        if (!this.apiKey && !this.firecrawlKey && !this.geminiKey) this.sandboxMode = !this.tavilyMode;
    },

    setFirecrawlKey(key) {
        const cleanKey = key ? key.trim() : '';
        this.firecrawlKey = cleanKey;
        this.firecrawlMode = !!cleanKey;
        studySnapUtils.safeStorage.setItem('studysnap_firecrawl_key', cleanKey);
        if (!this.apiKey && !this.tavilyKey && !this.geminiKey) this.sandboxMode = !this.firecrawlMode;
    },

    setGeminiKey(key) {
        const cleanKey = key ? key.trim() : '';
        this.geminiKey = cleanKey;
        this.geminiMode = !!cleanKey;
        studySnapUtils.safeStorage.setItem('studysnap_gemini_key', cleanKey);
        if (!this.apiKey) this.sandboxMode = !this.geminiMode;
    },

    setGroqKey(key) {
        const cleanKey = key ? key.trim() : '';
        this.groqKey = cleanKey;
        this.groqMode = !!cleanKey;
        studySnapUtils.safeStorage.setItem('studysnap_groq_key', cleanKey);
    },

    async tavilySearch(query) {
        if (!this.tavilyKey) return null;
        try {
            var res = await fetch('https://api.tavily.com/search', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                    api_key: this.tavilyKey,
                    query: query + ' education study India',
                    search_depth: 'basic',
                    include_answer: true,
                    max_results: 3
                })
            });
            if (!res.ok) return null;
            var data = await res.json();
            return data.answer || (data.results && data.results.length > 0 ? data.results[0].content : null);
        } catch(e) {
            console.warn('Tavily search error:', e);
            return null;
        }
    },

    async firecrawlSearch(query) {
        if (!this.firecrawlKey) return null;
        try {
            var res = await fetch('https://api.firecrawl.dev/v1/search', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                    apiKey: this.firecrawlKey,
                    query: query + ' study education',
                    limit: 3,
                    scrapeOptions: { formats: ['markdown'] }
                })
            });
            if (!res.ok) return null;
            var data = await res.json();
            if (data.success && data.data && data.data.length > 0) {
                return data.data.map(function(d) { return d.markdown || d.description || ''; }).filter(Boolean).join('\n\n');
            }
            return null;
        } catch(e) {
            console.warn('FireCrawl search error:', e);
            return null;
        }
    },

    async getContext(query) {
        var results = [];
        if (this.tavilyKey) {
            try {
                var res = await fetch('https://api.tavily.com/search', {
                    method: 'POST', headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({ api_key: this.tavilyKey, query: query + ' education study CBSE JEE NEET', search_depth: 'basic', max_results: 3 })
                });
                if (res.ok) {
                    var d = await res.json();
                    if (d.results) d.results.forEach(function(r) { if (r.content) results.push(r.content); });
                }
            } catch(e) {}
        }
        if (results.length === 0 && this.firecrawlKey) {
            try {
                var res = await fetch('https://api.firecrawl.dev/v1/search', {
                    method: 'POST', headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({ apiKey: this.firecrawlKey, query: query + ' study education', limit: 2, scrapeOptions: { formats: ['markdown'] } })
                });
                if (res.ok) {
                    var d = await res.json();
                    if (d.success && d.data) d.data.forEach(function(r) { if (r.markdown) results.push(r.markdown); });
                }
            } catch(e) {}
        }
        return results.slice(0, 3).join('\n\n');
    },

    async geminiComplete(prompt, context, systemPrompt) {
        if (!this.geminiKey) { console.warn('Gemini: no key set'); return null; }
        var fullPrompt = systemPrompt + '\n\n' + (context || '') + '\n\n' + prompt;
        console.log('Gemini: key length=' + this.geminiKey.length);
        var models = ['gemini-2.0-flash', 'gemini-2.0-flash-lite'];
        for (var m = 0; m < models.length; m++) {
            try {
                console.log('Gemini: trying model ' + models[m]);
                var res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + models[m] + ':generateContent?key=' + this.geminiKey, {
                    method: 'POST', headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: fullPrompt }] }],
                        generationConfig: { maxOutputTokens: 8192, temperature: 0.7 }
                    })
                });
                console.log('Gemini: status=' + res.status + ' model=' + models[m]);
                if (res.status === 429) {
                    console.warn('Gemini: rate limited on ' + models[m] + ', waiting 5s...');
                    await new Promise(function(r) { setTimeout(r, 5000); });
                    res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + models[m] + ':generateContent?key=' + this.geminiKey, {
                        method: 'POST', headers: { 'content-type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: fullPrompt }] }],
                            generationConfig: { maxOutputTokens: 8192, temperature: 0.7 }
                        })
                    });
                    console.log('Gemini: retry status=' + res.status);
                }
                if (!res.ok) { 
                    var errBody = await res.text();
                    console.warn('Gemini ' + models[m] + ' failed:', res.status); 
                    if (res.status === 429) { console.warn('Gemini: rate limited — all models will fail, stopping.'); break; }
                    continue; 
                }
                var d = await res.json();
                if (d.candidates && d.candidates[0] && d.candidates[0].content && d.candidates[0].content.parts) {
                    var answer = d.candidates[0].content.parts.map(function(p) { return p.text; }).join('');
                    if (answer) { console.log('Gemini: SUCCESS with ' + models[m]); return answer; }
                }
            } catch(e) { console.warn('Gemini ' + models[m] + ' error:', e.message); }
        }
        console.warn('Gemini: all models failed');
        return null;
    },

    async groqComplete(prompt, context, systemPrompt) {
        if (!this.groqKey) return null;
        var fullPrompt = systemPrompt + '\n\n' + (context || '') + '\n\n' + prompt;
        console.log('Groq: sending request');
        try {
            var res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: { 'content-type': 'application/json', 'Authorization': 'Bearer ' + this.groqKey },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: (context ? 'Context:\n' + context + '\n\n' : '') + prompt }],
                    max_tokens: 8192,
                    temperature: 0.7
                })
            });
            console.log('Groq: status=' + res.status);
            if (!res.ok) {
                var errBody = await res.text();
                console.warn('Groq failed:', res.status, errBody.substring(0, 200));
                return null;
            }
            var d = await res.json();
            if (d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content) {
                console.log('Groq: SUCCESS');
                return d.choices[0].message.content;
            }
        } catch(e) { console.warn('Groq error:', e.message); }
        return null;
    },

    /* General wrapper to get completion */
    async getCompletion(prompt, systemPrompt = "You are a helpful student tutor.") {
        const query = prompt.toLowerCase().trim();
        const casualReplies = ["hi", "hello", "hey", "yo", "namaste", "hola", "wow", "ok", "okay", "cool", "nice", "great", "awesome", "thanks", "thank you", "bye", "goodbye", "haha", "lol", "omg", "no", "yes", "yeah", "yep", "nope", "sure", "fine", "good", "bad", "sad", "happy", "love", "hate", "hmm", "oh", "ah", "um", "uh", "sup", "bro", "dude", "k", "kk", "nyc", "thx", "ty", "gn", "gm", "wait", "what", "huh", "nah", "yup", "true", "false", "maybe", "idk", "brb", "np", "welcome", "congrats", "congratulations", "rip", "wow", "oops", "damn", "cya", "peace", "byebye", "tysm", "appreciate"];
        if (!systemPrompt.includes("JSON") && casualReplies.includes(query)) {
            const responses = [
                "Hey! 😊",
                "Hi there! 👋",
                "What's up!",
                "Yo! 👋",
                "Sup!",
                "Hey! Ready to study?",
                "Hi! Got a doubt?",
                "Hello! Ask me anything!",
                "Yo! What do you need?",
                "Hey! 🙌"
            ];
            return responses[Math.floor(Math.random() * responses.length)];
        }

        // For flashcard/quiz/essay, always use sandbox (needs strict JSON format)
        if (systemPrompt.includes("flashcard") || systemPrompt.includes("quiz") || systemPrompt.includes("essay") || systemPrompt.includes("JSON") || systemPrompt.includes("board examiner")) {
            return this.generateSandboxResponse(prompt, systemPrompt);
        }

        // Get context from Tavily/FireCrawl for better answers
        var context = '';
        try {
            if (this.tavilyKey) {
                var tavilyResult = await this.tavilySearch(prompt);
                if (tavilyResult) context += 'Web search results:\n' + tavilyResult + '\n\n';
            }
            if (this.firecrawlKey && !context) {
                var fcResult = await this.firecrawlSearch(prompt);
                if (fcResult) context += 'Web scrape results:\n' + fcResult + '\n\n';
            }
        } catch(e) { console.warn('RAG context fetch error:', e); }

        // Gemini with context
        if (this.geminiKey) {
            var geminiAnswer = await this.geminiComplete(prompt, context, systemPrompt);
            if (geminiAnswer) return geminiAnswer;
        }

        // Groq fallback (free, fast)
        if (this.groqKey) {
            var groqAnswer = await this.groqComplete(prompt, context, systemPrompt);
            if (groqAnswer) return groqAnswer;
        }

        // No Gemini key or Gemini failed — go to sandbox
        return this.generateSandboxResponse(prompt, systemPrompt);
    },

    /* Advanced Sandbox Generative Engine */
    generateSandboxResponse(prompt, systemPrompt) {
        const query = prompt.toLowerCase();
        
        if (systemPrompt.includes("board examiner") || systemPrompt.includes("essay")) {
            return this.mockEssayAnalysis(prompt);
        }

        if (systemPrompt.includes("flashcard") || systemPrompt.includes("question/answer pairs") || query.includes("flashcard")) {
            return this.mockFlashcardGeneration(prompt);
        }

        if (systemPrompt.includes("quiz") || query.includes("quiz")) {
            return this.mockQuizGeneration(prompt);
        }

        if (query.includes("youtube.com") || query.includes("youtu.be")) {
            return this.mockYoutubeSummary(prompt);
        }

        if (query.includes("timetable") || query.includes("time table") || query.includes("schedule") || query.includes("study plan") || (query.includes("study") && (query.includes("routine") || query.includes("daily") || query.includes("weekly") || query.includes("hour")))) {
            return this.mockTimetableResponse(prompt);
        }

        const mathPattern = /^[0-9+\-*/().\s=<>]+$/;
        if (!systemPrompt.includes("JSON") && mathPattern.test(prompt.trim()) && prompt.trim().length > 0) {
            // Handle equation with '=' sign first
            if (prompt.includes('=')) {
                const sides = prompt.split('=');
                if (sides.length === 2) {
                    try {
                        const left = new Function('return ' + sides[0].trim().replace(/[^0-9+\-*/().\s]/g, ''))();
                        const right = new Function('return ' + sides[1].trim().replace(/[^0-9+\-*/().\s]/g, ''))();
                        if (!isNaN(left) && !isNaN(right)) {
                            const eq = Math.abs(left - right) < 0.0001;
                            return `### 📚 Subject: Mathematics\n**Equation Check**\n\nYou asked: \`${prompt}\`\n- Left side evaluates to: **${left}**\n- Right side evaluates to: **${right}**\n- Conclusion: **${eq ? '✅ True — both sides are equal!' : '❌ False — the sides are not equal.'}**\n\n` +
                                   `---DIDYOUKNOW---\n💡 **Did You Know?** The equals sign (=) was invented in 1557 by Robert Recorde.\n\n` +
                                   `---CHALLENGE---\n{"question": "What is 2 + 2 × 2?", "options": ["8", "6", "4", "0"], "correct": 1}`;
                        }
                    } catch (e2) {}
                }
            }
            // Plain arithmetic expression (no '=' sign)
            try {
                const sanitized = prompt.replace(/[^0-9+\-*/().\s]/g, '');
                const result = new Function('return ' + sanitized)();
                if (result !== undefined && !isNaN(result)) {
                    return `### 📚 Subject: Mathematics\n**Arithmetic Expression Evaluation**\n\nYou entered: \`${prompt}\`. Using BODMAS:\n- The expression evaluates to: **${result}**\n\n` +
                           `---DIDYOUKNOW---\n💡 **Did You Know?** The equals sign (=) was invented in 1557 by Robert Recorde.\n\n` +
                           `---CHALLENGE---\n{"question": "What is 2 + 2 × 2?", "options": ["8", "6", "4", "0"], "correct": 1}`;
                }
            } catch (e) {}
        }
    

        const greetingsList = ["hi", "hello", "hey", "greetings", "yo", "namaste", "hola"];
        if (!systemPrompt.includes("JSON") && greetingsList.includes(query.trim())) {
            return `### 📚 Subject: General Study\n**Welcome to StudySnap AI!**\n\nHello! I am your AI Study Tutor. Ask me any math problem, science question, or syllabus concept, and let's solve it step-by-step together! What are we studying today?\n\n` +
                   `---DIDYOUKNOW---\n💡 **Did You Know?** Talking to yourself out loud while studying can improve memory retention by up to 22%!\n\n` +
                   `---CHALLENGE---\n{"question": "", "options": [], "correct": 0}`;
        }

        const casualReplies = ["wow", "ok", "okay", "cool", "nice", "great", "awesome", "thanks", "thank you", "bye", "goodbye", "haha", "lol", "omg", "no", "yes", "yeah", "yep", "nope", "sure", "fine", "good", "bad", "sad", "happy", "love", "hate", "what", "why", "how", "who", "when", "where", "hmm", "oh", "ah", "um", "uh", "hey", "sup", "bro", "dude"];
        if (!systemPrompt.includes("JSON") && casualReplies.includes(query.trim())) {
            const responses = [
                `Hey there! 😊 Ready to study something awesome? Ask me about Physics, Chemistry, Math, or Biology!`,
                `Hi! I'm your study buddy. Got any doubts? I can help with JEE/NEET/CBSE topics! 📚`,
                `What's up! Want to solve some problems or learn a new concept? I'm here to help! 🎯`,
                `Hello! Ask me anything from your syllabus — Newton's laws, chemical reactions, calculus, or cell biology!`,
                `Hey! Need help with homework? Just type your question and I'll break it down step by step! 💡`
            ];
            return responses[Math.floor(Math.random() * responses.length)];
        }

        const chapterMatch = this.detectChapter(query);
        if (chapterMatch) {
            return this.formatChapterResponse(chapterMatch, prompt, query);
        }

        if ((query.includes("fox") && query.includes("goose") && query.includes("beans")) || (query.includes("wolf") && query.includes("goat") && query.includes("cabbage"))) {
            return `### 📚 Subject: Logical Reasoning\n**River Crossing Puzzle Solution**\n\nHere is the classic step-by-step solution to the farmer's river crossing puzzle:\n\n` +
                   `**Step 1:** The farmer takes the **goose** across first and leaves it on the far side. He returns alone.\n` +
                   `*Reason: The fox and beans are safe together, but the goose cannot be left with either.*\n\n` +
                   `**Step 2:** The farmer takes the **fox** across. He brings the **goose** back with him.\n` +
                   `*Reason: The fox is left on the far side alone (safe). The goose comes back to avoid eating the beans.*\n\n` +
                   `**Step 3:** The farmer leaves the goose on the starting side and takes the **beans** across.\n` +
                   `*Reason: The beans are now with the fox on the far side (safe together).*\n\n` +
                   `**Step 4:** The farmer returns alone and takes the **goose** across.\n` +
                   `*All three items are now safely on the far side with the farmer!*\n\n` +
                   `**Key Insight:** The goose is the 'bottleneck' item — it cannot be left with either the fox or the beans, so it must be the one that travels back and forth.\n\n` +
                   `---DIDYOUKNOW---\n💡 **Did You Know?** This puzzle dates back to the 8th century, created by Alcuin of York, an English scholar in Charlemagne's court!\n\n` +
                   `---CHALLENGE---\n{"question": "In the river crossing puzzle, what is the first item the farmer takes across?", "options": ["Fox", "Goose", "Beans", "Nothing"], "correct": 1}`;
        }

        const subjects = this.buildSubjectMap();
        const matched = this.matchSubject(query, subjects);

        if (matched) {
            return this.formatSandboxResponse(matched);
        }

        return this.genericFallback(prompt, query);
    },

    buildSubjectMap() {
        return [
            {
                keywords: ["photosynthesis", "chloroplast", "chlorophyll", "plant", "leaf", "stomata", "xylem", "phloem", "transpiration", "germination", "pollination", "fertilization", "seed", "root", "stem", "flower"],
                subject: "Biology",
                title: "Plant Biology & Photosynthesis",
                explanation: "Photosynthesis is the process by which green plants convert light energy into chemical energy (glucose) using chlorophyll in chloroplasts.",
                steps: [
                    "Light Absorption: Chlorophyll in thylakoid membranes absorbs sunlight (mainly red and blue wavelengths).",
                    "Photolysis of Water: Light energy splits water (H₂O) into oxygen, protons, and electrons — releasing O₂ as a byproduct.",
                    "Calvin Cycle: CO₂ is fixed using ATP and NADPH from the light reactions to produce glucose (C₆H₁₂O₆).",
                    "Overall Equation: 6CO₂ + 6H₂O + Light → C₆H₁₂O₆ + 6O₂"
                ],
                didYouKnow: "A single large oak tree can release up to 120 liters of water per day through transpiration!",
                challengeQuestion: "Which pigment gives plants their green color and absorbs light for photosynthesis?",
                challengeOptions: ["Carotene", "Xanthophyll", "Chlorophyll", "Anthocyanin"],
                challengeCorrect: 2
            },
            {
                keywords: ["cell", "mitosis", "meiosis", "dna", "rna", "chromosome", "gene", "nucleus", "organelle", "mitochondria", "ribosome", "protein", "enzyme", "mutation", "evolution", "natural selection", "adaptation", "species", "ecosystem", "habitat", "food chain", "food web", "symbiosis", "parasite", "host", "bacteria", "virus", "fungus", "microbe", "tissue", "organ", "digestion", "respiration", "circulation", "excretion", "neuron", "synapse", "hormone", "endocrine", "immune", "antibody", "vaccine"],
                subject: "Biology",
                title: "Cell Biology & Life Processes",
                explanation: "Cells are the basic structural and functional units of all living organisms. Eukaryotic cells contain membrane-bound organelles like the nucleus, mitochondria, and ribosomes that carry out specialized functions.",
                steps: [
                    "Cell Structure: All cells have a cell membrane, cytoplasm, and genetic material. Plant cells additionally have a cell wall and chloroplasts.",
                    "Energy Production: Mitochondria are the powerhouse of the cell, producing ATP through cellular respiration (glucose + O₂ → CO₂ + H₂O + ATP).",
                    "Protein Synthesis: DNA in the nucleus transcribes to mRNA, which is translated by ribosomes into proteins.",
                    "Cell Division: Mitosis produces 2 identical daughter cells (growth/repair), while meiosis produces 4 gametes (reproduction)."
                ],
                didYouKnow: "The human body contains approximately 37.2 trillion cells, and around 300 million cells die every minute!",
                challengeQuestion: "Which organelle is responsible for producing ATP energy in cells?",
                challengeOptions: ["Nucleus", "Ribosome", "Mitochondria", "Golgi Apparatus"],
                challengeCorrect: 2
            },
            {
                keywords: ["human body", "heart", "lung", "kidney", "brain", "liver", "stomach", "intestine", "blood", "artery", "vein", "capillary", "skeleton", "bone", "muscle", "joint", "nervous", "digestive", "respiratory", "circulatory", "excretory", "reproductive", "endocrine", "immune system", "white blood cell", "red blood cell", "plasma", "urine", "bile", "saliva", "enzyme digestion", "peristalsis", "alveoli", "diaphragm", "atrium", "ventricle", "aorta", "pulse", "blood pressure"],
                subject: "Biology",
                title: "Human Physiology",
                explanation: "The human body consists of multiple organ systems that work together to maintain homeostasis. Each system has specialized organs performing distinct functions.",
                steps: [
                    "Circulatory System: The heart pumps blood through arteries (oxygenated) and veins (deoxygenated). Blood carries oxygen, nutrients, and waste products.",
                    "Respiratory System: Oxygen enters through the nose → trachea → bronchi → alveoli (site of gas exchange). CO₂ is expelled.",
                    "Digestive System: Food moves from mouth → esophagus → stomach (acid + enzymes) → small intestine (absorption) → large intestine (water reabsorption).",
                    "Excretory System: Kidneys filter blood to produce urine, removing urea and regulating water/salt balance."
                ],
                didYouKnow: "The human heart beats about 100,000 times per day, pumping roughly 7,500 liters of blood!",
                challengeQuestion: "Which organ filters waste from blood and produces urine?",
                challengeOptions: ["Liver", "Kidney", "Lung", "Heart"],
                challengeCorrect: 1
            },
            {
                keywords: ["newton", "force", "motion", "velocity", "acceleration", "momentum", "inertia", "friction", "gravity", "gravitation", "mass", "weight", "energy", "kinetic", "potential", "work", "power", "pressure", "density", "buoyancy", "archimedes", "pascal", "bernoulli", "wave", "frequency", "amplitude", "wavelength", "sound", "light", "reflection", "refraction", "diffraction", "interference", "lens", "mirror", "concave", "convex", "prism", "spectrum", "color", "electric", "current", "voltage", "resistance", "ohm", "circuit", "series", "parallel", "magnet", "magnetic", "electromagnet", "induction", "faraday", "nuclear", "radioactive", "fission", "fusion", "thermodynamics", "heat", "temperature", "conduction", "convection", "radiation", "specific heat", "calorimetry"],
                subject: "Physics",
                title: "Physics Concepts Explained",
                explanation: "Physics is the study of matter, energy, and their interactions through fundamental laws and principles that govern the universe.",
                steps: [
                    "Newton's Laws: (1) Objects at rest stay at rest unless acted on by a force. (2) F = ma. (3) Every action has an equal and opposite reaction.",
                    "Energy Conservation: Energy cannot be created or destroyed (Law of Conservation), only converted between forms (kinetic, potential, thermal, etc.).",
                    "Electricity Basics: Ohm's Law states V = IR. In series circuits, current is constant; in parallel, voltage is constant across each branch.",
                    "Waves & Optics: Light travels at 3 × 10⁸ m/s in vacuum. Reflection (bouncing) and refraction (bending) determine how we see objects."
                ],
                didYouKnow: "Light from the Sun takes about 8 minutes and 20 seconds to reach Earth, traveling at 299,792,458 m/s!",
                challengeQuestion: "According to Newton's Second Law, force equals:",
                challengeOptions: ["mass × velocity", "mass × acceleration", "mass / acceleration", "velocity / time"],
                challengeCorrect: 1
            },
            {
                keywords: ["atom", "molecule", "element", "compound", "mixture", "periodic table", "proton", "neutron", "electron", "ion", "isotope", "bond", "ionic", "covalent", "metallic", "valence", "oxidation", "reduction", "redox", "acid", "base", "ph", "salt", "neutralization", "indicator", "litmus", "reaction", "chemical equation", "balanced", "stoichiometry", "mole", "molar", "concentration", "solution", "solvent", "solute", "soluble", "insoluble", "precipitate", "catalyst", "enzyme catalysis", "exothermic", "endothermic", "enthalpy", "activation energy", "rate of reaction", "equilibrium", "le chatelier", "organic", "hydrocarbon", "alkane", "alkene", "alkyne", "alcohol", "carboxylic acid", "ester", "polymer", "plastic", "metal", "nonmetal", "metalloid", "corrosion", "rust", "alloy", "electrolysis", "galvanic", "electrochemical", "cell"],
                subject: "Chemistry",
                title: "Chemistry Concepts Explained",
                explanation: "Chemistry is the study of matter — its composition, structure, properties, and the changes it undergoes during chemical reactions.",
                steps: [
                    "Atomic Structure: Atoms consist of protons (+), neutrons (neutral) in the nucleus, and electrons (-) orbiting in shells. Atomic number = number of protons.",
                    "Chemical Bonding: Ionic bonds involve electron transfer (metal + nonmetal). Covalent bonds involve electron sharing (nonmetal + nonmetal).",
                    "Types of Reactions: Combination (A+B→AB), Decomposition (AB→A+B), Displacement (A+BC→AC+B), Redox (electron transfer).",
                    "Acids & Bases: Acids donate H⁺ (pH < 7), bases accept H⁺ (pH > 7). Neutralization: Acid + Base → Salt + Water."
                ],
                didYouKnow: "A single drop of water contains about 1.67 sextillion (1.67 × 10²¹) molecules of H₂O!",
                challengeQuestion: "What is the pH value of a neutral solution?",
                challengeOptions: ["0", "5", "7", "14"],
                challengeCorrect: 2
            },
            {
                keywords: ["quadratic", "equation", "algebra", "polynomial", "factor", "root", "discriminant", "linear", "variable", "expression", "inequality", "function", "graph", "slope", "intercept", "trigonometry", "sin", "cos", "tan", "sine", "cosine", "tangent", "angle", "triangle", "pythagoras", "pythagorean", "hypotenuse", "geometry", "circle", "radius", "diameter", "circumference", "area", "volume", "surface area", "perimeter", "rectangle", "square", "triangle area", "parallelogram", "trapezium", "cube", "cuboid", "sphere", "cylinder", "cone", "calculus", "derivative", "integration", "limit", "differentiation", "statistics", "mean", "median", "mode", "range", "variance", "standard deviation", "probability", "permutation", "combination", "number system", "rational", "irrational", "integer", "fraction", "decimal", "percentage", "ratio", "proportion", "lcm", "hcf", "hcf lcm", "set", "union", "intersection", "venn", "matrix", "determinant", "vector", "scalar", "surd", "surds", "exponent", "logarithm", "indices", "log"],
                subject: "Mathematics",
                title: "Mathematics Concepts Explained",
                explanation: "Mathematics is the abstract science of numbers, quantity, structure, space, and change, providing tools for modeling and solving real-world problems.",
                steps: [
                    "Algebra: Quadratic equations (ax² + bx + c = 0) are solved using factorization or the quadratic formula: x = [-b ± √(b² - 4ac)] / 2a.",
                    "Trigonometry: In a right triangle, sinθ = Opposite/Hypotenuse, cosθ = Adjacent/Hypotenuse, tanθ = Opposite/Adjacent. Key identity: sin²θ + cos²θ = 1.",
                    "Geometry: Area of a circle = πr², circumference = 2πr. Volume of a sphere = 4/3πr³. Pythagoras: a² + b² = c².",
                    "Statistics: Mean = sum/n, Median = middle value when sorted, Mode = most frequent value. Range = max - min."
                ],
                didYouKnow: "The word 'mathematics' comes from the Greek word 'mathema' meaning 'that which is learned'!",
                challengeQuestion: "What is the quadratic formula used to find?",
                challengeOptions: ["Area of a circle", "Roots of ax²+bx+c=0", "Slope of a line", "Volume of a sphere"],
                challengeCorrect: 1
            },
            {
                keywords: ["gandhi", "nehru", "independence", "freedom", "british", "colonial", "sepoy", "mutiny", "1857", "revolt", "non-cooperation", "civil disobedience", "quit india", "salt march", "dandi", "bhagat", "netaji", "bose", "partition", "1947", "constitution", "ambedkar", "republic", "mughal", "akbar", "shah jahan", "taj mahal", "delhi sultanate", "maurya", "ashoka", "gupta", "chola", "vijayanagara", "maratha", "shivaji", "tipu", "sultan", "battle of plassey", "battle of panipat", "world war", "cold war", "league of nations", "united nations", "french revolution", "russian revolution", "industrial revolution", "renaissance", "enlightenment", "democracy", "socialism", "capitalism", "nationalism", "imperialism"],
                subject: "History",
                title: "Historical Events & Movements",
                explanation: "History studies past events, civilizations, and movements that shaped the modern world, providing context for understanding present-day societies and systems.",
                steps: [
                    "Ancient India: The Indus Valley Civilization (2500 BCE) was one of the world's earliest urban civilizations. The Mauryan Empire (321-185 BCE) under Ashoka spread Buddhism.",
                    "Medieval India: The Mughal Empire (1526-1857) brought Persian art, architecture (Taj Mahal), and a unified administration under rulers like Akbar.",
                    "British Colonial Period: The British East India Company gained control after the Battle of Plassey (1757). The 1857 Revolt was the first major uprising.",
                    "Independence Movement: Gandhi's non-violent movements (Non-Cooperation, Civil Disobedience, Quit India) led to independence on August 15, 1947."
                ],
                didYouKnow: "The Indus Valley Civilization had advanced urban planning with drainage systems — over 4,500 years ago!",
                challengeQuestion: "Who was the first Prime Minister of independent India?",
                challengeOptions: ["Mahatma Gandhi", "Jawaharlal Nehru", "Sardar Patel", "B. R. Ambedkar"],
                challengeCorrect: 1
            },
            {
                keywords: ["monsoon", "climate", "weather", "rainfall", "temperature", "humidity", "cyclone", "tornado", "hurricane", "typhoon", "wind", "pressure", "isobar", "front", "map", "latitude", "longitude", "equator", "tropic of cancer", "tropic of capricorn", "hemisphere", "continent", "asia", "africa", "europe", "north america", "south america", "australia", "antarctica", "ocean", "atlantic", "pacific", "indian", "arctic", "river", "mountain", "plateau", "plain", "desert", "forest", "tropical", "temperate", "tundra", "taiga", "grassland", "savanna", "soil", "erosion", "conservation", "agriculture", "crop", "irrigation", "mineral", "resource", "renewable", "nonrenewable", "population", "migration", "urbanization", "settlement", "transport", "communication", "trade", "globalization"],
                subject: "Geography",
                title: "Geography Concepts Explained",
                explanation: "Geography studies the Earth's physical features, atmosphere, and human activity across its surface, examining the relationship between people and their environment.",
                steps: [
                    "Physical Geography: The Earth has four spheres — lithosphere (land), hydrosphere (water), atmosphere (air), and biosphere (life).",
                    "Climate & Weather: India has a tropical monsoon climate. The SW monsoon (June-Sept) brings 80% of annual rainfall, critical for agriculture.",
                    "Landforms: Mountains (Himalayas), plateaus (Deccan), plains (Indo-Gangetic), and deserts (Thar) each have distinct characteristics and uses.",
                    "Resources: Renewable (solar, wind, water) and non-renewable (coal, petroleum, minerals) resources must be managed sustainably."
                ],
                didYouKnow: "Mawsynram in Meghalaya, India, receives the highest average rainfall in the world — about 11,872 mm per year!",
                challengeQuestion: "Which wind system brings the majority of rainfall to India?",
                challengeOptions: ["North-East Monsoon", "South-West Monsoon", "Trade Winds", "Westerlies"],
                challengeCorrect: 1
            },
            {
                keywords: ["computer", "cpu", "memory", "ram", "rom", "hard drive", "ssd", "processor", "input", "output", "storage", "software", "hardware", "operating system", "windows", "linux", "macos", "program", "programming", "algorithm", "flowchart", "code", "coding", "python", "java", "c++", "javascript", "html", "css", "web", "website", "internet", "network", "lan", "wan", "wifi", "ethernet", "protocol", "tcp/ip", "http", "https", "dns", "ip address", "router", "switch", "modem", "data", "database", "sql", "table", "query", "binary", "decimal", "hexadecimal", "bit", "byte", "artificial intelligence", "machine learning", "ai", "cybersecurity", "encryption", "virus", "malware", "firewall", "cloud", "server", "client", "frontend", "backend", "api", "json", "bug", "debug", "syntax", "logic error", "loop", "conditional", "function", "variable", "array", "object", "class", "inheritance"],
                subject: "Computer Science",
                title: "Computer Science Concepts",
                explanation: "Computer science is the study of computational systems, programming principles, and the design of software and hardware that process information.",
                steps: [
                    "Hardware Basics: CPU (Central Processing Unit) processes instructions. RAM stores active data (volatile). ROM stores boot instructions (non-volatile).",
                    "Programming: An algorithm is a step-by-step procedure. Programs translate algorithms into code using loops, conditionals, functions, and variables.",
                    "Networking: The Internet uses TCP/IP protocols. Data is sent in packets via routers. IP addresses identify devices; DNS translates domain names to IPs.",
                    "Number Systems: Binary (base-2) uses 0s and 1s. Decimal (base-10) is human-readable. Hexadecimal (base-16) is used in memory addressing."
                ],
                didYouKnow: "The first computer programmer was Ada Lovelace, who wrote an algorithm for Charles Babbage's Analytical Engine in 1843!",
                challengeQuestion: "What does CPU stand for?",
                challengeOptions: ["Central Processing Unit", "Computer Personal Unit", "Central Program Utility", "Core Processing Unit"],
                challengeCorrect: 0
            },
            {
                keywords: ["economics", "economy", "demand", "supply", "market", "price", "inflation", "gdp", "gnp", "national income", "budget", "tax", "revenue", "expenditure", "fiscal", "monetary", "bank", "rbi", "reserve bank", "currency", "money", "credit", "loan", "interest", "saving", "investment", "stock", "share", "bond", "trade", "export", "import", "globalization", "liberalization", "privatization", "poverty", "unemployment", "employment", "agriculture", "industry", "service sector", "five year plan", "nipp", "make in india", "gst", "demonetization"],
                subject: "Economics",
                title: "Economics Concepts Explained",
                explanation: "Economics studies how societies allocate scarce resources to produce, distribute, and consume goods and services. It covers both macroeconomics (whole economy) and microeconomics (individual markets).",
                steps: [
                    "Basic Concepts: Scarcity forces choices. Opportunity cost is the next best alternative foregone. Factors of production: land, labor, capital, entrepreneurship.",
                    "Demand & Supply: Demand = willingness + ability to buy. Law of Demand: price ↑ → quantity demanded ↓. Supply: price ↑ → quantity supplied ↑. Equilibrium is where they meet.",
                    "National Income: GDP (Gross Domestic Product) = total value of goods/services produced in a year. GDP = Consumption + Investment + Government Spending + Net Exports.",
                    "Money & Banking: RBI is India's central bank. Banks accept deposits and give loans. Monetary policy controls money supply and interest rates."
                ],
                didYouKnow: "India's economy is the 5th largest in the world by nominal GDP and the 3rd largest by purchasing power parity (PPP)!",
                challengeQuestion: "What does GDP stand for?",
                challengeOptions: ["Gross Domestic Product", "General Domestic Price", "Gross Development Plan", "Government Debt Percentage"],
                challengeCorrect: 0
            },
            {
                keywords: ["civics", "democracy", "government", "constitution", "parliament", "lok sabha", "rajya sabha", "president", "prime minister", "chief minister", "governor", "judiciary", "supreme court", "high court", "fundamental rights", "directive principles", "secular", "federal", "union", "state", "panchayat", "municipality", "election", "voting", "political party", "bill", "law", "amendment", "citizen", "duties", "right to education", "right to information", "human rights", "constitutional", "preamble"],
                subject: "Civics",
                title: "Civics & Indian Polity",
                explanation: "Civics studies the rights, duties, and responsibilities of citizens and the structure and functioning of government institutions.",
                steps: [
                    "Indian Constitution: Adopted on 26 Jan 1950. It is the longest written constitution. Features: Federal system, Parliamentary democracy, Fundamental Rights, Directive Principles.",
                    "Union Government: President (head of state), Prime Minister (head of government), Council of Ministers. Parliament: Lok Sabha (lower house) + Rajya Sabha (upper house).",
                    "State Government: Governor (appointed by President), Chief Minister (elected head of state government), State Legislature (Vidhan Sabha + Vidhan Parishad).",
                    "Judiciary: Supreme Court (apex court), High Courts (state level), District Courts. The Supreme Court has original, appellate, and advisory jurisdiction."
                ],
                didYouKnow: "The Indian Constitution is the world's longest written constitution, with 448 articles in 25 parts as of 2023!",
                challengeQuestion: "Who is the head of the Indian state?",
                challengeOptions: ["Prime Minister", "President", "Chief Justice", "Speaker of Lok Sabha"],
                challengeCorrect: 1
            },
            {
                keywords: ["english", "grammar", "tense", "noun", "pronoun", "verb", "adjective", "adverb", "preposition", "conjunction", "interjection", "article", "sentence", "clause", "phrase", "subject verb agreement", "active voice", "passive voice", "direct speech", "indirect speech", "reported speech", "modals", "conditionals", "essay", "paragraph", "composition", "letter", "story", "poem", "poetry", "prose", "literature", "shakespeare", "drama", "novel", "theme", "plot", "character", "setting", "figurative", "metaphor", "simile", "alliteration", "personification", "irony", "symbolism"],
                subject: "English",
                title: "English Language & Literature",
                explanation: "English covers language skills (reading, writing, speaking, listening) and the study of literature through prose, poetry, and drama.",
                steps: [
                    "Grammar Basics: Parts of speech include nouns (person/place/thing), verbs (action), adjectives (description), adverbs (modify verbs), prepositions (position), conjunctions (connect).",
                    "Tenses: Present (I walk), Past (I walked), Future (I will walk). Each has simple, continuous, perfect, and perfect continuous forms.",
                    "Active vs Passive: Active: 'The boy kicked the ball.' Passive: 'The ball was kicked by the boy.' Use passive when the action is more important than the doer.",
                    "Literature Analysis: Identify theme (central idea), plot (sequence of events), character (protagonist/antagonist), setting (time/place), and literary devices (metaphor, simile, imagery)."
                ],
                didYouKnow: "English has over 1.5 billion speakers worldwide, making it the most spoken language globally (including native and non-native speakers)!",
                challengeQuestion: "Which part of speech describes a person, place, or thing?",
                challengeOptions: ["Verb", "Adjective", "Noun", "Adverb"],
                challengeCorrect: 2
            },
            {
                keywords: ["environment", "pollution", "air pollution", "water pollution", "soil pollution", "noise pollution", "global warming", "climate change", "greenhouse", "carbon dioxide", "methane", "ozone", "deforestation", "conservation", "biodiversity", "endangered", "extinct", "renewable energy", "solar", "wind energy", "hydropower", "biomass", "sustainable", "ecosystem", "food chain", "food web", "biodegradable", "non-biodegradable", "waste management", "recycling", "compost", "sanitation", "swachh bharat"],
                subject: "Environmental Science",
                title: "Environment & Ecology",
                explanation: "Environmental science studies the interaction between physical, chemical, and biological components of the environment and the impact of human activities.",
                steps: [
                    "Ecosystem: All organisms (biotic) interact with their physical environment (abiotic — air, water, soil). Energy flows through food chains (producer → consumer → decomposer).",
                    "Pollution Types: Air (from vehicles/industries → respiratory issues), Water (from sewage/chemicals → waterborne diseases), Soil (from pesticides → reduced fertility), Noise (from traffic/construction → hearing loss).",
                    "Global Warming: Greenhouse gases (CO₂, CH₄, N₂O) trap heat. Human activities (burning fossil fuels, deforestation) increase these gases, causing temperature rise and climate change.",
                    "Conservation: Reduce, Reuse, Recycle. Renewable energy (solar, wind, hydro) reduces fossil fuel dependence. Protecting forests and wildlife preserves biodiversity."
                ],
                didYouKnow: "The Amazon rainforest produces about 20% of the world's oxygen and is home to 10% of all known species!",
                challengeQuestion: "Which gas is the primary contributor to the greenhouse effect?",
                challengeOptions: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"],
                challengeCorrect: 2
            },
            {
                keywords: ["puzzle", "riddle", "brain teaser", "logic", "reasoning", "cross the river", "fox goose", "fox", "goose", "wolf goat", "cabbage", "missionaries", "cannibals", "water jug", "river crossing", "weighing", "balance scale", "truth teller", "liar", "knight knave", "clock angle", "handshake", "age problem", "work problem", "pipe tank", "train problem", "relative speed", "boat stream", "upstream", "downstream", "circular track", "race", "infinite", "paradox", "beans", "farmer"],
                subject: "Logical Reasoning",
                title: "Logic Puzzles & Brain Teasers",
                explanation: "Logical reasoning puzzles test your ability to think step-by-step, apply constraints, and find optimal solutions through systematic trial and deduction.",
                steps: [
                    "Identify all elements and constraints: List every item/person involved and all rules about what can/cannot be left together.",
                    "Define the goal state: Clearly state what the final arrangement should look like (e.g., all items on the far side).",
                    "Find the bottleneck: Look for the most constrained step — usually the item that cannot be left with any other.",
                    "Work backwards if stuck: Start from the goal and reason backwards to see what the second-to-last state must be."
                ],
                didYouKnow: "The fox-goose-beans puzzle dates back to at least the 8th century, appearing in the works of Alcuin of York, a scholar in Charlemagne's court!",
                challengeQuestion: "In the fox-goose-beans puzzle, what should the farmer take on his FIRST trip across the river?",
                challengeOptions: ["Fox", "Goose", "Beans", "Nothing"],
                challengeCorrect: 1
            },
            {
                keywords: ["general knowledge", "gk", "current affairs", "sports", "game", "cricket", "football", "hockey", "tennis", "olympics", "world cup", "national flag", "national anthem", "national emblem", "national animal", "national bird", "national flower", "national tree", "capital", "country", "state capital", "currency", "language", "religion", "festival", "diwali", "holi", "eid", "christmas", "dussehra", "independence day", "republic day", "gandhi jayanti", "teacher day", "children day"],
                subject: "General Knowledge",
                title: "General Knowledge & Current Affairs",
                explanation: "General Knowledge covers a wide range of topics including Indian and world geography, history, science, sports, awards, and current events.",
                steps: [
                    "India at a Glance: Capital — New Delhi. National Animal — Bengal Tiger. National Bird — Peacock. National Flower — Lotus. National Anthem — Jana Gana Mana.",
                    "World Geography: Largest continent — Asia. Largest ocean — Pacific. Highest mountain — Mt. Everest (8,848m). Longest river — Nile (6,650 km).",
                    "Sports: Cricket (most popular in India), Hockey (national sport), Football (global phenomenon). World Cup tournaments are held every 4 years.",
                    "Important Days: Republic Day (Jan 26), Independence Day (Aug 15), Gandhi Jayanti (Oct 2), Teachers' Day (Sep 5), Children's Day (Nov 14)."
                ],
                didYouKnow: "India is the 7th largest country by area and the 2nd most populous country in the world!",
                challengeQuestion: "What is India's national animal?",
                challengeOptions: ["Lion", "Tiger", "Elephant", "Peacock"],
                challengeCorrect: 1
            }
        ];
    },

    matchSubject(query, subjects) {
        let bestMatch = null;
        let bestScore = 0;
        const words = query.split(/[\s,.;:!?()]+/);

        for (const sub of subjects) {
            let score = 0;
            for (const kw of sub.keywords) {
                const kwWords = kw.split(/\s+/);
                if (kwWords.length > 1) {
                    if (query.includes(kw)) {
                        score += 2;
                    }
                } else if (kw.length <= 3) {
                    if (words.includes(kw)) {
                        score++;
                    }
                } else {
                    if (query.includes(kw)) {
                        score++;
                    }
                }
            }
            if (score > bestScore) {
                bestScore = score;
                bestMatch = sub;
            }
        }

        return bestScore >= 1 ? bestMatch : null;
    },

    formatSandboxResponse(r) {
        return `### 📚 Subject: ${r.subject}\n**${r.title}**\n\n${r.explanation}\n\n` +
               `**Step-by-step Solution:**\n` +
               r.steps.map((s, i) => `${i+1}. ${s}`).join('\n') + `\n\n` +
               `---DIDYOUKNOW---\n💡 **Did You Know?** ${r.didYouKnow}\n\n` +
               `---CHALLENGE---\n{"question": "${r.challengeQuestion}", "options": ${JSON.stringify(r.challengeOptions)}, "correct": ${r.challengeCorrect}}`;
    },

    detectChapter(query) {
        const chapters = [
            { name: "surds", subject: "Mathematics", chapter: "Surds & Indices", keywords: ["surd", "surds", "rationalise", "rationalize", "conjugate", "radical", "root"] },
            { name: "indices", subject: "Mathematics", chapter: "Indices & Exponents", keywords: ["indices", "exponent", "power", "law of exponent"] },
            { name: "number system", subject: "Mathematics", chapter: "Number Systems", keywords: ["number system", "rational number", "irrational number", "real number", "natural number", "integer"] },
            { name: "polynomials", subject: "Mathematics", chapter: "Polynomials", keywords: ["polynomial", "degree", "zeroes", "coefficient", "binomial", "trinomial", "monomial"] },
            { name: "linear equations", subject: "Mathematics", chapter: "Linear Equations in Two Variables", keywords: ["linear equation", "simultaneous", "pair of equation", "elimination", "substitution"] },
            { name: "quadratic", subject: "Mathematics", chapter: "Quadratic Equations", keywords: ["quadratic", "discriminant", "roots", "sridharacharya"] },
            { name: "arithmetic progression", subject: "Mathematics", chapter: "Arithmetic Progressions", keywords: ["arithmetic progression", "ap ", "common difference", "nth term", "sum of n terms"] },
            { name: "trigonometry", subject: "Mathematics", chapter: "Trigonometry", keywords: ["trigonometry", "sin ", "cos ", "tan ", "sine", "cosine", "tangent", "cosec", "sec ", "cot ", "angle of elevation", "angle of depression", "heights and distance"] },
            { name: "coordinate geometry", subject: "Mathematics", chapter: "Coordinate Geometry", keywords: ["coordinate", "cartesian", "distance formula", "section formula", "midpoint", "quadrant"] },
            { name: "mensuration", subject: "Mathematics", chapter: "Mensuration", keywords: ["mensuration", "area of circle", "volume of", "surface area", "tsa ", "csa ", "lateral surface", "cylinder", "cone", "sphere", "hemisphere", "cuboid", "cube"] },
            { name: "statistics", subject: "Mathematics", chapter: "Statistics", keywords: ["statistics", "mean", "median", "mode", "bar graph", "histogram", "ogive", "cumulative frequency"] },
            { name: "probability", subject: "Mathematics", chapter: "Probability", keywords: ["probability", "chance", "random", "event", "outcome", "sample space"] },
            { name: "sets", subject: "Mathematics", chapter: "Sets", keywords: ["sets", "union", "intersection", "subset", "venn diagram", "complement", "power set"] },
            { name: "matrices", subject: "Mathematics", chapter: "Matrices", keywords: ["matrices", "matrix", "determinant", "adjoint", "inverse", "transpose"] },
            { name: "calculus", subject: "Mathematics", chapter: "Calculus", keywords: ["calculus", "derivative", "differentiation", "integration", "integral", "limit", "continuity"] },
            { name: "analytic geometry", subject: "Mathematics", chapter: "Analytic Geometry & Curves", keywords: ["curve", "tangent to curve", "normal to curve", "tangent at point", "normal at point", "slope of tangent", "slope of normal", "geometric progression", "series sum", "infinity", "infinite series", "coordinates of point", "distance from origin"] },
            { name: "vectors", subject: "Mathematics", chapter: "Vector Algebra", keywords: ["vector", "scalar", "dot product", "cross product"] },

            { name: "motion", subject: "Physics", chapter: "Motion", keywords: ["motion", "distance", "displacement", "speed", "velocity", "acceleration", "graph"] },
            { name: "force", subject: "Physics", chapter: "Force & Laws of Motion", keywords: ["force", "newton", "inertia", "momentum", "impulse", "friction"] },
            { name: "gravitation", subject: "Physics", chapter: "Gravitation", keywords: ["gravitation", "gravity", "g ", "universal law", "free fall", "mass", "weight", "kepler", "planet"] },
            { name: "work energy", subject: "Physics", chapter: "Work, Energy & Power", keywords: ["work", "energy", "power", "kinetic", "potential", "conservation of energy"] },
            { name: "sound", subject: "Physics", chapter: "Sound", keywords: ["sound", "frequency", "amplitude", "wavelength", "echo", "sonar", "ultrasound", "infrasound"] },
            { name: "light", subject: "Physics", chapter: "Light: Reflection & Refraction", keywords: ["light", "reflection", "refraction", "mirror", "lens", "concave", "convex", "focus", "focal", "prism", "dispersion", "rainbow", "snell", "critical angle", "total internal reflection"] },
            { name: "electricity", subject: "Physics", chapter: "Electricity", keywords: ["electricity", "electric current", "circuit", "ohm", "voltage", "potential difference", "resistance", "resistor", "series", "parallel", "heating effect"] },
            { name: "magnetism", subject: "Physics", chapter: "Magnetic Effects of Current", keywords: ["magnetic", "magnet", "electromagnet", "solenoid", "motor", "generator", "induced current", "faraday", "flemings"] },
            { name: "thermodynamics", subject: "Physics", chapter: "Heat & Thermodynamics", keywords: ["thermodynamics", "heat", "temperature", "specific heat", "conduction", "convection", "radiation", "calorimetry"] },
            { name: "waves", subject: "Physics", chapter: "Waves", keywords: ["wave", "oscillation", "simple harmonic", "shm", "pendulum", "spring"] },
            { name: "modern physics", subject: "Physics", chapter: "Modern Physics", keywords: ["modern physics", "radioactivity", "nuclear", "fission", "fusion", "photoelectric", "quantum", "photon"] },

            { name: "matter", subject: "Chemistry", chapter: "Matter in Our Surroundings", keywords: ["matter", "solid liquid gas", "state of matter", "melting", "boiling", "evaporation", "condensation", "sublimation"] },
            { name: "atom", subject: "Chemistry", chapter: "Structure of Atom", keywords: ["structure of atom", "atomic structure", "proton", "neutron", "electron", "orbit", "shell", "bohr", "rutherford", "isotope", "isobar"] },
            { name: "periodic", subject: "Chemistry", chapter: "Periodic Classification", keywords: ["periodic", "classification", "mendeleev", "modern periodic", "group", "period", "valence"] },
            { name: "chemical bonding", subject: "Chemistry", chapter: "Chemical Bonding", keywords: ["chemical bond", "ionic bond", "covalent bond", "electrovalent", "Lewis", "octet", "valence electron"] },
            { name: "acid base salt", subject: "Chemistry", chapter: "Acids, Bases & Salts", keywords: ["acid", "base", "salt", "ph ", "indicator", "litmus", "neutralization", "baking soda", "washing soda", "bleaching powder", "plaster of paris"] },
            { name: "metals nonmetals", subject: "Chemistry", chapter: "Metals & Non-metals", keywords: ["metal", "nonmetal", "non-metal", "lustre", "ductile", "malleable", "conductivity", "corrosion", "rust", "alloy", "reactivity series"] },
            { name: "carbon compounds", subject: "Chemistry", chapter: "Carbon & Its Compounds", keywords: ["carbon", "organic", "hydrocarbon", "alkane", "alkene", "alkyne", "alcohol", "ethanol", "ethanoic acid", "ester", "soap", "detergent", "covalent", "homologous"] },
            { name: "chemical reactions", subject: "Chemistry", chapter: "Chemical Reactions & Equations", keywords: ["chemical reaction", "balanced equation", "combination", "decomposition", "displacement", "redox", "oxidation", "reduction", "corrosion", "rancidity"] },
            { name: "electrochemistry", subject: "Chemistry", chapter: "Electrochemistry", keywords: ["electrolysis", "electrochemical", "galvanic", "voltaic", "electrode", "anode", "cathode", "electroplating"] },

            { name: "cell", subject: "Biology", chapter: "Cell: Structure & Functions", keywords: ["cell", "organelle", "nucleus", "mitochondria", "ribosome", "golgi", "endoplasmic", "lysosome", "plastid", "vacuole", "cell wall", "cell membrane", "prokaryotic", "eukaryotic"] },
            { name: "tissues", subject: "Biology", chapter: "Tissues", keywords: ["tissue", "epithelial", "connective", "muscular", "nervous", "parenchyma", "collenchyma", "sclerenchyma", "xylem", "phloem", "meristematic"] },
            { name: "diversity", subject: "Biology", chapter: "Diversity in Living Organisms", keywords: ["diversity", "classification", "kingdom", "monera", "protista", "fungi", "plantae", "animalia", "vertebrate", "invertebrate", "phylum", "genus", "species"] },
            { name: "photosynthesis", subject: "Biology", chapter: "Photosynthesis", keywords: ["photosynthesis", "chlorophyll", "chloroplast", "calvin", "light reaction", "dark reaction", "photolysis"] },
            { name: "respiration", subject: "Biology", chapter: "Respiration", keywords: ["respiration", "breathing", "aerobic", "anaerobic", "glycolysis", "krebs", "atp ", "fermentation", "lungs", "alveoli", "diaphragm"] },
            { name: "transport", subject: "Biology", chapter: "Transport in Living Organisms", keywords: ["transport", "circulation", "heart", "blood", "blood vessel", "artery", "vein", "capillary", "lymph", "xylem transport", "phloem transport", "transpiration"] },
            { name: "excretion", subject: "Biology", chapter: "Excretion", keywords: ["excretion", "kidney", "nephron", "urine", "dialysi", "liver", "skin", "lungs", "ureter", "urethra", "bladder"] },
            { name: "control coordination", subject: "Biology", chapter: "Control & Coordination", keywords: ["control", "coordination", "nervous system", "neuron", "brain", "reflex", "synapse", "hormone", "endocrine", "thyroid", "insulin", "adrenaline", "growth hormone"] },
            { name: "reproduction", subject: "Biology", chapter: "Reproduction", keywords: ["reproduction", "asexual", "sexual", "flower", "pollination", "fertilization", "menstrual", "pregnancy", "contraception", "testis", "ovary", "uterus", "sperm", "egg"] },
            { name: "heredity", subject: "Biology", chapter: "Heredity & Evolution", keywords: ["heredity", "genetics", "gene", "dna ", "chromosome", "mendel", "dominant", "recessive", "trait", "evolution", "natural selection", "speciation"] },
            { name: "health", subject: "Biology", chapter: "Health & Disease", keywords: ["disease", "health", "immunity", "vaccine", "antibiotic", "pathogen", "bacteria", "virus", "protozoan", " malaria", "typhoid", "aids", "cancer", "deficiency"] },
            { name: "microorganisms", subject: "Biology", chapter: "Microorganisms", keywords: ["microorganism", "microbe", "bacteria", "virus", "fungus", "protozoa", "algae", "fermentation", "pasteurization"] },
            { name: "environment", subject: "Biology", chapter: "Our Environment", keywords: ["ecosystem", "food chain", "food web", "trophic", "biodegradable", "non-biodegradable", "ozone", "greenhouse", "global warming"] },

            { name: "french revolution", subject: "History", chapter: "The French Revolution", keywords: ["french revolution", "1789", "bastille", "robespierre", "napoleon", "reign of terror", "declaration of rights"] },
            { name: "nationalism europe", subject: "History", chapter: "Rise of Nationalism in Europe", keywords: ["nationalism europe", "unification", "italy", "germany", "bismarck", "garibaldi", "mazzini", "nation state"] },
            { name: "nationalism india", subject: "History", chapter: "Nationalism in India", keywords: ["nationalism india", "gandhi", "non cooperation", "civil disobedience", "quit india", "salt march", "rowlatt", "jallianwala", "khilafat"] },
            { name: "medieval india", subject: "History", chapter: "Medieval India", keywords: ["medieval india", "delhi sultanate", "mughal", "akbar", "shah jahan", "aurangzeb", "taj mahal", "sher shah", "vijayanagara", "bhakti", "sufi"] },
            { name: "ancient india", subject: "History", chapter: "Ancient India", keywords: ["ancient india", "indus valley", "harappa", "mohenjodaro", "vedic", "maurya", "ashoka", "gupta", "chola", "sangam"] },
            { name: "world wars", subject: "History", chapter: "World Wars", keywords: ["world war", "first world war", "second world war", "hitler", "mussolini", "allied", "axis", "league of nations", "united nations"] },
            { name: "industrial revolution", subject: "History", chapter: "Industrial Revolution", keywords: ["industrial revolution", "factory", "textile", "steam engine", "urbanization", "capitalism", "socialism"] },
            { name: "cold war", subject: "History", chapter: "Cold War Era", keywords: ["cold war", "nato", "warsaw", "superpower", "arms race", "berlin wall", "vietnam", "korean", "proxy war"] },

            { name: "resources", subject: "Geography", chapter: "Resources & Development", keywords: ["resource", "renewable resource", "non renewable", "sustainable", "conservation", "land use", "soil erosion", "land degradation"] },
            { name: "agriculture", subject: "Geography", chapter: "Agriculture", keywords: ["agriculture", "crop", "kharif", "rabi", "zaid", "rice", "wheat", "plantation", "shifting cultivation", "horticulture", "sericulture"] },
            { name: "minerals", subject: "Geography", chapter: "Minerals & Energy Resources", keywords: ["mineral", "ore", "mining", "coal", "petroleum", "natural gas", "solar energy", "wind energy", "nuclear power", "hydel"] },
            { name: "industries", subject: "Geography", chapter: "Manufacturing Industries", keywords: ["manufacturing", "industry", "iron and steel", "textile", "cement", "automobile", "agro based", "industrial region"] },
            { name: "climate india", subject: "Geography", chapter: "Climate of India", keywords: ["climate india", "monsoon", "southwest monsoon", "northeast monsoon", "retreating monsoon", "el nino", "la nina"] },
            { name: "transport india", subject: "Geography", chapter: "Transport & Communication", keywords: ["transport", "roadways", "railways", "waterways", "airways", "communication", "internet", "postal"] },

            { name: "constitution", subject: "Civics", chapter: "Indian Constitution", keywords: ["constitution", "preamble", "fundamental right", "directive principle", "secular", "federal", "unitary", "amendment"] },
            { name: "democracy", subject: "Civics", chapter: "Democracy", keywords: ["democracy", "election", "voting", "political party", "pressure group", "public opinion"] },
            { name: "parliament", subject: "Civics", chapter: "Parliament & Legislature", keywords: ["parliament", "lok sabha", "rajya sabha", "speaker", "mps", "bill", "law", "legislature"] },
            { name: "judiciary", subject: "Civics", chapter: "Judiciary", keywords: ["judiciary", "supreme court", "high court", "judge", "public interest", "pil", "justice"] },
            { name: "federalism", subject: "Civics", chapter: "Federalism", keywords: ["federalism", "centre state", "union list", "state list", "concurrent list", "panchayat", "municipality", "local government"] },

            { name: "development", subject: "Economics", chapter: "Development", keywords: ["development", "gdp", "human development", "hdi", "per capita", "sustainable development"] },
            { name: "sectors", subject: "Economics", chapter: "Sectors of Economy", keywords: ["sectors of economy", "primary sector", "secondary sector", "tertiary sector", "gdp"] },
            { name: "money credit", subject: "Economics", chapter: "Money & Credit", keywords: ["money", "currency", "credit", "loan", "bank", "interest", "collateral", "rbi", "reserve bank", "formal sector", "informal sector"] },
            { name: "globalization", subject: "Economics", chapter: "Globalization", keywords: ["globalization", "liberalization", "privatization", "foreign trade", "mnc", "multinational", "wto", "world trade"] },
            { name: "consumer rights", subject: "Economics", chapter: "Consumer Rights", keywords: ["consumer", "consumer right", "consumer court", "legal metrology", "awareness", "advertisement", "market"] },

            { name: "tenses", subject: "English", chapter: "Tenses & Grammar", keywords: ["tense", "past tense", "present tense", "future tense", "grammar", "sentence structure"] },
            { name: "voice", subject: "English", chapter: "Active & Passive Voice", keywords: ["active voice", "passive voice", "change the voice"] },
            { name: "narration", subject: "English", chapter: "Direct & Indirect Speech", keywords: ["direct speech", "indirect speech", "reported speech", "narration"] },
            { name: "modals", subject: "English", chapter: "Modals", keywords: ["modal", "auxiliary", "can could", "may might", "shall should", "will would", "must ought"] },
            { name: "prepositions", subject: "English", chapter: "Prepositions", keywords: ["preposition", "in on at", "since for", "above below"] },
            { name: "writing skills", subject: "English", chapter: "Writing Skills", keywords: ["letter writing", "essay writing", "paragraph", "report writing", "notice", "email", "article", "speech"] }
        ];

        let bestMatch = null;
        let bestScore = 0;

        for (const ch of chapters) {
            let score = 0;
            for (const kw of ch.keywords) {
                if (query.includes(kw)) {
                    score++;
                }
            }
            if (score > bestScore) {
                bestScore = score;
                bestMatch = ch;
            }
        }

        return bestScore >= 1 ? bestMatch : null;
    },

    formatChapterResponse(ch, prompt, query) {
        return `### 📚 Subject: ${ch.subject}\n**${ch.chapter}**\n\nI see you're asking about **${ch.chapter}** in ${ch.subject}. Here's a structured guide to help you master this topic:\n\n` +
               `**Key Concepts to Focus On:**\n` +
               `1. **Understand the fundamentals** — Review the definitions, formulas, and core principles of ${ch.chapter} from your NCERT/CBSE textbook.\n` +
               `2. **Study important derivations** — Pay attention to step-by-step derivations and solved examples provided in the chapter.\n` +
               `3. **Practice numerical problems** — Work through the exercises at the end of the chapter, focusing on application-based questions.\n` +
               `4. **Review past year questions** — Check previous board exam papers for commonly asked questions in ${ch.chapter}.\n` +
               `5. **Create revision notes** — Summarize key points, formulas, and diagrams for quick revision before exams.\n\n` +
               `For a more specific answer, please type your exact question about ${ch.chapter}.\n\n` +
               `---DIDYOUKNOW---\n💡 **Did You Know?** Active recall — testing yourself instead of re-reading — improves long-term retention by up to 150%!\n\n` +
               `---CHALLENGE---\n{"question": "", "options": [], "correct": 0}`;
    },

    /* All-purpose knowledge base */
    knowledgeBase: {
        // === GEOGRAPHY: CAPITALS & COUNTRIES ===
        "capital of france": { s: "Geography", a: "Paris is the capital and largest city of France, located on the Seine River. It is known as 'The City of Light' and is home to the Eiffel Tower, Louvre Museum, and Notre-Dame Cathedral." },
        "capital of india": { s: "Geography", a: "New Delhi is the capital of India, located on the Yamuna River. It is part of the larger National Capital Territory (NCT) of Delhi and houses the Rashtrapati Bhavan, Parliament House, and India Gate." },
        "capital of japan": { s: "Geography", a: "Tokyo is the capital of Japan, the world's most populous metropolitan area. It is a global hub for technology, finance, and culture, home to the Imperial Palace, Shibuya Crossing, and Tokyo Tower." },
        "capital of china": { s: "Geography", a: "Beijing is the capital of China, one of the world's oldest cities. It is renowned for the Forbidden City, Great Wall of China (nearby), Temple of Heaven, and Tiananmen Square." },
        "capital of usa": { s: "Geography", a: "Washington, D.C. (District of Columbia) is the capital of the United States. It is home to the White House, Capitol Building, Lincoln Memorial, and the Smithsonian museums." },
        "capital of uk": { s: "Geography", a: "London is the capital of the United Kingdom, situated on the River Thames. It is famous for Buckingham Palace, Big Ben, the Tower of London, and the British Museum." },
        "capital of australia": { s: "Geography", a: "Canberra is the capital of Australia. Unlike Sydney or Melbourne, it was purpose-built as the capital in 1908 and houses the Parliament House, Australian War Memorial, and National Gallery." },
        "capital of russia": { s: "Geography", a: "Moscow is the capital of Russia, the largest city in Europe. It is known for the Kremlin, Red Square, St. Basil's Cathedral, and the Bolshoi Theatre." },
        "capital of germany": { s: "Geography", a: "Berlin is the capital of Germany. It is famous for the Brandenburg Gate, Berlin Wall (Checkpoint Charlie), Reichstag Building, and Museum Island." },
        "capital of egypt": { s: "Geography", a: "Cairo is the capital of Egypt, the largest city in the Arab world. It lies near the Great Pyramids of Giza and the Sphinx on the banks of the Nile River." },
        "capital of brazil": { s: "Geography", a: "Brasília is the capital of Brazil, inaugurated in 1960. It was a planned city designed by Oscar Niemeyer with its iconic airplane-shaped layout." },
        "capital of canada": { s: "Geography", a: "Ottawa is the capital of Canada, located on the Ottawa River. It is home to Parliament Hill, Rideau Canal, and the National Gallery of Canada." },
        "capital of south africa": { s: "Geography", a: "South Africa has three capitals: Pretoria (administrative), Cape Town (legislative), and Bloemfontein (judicial)." },
        "capital of italy": { s: "Geography", a: "Rome is the capital of Italy. Known as the 'Eternal City', it contains the Colosseum, Vatican City, Roman Forum, and Trevi Fountain." },
        "capital of spain": { s: "Geography", a: "Madrid is the capital of Spain, located in the center of the Iberian Peninsula. It is famous for the Prado Museum, Royal Palace, and Plaza Mayor." },
        "capital of pakistan": { s: "Geography", a: "Islamabad is the capital of Pakistan, a planned city built in the 1960s at the foot of the Margalla Hills." },
        "capital of bangladesh": { s: "Geography", a: "Dhaka is the capital of Bangladesh, one of the most densely populated cities in the world, located on the Buriganga River." },
        "capital of nepal": { s: "Geography", a: "Kathmandu is the capital of Nepal, situated in the Kathmandu Valley. It is known for its ancient temples, including Pashupatinath and Swayambhunath Stupa." },
        "capital of sri lanka": { s: "Geography", a: "Sri Jayawardenepura Kotte is the official capital of Sri Lanka, while Colombo is the commercial capital." },
        "capital of france population": { s: "Geography", a: "Paris has a population of approximately 2.1 million within the city limits and over 12 million in the metropolitan area." },
        "largest country": { s: "Geography", a: "Russia is the largest country in the world by land area at about 17.1 million km². Canada is second, followed by the United States, China, and Brazil." },
        "smallest country": { s: "Geography", a: "Vatican City is the smallest country in the world at just 0.44 km² (110 acres). It is an independent city-state enclaved within Rome, Italy." },
        "longest river": { s: "Geography", a: "The Nile River in Africa is traditionally considered the longest river at about 6,650 km. However, recent studies suggest the Amazon River in South America may be slightly longer." },
        "highest mountain": { s: "Geography", a: "Mount Everest is the highest mountain on Earth at 8,848.86 meters (29,031.7 feet) above sea level, located in the Himalayas on the border of Nepal and China (Tibet)." },
        "largest ocean": { s: "Geography", a: "The Pacific Ocean is the largest and deepest ocean on Earth, covering about 63.8 million square miles (165.25 million km²) — more than all landmasses combined." },

        // === SCIENCE: PHYSICS ===
        "newton law": { s: "Physics", a: "Sir Isaac Newton's three laws of motion: (1) An object at rest stays at rest unless acted upon by an external force. (2) F = ma (Force equals mass times acceleration). (3) Every action has an equal and opposite reaction." },
        "gravity": { s: "Physics", a: "Gravity is the force of attraction between any two objects with mass. On Earth, it gives us weight (g = 9.8 m/s²). Newton's law of universal gravitation states F = G(m₁m₂)/r², and Einstein's general relativity describes it as the curvature of spacetime." },
        "speed of light": { s: "Physics", a: "The speed of light in a vacuum is exactly 299,792,458 meters per second (about 300,000 km/s). It is the universal speed limit — nothing can travel faster than light according to Einstein's theory of relativity." },
        "einstein": { s: "Physics", a: "Albert Einstein (1879-1955) was a German-born theoretical physicist who developed the theory of relativity (E=mc²), explaining the relationship between mass and energy. He won the Nobel Prize in Physics in 1921 for his work on the photoelectric effect." },
        "newton": { s: "Physics", a: "Sir Isaac Newton (1643-1727) was an English physicist and mathematician who formulated the laws of motion and universal gravitation. He also co-invented calculus and built the first reflecting telescope." },
        "ohms law": { s: "Physics", a: "Ohm's Law states that the current (I) through a conductor is directly proportional to the voltage (V) across it, and inversely proportional to the resistance (R): V = IR. It was discovered by German physicist Georg Simon Ohm in 1827." },
        "friction": { s: "Physics", a: "Friction is a force that opposes relative motion between two surfaces in contact. Types include static, kinetic/sliding, rolling, and fluid friction. Friction depends on surface roughness and normal force, and can be reduced using lubricants or streamlining." },
        "energy conservation": { s: "Physics", a: "The Law of Conservation of Energy states that energy cannot be created or destroyed, only transformed from one form to another. For example, chemical energy in food → kinetic energy in muscles → heat energy." },
        "electricity": { s: "Physics", a: "Electricity is the flow of electric charge (electrons) through a conductor. Key concepts: current (I, measured in amperes), voltage (V, measured in volts), resistance (R, measured in ohms). Series circuits have one path; parallel circuits have multiple paths." },
        "sound": { s: "Physics", a: "Sound is a mechanical wave that travels through a medium (solid, liquid, gas) by vibrating particles. It cannot travel through a vacuum. Speed of sound in air at 20°C is about 343 m/s. Frequency determines pitch, amplitude determines loudness." },

        // === SCIENCE: CHEMISTRY ===
        "periodic table": { s: "Chemistry", a: "The Periodic Table organizes all 118 known chemical elements by atomic number in rows (periods) and columns (groups). Elements in the same group have similar properties. It was created by Dmitri Mendeleev in 1869." },
        "atom": { s: "Chemistry", a: "An atom is the smallest unit of matter that retains the properties of an element. It consists of a nucleus (protons + neutrons) surrounded by electrons in shells. Protons are positively charged, electrons negatively charged, neutrons neutral." },
        "chemical reaction": { s: "Chemistry", a: "A chemical reaction involves the rearrangement of atoms to form new substances. Reactants → Products. Types: combination (A+B→AB), decomposition (AB→A+B), displacement (A+BC→AC+B), combustion (hydrocarbon+O₂→CO₂+H₂O), and redox reactions." },
        "ph scale": { s: "Chemistry", a: "The pH scale measures how acidic or basic a solution is, ranging from 0 (highly acidic) to 14 (highly basic), with 7 being neutral. Acids have pH < 7 (e.g., HCl pH=1), bases have pH > 7 (e.g., NaOH pH=13). Litmus paper turns red in acid, blue in base." },
        "acid": { s: "Chemistry", a: "Acids are substances that release H⁺ ions in water, have a sour taste, turn blue litmus red, and have pH < 7. Strong acids (HCl, H₂SO₄, HNO₃) fully dissociate; weak acids (acetic, citric) partially dissociate." },
        "base": { s: "Chemistry", a: "Bases are substances that release OH⁻ ions in water, have a bitter taste, turn red litmus blue, feel slippery, and have pH > 7. Strong bases (NaOH, KOH) fully dissociate; weak bases (NH₃) partially dissociate." },
        "molar mass": { s: "Chemistry", a: "Molar mass is the mass of one mole of a substance (6.022 × 10²³ particles), expressed in g/mol. For example, H₂O has molar mass 18 g/mol (2×1 + 16). It is used to convert between mass and number of moles." },
        "organic chemistry": { s: "Chemistry", a: "Organic chemistry is the study of carbon-containing compounds. Carbon can form four covalent bonds, allowing diverse structures: chains, branches, rings. Key functional groups: alkanes, alkenes, alkynes, alcohols, carboxylic acids, esters, amines." },

        // === SCIENCE: BIOLOGY ===
        "human heart": { s: "Biology", a: "The human heart is a muscular organ about the size of a fist, located in the chest. It has four chambers: right atrium, right ventricle, left atrium, left ventricle. The heart pumps about 7,500 liters of blood daily through 100,000 km of blood vessels." },
        "dna": { s: "Biology", a: "DNA (Deoxyribonucleic Acid) is the molecule that contains genetic instructions for all living organisms. It has a double helix structure discovered by Watson and Crick in 1953. DNA is made of four nucleotides: A (adenine), T (thymine), G (guanine), C (cytosine)." },
        "photosynthesis": { s: "Biology", a: "Photosynthesis is the process by which green plants convert light energy into chemical energy (glucose). Equation: 6CO₂ + 6H₂O + Light → C₆H₁₂O₆ + 6O₂. It occurs in chloroplasts, which contain the green pigment chlorophyll." },
        "mitochondria": { s: "Biology", a: "Mitochondria are membrane-bound organelles known as the 'powerhouse of the cell'. They produce ATP (energy) through cellular respiration, have their own DNA, and are believed to have originated from ancient bacteria (endosymbiotic theory)." },
        "human brain": { s: "Biology", a: "The human brain is the command center of the nervous system, weighing about 1.4 kg and containing roughly 86 billion neurons. It is divided into the cerebrum (thinking, memory), cerebellum (coordination), and brainstem (basic life functions)." },
        "evolution": { s: "Biology", a: "Evolution is the process by which species change over time through natural selection, as proposed by Charles Darwin in 'On the Origin of Species' (1859). Organisms with advantageous traits survive and reproduce, passing those traits to the next generation." },
        "vaccine": { s: "Biology", a: "A vaccine is a biological preparation that provides immunity to a specific disease. It contains weakened or inactivated pathogens that stimulate the immune system to produce antibodies without causing the disease. Edward Jenner developed the first vaccine (smallpox) in 1796." },
        "ecosystem": { s: "Biology", a: "An ecosystem is a community of living organisms interacting with their non-living environment. Components: producers (plants), consumers (herbivores/carnivores), decomposers (bacteria/fungi). Energy flows through food chains and food webs." },
        "blood": { s: "Biology", a: "Blood is a connective tissue that transports oxygen, nutrients, waste, and immune cells. Components: red blood cells (carry oxygen via hemoglobin), white blood cells (immunity), platelets (clotting), and plasma (liquid matrix carrying dissolved substances)." },
        "respiratory system": { s: "Biology", a: "The respiratory system brings oxygen into the body and removes carbon dioxide. Pathway: nose/mouth → pharynx → larynx → trachea → bronchi → bronchioles → alveoli (gas exchange site). The diaphragm muscle controls breathing movements." },

        // === HISTORY ===
        "world war 2": { s: "History", a: "World War II (1939-1945) was the deadliest conflict in human history, involving most of the world's nations. It was fought between the Allies (UK, US, USSR, China) and the Axis (Germany, Italy, Japan). The war ended with the atomic bombings of Hiroshima and Nagasaki." },
        "world war 1": { s: "History", a: "World War I (1914-1918), also known as the Great War, was a global conflict centered in Europe. It was triggered by the assassination of Archduke Franz Ferdinand and involved the Allies (UK, France, Russia) vs Central Powers (Germany, Austria-Hungary, Ottoman Empire). Over 16 million died." },
        "indian independence": { s: "History", a: "India gained independence from British rule on August 15, 1947. The independence movement was led by Mahatma Gandhi (non-violent civil disobedience), Jawaharlal Nehru (first Prime Minister), and many others. The partition created India and Pakistan." },
        "french revolution": { s: "History", a: "The French Revolution (1789-1799) was a period of radical social and political change in France. It began with the storming of the Bastille on July 14, 1789, overthrew the monarchy, and established the French Republic. Key slogan: 'Liberté, égalité, fraternité'." },
        "american revolution": { s: "History", a: "The American Revolution (1775-1783) was the war by which the 13 American colonies gained independence from Great Britain. It began with the Battles of Lexington and Concord and ended with the Treaty of Paris (1783). George Washington was the commanding general." },
        "cold war": { s: "History", a: "The Cold War (1947-1991) was a period of geopolitical tension between the United States (NATO) and the Soviet Union (Warsaw Pact). It involved nuclear arms races, space race, proxy wars (Korea, Vietnam, Afghanistan), and ended with the fall of the Soviet Union in 1991." },
        "gandhi": { s: "History", a: "Mahatma Gandhi (1869-1948) was the leader of India's non-violent independence movement against British rule. He pioneered the philosophy of Satyagraha (truth force) and non-violent civil disobedience. He was assassinated on January 30, 1948." },
        "buddha": { s: "History", a: "Siddhartha Gautama, the Buddha (c. 563-483 BCE), was a spiritual teacher in ancient India who founded Buddhism. He attained enlightenment while meditating under the Bodhi tree in Bodh Gaya. His teachings focus on the Four Noble Truths and the Eightfold Path." },
        "magna carta": { s: "History", a: "Magna Carta (1215) was a royal charter of rights signed by King John of England at Runnymede. It established the principle that everyone, including the king, is subject to the law. It is a foundational document for constitutional law and democracy." },
        "renaissance": { s: "History", a: "The Renaissance (14th-17th century) was a period of cultural, artistic, and scientific rebirth in Europe after the Middle Ages. Key figures: Leonardo da Vinci, Michelangelo, Galileo, Shakespeare. It began in Florence, Italy and spread across Europe." },

        // === MATHEMATICS ===
        "pythagoras theorem": { s: "Mathematics", a: "Pythagoras' theorem states that in a right-angled triangle, the square of the hypotenuse equals the sum of squares of the other two sides: a² + b² = c². It was discovered by Greek mathematician Pythagoras (c. 570-495 BCE) and is fundamental to geometry and trigonometry." },
        "pi": { s: "Mathematics", a: "π (pi) is a mathematical constant equal to the ratio of a circle's circumference to its diameter. Its value is approximately 3.14159. Pi is irrational (never-ending decimal) and transcendental. Archimedes first calculated it accurately." },
        "quadratic formula": { s: "Mathematics", a: "The quadratic formula solves any quadratic equation ax² + bx + c = 0: x = [-b ± √(b² - 4ac)] / 2a. The discriminant D = b² - 4ac determines the nature of roots: D > 0 (two real), D = 0 (one real/repeated), D < 0 (two complex)." },
        "fibonacci": { s: "Mathematics", a: "The Fibonacci sequence is a series where each number is the sum of the two preceding ones: 0, 1, 1, 2, 3, 5, 8, 13, 21, 34... It appears frequently in nature (sunflower spirals, pinecones, shells) and was described by Italian mathematician Leonardo Fibonacci in 1202." },
        "calculus": { s: "Mathematics", a: "Calculus is the branch of mathematics dealing with change, co-invented by Isaac Newton and Gottfried Leibniz in the 17th century. Two main branches: differential calculus (rates of change, derivatives) and integral calculus (accumulation, areas under curves)." },
        "binary": { s: "Mathematics", a: "The binary number system uses only two digits: 0 and 1. It is the foundation of all modern computers, where each binary digit (bit) represents an electrical on/off state. For example, decimal 5 = binary 101." },

        // === TECHNOLOGY ===
        "computer": { s: "Technology", a: "A computer is an electronic device that processes data using binary instructions. Major components: CPU (processor), RAM (memory), storage (hard drive/SSD), input devices (keyboard/mouse), output devices (monitor/printer). Charles Babbage designed the first mechanical computer (Analytical Engine) in 1837." },
        "internet": { s: "Technology", a: "The Internet is a global network connecting millions of computers. It originated as ARPANET in 1969 (US Department of Defense). Key technologies: TCP/IP (communication protocol), World Wide Web (by Tim Berners-Lee, 1989), HTTP/HTTPS, DNS, and broadband/optical fiber." },
        "ai": { s: "Technology", a: "Artificial Intelligence (AI) is the simulation of human intelligence by machines. Subfields: machine learning (training from data), deep learning (neural networks), natural language processing (text understanding), computer vision (image recognition). AI was pioneered by Alan Turing, John McCarthy, and others." },
        "programming": { s: "Technology", a: "Programming is the process of giving instructions to a computer using a programming language. Popular languages: Python (general-purpose/data science), JavaScript (web), Java (enterprise/apps), C++ (systems/games), HTML/CSS (web structure/style)." },
        "smartphone": { s: "Technology", a: "A smartphone is a mobile phone with advanced computing capabilities. The first iPhone was released by Apple in 2007. Modern smartphones include: processor (SoC), touchscreen display, camera(s), GPS, Wi-Fi/Bluetooth, and various sensors (accelerometer, gyroscope)." },
        "quantum computing": { s: "Technology", a: "Quantum computing uses quantum bits (qubits) that can exist in multiple states simultaneously (superposition) and be entangled, enabling exponentially faster computation for certain problems. Companies developing quantum computers: IBM, Google, Microsoft, D-Wave." },

        // === LANGUAGE & LITERATURE ===
        "shakespeare": { s: "Literature", a: "William Shakespeare (1564-1616) was an English playwright, poet, and actor widely regarded as the greatest writer in the English language. His famous works include 'Romeo and Juliet', 'Hamlet', 'Macbeth', and 'A Midsummer Night's Dream'. He invented over 1,700 English words." },
        "noun": { s: "Grammar", a: "A noun is a word that names a person, place, thing, or idea. Types: proper nouns (names, e.g., 'India'), common nouns (general, e.g., 'country'), collective nouns (groups, e.g., 'team'), abstract nouns (concepts, e.g., 'freedom')." },
        "verb": { s: "Grammar", a: "A verb describes an action, occurrence, or state of being. Types: action verbs (run, eat), linking verbs (is, seem), auxiliary/helping verbs (have, will). Every complete sentence requires a verb." },
        "adjective": { s: "Grammar", a: "An adjective is a word that describes or modifies a noun. Examples: red, tall, beautiful, interesting. Adjectives can be comparative (bigger) and superlative (biggest). They answer 'what kind?', 'which one?', or 'how many?'." },
        "tense": { s: "Grammar", a: "Tense indicates the time of an action or state. Three main tenses: present (I walk), past (I walked), future (I will walk). Each has four aspects: simple, continuous/progressive, perfect, and perfect continuous (e.g., I have been walking)." },

        // === SPACE & ASTRONOMY ===
        "solar system": { s: "Astronomy", a: "The Solar System consists of the Sun and everything orbiting it: 8 planets (Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune), dwarf planets (Pluto), asteroids (most in the asteroid belt between Mars and Jupiter), comets, and countless smaller objects." },
        "sun": { s: "Astronomy", a: "The Sun is a yellow dwarf star at the center of our Solar System. It is about 4.6 billion years old, with a diameter of 1.39 million km. Its surface temperature is about 5,500°C, and it generates energy through nuclear fusion (hydrogen → helium)." },
        "moon": { s: "Astronomy", a: "Earth's Moon is the fifth largest natural satellite in the Solar System, with a diameter of 3,474 km. It orbits Earth every 27.3 days and causes tides through gravitational pull. The first human landing was Apollo 11 (1969) with Neil Armstrong and Buzz Aldrin." },
        "black hole": { s: "Astronomy", a: "A black hole is a region of spacetime where gravity is so strong that nothing — not even light — can escape. It forms when a massive star collapses under its own gravity. The first image of a black hole (M87*) was captured in 2019 by the Event Horizon Telescope." },
        "mars": { s: "Astronomy", a: "Mars is the fourth planet from the Sun, known as the 'Red Planet' due to iron oxide (rust) on its surface. It has the tallest mountain in the Solar System (Olympus Mons, 21.9 km) and the largest canyon (Valles Marineris). NASA's Perseverance rover is currently exploring it." },
        "big bang": { s: "Astronomy", a: "The Big Bang Theory is the leading explanation for the origin of the universe. It states that the universe began as a singularity about 13.8 billion years ago and has been expanding ever since. Cosmic microwave background radiation is key evidence for it." },

        // === EVERYDAY KNOWLEDGE ===
        "water": { s: "Science", a: "Water (H₂O) is a molecule made of two hydrogen atoms and one oxygen atom. It is essential for all known life, covering about 71% of Earth's surface. Water exists in three states: solid (ice), liquid (water), gas (steam). Its unique properties include high specific heat capacity and its ability to dissolve many substances (universal solvent)." },
        "oxygen": { s: "Science", a: "Oxygen (O₂) is a colorless, odorless gas that makes up about 21% of Earth's atmosphere. It is essential for cellular respiration in most living organisms and is produced by plants during photosynthesis. The ozone layer (O₃) in the stratosphere protects Earth from UV radiation." },
        "gravity on moon": { s: "Physics", a: "The Moon's gravity is about 1/6th of Earth's gravity (approximately 1.62 m/s²). This means a person weighing 60 kg on Earth would weigh only about 10 kg on the Moon." },

        // === INVENTIONS & DISCOVERIES ===
        "telephone": { s: "Technology", a: "The telephone was invented by Alexander Graham Bell in 1876. The first words transmitted were 'Mr. Watson, come here — I want to see you.' Bell's patent is considered one of the most valuable in history." },
        "light bulb": { s: "Technology", a: "Thomas Edison is widely credited with inventing the first commercially practical incandescent light bulb in 1879. However, earlier versions were developed by Humphry Davy (1800) and Joseph Swan (1860). Edison's key innovation was a long-lasting carbon filament." },
        "radio": { s: "Technology", a: "The radio was invented by Guglielmo Marconi in 1895, for which he won the Nobel Prize in Physics in 1909. Nikola Tesla also made fundamental contributions to radio technology." },
        "television": { s: "Technology", a: "The television was invented by John Logie Baird (mechanical TV, 1925) and Philo Farnsworth (electronic TV, 1927). The first electronic television broadcast in India started in 1959." },
        "penicillin": { s: "Science", a: "Penicillin, the first antibiotic, was discovered by Alexander Fleming in 1928 when he noticed that mold (Penicillium) killed bacteria. Mass production during WWII saved millions of lives." },
        "printing press": { s: "History", a: "The printing press was invented by Johannes Gutenberg in 1440 in Mainz, Germany. His movable type printing press revolutionized the spread of knowledge, making books affordable. The Gutenberg Bible (1455) was the first major book printed." },
        "wheel": { s: "History", a: "The wheel was invented around 3500 BCE in Mesopotamia (modern-day Iraq). It was first used for pottery (potter's wheel) before being adapted for transportation on chariots around 3200 BCE." },
        "internet invented": { s: "Technology", a: "The Internet originated as ARPANET, a US Department of Defense project launched in 1969. Tim Berners-Lee invented the World Wide Web (WWW) in 1989 at CERN, making the Internet accessible to everyone." },

        // === CONVERSATIONAL ===
        "joke": { s: "Fun", a: "Here's one: Why did the scarecrow win an award? Because he was outstanding in his field! 🏆" },
        "fun fact": { s: "Fun", a: "Here's a cool fact: A day on Venus is longer than a year on Venus! Venus takes 243 Earth days to rotate once on its axis but only 225 Earth days to orbit the Sun." },
        "motivational quote": { s: "Fun", a: "Here's one by Albert Einstein: 'Strive not to be a success, but rather to be of value.' And another by APJ Abdul Kalam: 'Dream, dream, dream. Dreams transform into thoughts and thoughts result in action.'" },
    },

    /* Detect question type from query */
    detectQueryType(query) {
        if (/^(what|which)\s+(is|are|was|were)/.test(query)) return "definition";
        if (/^(who)\s+(is|was|are|were)/.test(query)) return "person";
        if (/^(where)\s+(is|are|was|were)/.test(query)) return "place";
        if (/^(when)\s+(is|was|were|did)/.test(query)) return "time";
        if (/^(why)\s+(is|are|was|were|do|does|did)/.test(query)) return "reason";
        if (/^(how)\s+(to|do|does|did|is|are|was|were)/.test(query)) return "method";
        if (/^(define|definition|meaning|explain|describe|elaborate)\b/.test(query)) return "definition";
        if (/^(tell|show|give)\s+(me|us|some)/.test(query)) return "tell";
        if (/(joke|funny|humor)/.test(query)) return "joke";
        if (/(fact|did you know|interesting)/.test(query)) return "fact";
        if (/(quote|inspire|motivat)/.test(query)) return "quote";
        if (/(riddle|puzzle|brain teaser)/.test(query)) return "riddle";
        return "general";
    },

    /* Find matching entry in knowledgeBase using multi-keyword matching */
    findKnowledgeMatch(query) {
        const normalized = query.replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
        // Exact match on keys
        for (const [key, val] of Object.entries(this.knowledgeBase)) {
            if (normalized.includes(key)) return val;
        }
        // Try key subsets: check if all words in a key appear in query
        const entries = Object.entries(this.knowledgeBase);
        let best = null, bestScore = 0;
        for (const [key, val] of entries) {
            const keyWords = key.split(/\s+/).filter(w => w.length > 2);
            if (keyWords.length === 0) continue;
            let matchCount = 0;
            for (const kw of keyWords) {
                if (normalized.includes(kw)) matchCount++;
            }
            const score = matchCount / keyWords.length;
            if (score >= 0.6 && score > bestScore) {
                bestScore = score;
                best = val;
            }
        }
        return best;
    },

    /* Build a contextual fallback response for unmatched queries */
    contextualResponse(prompt, query, qtype) {
        // Try knowledge base
        const match = this.findKnowledgeMatch(query);
        if (match) {
            return `### 📚 Subject: ${match.s}\n**StudySnap AI Explains**\n\nYou asked about **${prompt.trim()}**.\n\n${match.a}\n\n` +
                   `---DIDYOUKNOW---\n💡 **Did You Know?** The word '${query.split(/\s+/).filter(w => w.length > 3)[0] || 'study'}' appears in many interesting contexts across different subjects!\n\n` +
                   `---CHALLENGE---\n{"question": "What curiosity would you like to explore next?", "options": ["A new subject", "Deeper dive", "Practice quiz", "Fun fact"], "correct": 0}`;
        }

        // Extract key nouns (words 4+ chars)
        const nouns = query.split(/\s+/).filter(w => w.length > 3 && !["what", "when", "where", "who", "why", "how", "does", "do", "did", "the", "that", "this", "with", "from", "have", "has", "had", "not", "are", "was", "were", "can", "could", "would", "will", "shall", "should", "about", "tell", "know", "like", "into"].includes(w));
        const topic = nouns.slice(0, 3).join(", ") || query.slice(0, 40);

        if (qtype === "definition") {
            return `### 📚 Subject: General Knowledge\n**Let’s Explore: ${topic}**\n\nGreat question! Let me break down **${topic}** for you:\n\n` +
                   `**Overview:** ${topic} is an important concept. In academic contexts, it is studied across multiple subjects — science, social studies, and language arts.\n\n` +
                   `**Key Points to Remember:**\n` +
                   `- Start by understanding the textbook definition from your NCERT/CBSE curriculum.\n` +
                   `- Look for real-world examples — how is this concept applied in daily life?\n` +
                   `- Create a concept map linking ${topic} to related ideas you've already learned.\n\n` +
                   `Would you like me to create a flashcard, quiz, or diagram on **${topic}**?\n\n` +
                   `---DIDYOUKNOW---\n💡 **Did You Know?** The Feynman Technique — explaining a concept in simple terms — is one of the most effective ways to learn!\n\n` +
                   `---CHALLENGE---\n{"question": "Which study technique involves teaching concepts to others?", "options": ["Feynman Technique", "Pomodoro", "Mind Mapping", "SQ3R"], "correct": 0}`;
        }

        if (qtype === "person") {
            return `### 📚 Subject: General Knowledge\n**About: ${topic}**\n\nYou asked about **${topic}**. Here's what you should know:\n\n` +
                   `To research this person:\n` +
                   `1. **Who are they?** - Look up their birth date, nationality, and profession.\n` +
                   `2. **Why are they famous?** - Identify their key contributions or achievements.\n` +
                   `3. **Timeline** - Note important events in their life journey.\n` +
                   `4. **Impact** - How did they influence their field or the world?\n\n` +
                   `Try searching your textbook or NCERT notes for more biographical details!\n\n` +
                   `---DIDYOUKNOW---\n💡 **Did You Know?** The biography genre comes from Greek 'bios' (life) and 'graphein' (to write).\n\n` +
                   `---CHALLENGE---\n{"question": "What literary genre tells the story of a person's life?", "options": ["Autobiography", "Biography", "Memoir", "Chronicle"], "correct": 1}`;
        }

        if (qtype === "place") {
            return `### 📚 Subject: Geography\n**Exploring: ${topic}**\n\nYou asked about the location/place **${topic}**. Here's how to study it:\n\n` +
                   `**Geographic Analysis Framework:**\n` +
                   `1. **Location** - Find it on a map. What continent/country is it in?\n` +
                   `2. **Physical Features** - What is the terrain, climate, and natural resources?\n` +
                   `3. **Human Geography** - Population, culture, economy, and landmarks.\n` +
                   `4. **Significance** - Why is this place important historically or culturally?\n\n` +
                   `Check your atlas or NCERT geography textbook for detailed maps and information!\n\n` +
                   `---DIDYOUKNOW---\n💡 **Did You Know?** There are 195 recognized countries in the world today!\n\n` +
                   `---CHALLENGE---\n{"question": "What is the largest continent by area?", "options": ["Africa", "Asia", "North America", "Europe"], "correct": 1}`;
        }

        if (qtype === "tell" || qtype === "joke") {
            const jokes = [
                "Why don't scientists trust atoms? Because they make up everything! ⚛️",
                "What do you call a fake noodle? An impasta! 🍝",
                "Why was the math book sad? It had too many problems. 📘",
                "What did the right triangle say to the left triangle? You're never right. 📐",
                "Why did the chicken go to the seance? To talk to the other side! 🐔",
                "Why did the scarecrow win an award? He was outstanding in his field! 🌾",
                "What do you get when you cross a snowman and a vampire? Frostbite! 🧛",
                "Why did the student eat his homework? Because the teacher said it was a piece of cake! 📝"
            ];
            const pick = jokes[Math.floor(Math.random() * jokes.length)];
            return `### 📚 Subject: Fun Break\n**Time for a Smile!**\n\n${pick}\n\n` +
                   `---DIDYOUKNOW---\n💡 **Did You Know?** Laughter triggers the release of endorphins — the body's natural 'feel-good' chemicals!\n\n` +
                   `---CHALLENGE---\n{"question": "Ready for more?", "options": ["Another joke", "Fun fact", "Study mode", "Quiz"], "correct": 0}`;
        }

        if (qtype === "quote") {
            const quotes = [
                "'The only way to do great work is to love what you do.' — Steve Jobs",
                "'Education is the most powerful weapon which you can use to change the world.' — Nelson Mandela",
                "'The future belongs to those who believe in the beauty of their dreams.' — Eleanor Roosevelt",
                "'You miss 100% of the shots you don't take.' — Wayne Gretzky",
                "'Believe you can and you're halfway there.' — Theodore Roosevelt",
                "'The best time to plant a tree was 20 years ago. The second best time is now.' — Chinese Proverb"
            ];
            const pick = quotes[Math.floor(Math.random() * quotes.length)];
            return `### 📚 Subject: Motivation\n**Words of Wisdom**\n\n${pick}\n\n` +
                   `---DIDYOUKNOW---\n💡 **Did You Know?** Reading motivational quotes can increase focus and persistence by activating the brain's reward centers!\n\n` +
                   `---CHALLENGE---\n{"question": "", "options": [], "correct": 0}`;
        }

        // For anything not matched, provide a helpful study-oriented response
        const reactions = [
            `That's an interesting query about **${topic}**! As your AI study tutor, I'd suggest approaching it step by step. Break down the concept, find examples in your NCERT textbook, and practice with related problems. If you need a specific explanation, try asking with more subject context — like 'Explain ${topic} in biology' or 'What is the formula for ${topic} in physics'!`,
            `I see you're curious about **${topic}**! To help you study this effectively: start with the basic definition from your curriculum, understand the underlying principles, and work through example problems. Feel free to ask a more specific question like a definition, formula, or historical fact about ${topic}!`,
            `Great curiosity about **${topic}**! Here's a study tip: relate it to something you already know. Creating connections between new concepts and familiar ones strengthens memory. Want me to create flashcards, a quiz, or a diagram to help you master ${topic}?`
        ];
        const reaction = reactions[Math.floor(Math.random() * reactions.length)];

        return `### 📚 Subject: General Study\n**StudySnap AI Explores: ${topic}**\n\n${reaction}\n\n` +
               `---DIDYOUKNOW---\n💡 **Did You Know?** Curiosity boosts learning! Studies show that asking questions activates the brain's reward system, making information easier to remember.\n\n` +
               `---CHALLENGE---\n{"question": "What would you like to do next?", "options": ["Ask another question", "Take a quiz", "Study flashcards", "Explore diagrams"], "correct": 0}`;
    },

    genericFallback(prompt, query) {
        const qtype = this.detectQueryType(query);
        return this.contextualResponse(prompt, query, qtype);
    },

    /* Mock Essay Grader */
    mockEssayAnalysis(essayText) {
        const words = essayText.split(/\s+/).filter(w => w.length > 0).length;
        
        let scoreGrammar = 75;
        let scoreStructure = 70;
        let scoreClarity = 80;
        let grade = "B";
        let feedback = [];

        if (words < 40) {
            scoreStructure = 35;
            scoreClarity = 50;
            grade = "D-";
            feedback.push({ critical: true, text: "Length too short: Board essays require at least 150 words. Expand with introductory definitions and practical instances." });
        } else {
            // Rule-based checks
            if (essayText.toLowerCase().includes("could of") || essayText.toLowerCase().includes("their is")) {
                scoreGrammar -= 15;
                feedback.push({ critical: true, text: "Grammar Mistake: Detected homophone confusion ('their is' or 'could of'). Use 'there is' for locations and 'could have' for modal verbs." });
            }
            if (!essayText.includes(".") || essayText.split(".").length < 3) {
                scoreStructure -= 20;
                feedback.push({ critical: true, text: "Formatting Issue: Lack of appropriate punctuation marks. Avoid run-on sentences by breaking thoughts into clear, concise clauses." });
            }
            if (words > 120) {
                scoreGrammar = Math.min(scoreGrammar + 15, 95);
                scoreStructure = Math.min(scoreStructure + 20, 90);
                scoreClarity = Math.min(scoreClarity + 10, 95);
            }
            
            const avgScore = (scoreGrammar + scoreStructure + scoreClarity) / 3;
            if (avgScore >= 90) grade = "A+";
            else if (avgScore >= 80) grade = "A-";
            else if (avgScore >= 70) grade = "B+";
            else if (avgScore >= 60) grade = "B-";
            else grade = "C";
        }

        // Add encouraging structural points
        if (words >= 40) {
            feedback.push({ critical: false, text: "Strong Vocabulary: Your text uses strong active voice structures and keeps an academic perspective throughout." });
            feedback.push({ critical: false, text: "Well-structured thesis: The introductory lines present a clear and logical direction for the overall topic arguments." });
        }

        return JSON.stringify({
            grade,
            grammar: scoreGrammar,
            structure: scoreStructure,
            clarity: scoreClarity,
            feedback
        });
    },

    /* Mock Flashcards Generator — chapter-specific per subject */
    mockFlashcardGeneration(content) {
        const query = content.toLowerCase();

        // ===== BIOLOGY SUB-BRANCHES =====
        if (query.includes("cell") || query.includes("mitosis") || query.includes("meiosis") || query.includes("organelle") || query.includes("mitochondria") || query.includes("ribosome") || query.includes("nucleus") || query.includes("cytoplasm")) {
            return JSON.stringify([
                { q: "What is the primary function of mitochondria?", a: "To produce ATP energy through cellular respiration — the powerhouse of the cell." },
                { q: "What is the difference between mitosis and meiosis?", a: "Mitosis produces 2 identical diploid cells (growth/repair); meiosis produces 4 non-identical haploid gametes (reproduction)." },
                { q: "Which organelle contains digestive enzymes?", a: "Lysosomes — membrane-bound organelles that break down waste and foreign invaders." },
                { q: "What is the function of ribosomes?", a: "Protein synthesis — they translate mRNA into polypeptide chains." },
                { q: "What is the cell membrane made of?", a: "A phospholipid bilayer with embedded proteins — fluid mosaic model described by Singer and Nicolson." }
            ]);
        }
        if (query.includes("photosynthesis") || query.includes("plant") || query.includes("chloroplast") || query.includes("chlorophyll") || query.includes("leaf") || query.includes("stomata") || query.includes("xylem") || query.includes("phloem") || query.includes("transpiration")) {
            return JSON.stringify([
                { q: "What is the equation for photosynthesis?", a: "6CO₂ + 6H₂O + Light → C₆H₁₂O₆ + 6O₂. Light energy is converted to chemical energy in chloroplasts." },
                { q: "What is the role of stomata?", a: "Small pores on leaves that regulate gas exchange (CO₂ in, O₂ out) and water loss through transpiration." },
                { q: "What is the function of xylem vessels?", a: "Transport water and dissolved minerals from roots to the rest of the plant through capillary action." },
                { q: "What is the function of phloem?", a: "Transports food (glucose/sucrose) from leaves to all parts of the plant via translocation." },
                { q: "Which pigment gives plants their green color?", a: "Chlorophyll — located in the thylakoid membranes of chloroplasts." }
            ]);
        }
        if (query.includes("human") || query.includes("heart") || query.includes("brain") || query.includes("lung") || query.includes("kidney") || query.includes("liver") || query.includes("stomach") || query.includes("digest") || query.includes("respirat") || query.includes("circulat") || query.includes("excret") || query.includes("neuron") || query.includes("nervous") || query.includes("hormone") || query.includes("endocrine")) {
            if (query.includes("heart") || query.includes("circulat") || query.includes("blood") || query.includes("artery") || query.includes("vein")) {
                return JSON.stringify([
                    { q: "How many chambers does the human heart have?", a: "Four chambers: right atrium, right ventricle, left atrium, left ventricle. The right side pumps deoxygenated blood to the lungs; the left side pumps oxygenated blood to the body." },
                    { q: "What is the function of red blood cells?", a: "To carry oxygen from the lungs to body tissues using hemoglobin, an iron-containing protein." },
                    { q: "What is blood pressure?", a: "The force exerted by circulating blood on artery walls, measured as systolic/diastolic (e.g., 120/80 mmHg)." },
                    { q: "What is the role of platelets?", a: "Blood clotting (coagulation) — they aggregate at wound sites to form a plug and prevent bleeding." },
                    { q: "What are the main components of blood?", a: "Red blood cells (RBCs), white blood cells (WBCs), platelets, and plasma (the liquid matrix)." }
                ]);
            }
            if (query.includes("brain") || query.includes("neuron") || query.includes("nervous") || query.includes("synapse")) {
                return JSON.stringify([
                    { q: "What are the three main parts of the human brain?", a: "Cerebrum (thought, memory, voluntary action), cerebellum (balance, coordination), and brainstem (heartbeat, breathing, reflexes)." },
                    { q: "What is a neuron?", a: "A nerve cell that transmits electrical signals. Parts: dendrites (receive), axon (transmit), synaptic terminals (communicate to next cell)." },
                    { q: "What is a synapse?", a: "The junction between two neurons where neurotransmitters are released to transmit signals across the gap." },
                    { q: "What does the autonomic nervous system control?", a: "Involuntary functions: heart rate, digestion, breathing, and reflex actions." },
                    { q: "What is the function of the cerebrum?", a: "The largest part of the brain, responsible for voluntary actions, speech, memory, intelligence, and sensory processing." }
                ]);
            }
            if (query.includes("kidney") || query.includes("excret") || query.includes("urine")) {
                return JSON.stringify([
                    { q: "What is the main function of the kidneys?", a: "To filter blood, remove waste (urea), regulate water/salt balance, and produce urine." },
                    { q: "What is a nephron?", a: "The functional filtering unit of the kidney — each kidney contains about 1 million nephrons." },
                    { q: "What is dialysis?", a: "An artificial blood-filtering procedure used when kidneys fail — it removes waste and excess fluid from the blood." },
                    { q: "What is urine composed of?", a: "95% water, plus urea, uric acid, salts (NaCl, KCl), and other dissolved wastes." },
                    { q: "What hormone regulates water reabsorption in kidneys?", a: "ADH (Antidiuretic Hormone) — released by the pituitary gland to control water balance." }
                ]);
            }
            return JSON.stringify([
                { q: "What is the primary function of the digestive system?", a: "To break down food into nutrients that can be absorbed into the bloodstream for energy and growth." },
                { q: "Where does most nutrient absorption occur?", a: "In the small intestine — its inner lining has villi and microvilli to maximize surface area." },
                { q: "What is the role of the liver?", a: "Produces bile (digests fats), stores glucose as glycogen, detoxifies harmful substances, and synthesizes proteins." },
                { q: "What is peristalsis?", a: "Wave-like muscular contractions that push food through the esophagus and digestive tract." },
                { q: "What enzyme breaks down starch in the mouth?", a: "Amylase (ptyalin) — produced by salivary glands, it converts starch into maltose." }
            ]);
        }
        if (query.includes("dna") || query.includes("gene") || query.includes("genetic") || query.includes("evolution") || query.includes("darwin") || query.includes("natural selection") || query.includes("chromosome") || query.includes("heredity") || query.includes("mutation") || query.includes("rna") || query.includes("protein synthesis")) {
            return JSON.stringify([
                { q: "What is the structure of DNA?", a: "A double helix made of two strands of nucleotides. Each nucleotide contains a phosphate, deoxyribose sugar, and a nitrogenous base (A, T, G, C)." },
                { q: "What is the Central Dogma of molecular biology?", a: "DNA → RNA → Protein. Genetic information flows from DNA (transcription to mRNA) to proteins (translation by ribosomes)." },
                { q: "What is a gene?", a: "A segment of DNA that codes for a specific protein or functional RNA. Genes are the basic units of heredity." },
                { q: "Who proposed the theory of natural selection?", a: "Charles Darwin in 'On the Origin of Species' (1859) — organisms with advantageous traits survive and reproduce more." },
                { q: "What is a mutation?", a: "A permanent change in the DNA sequence, caused by errors in replication or environmental factors (radiation, chemicals)." }
            ]);
        }
        if (query.includes("ecosystem") || query.includes("ecology") || query.includes("habitat") || query.includes("food chain") || query.includes("food web") || query.includes("biome") || query.includes("population") || query.includes("symbiosis") || query.includes("parasite") || query.includes("decomposer") || query.includes("producer") || query.includes("consumer") || query.includes("biodiversity") || query.includes("conservation") || query.includes("pollution")) {
            return JSON.stringify([
                { q: "What is a food chain?", a: "A linear sequence showing who eats whom: Producer → Primary Consumer → Secondary Consumer → Tertiary Consumer → Decomposer." },
                { q: "What is the 10% energy rule?", a: "Only about 10% of energy at one trophic level is transferred to the next; the rest is lost as heat." },
                { q: "What is symbiosis?", a: "A close, long-term interaction between two species. Types: mutualism (both benefit), commensalism (one benefits, other unaffected), parasitism (one benefits, other harmed)." },
                { q: "What is biodiversity?", a: "The variety of life forms in an ecosystem — genetic, species, and ecological diversity. High biodiversity indicates a healthy ecosystem." },
                { q: "What is the greenhouse effect?", a: "The trapping of heat by greenhouse gases (CO₂, CH₄, H₂O vapor) in the atmosphere, essential for life but amplified by human activity (global warming)." }
            ]);
        }
        if (query.includes("disease") || query.includes("vaccine") || query.includes("immunity") || query.includes("antibody") || query.includes("virus") || query.includes("bacteria") || query.includes("infection") || query.includes("pathogen") || query.includes("immune")) {
            return JSON.stringify([
                { q: "What is the difference between a virus and bacteria?", a: "Bacteria are single-celled living organisms that can reproduce independently; viruses are non-living protein shells with genetic material that require a host cell to replicate." },
                { q: "How do vaccines work?", a: "They introduce a weakened/inactivated pathogen (antigen) to stimulate the immune system to produce antibodies and memory cells without causing disease." },
                { q: "What are antibodies?", a: "Y-shaped proteins produced by B-lymphocytes (WBCs) that bind to specific antigens and neutralize pathogens." },
                { q: "What is herd immunity?", a: "When a large portion of a population is immune (through vaccination or prior infection), protecting those who cannot be vaccinated." },
                { q: "Who discovered the first vaccine?", a: "Edward Jenner — the smallpox vaccine in 1796, using cowpox virus to protect against smallpox." }
            ]);
        }

        // ===== CHEMISTRY SUB-BRANCHES =====
        if (query.includes("chem") || query.includes("acid") || query.includes("base") || query.includes("salt") || query.includes("reaction") || query.includes("element") || query.includes("compound") || query.includes("metal") || query.includes("non metal") || query.includes("oxidat") || query.includes("reduction") || query.includes("periodic") || query.includes("atom") || query.includes("molecule") || query.includes("bond") || query.includes("ph") || query.includes("organic") || query.includes("carbon compound") || query.includes("electrochem") || query.includes("mole") || query.includes("molar") || query.includes("concentration")) {
            if (query.includes("periodic") || query.includes("atom") || query.includes("electron") || query.includes("proton") || query.includes("neutron") || query.includes("shell") || query.includes("orbital") || query.includes("configuration") || query.includes("element") && !query.includes("compound")) {
                return JSON.stringify([
                    { q: "What is the structure of an atom?", a: "A nucleus (protons + neutrons) surrounded by electrons in shells/orbitals. Protons are +ve, electrons -ve, neutrons neutral." },
                    { q: "How is the periodic table organized?", a: "By increasing atomic number. Rows are periods (same number of shells), columns are groups (same valence electron configuration, similar properties)." },
                    { q: "What is an isotope?", a: "Atoms of the same element with the same number of protons but different numbers of neutrons (e.g., Carbon-12, Carbon-14)." },
                    { q: "What is the octet rule?", a: "Atoms tend to gain, lose, or share electrons to achieve a full outer shell of 8 electrons (like noble gases)." },
                    { q: "What is electronegativity?", a: "The tendency of an atom to attract shared electrons in a chemical bond. Fluorine is the most electronegative element." }
                ]);
            }
            if (query.includes("bond") || query.includes("ionic") || query.includes("covalent") || query.includes("metallic") || query.includes("electrovalent") || query.includes("molecule") && !query.includes("periodic")) {
                return JSON.stringify([
                    { q: "What is an ionic bond?", a: "A bond formed by the complete transfer of electrons from a metal to a non-metal, creating oppositely charged ions that attract (e.g., NaCl)." },
                    { q: "What is a covalent bond?", a: "A bond formed by the sharing of electrons between two non-metal atoms (e.g., H₂O, CO₂)." },
                    { q: "What is a metallic bond?", a: "A bond in metals where delocalized electrons are shared among a lattice of positive metal ions, enabling conductivity and malleability." },
                    { q: "What is a polar covalent bond?", a: "Unequal sharing of electrons due to difference in electronegativity, creating partial charges (δ⁺ and δ⁻), e.g., H₂O." },
                    { q: "What are intermolecular forces?", a: "Forces between molecules: hydrogen bonding (strongest), dipole-dipole, and London dispersion forces (weakest)." }
                ]);
            }
            if (query.includes("acid") || query.includes("base") || query.includes("salt") || query.includes("ph") || query.includes("neutrali")) {
                return JSON.stringify([
                    { q: "What is the pH of a strong acid?", a: "pH 0-2 (e.g., HCl, H₂SO₄). Strong acids fully dissociate in water, releasing all H⁺ ions." },
                    { q: "What happens in a neutralization reaction?", a: "An acid + base react to form salt + water. H⁺ + OH⁻ → H₂O. Example: HCl + NaOH → NaCl + H₂O." },
                    { q: "What is a universal indicator?", a: "A mixture of dyes that changes color across the pH range — red (acidic), green (neutral), purple (basic)." },
                    { q: "What is the pH of pure water?", a: "7 (neutral) at 25°C — because [H⁺] = [OH⁻] = 10⁻⁷ M." },
                    { q: "What are indicators?", a: "Substances that change color in acidic/basic conditions. Natural: litmus, turmeric; synthetic: phenolphthalein, methyl orange." }
                ]);
            }
            if (query.includes("organic") || query.includes("carbon") || query.includes("hydrocarbon") || query.includes("alkane") || query.includes("alkene") || query.includes("alkyne") || query.includes("alcohol") || query.includes("carboxylic") || query.includes("ester") || query.includes("functional group")) {
                return JSON.stringify([
                    { q: "Why is carbon special in organic chemistry?", a: "Carbon can form four covalent bonds (catenation), enabling long chains, branches, and rings — the backbone of millions of organic compounds." },
                    { q: "What are alkanes?", a: "Saturated hydrocarbons with only single bonds (C-C). General formula: CₙH₂ₙ₊₂. Example: Methane (CH₄), Ethane (C₂H₆)." },
                    { q: "What are alkenes?", a: "Unsaturated hydrocarbons with at least one double bond (C=C). General formula: CₙH₂ₙ. Example: Ethene (C₂H₄)." },
                    { q: "What is a functional group?", a: "An atom or group of atoms that determines the chemical properties of an organic compound. Examples: -OH (alcohol), -COOH (carboxylic acid)." },
                    { q: "What is esterification?", a: "A reaction between a carboxylic acid and an alcohol (with acid catalyst) to form an ester and water. Used in perfumes and flavors." }
                ]);
            }
            if (query.includes("metal") || query.includes("non metal") || query.includes("reactivity") || query.includes("corrosion") || query.includes("alloy") || query.includes("displacement") || query.includes("extraction")) {
                return JSON.stringify([
                    { q: "What is the reactivity series of metals?", a: "A list of metals ranked by reactivity: K > Na > Ca > Mg > Al > Zn > Fe > Pb > H > Cu > Ag > Au. Highly reactive metals are extracted by electrolysis." },
                    { q: "What is corrosion?", a: "The gradual destruction of metals by chemical reaction with the environment. Rust is iron oxide (Fe₂O₃) formed on iron." },
                    { q: "What is an alloy?", a: "A mixture of a metal with another element (usually another metal) to improve properties. Examples: Brass (Cu+Zn), Steel (Fe+C)." },
                    { q: "What is a displacement reaction?", a: "A more reactive metal displaces a less reactive metal from its compound. Example: Zn + CuSO₄ → ZnSO₄ + Cu." },
                    { q: "How are highly reactive metals extracted?", a: "By electrolysis of molten ores (e.g., Al from Al₂O₃). Less reactive metals are extracted by heating with carbon (reduction)." }
                ]);
            }
            if (query.includes("oxidat") || query.includes("reduction") || query.includes("redox") || query.includes("electrolysis") || query.includes("electrochem") || query.includes("galvanic") || query.includes("cell") || query.includes("electrode") || query.includes("anode") || query.includes("cathode")) {
                return JSON.stringify([
                    { q: "What is oxidation?", a: "Loss of electrons (or gain of oxygen). Example: Fe → Fe²⁺ + 2e⁻." },
                    { q: "What is reduction?", a: "Gain of electrons (or loss of oxygen). Example: Cu²⁺ + 2e⁻ → Cu." },
                    { q: "What is the mnemonic OIL RIG?", a: "Oxidation Is Loss (of electrons), Reduction Is Gain (of electrons)." },
                    { q: "What happens during electrolysis?", a: "An electric current passes through an electrolyte, causing ions to migrate: cations go to the cathode (-), anions to the anode (+)." },
                    { q: "What is a galvanic (voltaic) cell?", a: "A device that converts chemical energy to electrical energy through spontaneous redox reactions (e.g., batteries)." }
                ]);
            }
            return JSON.stringify([
                { q: "What is a chemical equation?", a: "A symbolic representation of a chemical reaction showing reactants (left) → products (right). Must be balanced for mass conservation." },
                { q: "What is a mole?", a: "6.022 × 10²³ particles (Avogadro's number) of a substance. One mole of any substance has mass equal to its molar mass in grams." },
                { q: "What is the law of conservation of mass?", a: "Mass cannot be created or destroyed in a chemical reaction — total mass of reactants = total mass of products." },
                { q: "What is a catalyst?", a: "A substance that speeds up a reaction by lowering activation energy without being consumed. Enzymes are biological catalysts." },
                { q: "What are exothermic and endothermic reactions?", a: "Exothermic releases heat (ΔH < 0, e.g., combustion); endothermic absorbs heat (ΔH > 0, e.g., photosynthesis)." }
            ]);
        }

        // ===== PHYSICS SUB-BRANCHES =====
        if (query.includes("physics") || query.includes("force") || query.includes("motion") || query.includes("newton") || query.includes("inertia") || query.includes("momentum") || query.includes("friction") || query.includes("gravity") || query.includes("energy") || query.includes("work") || query.includes("power") || query.includes("electric") || query.includes("current") || query.includes("voltage") || query.includes("resistance") || query.includes("wave") || query.includes("light") || query.includes("optics") || query.includes("sound") || query.includes("magnet") || query.includes("electromagnetic") || query.includes("circuit") || query.includes("heat") || query.includes("thermodynamic") || query.includes("nuclear")) {
            if (query.includes("force") || query.includes("newton") || query.includes("motion") || query.includes("inertia") || query.includes("momentum") || query.includes("friction")) {
                return JSON.stringify([
                    { q: "State Newton's First Law of Motion.", a: "A body remains at rest or in uniform motion unless acted upon by an external unbalanced force (Law of Inertia)." },
                    { q: "What is Newton's Second Law?", a: "F = ma — The net force on an object equals its mass times its acceleration. Force is measured in Newtons (N)." },
                    { q: "What is Newton's Third Law?", a: "Every action has an equal and opposite reaction. When you push a wall, the wall pushes back with equal force." },
                    { q: "What is momentum?", a: "Mass × velocity (p = mv). It is a vector quantity. The law of conservation of momentum states total momentum is conserved in isolated systems." },
                    { q: "What is friction?", a: "A force opposing relative motion between surfaces. Types: static, kinetic/sliding, rolling. Friction can be reduced by lubrication or streamlining." }
                ]);
            }
            if (query.includes("energy") || query.includes("work") || query.includes("power") || query.includes("kinetic") || query.includes("potential")) {
                return JSON.stringify([
                    { q: "What is kinetic energy?", a: "The energy of motion: KE = ½mv². A moving car, a flying bird, and flowing water all have kinetic energy." },
                    { q: "What is potential energy?", a: "Stored energy due to position or state: PE = mgh (gravitational). A stretched bow, a raised hammer, and a compressed spring store potential energy." },
                    { q: "State the Law of Conservation of Energy.", a: "Energy cannot be created or destroyed, only transformed from one form to another. Total energy in an isolated system remains constant." },
                    { q: "What is power?", a: "The rate of doing work: P = W/t. SI unit is the watt (W), where 1 W = 1 J/s." },
                    { q: "What is work in physics?", a: "Work = Force × Displacement (W = F·d), done only when force causes motion. SI unit is joule (J)." }
                ]);
            }
            if (query.includes("electric") || query.includes("current") || query.includes("voltage") || query.includes("resistance") || query.includes("circuit") || query.includes("ohm") || query.includes("cell") || query.includes("battery") || query.includes("series") || query.includes("parallel")) {
                return JSON.stringify([
                    { q: "What is Ohm's Law?", a: "V = IR — Potential difference across a conductor is directly proportional to current at constant temperature." },
                    { q: "What is the difference between series and parallel circuits?", a: "Series: single path, same current, voltage divides. Parallel: multiple paths, voltage same, current divides." },
                    { q: "What is electric current?", a: "The flow of electric charge (electrons) through a conductor, measured in amperes (A). I = Q/t." },
                    { q: "What is electrical resistance?", a: "The opposition to current flow, measured in ohms (Ω). Factors: length, cross-sectional area, material, temperature." },
                    { q: "What is Joule's law of heating?", a: "Heat produced H = I²Rt. Electric heaters, toasters, and bulbs convert electrical energy to heat using this principle." }
                ]);
            }
            if (query.includes("light") || query.includes("optics") || query.includes("mirror") || query.includes("lens") || query.includes("reflection") || query.includes("refraction") || query.includes("prism") || query.includes("spectrum") || query.includes("eye") || query.includes("vision") || query.includes("telescope") || query.includes("microscope")) {
                return JSON.stringify([
                    { q: "What is the law of reflection?", a: "Angle of incidence = Angle of reflection. The incident ray, reflected ray, and normal all lie in the same plane." },
                    { q: "What is Snell's law of refraction?", a: "n₁ sin θ₁ = n₂ sin θ₂. Light bends when it passes between media of different optical densities." },
                    { q: "What type of mirror is used in rear-view mirrors?", a: "Convex mirrors — they form a virtual, erect, diminished image with a wider field of view." },
                    { q: "What is a concave lens?", a: "A diverging lens that is thinner in the middle. It always forms a virtual, erect, and diminished image." },
                    { q: "What is the dispersion of light?", a: "The splitting of white light into its constituent colors (VIBGYOR) when passing through a prism, discovered by Newton." }
                ]);
            }
            if (query.includes("sound") || query.includes("wave") || query.includes("frequency") || query.includes("amplitude") || query.includes("wavelength") || query.includes("pitch") || query.includes("echo") || query.includes("sonar") || query.includes("decibel") || query.includes("ultrasound") || query.includes("infrasound")) {
                return JSON.stringify([
                    { q: "What is sound and how does it travel?", a: "Sound is a mechanical wave that requires a medium. It travels fastest in solids, slower in liquids, slowest in gases." },
                    { q: "What is the range of human hearing?", a: "20 Hz to 20,000 Hz (20 kHz). Frequencies below 20 Hz are infrasound; above 20 kHz are ultrasound." },
                    { q: "What is the speed of sound in air?", a: "Approximately 343 m/s at 20°C. Speed increases with temperature." },
                    { q: "What is an echo?", a: "The reflection of sound waves off a hard surface. Used by bats, sonar, and ultrasound imaging." },
                    { q: "What determines the pitch of a sound?", a: "Frequency — higher frequency means higher pitch. Amplitude determines loudness (measured in decibels)." }
                ]);
            }
            if (query.includes("magnet") || query.includes("electromagnetic") || query.includes("induction") || query.includes("faraday") || query.includes("generator") || query.includes("motor") || query.includes("transformer") || query.includes("magnetic field") || query.includes("flem")) {
                return JSON.stringify([
                    { q: "What is electromagnetic induction?", a: "The generation of an EMF (voltage) in a conductor when the magnetic flux through it changes — discovered by Michael Faraday." },
                    { q: "What is Fleming's Right Hand Rule?", a: "Used for generators: Thumb (motion), Forefinger (magnetic field), Middle finger (induced current) — all perpendicular." },
                    { q: "What is an electromagnet?", a: "A temporary magnet created by passing current through a coil wound around a soft iron core. Used in cranes, speakers, and relays." },
                    { q: "What is the difference between AC and DC?", a: "AC (Alternating Current) reverses direction periodically (household supply). DC (Direct Current) flows in one direction (batteries)." },
                    { q: "What is a transformer?", a: "A device that changes AC voltage using electromagnetic induction. Step-up increases voltage, step-down decreases voltage." }
                ]);
            }
            return JSON.stringify([
                { q: "What is gravity?", a: "The force of attraction between objects with mass. On Earth, g = 9.8 m/s². Newton's law: F = G(m₁m₂)/r²." },
                { q: "What is the SI unit of Force?", a: "Newton (N) — 1 N = 1 kg·m/s². Named after Sir Isaac Newton." },
                { q: "What is a scalar and a vector?", a: "Scalar has magnitude only (mass, speed). Vector has magnitude and direction (velocity, force, acceleration)." },
                { q: "What is the difference between speed and velocity?", a: "Speed is scalar (distance/time); velocity is vector (displacement/time) — direction matters for velocity." },
                { q: "What is the universal law of gravitation?", a: "Every object attracts every other object with force F = G(m₁m₂)/r², where G = 6.67 × 10⁻¹¹ N·m²/kg²." }
            ]);
        }

        // ===== HISTORY SUB-BRANCHES =====
        if (query.includes("history") || query.includes("independence") || query.includes("war") || query.includes("empire") || query.includes("revolution") || query.includes("mughal") || query.includes("british") || query.includes("ancient") || query.includes("medieval") || query.includes("colonial") || query.includes("freedom") || query.includes("national movement") || query.includes("constitution") || query.includes("gandhi") || query.includes("nation")) {
            if (query.includes("independence") || query.includes("gandhi") || query.includes("freedom") || query.includes("national movement") || query.includes("british") || query.includes("1857") || query.includes("partition")) {
                return JSON.stringify([
                    { q: "When did India gain independence?", a: "August 15, 1947 — after a multi-decade freedom struggle led by Gandhi, Nehru, and countless others." },
                    { q: "Who is known as the 'Father of the Nation' in India?", a: "Mahatma Gandhi — for pioneering non-violent civil disobedience (Satyagraha) against British rule." },
                    { q: "What was the Dandi Salt March (1930)?", a: "A 240-mile protest march led by Gandhi to break the British salt tax law, a pivotal event in India's independence movement." },
                    { q: "What was the 1857 Revolt?", a: "India's First War of Independence — a large-scale uprising of Indian sepoys and rulers against the British East India Company." },
                    { q: "What was the Rowlatt Act (1919)?", a: "A British law allowing arrest without trial, opposed by Gandhi — leading to the Jallianwala Bagh massacre." }
                ]);
            }
            if (query.includes("world war") || query.includes("ww1") || query.includes("ww2") || query.includes("hitler") || query.includes("nazi") || query.includes("fascist") || query.includes("allies") || query.includes("axis") || query.includes("cold war") || query.includes("nuclear")) {
                return JSON.stringify([
                    { q: "What caused World War I?", a: "Assassination of Archduke Franz Ferdinand (1914) triggered war between Allies (UK, France, Russia) and Central Powers (Germany, Austria-Hungary, Ottoman Empire)." },
                    { q: "What was World War II?", a: "The deadliest war (1939-45) between Allies (UK, US, USSR) and Axis (Germany, Italy, Japan). Ended with atomic bombs on Hiroshima and Nagasaki." },
                    { q: "Who was Adolf Hitler?", a: "Nazi dictator of Germany (1933-45) whose aggressive expansionism and genocidal policies led to WWII and the Holocaust (6 million Jews killed)." },
                    { q: "What was the Cold War?", a: "A 1947-1991 geopolitical tension between the US (NATO) and USSR (Warsaw Pact) involving nuclear arms race, space race, and proxy wars." },
                    { q: "What was the Holocaust?", a: "The systematic genocide of 6 million Jews by Nazi Germany under Hitler, along with millions of others (Roma, disabled, political opponents)." }
                ]);
            }
            if (query.includes("mughal") || query.includes("akbar") || query.includes("shah jahan") || query.includes("taj") || query.includes("medieval india") || query.includes("sultanate") || query.includes("babur") || query.includes("aurangzeb")) {
                return JSON.stringify([
                    { q: "Who founded the Mughal Empire in India?", a: "Babur in 1526, after defeating the Lodi Sultanate at the First Battle of Panipat." },
                    { q: "Who was Akbar the Great?", a: "The third Mughal emperor (1556-1605), known for religious tolerance, administrative reforms, and the Din-i-Ilahi philosophy." },
                    { q: "Which Mughal emperor built the Taj Mahal?", a: "Shah Jahan (1628-1658) — built the Taj Mahal in Agra as a mausoleum for his wife Mumtaz Mahal." },
                    { q: "What was the Mansabdari system?", a: "A military-administrative hierarchy introduced by Akbar, ranking officials (Mansabdars) based on their troop-holding capacity." },
                    { q: "Who was the last strong Mughal emperor?", a: "Aurangzeb (1658-1707) — expanded the empire to its greatest extent but his policies led to its decline." }
                ]);
            }
            if (query.includes("ancient") || query.includes("harappa") || query.includes("indus") || query.includes("vedic") || query.includes("maurya") || query.includes("ashoka") || query.includes("gupta") || query.includes("sanskrit") || query.includes("buddha") || query.includes("buddhism") || query.includes("jain")) {
                return JSON.stringify([
                    { q: "What was the Indus Valley Civilization?", a: "A Bronze Age civilization (2600-1900 BCE) in present-day Pakistan and India, known for advanced urban planning, drainage, and the Great Bath of Mohenjo-Daro." },
                    { q: "Who was Emperor Ashoka?", a: "A Mauryan emperor (268-232 BCE) who embraced Buddhism after the Kalinga War and spread non-violence and Dharma across India and beyond." },
                    { q: "What was the Gupta Empire known for?", a: "The 'Golden Age of India' (320-550 CE) — advancements in mathematics (concept of zero), astronomy, medicine, art, and literature (Kalidasa)." },
                    { q: "Who founded Buddhism?", a: "Siddhartha Gautama (the Buddha, c. 563-483 BCE) in Lumbini (present-day Nepal). Core teachings: Four Noble Truths and Eightfold Path." },
                    { q: "What is the Vedic period?", a: "The period (1500-500 BCE) when the Vedas — the oldest Hindu scriptures — were composed. Society was divided into varnas (castes)." }
                ]);
            }
            return JSON.stringify([
                { q: "What was the French Revolution?", a: "A period of radical social/political change in France (1789-1799) that overthrew the monarchy. Motto: Liberté, égalité, fraternité." },
                { q: "What was the Renaissance?", a: "A cultural rebirth (14th-17th century) in Europe, starting in Florence. Key figures: Leonardo da Vinci, Michelangelo, Martin Luther." },
                { q: "What was the Industrial Revolution?", a: "The transition to new manufacturing processes (1760-1840) — steam engine, factories, urbanization. Began in Britain." },
                { q: "Who is known as the 'Iron Man of India'?", a: "Sardar Vallabhbhai Patel — instrumental in unifying 562 princely states into the Indian Union." },
                { q: "Who drafted the Indian Constitution?", a: "Dr. B. R. Ambedkar, who chaired the Drafting Committee. The Constitution came into effect on January 26, 1950." }
            ]);
        }

        // ===== GEOGRAPHY SUB-BRANCHES =====
        if (query.includes("geo") || query.includes("map") || query.includes("climate") || query.includes("river") || query.includes("mountain") || query.includes("continent") || query.includes("monsoon") || query.includes("soil") || query.includes("agriculture") || query.includes("population") || query.includes("forest") || query.includes("mineral") || query.includes("industry") || query.includes("transport") || query.includes("natural resource") || query.includes("weather") || query.includes("ocean") || query.includes("sea") || query.includes("lake") || query.includes("desert") || query.includes("plateau") || query.includes("plain")) {
            if (query.includes("river") || query.includes("ganga") || query.includes("yamuna") || query.includes("brahmaputra") || query.includes("nile") || query.includes("amazon") || query.includes("drainage") || query.includes("basin")) {
                return JSON.stringify([
                    { q: "What is the longest river in India?", a: "The Ganga (Ganges), stretching about 2,525 km from the Gangotri glacier to the Bay of Bengal." },
                    { q: "What is the longest river in the world?", a: "The Nile (6,650 km) in Africa, though recent studies suggest the Amazon may be longer." },
                    { q: "What is the Brahmaputra known for?", a: "It originates in Tibet (as Tsangpo), flows through India and Bangladesh, and creates the world's largest river island — Majuli." },
                    { q: "What are the three Himalayan river systems?", a: "The Indus (Sindhu), Ganga (Ganges), and Brahmaputra systems — all originating from the Himalayas and fed by glacial melt." },
                    { q: "What is a drainage basin?", a: "The area of land drained by a river and its tributaries. The Ganga basin is the largest in India." }
                ]);
            }
            if (query.includes("climate") || query.includes("monsoon") || query.includes("weather") || query.includes("rainfall") || query.includes("temperature") || query.includes("season") || query.includes("cyclone") || query.includes("el nino") || query.includes("la nina")) {
                return JSON.stringify([
                    { q: "What is the Indian monsoon?", a: "A seasonal reversal of winds that brings heavy rainfall from June to September. Caused by differential heating of land and sea." },
                    { q: "What are the four seasons in India?", a: "Winter (Dec-Feb), Summer/March-May), Monsoon/Rainy (June-Sep), and Post-Monsoon/Autumn (Oct-Nov)." },
                    { q: "What is the Western Ghats' role in monsoon?", a: "It acts as a climatic barrier — the windward side receives heavy rainfall while the leeward side (Deccan) is in rain shadow." },
                    { q: "What is El Niño?", a: "A warming of Pacific Ocean surface waters that weakens the Indian monsoon, often causing drought conditions." },
                    { q: "What is the ITCZ?", a: "Intertropical Convergence Zone — a belt of low pressure near the equator where trade winds converge, causing heavy rainfall." }
                ]);
            }
            if (query.includes("soil") || query.includes("agriculture") || query.includes("crop") || query.includes("irrigation") || query.includes("fertilizer") || query.includes("farming")) {
                return JSON.stringify([
                    { q: "What are the main types of soil in India?", a: "Alluvial (Indo-Gangetic plains), Black/Regur (Deccan), Red/Yellow (S. India), Laterite (coastal), Arid (Rajasthan), and Forest soils." },
                    { q: "Which soil is best for cotton?", a: "Black soil (Regur) — rich in clay, moisture-retentive, found in Maharashtra, Gujarat, and Madhya Pradesh." },
                    { q: "What is alluvial soil?", a: "Fertile soil deposited by rivers, found in the Indo-Gangetic plains. It is the most agriculturally productive soil, ideal for wheat, rice, and sugarcane." },
                    { q: "What is the Green Revolution?", a: "A period (1960s-70s) of high-yield crop varieties, fertilizers, and irrigation that made India self-sufficient in food grains." },
                    { q: "What is drip irrigation?", a: "A water-efficient method delivering water directly to plant roots through tubes, reducing evaporation and water waste." }
                ]);
            }
            return JSON.stringify([
                { q: "What is the Tropic of Cancer?", a: "Latitude 23.5°N that passes through 8 Indian states — the northernmost latitude where the sun can be directly overhead." },
                { q: "What are the major mountain ranges of India?", a: "The Himalayas (north), Western Ghats (west), Eastern Ghats (east), Aravalli, Vindhya, and Satpura ranges." },
                { q: "What is the largest continent?", a: "Asia — covering about 30% of Earth's land area and home to 60% of the world's population." },
                { q: "What is a biodiversity hotspot?", a: "A region with high species richness and endemism under threat. India has four: Western Ghats, Himalayas, Indo-Burma, Sundaland." },
                { q: "What is the deepest ocean trench?", a: "The Mariana Trench in the Pacific Ocean — its deepest point (Challenger Deep) is about 11,000 m below sea level." }
            ]);
        }

        // ===== COMPUTER SCIENCE SUB-BRANCHES =====
        if (query.includes("computer") || query.includes("program") || query.includes("software") || query.includes("hardware") || query.includes("internet") || query.includes("data") || query.includes("code") || query.includes("algorithm") || query.includes("binary") || query.includes("python") || query.includes("html") || query.includes("css") || query.includes("javascript") || query.includes("java") || query.includes("oop") || query.includes("sql") || query.includes("database") || query.includes("network") || query.includes("cyber") || query.includes("web") || query.includes("app") || query.includes("machine learning") || query.includes("ai") || query.includes("artificial intelligence")) {
            if (query.includes("python") || query.includes("program") || query.includes("java") || query.includes("javascript") || query.includes("html") || query.includes("css") || query.includes("oop") || query.includes("class") || query.includes("object") || query.includes("loop") || query.includes("function") || query.includes("array") || query.includes("variable") || query.includes("syntax")) {
                return JSON.stringify([
                    { q: "What is an algorithm?", a: "A finite, step-by-step procedure for solving a problem, independent of any programming language." },
                    { q: "What is the difference between a compiler and an interpreter?", a: "A compiler translates entire source code at once; an interpreter translates and executes line-by-line." },
                    { q: "What are the four pillars of OOP?", a: "Encapsulation, Inheritance, Polymorphism, and Abstraction." },
                    { q: "What is a variable?", a: "A named memory location that stores a value which can change during program execution." },
                    { q: "What is a data type?", a: "A classification of data that determines the type of value a variable can hold: int, float, string, boolean, etc." }
                ]);
            }
            if (query.includes("sql") || query.includes("database") || query.includes("table") || query.includes("query") || query.includes("dbms") || query.includes("relational")) {
                return JSON.stringify([
                    { q: "What is a database?", a: "An organized collection of structured data that can be stored, retrieved, and manipulated electronically." },
                    { q: "What is SQL?", a: "Structured Query Language — used to manage and manipulate relational databases (SELECT, INSERT, UPDATE, DELETE)." },
                    { q: "What is a primary key?", a: "A unique identifier for each record in a database table. No two rows can have the same primary key." },
                    { q: "What is a foreign key?", a: "A field in one table that references the primary key of another table, establishing a relationship between them." },
                    { q: "What is normalization?", a: "The process of organizing data to reduce redundancy and improve integrity — typically into 1NF, 2NF, 3NF." }
                ]);
            }
            if (query.includes("internet") || query.includes("web") || query.includes("network") || query.includes("www") || query.includes("http") || query.includes("protocol") || query.includes("ip") || query.includes("dns") || query.includes("tcp") || query.includes("server") || query.includes("client") || query.includes("cyber") || query.includes("security") || query.includes("encryption") || query.includes("hack")) {
                return JSON.stringify([
                    { q: "What is the Internet?", a: "A global network of interconnected computers that communicate using TCP/IP protocols." },
                    { q: "What does HTTP stand for?", a: "HyperText Transfer Protocol — the foundation of web data communication. HTTPS adds encryption (SSL/TLS)." },
                    { q: "What is a DNS?", a: "Domain Name System — translates human-readable domain names (google.com) into IP addresses (142.250.183.4)." },
                    { q: "What is the difference between the Internet and WWW?", a: "The Internet is the global network infrastructure; the WWW (World Wide Web) is a service that runs on it via HTTP." },
                    { q: "What is a firewall?", a: "A network security system that monitors and controls incoming/outgoing traffic based on security rules." }
                ]);
            }
            return JSON.stringify([
                { q: "What does RAM stand for?", a: "Random Access Memory — volatile, temporary memory for active data and processes." },
                { q: "What is the binary number system?", a: "A base-2 system using 0s and 1s — the fundamental language of all digital computers." },
                { q: "What is cloud computing?", a: "On-demand delivery of computing resources (servers, storage, databases) over the internet on a pay-as-you-go basis." },
                { q: "What is the difference between AI and ML?", a: "AI is the broad field of making machines intelligent; ML is a subset where systems learn from data without explicit programming." },
                { q: "What is a data structure?", a: "A way of organizing and storing data: arrays, linked lists, stacks, queues, trees, graphs, hash tables." }
            ]);
        }

        // ===== MATHEMATICS SUB-BRANCHES =====
        if (query.includes("math") || query.includes("surd") || query.includes("quad") || query.includes("geometry") || query.includes("algebra") || query.includes("trig") || query.includes("calculus") || query.includes("number") || query.includes("fraction") || query.includes("equation") || query.includes("exponent") || query.includes("logarithm") || query.includes("indices") || query.includes("polynomial") || query.includes("matrix") || query.includes("vector") || query.includes("statistics") || query.includes("probability") || query.includes("set") || query.includes("function") || query.includes("relation") || query.includes("permutation") || query.includes("combination") || query.includes("binomial") || query.includes("differentiation") || query.includes("integration") || query.includes("limit") || query.includes("coordinate") || query.includes("straight line") || query.includes("circle") || query.includes("parabola") || query.includes("ellipse") || query.includes("hyperbola") || query.includes("conic") || query.includes("ratio") || query.includes("proportion") || query.includes("profit") || query.includes("loss") || query.includes("discount") || query.includes("time") || query.includes("speed") || query.includes("area") || query.includes("volume") || query.includes("mensuration")) {
            if (query.includes("trig") || query.includes("sin") || query.includes("cos") || query.includes("tan")) {
                return JSON.stringify([
                    { q: "What is sin 30°?", a: "0.5 (or ½). Sin 0° = 0, sin 30° = ½, sin 45° = 1/√2, sin 60° = √3/2, sin 90° = 1." },
                    { q: "What is tan 45°?", a: "1. Tan θ = sinθ/cosθ. tan 0° = 0, tan 30° = 1/√3, tan 45° = 1, tan 60° = √3, tan 90° = undefined." },
                    { q: "What is the Pythagorean identity?", a: "sin²θ + cos²θ = 1. Also: 1 + tan²θ = sec²θ, and 1 + cot²θ = cosec²θ." },
                    { q: "What are the trigonometric ratios?", a: "sin = opposite/hypotenuse, cos = adjacent/hypotenuse, tan = opposite/adjacent, cosec = 1/sin, sec = 1/cos, cot = 1/tan." },
                    { q: "What is the value of sec 0°?", a: "1, because cos 0° = 1, so sec 0° = 1/cos 0° = 1." }
                ]);
            }
            if (query.includes("quad") || query.includes("discriminant") || query.includes("sridharacharya") || query.includes("roots") || query.includes("equation") && !query.includes("line")) {
                return JSON.stringify([
                    { q: "What is the quadratic formula?", a: "x = [-b ± √(b² - 4ac)] / 2a — solves ax² + bx + c = 0." },
                    { q: "What does the discriminant tell us?", a: "D = b² - 4ac. D > 0 → 2 real roots; D = 0 → 1 real root (repeated); D < 0 → 2 complex roots." },
                    { q: "What is the sum of roots formula?", a: "For ax² + bx + c = 0: sum of roots = -b/a, product of roots = c/a." },
                    { q: "What is the nature of roots if D = 0?", a: "The quadratic has equal/repeated real roots. The graph touches the x-axis at exactly one point." },
                    { q: "What is the discriminant of x² - 5x + 6 = 0?", a: "D = (-5)² - 4(1)(6) = 25 - 24 = 1. So roots are real and distinct." }
                ]);
            }
            if (query.includes("geometry") || query.includes("circle") || query.includes("triangle") || query.includes("pythagoras") || query.includes("area of") || query.includes("volume") || query.includes("mensuration") || query.includes("coordinate") || query.includes("conic") || query.includes("parabola") || query.includes("ellipse") || query.includes("hyperbola") || query.includes("straight line")) {
                return JSON.stringify([
                    { q: "State Pythagoras' Theorem.", a: "In a right triangle: a² + b² = c², where c is the hypotenuse (the longest side opposite the right angle)." },
                    { q: "What is the area of a circle?", a: "A = πr², where r = radius. For r = 7 cm, A = 154 cm²." },
                    { q: "What is the volume of a sphere?", a: "V = ⁴⁄₃πr³. For r = 3 cm, V = 36π cm³." },
                    { q: "What is the angle subtended by a diameter on a circle?", a: "90° — the angle in a semicircle is always a right angle (Thales' theorem)." },
                    { q: "What is the section formula?", a: "For a point P dividing AB in ratio m:n: P = ((mx₂+nx₁)/(m+n), (my₂+ny₁)/(m+n))." }
                ]);
            }
            if (query.includes("statistics") || query.includes("mean") || query.includes("median") || query.includes("mode") || query.includes("probability") || query.includes("chance") || query.includes("variance") || query.includes("standard deviation") || query.includes("correlation") || query.includes("distribution")) {
                return JSON.stringify([
                    { q: "What is the mean of 4, 6, 8, 10, 12?", a: "8 — sum (40) divided by count (5)." },
                    { q: "What is the median?", a: "The middle value when data is arranged in order. For odd n, it's the middle term; for even n, average of two middle terms." },
                    { q: "What is the empirical relationship between mean, median, and mode?", a: "Mode = 3(Median) - 2(Mean). This is the empirical formula for moderately skewed distributions." },
                    { q: "What is the probability of an event?", a: "P(E) = Number of favorable outcomes / Total number of possible outcomes. 0 ≤ P(E) ≤ 1." },
                    { q: "Two coins are tossed. Probability of at least one head?", a: "3/4 — possible outcomes: HH, HT, TH, TT. Three have at least one head." }
                ]);
            }
            if (query.includes("calculus") || query.includes("derivative") || query.includes("differentiation") || query.includes("integration") || query.includes("integral") || query.includes("limit") || query.includes("differential")) {
                return JSON.stringify([
                    { q: "What is the derivative of x²?", a: "2x. Using the power rule: d/dx(xⁿ) = nxⁿ⁻¹." },
                    { q: "What is ∫ x dx?", a: "x²/2 + C, where C is the constant of integration." },
                    { q: "What is the limit of (sin x)/x as x→0?", a: "1 — a fundamental limit used in calculus." },
                    { q: "What is the derivative of sin x?", a: "cos x. Derivative of cos x is -sin x, derivative of tan x is sec² x." },
                    { q: "What is the chain rule?", a: "For composite functions: dy/dx = (dy/du)(du/dx). Used to differentiate functions within functions." }
                ]);
            }
            if (query.includes("set") || query.includes("function") || query.includes("relation") || query.includes("mapping") || query.includes("domain") || query.includes("range") || query.includes("codomain") || query.includes("one one") || query.includes("onto")) {
                return JSON.stringify([
                    { q: "What is a set?", a: "A well-defined collection of distinct objects. Represented in roster form {a, b, c} or set-builder {x: condition}." },
                    { q: "What is a function?", a: "A relation where each input (domain) maps to exactly one output (range). f: A → B." },
                    { q: "What is a one-to-one (injective) function?", a: "A function where different inputs always give different outputs: f(a) = f(b) → a = b." },
                    { q: "What is an onto (surjective) function?", a: "A function where every element in the codomain has at least one pre-image in the domain." },
                    { q: "What is the union of sets A and B?", a: "A ∪ B = {x: x ∈ A or x ∈ B}. All elements belonging to either set." }
                ]);
            }
            if (query.includes("permutation") || query.includes("combination") || query.includes("binomial") || query.includes("factorial")) {
                return JSON.stringify([
                    { q: "What is the factorial of n?", a: "n! = n × (n-1) × (n-2) × ... × 1. 0! = 1. 5! = 120." },
                    { q: "What is a permutation?", a: "An arrangement of items where order matters: ⁿPᵣ = n!/(n-r)!." },
                    { q: "What is a combination?", a: "A selection of items where order does not matter: ⁿCᵣ = n!/[r!(n-r)!]." },
                    { q: "What is the binomial theorem?", a: "(a+b)ⁿ = Σᵣ₌₀ⁿ ⁿCᵣ aⁿ⁻ʳ bʳ. Describes the expansion of powers of a binomial." },
                    { q: "How many ways can 3 books be arranged on a shelf from 5?", a: "⁵P₃ = 5×4×3 = 60 ways (permutation, order matters)." }
                ]);
            }
            if (query.includes("matrix") || query.includes("determinant") || query.includes("vector") || query.includes("scalar") || query.includes("dot product") || query.includes("cross product")) {
                return JSON.stringify([
                    { q: "What is a matrix?", a: "A rectangular array of numbers arranged in rows and columns. Order = rows × columns." },
                    { q: "What is the determinant of a 2×2 matrix?", a: "For matrix [[a,b],[c,d]], det = ad - bc." },
                    { q: "What is a vector?", a: "A quantity with both magnitude and direction, represented as directed line segment or coordinates (x, y, z)." },
                    { q: "What is the dot product of two vectors?", a: "a·b = |a||b|cosθ = a₁b₁ + a₂b₂ + a₃b₃. Result is a scalar." },
                    { q: "What is the cross product of two vectors?", a: "a × b = |a||b|sinθ n̂. Result is a vector perpendicular to both a and b." }
                ]);
            }
            if (query.includes("logarithm") || query.includes("log ") || query.includes("ln ") || query.includes("exponent") || query.includes("indices") || query.includes("power")) {
                return JSON.stringify([
                    { q: "What is log₂ 8?", a: "3 — because 2³ = 8. Logarithms answer 'what exponent produces this number?'." },
                    { q: "What is log a + log b?", a: "log(ab). Log laws: log a + log b = log(ab), log a - log b = log(a/b), n·log a = log(aⁿ)." },
                    { q: "What is a⁰ equal to?", a: "1 (for any non-zero a). Example: 5⁰ = 1." },
                    { q: "What is aᵐ × aⁿ?", a: "aᵐ⁺ⁿ. Law of exponents: aᵐ × aⁿ = aᵐ⁺ⁿ, aᵐ/aⁿ = aᵐ⁻ⁿ, (aᵐ)ⁿ = aᵐⁿ." },
                    { q: "What is log₁₀ 100?", a: "2 — because 10² = 100." }
                ]);
            }
            return JSON.stringify([
                { q: "What is the HCF × LCM property?", a: "For any two positive integers a and b: HCF(a,b) × LCM(a,b) = a × b." },
                { q: "What is the number system?", a: "Natural (N), Whole (W), Integers (Z), Rational (Q), Irrational (Q'), Real (R), Complex (C). N ⊂ W ⊂ Z ⊂ Q ⊂ R ⊂ C." },
                { q: "What is the difference between rational and irrational numbers?", a: "Rational numbers can be expressed as p/q (e.g., 0.5 = ½); irrational numbers cannot (e.g., √2, π)." },
                { q: "What is the order of operations?", a: "BODMAS/BIDMAS/PEMDAS: Brackets, Orders/Indices, Division/Multiplication, Addition/Subtraction." },
                { q: "What is a surd?", a: "An irrational root, like √2 or √3. Surds cannot be simplified to remove the root." }
            ]);
        }

        // ===== ECONOMICS SUB-BRANCHES =====
        if (query.includes("economics") || query.includes("economy") || query.includes("demand") || query.includes("supply") || query.includes("market") || query.includes("price") || query.includes("money") || query.includes("bank") || query.includes("budget") || query.includes("gdp") || query.includes("inflation") || query.includes("tax") || query.includes("trade") || query.includes("globalization") || query.includes("finance") || query.includes("saving") || query.includes("investment") || query.includes("stock") || query.includes("capital")) {
            if (query.includes("demand") || query.includes("supply") || query.includes("market") || query.includes("price") || query.includes("equilibrium")) {
                return JSON.stringify([
                    { q: "What is the law of demand?", a: "As price increases, quantity demanded decreases (and vice versa), assuming other factors constant — inverse relationship." },
                    { q: "What is the law of supply?", a: "As price increases, quantity supplied increases — direct relationship between price and quantity supplied." },
                    { q: "What is market equilibrium?", a: "The point where quantity demanded equals quantity supplied, determining the market price and quantity." },
                    { q: "What is elasticity of demand?", a: "The responsiveness of quantity demanded to changes in price. Elastic: |E| > 1; Inelastic: |E| < 1; Unitary: |E| = 1." },
                    { q: "What is the difference between movement and shift?", a: "Movement along the curve is caused by price change; shift of the curve is caused by non-price factors (income, preferences)." }
                ]);
            }
            if (query.includes("money") || query.includes("bank") || query.includes("finance") || query.includes("credit") || query.includes("rbi") || query.includes("central bank") || query.includes("monetary")) {
                return JSON.stringify([
                    { q: "What is the function of a central bank?", a: "Controls money supply, regulates commercial banks, manages inflation, sets interest rates (repo rate), and issues currency." },
                    { q: "What is the Reserve Bank of India (RBI)?", a: "India's central bank, established in 1935. It regulates monetary policy, currency, and the banking system." },
                    { q: "What is inflation?", a: "A sustained increase in the general price level of goods and services, reducing purchasing power of money." },
                    { q: "What is the repo rate?", a: "The rate at which the RBI lends money to commercial banks. Increasing repo rate reduces money supply, controlling inflation." },
                    { q: "What is a bank?", a: "A financial institution that accepts deposits, provides loans, and offers other financial services." }
                ]);
            }
            return JSON.stringify([
                { q: "What is GDP?", a: "Gross Domestic Product — the total monetary value of all final goods and services produced within a country in a given period." },
                { q: "What is globalization?", a: "The increasing integration of economies through trade, investment, technology, and cultural exchange across borders." },
                { q: "What is a budget?", a: "An annual financial statement estimating government revenue and expenditure for the coming fiscal year." },
                { q: "What is the difference between direct and indirect tax?", a: "Direct tax is paid by the person on whom it is levied (income tax); indirect tax is passed on to consumers (GST)." },
                { q: "What is the stock market?", a: "A marketplace where shares of publicly listed companies are bought and sold. India's major exchanges: BSE and NSE." }
            ]);
        }

        // ===== DEFAULT: intelligent fallback with diverse sets =====
        const defaultSets = [
            [
                { q: "What is the primary site of photosynthesis?", a: "Chloroplasts — specifically within the thylakoid membranes where chlorophyll resides." },
                { q: "What are the light-dependent products of photolysis?", a: "Oxygen (O₂), ATP, and NADPH molecules." },
                { q: "What is the key carbon-fixing enzyme in the Calvin Cycle?", a: "RuBisCO (Ribulose-1,5-bisphosphate carboxylase-oxygenase)." },
                { q: "Why are plants green?", a: "Chlorophyll absorbs red and blue light but reflects green light." },
                { q: "What is the molecular formula of Glucose?", a: "C₆H₁₂O₆ (6 carbon, 12 hydrogen, 6 oxygen atoms)." }
            ],
            [
                { q: "What is a balanced chemical equation?", a: "An equation where the number of atoms of each element is equal on both sides, following the law of conservation of mass." },
                { q: "What are reactants and products?", a: "Reactants are starting substances (left of arrow); products are substances formed (right of arrow)." },
                { q: "What is the difference between physical and chemical change?", a: "Physical change (melting ice) is reversible with no new substance; chemical change (rusting iron) produces new substances." },
                { q: "What is valency?", a: "The combining capacity of an element, equal to the number of electrons gained, lost, or shared to achieve a stable octet." },
                { q: "What is Avogadro's law?", a: "Equal volumes of gases at the same temperature and pressure contain equal numbers of molecules." }
            ],
            [
                { q: "What is the difference between mass and weight?", a: "Mass is the amount of matter (kg, constant); weight is the force of gravity on that mass (N, changes with gravity)." },
                { q: "What is the SI unit of energy?", a: "Joule (J). 1 J = 1 N·m. Also commonly: calorie (1 cal = 4.184 J), kilowatt-hour (1 kWh = 3.6 × 10⁶ J)." },
                { q: "What is a simple pendulum?", a: "A mass (bob) suspended from a fixed point by an inextensible string. Its time period T = 2π√(L/g)." },
                { q: "What is the law of reflection?", a: "The angle of incidence equals the angle of reflection, and the incident ray, reflected ray, and normal all lie in the same plane." },
                { q: "What is an electric fuse?", a: "A safety device with a thin wire that melts and breaks the circuit when current exceeds a safe limit." }
            ],
            [
                { q: "What is a computer virus?", a: "A malicious program that replicates itself and spreads to other computers, often causing damage or stealing data." },
                { q: "What is an operating system?", a: "System software that manages hardware, runs applications, and provides a user interface. Examples: Windows, macOS, Linux." },
                { q: "What is the difference between primary and secondary memory?", a: "Primary memory (RAM/ROM) is directly accessible by CPU, volatile; secondary (HDD/SSD) is persistent long-term storage." },
                { q: "What is a flowchart?", a: "A diagrammatic representation of an algorithm using standard symbols — start/end (oval), process (rectangle), decision (diamond)." },
                { q: "What is HTML?", a: "HyperText Markup Language — the standard language for creating web pages using tags like <h1>, <p>, <div>." }
            ],
            [
                { q: "What are the three estates in French Revolution?", a: "First Estate (clergy), Second Estate (nobility), Third Estate (commoners — 98% of population)." },
                { q: "What was the Industrial Revolution?", a: "The transition to new manufacturing processes (1760-1840) through steam power, factories, and mechanization." },
                { q: "What is the UNO?", a: "United Nations Organization — founded in 1945 after WWII to maintain international peace and security." },
                { q: "What is democracy?", a: "A system of government where citizens elect representatives to make decisions on their behalf." },
                { q: "What is the Panchayati Raj system?", a: "India's decentralized local self-government system: Gram Panchayat (village), Panchayat Samiti (block), Zila Parishad (district)." }
            ]
        ];
        return JSON.stringify(defaultSets[Math.floor(Math.random() * defaultSets.length)]);
    },

    /* Mock Quiz Generator — chapter-specific questions per subject */
    mockQuizGeneration(content) {
        const query = content.toLowerCase();

        // ===== MATHEMATICS CHAPTERS =====
        if (query.includes("trig") || query.includes("sin") || query.includes("cos") || query.includes("tan")) {
            if (query.includes("ident") || query.includes("prove")) {
                return JSON.stringify([
                    { q: "Prove the identity: sin²θ + cos²θ = 1", o: ["Uses Pythagoras theorem in right triangle", "Uses law of sines", "Uses cosine rule", "Uses angle sum property"], c: 0 },
                    { q: "What is the value of tan(90° - θ) in terms of cot?", o: ["cotθ", "tanθ", "secθ", "cosecθ"], c: 0 },
                    { q: "Which of the following is equal to sec²θ?", o: ["1 + tan²θ", "1 - tan²θ", "1 + cot²θ", "1 - sin²θ"], c: 0 },
                    { q: "If sinθ = 3/5, what is cosθ (in a right triangle)?", o: ["4/5", "2/5", "3/4", "5/4"], c: 0 },
                    { q: "What is the value of cosec 90°?", o: ["0", "1", "∞", "undefined"], c: 1 }
                ]);
            }
            return JSON.stringify([
                { q: "What is sin 30°?", o: ["0.5", "1", "0", "0.707"], c: 0 },
                { q: "What is the value of tan 45°?", o: ["0", "0.5", "1", "∞"], c: 2 },
                { q: "If cosθ = 4/5, what is sinθ?", o: ["3/5", "1/5", "2/5", "4/5"], c: 0 },
                { q: "The angle of elevation of the sun when a 10m pole casts a 10m shadow is:", o: ["30°", "45°", "60°", "90°"], c: 1 },
                { q: "What is sec 0°?", o: ["0", "1", "∞", "undefined"], c: 1 }
            ]);
        }
        if (query.includes("quad") || query.includes("discriminant") || query.includes("sridharacharya") || query.includes("roots")) {
            return JSON.stringify([
                { q: "What is the discriminant of x² - 5x + 6 = 0?", o: ["1", "25", "49", "0"], c: 0 },
                { q: "For which discriminant value does a quadratic have equal roots?", o: ["D > 0", "D = 0", "D < 0", "D ≥ 0"], c: 1 },
                { q: "The sum of roots of ax² + bx + c = 0 is:", o: ["c/a", "-b/a", "b/a", "-c/a"], c: 1 },
                { q: "The product of roots of ax² + bx + c = 0 is:", o: ["-b/a", "c/a", "b/c", "a/c"], c: 1 },
                { q: "What is the quadratic formula?", o: ["x = (-b ± √(b²-4ac))/2a", "x = (-b ± √(b²+4ac))/2a", "x = (b ± √(b²-4ac))/2a", "x = (-b ± √(4ac-b²))/2a"], c: 0 }
            ]);
        }
        if (query.includes("geometry") || query.includes("circle") || query.includes("triangle") || query.includes("pythagoras") || query.includes("area of") || query.includes("volume") || query.includes("mensuration")) {
            return JSON.stringify([
                { q: "What is the area of a circle of radius 7 cm?", o: ["144 cm²", "154 cm²", "148 cm²", "164 cm²"], c: 1 },
                { q: "Pythagoras theorem states:", o: ["a² + b² = c²", "a² - b² = c²", "a + b = c", "a² + c² = b²"], c: 0 },
                { q: "What is the volume of a sphere of radius 3 cm?", o: ["36π cm³", "27π cm³", "12π cm³", "9π cm³"], c: 0 },
                { q: "The angle subtended by a diameter on a circle is:", o: ["90°", "180°", "60°", "45°"], c: 0 },
                { q: "What is the total surface area of a cube of side 5 cm?", o: ["100 cm²", "150 cm²", "125 cm²", "175 cm²"], c: 1 }
            ]);
        }
        if (query.includes("statistic") || query.includes("mean") || query.includes("median") || query.includes("mode") || query.includes("probability") || query.includes("chance")) {
            if (query.includes("prob") || query.includes("chance")) {
                return JSON.stringify([
                    { q: "When rolling a fair die, the probability of getting a 4 is:", o: ["1/6", "1/2", "1/3", "2/3"], c: 0 },
                    { q: "The probability of a sure event is:", o: ["0", "0.5", "1", "∞"], c: 2 },
                    { q: "A bag has 3 red and 5 blue balls. Probability of picking a red ball is:", o: ["3/8", "5/8", "3/5", "1/8"], c: 0 },
                    { q: "Two coins are tossed. Probability of at least one head is:", o: ["1/4", "2/4", "3/4", "1"], c: 2 },
                    { q: "Probability of an event cannot exceed:", o: ["0", "1", "100", "0.5"], c: 1 }
                ]);
            }
            return JSON.stringify([
                { q: "What is the mean of 4, 6, 8, 10, 12?", o: ["7", "8", "9", "10"], c: 1 },
                { q: "The median of 1, 2, 3, 4, 5 is:", o: ["2", "3", "4", "5"], c: 1 },
                { q: "If mean = 25 and median = 20, the mode (using empirical formula) is:", o: ["10", "15", "20", "25"], c: 0 },
                { q: "The range of data 15, 8, 12, 20, 5 is:", o: ["15", "20", "5", "12"], c: 0 },
                { q: "What is the mode of 2, 3, 3, 5, 7, 8?", o: ["2", "3", "5", "7"], c: 1 }
            ]);
        }
        if (query.includes("calculus") || query.includes("derivative") || query.includes("differentiation") || query.includes("integration") || query.includes("integral") || query.includes("limit")) {
            return JSON.stringify([
                { q: "What is the derivative of x² with respect to x?", o: ["x", "2x", "2", "x²"], c: 1 },
                { q: "What is ∫ x dx?", o: ["x² + C", "x²/2 + C", "x + C", "1 + C"], c: 1 },
                { q: "The limit of (sin x)/x as x→0 is:", o: ["0", "1", "∞", "x"], c: 1 },
                { q: "What is the derivative of sin x?", o: ["cos x", "-cos x", "tan x", "sec² x"], c: 0 },
                { q: "What is ∫ cos x dx?", o: ["sin x + C", "-sin x + C", "tan x + C", "sec x + C"], c: 0 }
            ]);
        }
        if (query.includes("logarithm") || query.includes("log") || query.includes("exponent") || query.includes("indices")) {
            return JSON.stringify([
                { q: "What is log₂ 8?", o: ["2", "3", "4", "8"], c: 1 },
                { q: "log a + log b equals:", o: ["log(a+b)", "log(ab)", "log(a/b)", "log(a^b)"], c: 1 },
                { q: "What is a⁰ equal to?", o: ["0", "1", "a", "undefined"], c: 1 },
                { q: "aᵐ × aⁿ equals:", o: ["aᵐⁿ", "aᵐ⁺ⁿ", "aᵐ⁻ⁿ", "aᵐ/ⁿ"], c: 1 },
                { q: "What is log₁₀ 100?", o: ["1", "2", "10", "100"], c: 1 }
            ]);
        }
        if (query.includes("surd") || query.includes("surds") || query.includes("radical")) {
            return JSON.stringify([
                { q: "What is √32 simplified?", o: ["4√2", "2√8", "8√2", "16√2"], c: 0 },
                { q: "What is √25?", o: ["3", "5", "8", "10"], c: 1 },
                { q: "Which of the following is a surd?", o: ["√9", "√4", "√2", "√16"], c: 2 },
                { q: "What is √12 + √27 simplified?", o: ["√39", "5√3", "6√3", "7√3"], c: 1 },
                { q: "Rationalize the denominator: 1/√2", o: ["√2/2", "2/√2", "√2", "1/2"], c: 0 }
            ]);
        }
        if (query.includes("number") || query.includes("fraction") || query.includes("decimal") || query.includes("rational") || query.includes("irrational") || query.includes("real number") || query.includes("integer")) {
            return JSON.stringify([
                { q: "Which of the following is an irrational number?", o: ["√9", "3.14", "√2", "0.333..."], c: 2 },
                { q: "What is 1/4 expressed as a decimal?", o: ["0.25", "0.5", "0.4", "0.2"], c: 0 },
                { q: "The HCF of 12 and 18 is:", o: ["2", "3", "6", "9"], c: 2 },
                { q: "What is the LCM of 6 and 8?", o: ["14", "24", "48", "12"], c: 1 },
                { q: "Which is the smallest prime number?", o: ["0", "1", "2", "3"], c: 2 }
            ]);
        }
        if (query.includes("algebra") || query.includes("polynomial") || query.includes("factor") || query.includes("linear equation") || query.includes("simultaneous") || query.includes("equation")) {
            return JSON.stringify([
                { q: "Solve: 2x + 5 = 13. What is x?", o: ["4", "5", "6", "3"], c: 0 },
                { q: "If x + y = 10 and x - y = 2, what is x?", o: ["4", "5", "6", "8"], c: 2 },
                { q: "The degree of the polynomial x³ + 2x² - 5x + 1 is:", o: ["1", "2", "3", "4"], c: 2 },
                { q: "Expand (x + 3)²:", o: ["x² + 6x + 9", "x² + 9", "x² + 3x + 9", "x² + 6x + 6"], c: 0 },
                { q: "What is the zero of the polynomial P(x) = x - 4?", o: ["0", "4", "-4", "1"], c: 1 }
            ]);
        }
        if (query.includes("math") || query.includes("mathematic")) {
            return JSON.stringify([
                { q: "What is 15% of 200?", o: ["15", "30", "45", "60"], c: 1 },
                { q: "If a train travels 60 km in 1 hour, how far in 2.5 hours?", o: ["120 km", "150 km", "180 km", "200 km"], c: 1 },
                { q: "The ratio 3:5 expressed as percentage is:", o: ["30%", "40%", "60%", "50%"], c: 2 },
                { q: "What is the simple interest on ₹1000 at 10% per annum for 2 years?", o: ["₹100", "₹200", "₹150", "₹250"], c: 1 },
                { q: "A shopkeeper gives a 20% discount on a ₹500 item. What is the sale price?", o: ["₹400", "₹450", "₹350", "₹480"], c: 0 }
            ]);
        }

        // ===== PHYSICS CHAPTERS =====
        if (query.includes("light") || query.includes("mirror") || query.includes("lens") || query.includes("reflection") || query.includes("refraction") || query.includes("concave") || query.includes("convex") || query.includes("prism") || query.includes("optics")) {
            return JSON.stringify([
                { q: "The image formed by a plane mirror is:", o: ["Virtual and inverted", "Virtual and erect", "Real and erect", "Real and inverted"], c: 1 },
                { q: "In a concave mirror, the focal length is related to the radius of curvature as:", o: ["f = R/2", "f = R", "f = 2R", "f = R/4"], c: 0 },
                { q: "A convex lens of focal length 20 cm has power:", o: ["+5 D", "+0.5 D", "-5 D", "-0.5 D"], c: 0 },
                { q: "The speed of light is maximum in:", o: ["Water", "Glass", "Vacuum", "Diamond"], c: 2 },
                { q: "Snell's law relates: n₁ sinθ₁ = n₂ sinθ₂. What does θ represent?", o: ["Angle of incidence/refraction with normal", "Angle with surface", "Critical angle", "Deviation angle"], c: 0 }
            ]);
        }
        if (query.includes("electric") || query.includes("current") || query.includes("ohm") || query.includes("circuit") || query.includes("voltage") || query.includes("resistance") || query.includes("resistor")) {
            return JSON.stringify([
                { q: "Ohm's law states V = I × R. For a constant R, if I doubles, V:", o: ["Halves", "Doubles", "Quadruples", "Stays same"], c: 1 },
                { q: "The SI unit of resistance is:", o: ["Volt", "Ohm", "Ampere", "Watt"], c: 1 },
                { q: "In a series circuit with two identical bulbs, the current is:", o: ["Same in both bulbs", "Different in each bulb", "Zero in one bulb", "Split equally"], c: 0 },
                { q: "What is the heating effect of current proportional to?", o: ["I", "I²", "R only", "V"], c: 1 },
                { q: "Electric power is given by:", o: ["VI", "V²R", "I/R", "V/I"], c: 0 }
            ]);
        }
        if (query.includes("magnet") || query.includes("electromagnet") || query.includes("solenoid") || query.includes("motor") || query.includes("generator") || query.includes("induced") || query.includes("faraday")) {
            return JSON.stringify([
                { q: "Electromagnetic induction was discovered by:", o: ["Newton", "Faraday", "Maxwell", "Einstein"], c: 1 },
                { q: "The direction of induced current is given by:", o: ["Right hand thumb rule", "Fleming's right hand rule", "Fleming's left hand rule", "Ampere's rule"], c: 1 },
                { q: "A current-carrying conductor placed in a magnetic field experiences:", o: ["Force", "Torque", "No effect", "Heating"], c: 0 },
                { q: "The magnetic field inside a solenoid is:", o: ["Zero", "Uniform", "Non-uniform", "Circular"], c: 1 },
                { q: "An electric motor converts:", o: ["Mechanical to electrical", "Electrical to mechanical", "Heat to electrical", "Light to electrical"], c: 1 }
            ]);
        }
        if (query.includes("motion") || query.includes("force") || query.includes("newton") || query.includes("velocity") || query.includes("acceleration") || query.includes("momentum") || query.includes("inertia")) {
            return JSON.stringify([
                { q: "Newton's First Law is also called the law of:", o: ["Inertia", "Acceleration", "Reaction", "Gravitation"], c: 0 },
                { q: "F = ma is Newton's:", o: ["First Law", "Second Law", "Third Law", "Law of Gravitation"], c: 1 },
                { q: "The SI unit of force is:", o: ["Joule", "Newton", "Watt", "Pascal"], c: 1 },
                { q: "Momentum is equal to:", o: ["mv", "ma", "mgh", "mv²"], c: 0 },
                { q: "Action and reaction forces act on:", o: ["The same object", "Different objects", "Only on stationary objects", "Only on moving objects"], c: 1 }
            ]);
        }
        if (query.includes("sound") || query.includes("wave") || query.includes("frequency") || query.includes("amplitude") || query.includes("echo") || query.includes("ultrasound")) {
            return JSON.stringify([
                { q: "Sound waves are:", o: ["Transverse", "Longitudinal", "Electromagnetic", "Surface"], c: 1 },
                { q: "The speed of sound is maximum in:", o: ["Air", "Water", "Steel", "Vacuum"], c: 2 },
                { q: "The SI unit of frequency is:", o: ["Hertz", "Decibel", "Watt", "Newton"], c: 0 },
                { q: "Sound cannot travel through:", o: ["Air", "Water", "Vacuum", "Steel"], c: 2 },
                { q: "An echo is produced due to:", o: ["Reflection of sound", "Refraction of sound", "Diffraction of sound", "Absorption of sound"], c: 0 }
            ]);
        }
        if (query.includes("physics")) {
            return JSON.stringify([
                { q: "What is the SI unit of potential difference?", o: ["Ampere", "Ohm", "Watt", "Volt"], c: 3 },
                { q: "The energy possessed by a body due to its motion is called:", o: ["Potential energy", "Kinetic energy", "Thermal energy", "Chemical energy"], c: 1 },
                { q: "Which of Newton's laws explains rocket propulsion?", o: ["First", "Second", "Third", "Fourth"], c: 2 },
                { q: "What type of image is formed by a convex mirror?", o: ["Real and inverted", "Virtual and erect", "Real and erect", "Virtual and inverted"], c: 1 },
                { q: "The speed of light in vacuum is approximately:", o: ["3 × 10⁶ m/s", "3 × 10⁸ m/s", "3 × 10¹⁰ m/s", "3 × 10⁴ m/s"], c: 1 }
            ]);
        }

        // ===== CHEMISTRY CHAPTERS =====
        if (query.includes("acid") || query.includes("base") || query.includes("ph ") || query.includes("neutralization") || query.includes("litmus") || query.includes("indicator")) {
            return JSON.stringify([
                { q: "What is the pH of a strong acid like HCl (0.1M)?", o: ["~1", "~7", "~14", "~5"], c: 0 },
                { q: "The colour of litmus paper in a base is:", o: ["Red", "Blue", "Green", "Yellow"], c: 1 },
                { q: "Acid + Base → ___ + Water", o: ["Salt", "Hydrogen", "Chloride", "Base"], c: 0 },
                { q: "Baking soda is chemically known as:", o: ["NaHCO₃", "Na₂CO₃", "NaCl", "NaOH"], c: 0 },
                { q: "Which acid is found in the stomach?", o: ["Sulphuric acid", "Nitric acid", "Hydrochloric acid", "Acetic acid"], c: 2 }
            ]);
        }
        if (query.includes("carbon") || query.includes("organic") || query.includes("hydrocarbon") || query.includes("alkane") || query.includes("alkene") || query.includes("alkyne") || query.includes("ethanol") || query.includes("soap") || query.includes("detergent")) {
            return JSON.stringify([
                { q: "The general formula of alkanes is:", o: ["CₙH₂ₙ₊₂", "CₙH₂ₙ", "CₙH₂ₙ₋₂", "CₙHₙ"], c: 0 },
                { q: "Which compound is used as a preservative in pickles?", o: ["Ethanol", "Acetic acid", "Methane", "Ethene"], c: 1 },
                { q: "Soap is formed by the reaction of an ester with NaOH. This is called:", o: ["Hydrolysis", "Saponification", "Esterification", "Hydrogenation"], c: 1 },
                { q: "The molecular formula of ethanol is:", o: ["CH₃OH", "C₂H₅OH", "C₂H₆", "CH₄"], c: 1 },
                { q: "Which of these undergoes addition reactions readily?", o: ["Alkanes", "Alkenes", "Alcohols", "Carboxylic acids"], c: 1 }
            ]);
        }
        if (query.includes("periodic") || query.includes("element") || query.includes("group") || query.includes("period") || query.includes("mendeleev") || query.includes("modern periodic")) {
            return JSON.stringify([
                { q: "How many periods are in the modern periodic table?", o: ["5", "7", "9", "18"], c: 1 },
                { q: "The most reactive metal in Group 1 is:", o: ["Lithium", "Sodium", "Potassium", "Francium"], c: 3 },
                { q: "Elements in the same group have:", o: ["Same number of shells", "Same valence electrons", "Same atomic mass", "Same atomic number"], c: 1 },
                { q: "Who created the first periodic table?", o: ["Mendeleev", "Moseley", "Newlands", "Dobereiner"], c: 0 },
                { q: "The element with atomic number 6 is:", o: ["Nitrogen", "Oxygen", "Carbon", "Boron"], c: 2 }
            ]);
        }
        if (query.includes("metals") || query.includes("non-metal") || query.includes("nonmetal") || query.includes("corrosion") || query.includes("alloy") || query.includes("reactivity series")) {
            return JSON.stringify([
                { q: "Which metal is liquid at room temperature?", o: ["Iron", "Mercury", "Copper", "Aluminium"], c: 1 },
                { q: "Gold is alloyed with which metal to increase strength?", o: ["Silver", "Copper", "Zinc", "Nickel"], c: 1 },
                { q: "Rust is chemically:", o: ["Fe₂O₃.xH₂O", "FeO", "Fe₃O₄", "FeCl₂"], c: 0 },
                { q: "The most reactive metal in the reactivity series is:", o: ["Gold", "Potassium", "Calcium", "Magnesium"], c: 1 },
                { q: "Non-metals generally form ___ oxides:", o: ["Basic", "Acidic", "Neutral", "Amphoteric"], c: 1 }
            ]);
        }
        if (query.includes("chem") || query.includes("atom") || query.includes("compound") || query.includes("reaction") || query.includes("oxidat") || query.includes("redox")) {
            return JSON.stringify([
                { q: "Which gas is produced when zinc reacts with dilute sulphuric acid?", o: ["Oxygen", "Carbon Dioxide", "Hydrogen", "Nitrogen"], c: 2 },
                { q: "What is the pH value of a neutral solution?", o: ["0", "5", "7", "14"], c: 2 },
                { q: "Which element has the chemical symbol 'Fe'?", o: ["Fluorine", "Francium", "Iron", "Fermium"], c: 2 },
                { q: "What type of reaction is: A + BC → AC + B?", o: ["Combination", "Decomposition", "Single Displacement", "Double Displacement"], c: 2 },
                { q: "Which gas turns lime water milky?", o: ["Oxygen", "Hydrogen", "Carbon Dioxide", "Nitrogen"], c: 2 }
            ]);
        }

        // ===== BIOLOGY CHAPTERS =====
        if (query.includes("photo") || query.includes("chlorophyll") || query.includes("chloroplast") || query.includes("calvin") || query.includes("light reaction")) {
            return JSON.stringify([
                { q: "The green pigment in plants is called:", o: ["Carotene", "Chlorophyll", "Xanthophyll", "Phycobilin"], c: 1 },
                { q: "The product of the light reaction used in the Calvin cycle is:", o: ["Glucose", "ATP and NADPH", "Oxygen", "Water"], c: 1 },
                { q: "The overall equation for photosynthesis is:", o: ["6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂", "C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O", "CO₂ + H₂O → CH₂O + O₂", "6CO₂ + 12H₂O → C₆H₁₂O₆ + 6O₂ + 6H₂O"], c: 0 },
                { q: "The site of the dark reaction (Calvin cycle) is:", o: ["Thylakoid membrane", "Stroma of chloroplast", "Grana", "Cytoplasm"], c: 1 },
                { q: "Which wavelength is least absorbed by chlorophyll?", o: ["Red", "Blue", "Green", "Violet"], c: 2 }
            ]);
        }
        if (query.includes("cell") || query.includes("mitochondria") || query.includes("nucleus") || query.includes("organelle") || query.includes("membrane") || query.includes("ribosome")) {
            return JSON.stringify([
                { q: "The powerhouse of the cell is:", o: ["Nucleus", "Mitochondria", "Golgi body", "ER"], c: 1 },
                { q: "DNA is primarily found in the:", o: ["Ribosome", "Nucleus", "Cytoplasm", "Cell membrane"], c: 1 },
                { q: "The selectively permeable layer surrounding the cell is the:", o: ["Cell wall", "Cell membrane", "Nuclear membrane", "Cytoplasm"], c: 1 },
                { q: "Ribosomes are the site of:", o: ["Protein synthesis", "Lipid synthesis", "ATP production", "Photosynthesis"], c: 0 },
                { q: "Which organelle modifies and packages proteins?", o: ["ER", "Golgi apparatus", "Lysosome", "Vacuole"], c: 1 }
            ]);
        }
        if (query.includes("dna") || query.includes("gene") || query.includes("mendel") || query.includes("heredity") || query.includes("evolution") || query.includes("trait") || query.includes("dominant") || query.includes("recessive")) {
            return JSON.stringify([
                { q: "Mendel is known as the father of:", o: ["Modern biology", "Genetics", "Evolution", "Medicine"], c: 1 },
                { q: "A dominant trait is expressed when:", o: ["Both alleles are recessive", "At least one dominant allele is present", "Only in females", "Only in males"], c: 1 },
                { q: "The ratio of a monohybrid cross is:", o: ["9:3:3:1", "3:1", "1:2:1", "1:1"], c: 1 },
                { q: "Humans have how many pairs of chromosomes?", o: ["23", "46", "22", "24"], c: 0 },
                { q: "Evolution is the change in ___ over time.", o: ["Individuals", "Populations", "Cells", "Ecosystems"], c: 1 }
            ]);
        }
        if (query.includes("heart") || query.includes("blood") || query.includes("circul") || query.includes("artery") || query.includes("vein") || query.includes("atrium") || query.includes("ventricle") || query.includes("pulse")) {
            return JSON.stringify([
                { q: "How many chambers does the human heart have?", o: ["2", "3", "4", "5"], c: 2 },
                { q: "The largest artery in the human body is:", o: ["Pulmonary artery", "Aorta", "Carotid artery", "Femoral artery"], c: 1 },
                { q: "Red blood cells contain:", o: ["Fibrinogen", "Hemoglobin", "Antibodies", "Heparin"], c: 1 },
                { q: "The universal donor blood group is:", o: ["A", "B", "AB", "O"], c: 3 },
                { q: "Blood pressure is measured in:", o: ["Pascals", "mmHg", "Atm", "Bar"], c: 1 }
            ]);
        }
        if (query.includes("disease") || query.includes("health") || query.includes("virus") || query.includes("bacteria") || query.includes("pathogen") || query.includes("immunity") || query.includes("vaccine")) {
            return JSON.stringify([
                { q: "Malaria is caused by:", o: ["Virus", "Bacteria", "Protozoan", "Fungus"], c: 2 },
                { q: "Which vitamin is produced when sunlight hits the skin?", o: ["Vitamin A", "Vitamin C", "Vitamin D", "Vitamin B12"], c: 2 },
                { q: "The body's first line of defense against pathogens is:", o: ["Skin", "White blood cells", "Antibodies", "Vaccines"], c: 0 },
                { q: "AIDS is caused by:", o: ["Bacteria", "HIV virus", "Fungus", "Protozoan"], c: 1 },
                { q: "The vaccine for tuberculosis is:", o: ["DPT", "BCG", "MMR", "Polio"], c: 1 }
            ]);
        }
        if (query.includes("human body") || query.includes("digest") || query.includes("respir") || query.includes("excret") || query.includes("kidney") || query.includes("lung") || query.includes("brain") || query.includes("neuron")) {
            return JSON.stringify([
                { q: "The basic unit of the nervous system is the:", o: ["Neuron", "Brain", "Spinal cord", "Synapse"], c: 0 },
                { q: "The functional unit of the kidney is the:", o: ["Neuron", "Nephron", "Alveolus", "Bronchiole"], c: 1 },
                { q: "The site of gas exchange in the lungs is:", o: ["Bronchi", "Trachea", "Alveoli", "Diaphragm"], c: 2 },
                { q: "Bile is produced in the:", o: ["Stomach", "Liver", "Pancreas", "Gall bladder"], c: 1 },
                { q: "The largest part of the human brain is the:", o: ["Cerebellum", "Cerebrum", "Medulla oblongata", "Brain stem"], c: 1 }
            ]);
        }
        if (query.includes("bio") || query.includes("plant") || query.includes("animal") || query.includes("enzyme") || query.includes("tissue") || query.includes("organ")) {
            return JSON.stringify([
                { q: "Which gas is consumed during the light-independent reactions of photosynthesis?", o: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Hydrogen"], c: 1 },
                { q: "Which organelle is known as the powerhouse of the cell?", o: ["Nucleus", "Ribosome", "Mitochondria", "Vacuole"], c: 2 },
                { q: "What is the full form of DNA?", o: ["Deoxyribose Nucleic Acid", "Deoxyribonucleic Acid", "Di-Nitrogen Acid", "Double Nucleotide Array"], c: 1 },
                { q: "Which blood group is known as the Universal Donor?", o: ["A", "B", "AB", "O"], c: 3 },
                { q: "Which vitamin is produced when sunlight hits the skin?", o: ["Vitamin A", "Vitamin C", "Vitamin D", "Vitamin B12"], c: 2 }
            ]);
        }

        // ===== HISTORY CHAPTERS =====
        if (query.includes("ancient") || query.includes("indus") || query.includes("harappa") || query.includes("maurya") || query.includes("ashoka") || query.includes("gupta") || query.includes("chola")) {
            return JSON.stringify([
                { q: "The Indus Valley Civilization was located along which river?", o: ["Ganga", "Indus", "Yamuna", "Brahmaputra"], c: 1 },
                { q: "Ashoka the Great belonged to which dynasty?", o: ["Gupta", "Maurya", "Chola", "Mughal"], c: 1 },
                { q: "The Gupta period is considered the ___ Age of India.", o: ["Dark", "Golden", "Bronze", "Iron"], c: 1 },
                { q: "Which of these was a major city of the Indus Valley Civilization?", o: ["Delhi", "Mohenjo-daro", "Kolkata", "Chennai"], c: 1 },
                { q: "The great ruler Ashoka converted to which religion after the Kalinga war?", o: ["Hinduism", "Buddhism", "Jainism", "Islam"], c: 1 }
            ]);
        }
        if (query.includes("mughal") || query.includes("akbar") || query.includes("taj mahal") || query.includes("shah jahan") || query.includes("delhi sultanate")) {
            return JSON.stringify([
                { q: "The Taj Mahal was built by:", o: ["Akbar", "Shah Jahan", "Jahangir", "Aurangzeb"], c: 1 },
                { q: "Akbar's religious policy was called:", o: ["Din-i-Ilahi", "Sulh-i-Kul", "Zakat", "Jizya"], c: 1 },
                { q: "The first ruler of the Mughal Empire was:", o: ["Akbar", "Babur", "Humayun", "Sher Shah Suri"], c: 1 },
                { q: "The largest contiguous empire in India was the:", o: ["Maurya", "Mughal", "Gupta", "Maratha"], c: 1 },
                { q: "Which Mughal emperor built the Red Fort in Delhi?", o: ["Akbar", "Shah Jahan", "Humayun", "Aurangzeb"], c: 1 }
            ]);
        }
        if (query.includes("british") || query.includes("east india") || query.includes("plassey") || query.includes("1857") || query.includes("revolt") || query.includes("colonial")) {
            return JSON.stringify([
                { q: "The Battle of Plassey was fought in:", o: ["1747", "1757", "1767", "1777"], c: 1 },
                { q: "The Revolt of 1857 is also known as:", o: ["First War of Independence", "Sepoy Mutiny", "Both", "Peasant Uprising"], c: 2 },
                { q: "The first Governor-General of British India was:", o: ["Warren Hastings", "Robert Clive", "Lord Dalhousie", "Lord Wellesley"], c: 1 },
                { q: "Which British act ended the East India Company's rule?", o: ["Regulating Act 1773", "Government of India Act 1858", "Indian Councils Act 1861", "Pitts India Act 1784"], c: 1 },
                { q: "The doctrine of lapse was introduced by:", o: ["Lord Dalhousie", "Lord Wellesley", "Lord Hastings", "Lord Curzon"], c: 0 }
            ]);
        }
        if (query.includes("gandhi") || query.includes("non-cooperation") || query.includes("civil disobedience") || query.includes("quit india") || query.includes("salt march") || query.includes("dandi") || query.includes("jallianwala") || query.includes("rowlatt") || query.includes("independence") || query.includes("freedom") || query.includes("nationalism")) {
            return JSON.stringify([
                { q: "The Jallianwala Bagh massacre occurred in:", o: ["1919", "1920", "1922", "1915"], c: 0 },
                { q: "The Dandi March was against:", o: ["Salt tax", "Land tax", "Income tax", "Customs duty"], c: 0 },
                { q: "Who gave the 'Quit India' call?", o: ["Nehru", "Gandhi", "Bose", "Patel"], c: 1 },
                { q: "The Non-Cooperation Movement was launched in:", o: ["1920", "1922", "1930", "1942"], c: 0 },
                { q: "India gained independence on:", o: ["January 26, 1950", "August 15, 1947", "August 15, 1950", "January 26, 1947"], c: 1 }
            ]);
        }
        if (query.includes("history") || query.includes("rev") || query.includes("world war") || query.includes("french revolution") || query.includes("cold war")) {
            return JSON.stringify([
                { q: "The French Revolution began in the year:", o: ["1776", "1789", "1799", "1804"], c: 1 },
                { q: "World War II ended in the year:", o: ["1943", "1945", "1947", "1944"], c: 1 },
                { q: "The United Nations was formed in:", o: ["1945", "1946", "1947", "1948"], c: 0 },
                { q: "The Berlin Wall fell in:", o: ["1987", "1989", "1991", "1985"], c: 1 },
                { q: "The Industrial Revolution began in:", o: ["France", "Germany", "England", "America"], c: 2 }
            ]);
        }

        // ===== GEOGRAPHY CHAPTERS =====
        if (query.includes("climate") || query.includes("monsoon") || query.includes("weather") || query.includes("rainfall") || query.includes("temperature") || query.includes("cyclone")) {
            return JSON.stringify([
                { q: "Indian climate is described as:", o: ["Tropical", "Monsoon type", "Temperate", "Continental"], c: 1 },
                { q: "The South-West Monsoon typically arrives in Kerala by:", o: ["April", "Early June", "July", "August"], c: 1 },
                { q: "Mawsynram in Meghalaya is known for:", o: ["Coldest temperature", "Highest rainfall", "Largest forest", "Deepest river"], c: 1 },
                { q: "Which wind causes rainfall over most of India?", o: ["Trade winds", "South-West Monsoon", "North-East Monsoon", "Westerlies"], c: 1 },
                { q: "The retreating monsoon season occurs during:", o: ["June-Sept", "Oct-Nov", "Dec-Feb", "March-May"], c: 1 }
            ]);
        }
        if (query.includes("soil") || query.includes("agriculture") || query.includes("crop") || query.includes("kharif") || query.includes("rabi") || query.includes("irrigation")) {
            return JSON.stringify([
                { q: "Which soil is best suited for growing cotton?", o: ["Alluvial", "Red", "Black (Regur)", "Laterite"], c: 2 },
                { q: "Kharif crops are sown in which season?", o: ["Winter", "Monsoon (June-July)", "Summer", "Spring"], c: 1 },
                { q: "Rice is the main crop of which type of soil?", o: ["Desert soil", "Alluvial soil", "Laterite soil", "Mountain soil"], c: 1 },
                { q: "The Green Revolution in India focused on:", o: ["Cotton", "Wheat and Rice", "Tea", "Sugarcane"], c: 1 },
                { q: "Rabi crops are harvested in:", o: ["October-December", "March-April", "June-July", "August-September"], c: 1 }
            ]);
        }
        if (query.includes("mineral") || query.includes("coal") || query.includes("petroleum") || query.includes("natural gas") || query.includes("solar") || query.includes("wind energy") || query.includes("resource")) {
            return JSON.stringify([
                { q: "India's largest coal-producing state is:", o: ["Bihar", "Jharkhand", "Odisha", "West Bengal"], c: 1 },
                { q: "Petroleum is known as:", o: ["Black gold", "White gold", "Liquid gold", "Green gold"], c: 0 },
                { q: "Which energy source is renewable?", o: ["Coal", "Natural gas", "Solar", "Petroleum"], c: 2 },
                { q: "The major iron ore producing state in India is:", o: ["Kerala", "Odisha", "Punjab", "Tamil Nadu"], c: 1 },
                { q: "Bauxite is the ore of:", o: ["Iron", "Aluminium", "Copper", "Gold"], c: 1 }
            ]);
        }
        if (query.includes("river") || query.includes("mountain") || query.includes("forest") || query.includes("continent") || query.includes("ocean") || query.includes("map")) {
            return JSON.stringify([
                { q: "Which is the longest river in India?", o: ["Brahmaputra", "Yamuna", "Ganga", "Godavari"], c: 2 },
                { q: "The Tropic of Cancer passes through which Indian state?", o: ["Rajasthan", "Gujarat", "Odisha", "All of these"], c: 3 },
                { q: "The Ganga river originates from:", o: ["Himalayas", "Gangotri Glacier", "Aravalli", "Vindhyas"], c: 1 },
                { q: "Which is the highest mountain peak in India?", o: ["Mount Everest", "K2", "Kanchenjunga", "Nanga Parbat"], c: 2 },
                { q: "The mangrove forest in the Sundarbans is home to which animal?", o: ["Lion", "Royal Bengal Tiger", "Elephant", "Rhinoceros"], c: 1 }
            ]);
        }
        if (query.includes("geo") || query.includes("continent") || query.includes("population") || query.includes("urban")) {
            return JSON.stringify([
                { q: "Which is the longest river in India?", o: ["Brahmaputra", "Yamuna", "Ganga", "Godavari"], c: 2 },
                { q: "The Tropic of Cancer passes through which Indian state?", o: ["Rajasthan", "Gujarat", "Odisha", "All of these"], c: 3 },
                { q: "Which type of soil is best suited for growing cotton in India?", o: ["Alluvial", "Red", "Black (Regur)", "Laterite"], c: 2 },
                { q: "Mawsynram in Meghalaya is known for:", o: ["Coldest temperature", "Highest rainfall", "Largest forest", "Deepest river"], c: 1 },
                { q: "The South-West Monsoon typically arrives in Kerala by:", o: ["April", "Early June", "July", "August"], c: 1 }
            ]);
        }

        // ===== COMPUTER SCIENCE CHAPTERS =====
        if (query.includes("binary") || query.includes("decimal") || query.includes("hexadecimal") || query.includes("byte") || query.includes("bit") || query.includes("number system")) {
            return JSON.stringify([
                { q: "What is the binary equivalent of decimal 10?", o: ["1000", "1010", "0110", "1100"], c: 1 },
                { q: "1 byte is equal to:", o: ["4 bits", "8 bits", "12 bits", "16 bits"], c: 1 },
                { q: "The decimal value of binary 1111 is:", o: ["12", "15", "16", "8"], c: 1 },
                { q: "What is the hexadecimal equivalent of decimal 15?", o: ["A", "B", "F", "E"], c: 2 },
                { q: "Which base does the binary system use?", o: ["8", "10", "2", "16"], c: 2 }
            ]);
        }
        if (query.includes("program") || query.includes("algorithm") || query.includes("code") || query.includes("python") || query.includes("java") || query.includes("c++") || query.includes("javascript")) {
            return JSON.stringify([
                { q: "Which data structure follows the LIFO (Last-In, First-Out) principle?", o: ["Queue", "Stack", "Array", "Tree"], c: 1 },
                { q: "An algorithm is:", o: ["A step-by-step procedure", "A programming language", "A type of computer", "A data structure"], c: 0 },
                { q: "What is the time complexity of binary search?", o: ["O(n)", "O(log n)", "O(n²)", "O(1)"], c: 1 },
                { q: "Which sorting algorithm has the best average time complexity?", o: ["Bubble sort", "Merge sort", "Selection sort", "Insertion sort"], c: 1 },
                { q: "A variable that stores an address is called a:", o: ["Integer", "Pointer", "String", "Float"], c: 1 }
            ]);
        }
        if (query.includes("internet") || query.includes("network") || query.includes("lan") || query.includes("wan") || query.includes("protocol") || query.includes("tcp/ip") || query.includes("http") || query.includes("ip address") || query.includes("router")) {
            return JSON.stringify([
                { q: "What does TCP stand for?", o: ["Transmission Control Protocol", "Transfer Control Protocol", "Transport Communication Protocol", "Total Control Protocol"], c: 0 },
                { q: "The device used to connect different networks is a:", o: ["Switch", "Router", "Hub", "Modem"], c: 1 },
                { q: "What does DNS stand for?", o: ["Domain Name System", "Digital Network Service", "Data Network System", "Domain Network Server"], c: 0 },
                { q: "Which protocol is used for secure web browsing?", o: ["HTTP", "FTP", "HTTPS", "SMTP"], c: 2 },
                { q: "An IP address consists of how many octets?", o: ["2", "4", "6", "8"], c: 1 }
            ]);
        }
        if (query.includes("computer") || query.includes("hardware") || query.includes("software") || query.includes("memory") || query.includes("cpu") || query.includes("ram") || query.includes("rom") || query.includes("data") || query.includes("database") || query.includes("sql") || query.includes("html") || query.includes("css")) {
            return JSON.stringify([
                { q: "What does CPU stand for?", o: ["Central Processing Unit", "Computer Processing Unit", "Control Program Unit", "Central Program Utility"], c: 0 },
                { q: "HTML stands for:", o: ["Hyper Text Markup Language", "High Transfer Markup Language", "Hyper Transfer Mode Language", "Home Text Markup Language"], c: 0 },
                { q: "Which of the following is NOT an operating system?", o: ["Windows", "Linux", "Python", "macOS"], c: 2 },
                { q: "What is the full form of RAM?", o: ["Read Access Memory", "Random Access Memory", "Read And Memory", "Run Access Memory"], c: 1 },
                { q: "Which SQL keyword is used to retrieve data?", o: ["INSERT", "DELETE", "SELECT", "UPDATE"], c: 2 }
            ]);
        }

        // ===== CIVICS =====
        if (query.includes("constitution") || query.includes("preamble") || query.includes("fundamental right") || query.includes("directive principle") || query.includes("citizen") || query.includes("secular") || query.includes("federal") || query.includes("amendment")) {
            return JSON.stringify([
                { q: "The Indian Constitution was adopted on:", o: ["15 Aug 1947", "26 Jan 1950", "26 Nov 1949", "15 Aug 1950"], c: 2 },
                { q: "How many fundamental rights are guaranteed by the Indian Constitution?", o: ["5", "6", "7", "8"], c: 1 },
                { q: "The phrase 'We the People of India' appears in the:", o: ["Fundamental Rights", "Preamble", "Directive Principles", "Citizenship"], c: 1 },
                { q: "Right to Equality is which Article?", o: ["14", "19", "21", "32"], c: 0 },
                { q: "The outermost layer of government in India's federal system is:", o: ["Panchayat", "State", "Union", "Municipality"], c: 2 }
            ]);
        }
        if (query.includes("parliament") || query.includes("lok sabha") || query.includes("rajya sabha") || query.includes("prime minister") || query.includes("president") || query.includes("mp ") || query.includes("bill") || query.includes("election")) {
            return JSON.stringify([
                { q: "The minimum age to become the Prime Minister of India is:", o: ["21", "25", "30", "35"], c: 1 },
                { q: "How many members can the President nominate to Rajya Sabha?", o: ["10", "12", "14", "16"], c: 1 },
                { q: "The term of the Lok Sabha is:", o: ["4 years", "5 years", "6 years", "7 years"], c: 1 },
                { q: "Who is the Supreme Commander of the Indian Armed Forces?", o: ["Prime Minister", "President", "Defence Minister", "Chief of Army"], c: 1 },
                { q: "Elections in India are conducted by:", o: ["Supreme Court", "Election Commission", "President", "Parliament"], c: 1 }
            ]);
        }
        if (query.includes("civic") || query.includes("democracy") || query.includes("government") || query.includes("judiciary") || query.includes("supreme court") || query.includes("high court") || query.includes("panchayat")) {
            return JSON.stringify([
                { q: "The Supreme Court of India is located in:", o: ["Mumbai", "Delhi", "Kolkata", "Chennai"], c: 1 },
                { q: "The head of the Indian state is the:", o: ["Prime Minister", "President", "Chief Justice", "Speaker"], c: 1 },
                { q: "Panchayati Raj is the system of:", o: ["Local self-government", "State government", "Union government", "Judicial system"], c: 0 },
                { q: "India is a ___ democracy.", o: ["Direct", "Indirect", "Presidential", "Monarchical"], c: 1 },
                { q: "The Right to Information Act was passed in:", o: ["2000", "2005", "2010", "2012"], c: 1 }
            ]);
        }

        // ===== ECONOMICS =====
        if (query.includes("gdp") || query.includes("economy") || query.includes("national income") || query.includes("budget") || query.includes("monetary") || query.includes("fiscal") || query.includes("bank") || query.includes("rbi") || query.includes("reserve bank") || query.includes("inflation")) {
            return JSON.stringify([
                { q: "GDP stands for:", o: ["Gross Domestic Product", "General Development Plan", "Gross Demand Price", "Government Deposit Policy"], c: 0 },
                { q: "The Reserve Bank of India was established in:", o: ["1935", "1947", "1950", "1960"], c: 0 },
                { q: "Inflation refers to:", o: ["Rise in prices", "Fall in prices", "Rise in employment", "Fall in GDP"], c: 0 },
                { q: "The three sectors of the economy are:", o: ["Public, Private, Joint", "Primary, Secondary, Tertiary", "Local, State, Centre", "Agricultural, Industrial, Service"], c: 1 },
                { q: "What is a budget deficit?", o: ["Revenue < Expenditure", "Revenue > Expenditure", "Revenue = Expenditure", "None"], c: 0 }
            ]);
        }
        if (query.includes("demand") || query.includes("supply") || query.includes("market") || query.includes("price") || query.includes("trade") || query.includes("globalization") || query.includes("liberalization")) {
            return JSON.stringify([
                { q: "When demand increases and supply stays constant, price:", o: ["Increases", "Decreases", "Stays same", "Fluctuates"], c: 0 },
                { q: "The law of demand states:", o: ["Price and demand move together", "Price and demand are inversely related", "Demand is constant", "Demand depends only on supply"], c: 1 },
                { q: "A market economy is also called:", o: ["Planned economy", "Capitalist economy", "Socialist economy", "Mixed economy"], c: 1 },
                { q: "India adopted economic liberalization in:", o: ["1985", "1991", "2000", "1995"], c: 1 },
                { q: "What is the main function of a bank?", o: ["Lending only", "Accepting deposits and lending", "Printing currency", "Collecting taxes"], c: 1 }
            ]);
        }
        if (query.includes("economic") || query.includes("poverty") || query.includes("unemployment") || query.includes("development") || query.includes("five year") || query.includes("make in india") || query.includes("gst")) {
            return JSON.stringify([
                { q: "The human development index (HDI) includes:", o: ["Education, Health, Income", "Education only", "Income only", "GDP and Population"], c: 0 },
                { q: "India's first five-year plan commenced in:", o: ["1947", "1951", "1960", "1970"], c: 1 },
                { q: "Poverty line in India is determined by:", o: ["Income level", "Calorie intake", "Education level", "Housing"], c: 1 },
                { q: "GST was introduced in India on:", o: ["1 July 2017", "1 April 2017", "1 Jan 2016", "1 Aug 2018"], c: 0 },
                { q: "Which sector employs the largest workforce in India?", o: ["Primary (Agriculture)", "Secondary (Industry)", "Tertiary (Services)", "None"], c: 0 }
            ]);
        }

        // ===== ENGLISH =====
        if (query.includes("tense") || query.includes("grammar") || query.includes("noun") || query.includes("verb") || query.includes("adjective") || query.includes("adverb") || query.includes("preposition") || query.includes("conjunction")) {
            return JSON.stringify([
                { q: "Identify the noun in: 'The cat sat on the mat.'", o: ["sat", "cat", "the", "on"], c: 1 },
                { q: "Which tense is 'She is reading a book'?", o: ["Past continuous", "Present continuous", "Future continuous", "Present perfect"], c: 1 },
                { q: "What is the comparative form of 'good'?", o: ["Better", "Best", "Gooder", "Most good"], c: 0 },
                { q: "An adverb modifies:", o: ["Noun", "Verb", "Pronoun", "Article"], c: 1 },
                { q: "Which of these is a preposition?", o: ["Happy", "Under", "Run", "Blue"], c: 1 }
            ]);
        }
        if (query.includes("voice") || query.includes("active") || query.includes("passive") || query.includes("narration") || query.includes("speech") || query.includes("reported")) {
            return JSON.stringify([
                { q: "Change to passive: 'The boy kicked the ball.'", o: ["The ball was kicked by the boy", "The ball is kicked by the boy", "The boy was kicked by the ball", "The ball had kicked the boy"], c: 0 },
                { q: "Direct speech: He said, 'I am tired.' Indirect:", o: ["He said he was tired", "He said he is tired", "He said he has tired", "He said I am tired"], c: 0 },
                { q: "The active voice focuses on:", o: ["The action", "The doer", "The receiver", "The time"], c: 1 },
                { q: "The passive voice is formed using:", o: ["have + past participle", "be + past participle", "be + present participle", "have + present participle"], c: 1 },
                { q: "In 'The letter was written by her', the subject is:", o: ["She", "The letter", "Written", "By"], c: 1 }
            ]);
        }
        if (query.includes("english") || query.includes("literature") || query.includes("poem") || query.includes("essay") || query.includes("writing") || query.includes("paragraph") || query.includes("letter")) {
            return JSON.stringify([
                { q: "What is a metaphor?", o: ["A comparison using 'like' or 'as'", "A direct comparison without 'like' or 'as'", "A repeated sound", "An exaggeration"], c: 1 },
                { q: "The central idea of a literary work is called its:", o: ["Plot", "Theme", "Setting", "Character"], c: 1 },
                { q: "'The world is a stage' is an example of:", o: ["Simile", "Metaphor", "Personification", "Hyperbole"], c: 1 },
                { q: "What is alliteration?", o: ["Repetition of vowel sounds", "Repetition of consonant sounds at word starts", "Repetition of entire words", "A type of rhyme"], c: 1 },
                { q: "A formal letter should include:", o: ["Subject line and salutation", "Only the message", "Poetic devices", "Storytelling"], c: 0 }
            ]);
        }

        // ===== ENVIRONMENTAL SCIENCE =====
        if (query.includes("pollution") || query.includes("global warming") || query.includes("greenhouse") || query.includes("ozone") || query.includes("climate change") || query.includes("carbon")) {
            return JSON.stringify([
                { q: "The main greenhouse gas is:", o: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Hydrogen"], c: 1 },
                { q: "Ozone depletion is primarily caused by:", o: ["CO₂", "CFCs", "SO₂", "NO₂"], c: 1 },
                { q: "Global warming leads to:", o: ["Sea level rise", "More forests", "Colder winters", "Less rainfall"], c: 0 },
                { q: "The largest source of air pollution in cities is:", o: ["Factories", "Vehicles", "Construction", "Agriculture"], c: 1 },
                { q: "Which international agreement aims to combat climate change?", o: ["Montreal Protocol", "Kyoto Protocol", "Paris Agreement", "Geneva Convention"], c: 2 }
            ]);
        }
        if (query.includes("ecosystem") || query.includes("food chain") || query.includes("food web") || query.includes("biodiversity") || query.includes("endangered") || query.includes("conservation") || query.includes("biodegradable") || query.includes("recycling")) {
            return JSON.stringify([
                { q: "The ultimate source of energy in a food chain is:", o: ["Plants", "Sun", "Animals", "Soil"], c: 1 },
                { q: "Biodegradable waste can be broken down by:", o: ["Microorganisms", "Heat only", "Water only", "Sunlight only"], c: 0 },
                { q: "A species at risk of extinction is called:", o: ["Endangered", "Extinct", "Threatened", "Vulnerable"], c: 0 },
                { q: "Tiger reserves in India are part of project:", o: ["Elephant", "Tiger", "Lion", "Rhino"], c: 1 },
                { q: "The 3 R's of waste management are:", o: ["Reduce, Reuse, Recycle", "Recycle, Remove, Replace", "Reduce, Remove, Reuse", "Recycle, Reuse, Repair"], c: 0 }
            ]);
        }
        if (query.includes("environment") || query.includes("deforestation") || query.includes("forest") || query.includes("wildlife") || query.includes("sanctuar") || query.includes("national park") || query.includes("swachh")) {
            return JSON.stringify([
                { q: "Deforestation leads to:", o: ["Increased rainfall", "Soil erosion and climate change", "More oxygen", "Cooler climate"], c: 1 },
                { q: "Chipko movement was related to:", o: ["Water conservation", "Forest protection", "Soil conservation", "Wildlife protection"], c: 1 },
                { q: "The first national park of India is:", o: ["Corbett National Park", "Kaziranga National Park", "Sundarbans National Park", "Kanha National Park"], c: 0 },
                { q: "Which resource is non-renewable?", o: ["Solar energy", "Wind energy", "Coal", "Water"], c: 2 },
                { q: "The Swachh Bharat Mission aims to:", o: ["Cleanliness and sanitation", "Forest conservation", "Education for all", "Digital India"], c: 0 }
            ]);
        }

        // --- DEFAULT: General fallback ---
        return JSON.stringify([
            { q: "Which gas is consumed during photosynthesis?", o: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Hydrogen"], c: 1 },
            { q: "What is the SI unit of electric current?", o: ["Volt", "Ohm", "Ampere", "Watt"], c: 2 },
            { q: "What is the pH of a neutral solution?", o: ["0", "5", "7", "14"], c: 2 },
            { q: "Identify the figure of speech: 'The world is a stage.'", o: ["Simile", "Metaphor", "Personification", "Hyperbole"], c: 1 },
            { q: "The Tropic of Cancer passes through:", o: ["Rajasthan", "Gujarat", "Odisha", "All of these"], c: 3 }
        ]);
    },

    /* Mock YouTube Summarizer */
    mockYoutubeSummary(url) {
        return `### 📹 Lecture Video Summary\n**Source URL**: ${url}\n\n` +
               `Here are the top high-yield **Topper Notes** extracted from the lecture script:\n\n` +
               `- **Introduction of Topic**: The lecturer defines the core terms and frames the syllabus relevance for Class 10/12 Board Exams.\n` +
               `- **Core Theory Explanation**: Step-by-step diagrams are drawn explaining mechanism details and critical mathematical formulas.\n` +
               `- **Key Mistakes to Avoid**: The instructor points out the common misconceptions students make in exams, highlighting proper board keyword answers.\n` +
               `- **Practical Example Exercises**: Three past year questions (PYQs) are solved on the blackboard showing exact marking point schemes.\n\n` +
               `💡 **Study Tip**: We have auto-loaded these video summary points into your flashcard module! Navigate to the 'Cards' tab to begin active recall testing.`;
    },

    /* Mock Timetable/Schedule Generator */
    mockTimetableResponse(prompt) {
        const query = prompt.toLowerCase();
        let exam = 'JEE';
        let subjects = ['Physics', 'Chemistry', 'Mathematics'];
        if (query.includes('neet')) { exam = 'NEET'; subjects = ['Physics', 'Chemistry', 'Biology']; }
        else if (query.includes('cbse')) { exam = 'CBSE'; subjects = ['Science', 'Mathematics', 'Social Science']; }

        return `### 📚 Subject: Study Planning\n**${exam} Study Timetable**\n\n` +
               `Here is a detailed **hour-by-hour** ${exam} study schedule:\n\n` +
               `**🕐 Morning Block (5:00 AM – 12:00 PM)**\n` +
               `| Time | Subject | Activity |\n|------|---------|----------|\n` +
               `| 5:00 – 5:30 AM | Wake Up | Freshen up, light exercise |\n` +
               `| 5:30 – 7:30 AM | ${subjects[0]} | Theory + Numericals (Freshest mind — hardest subject first) |\n` +
               `| 7:30 – 8:00 AM | Break | Breakfast + short walk |\n` +
               `| 8:00 – 10:00 AM | ${subjects[1]} | Concepts + Reactions/Formulas |\n` +
               `| 10:00 – 10:15 AM | Break | Snack + hydrate |\n` +
               `| 10:15 AM – 12:15 PM | ${subjects[2]} | Problem Practice + Previous Year Questions |\n\n` +
               `**🕑 Afternoon Block (12:30 PM – 5:00 PM)**\n` +
               `| Time | Subject | Activity |\n|------|---------|----------|\n` +
               `| 12:30 – 1:30 PM | Lunch + Rest | Power nap (20 min max) |\n` +
               `| 1:30 – 3:30 PM | ${subjects[0]} | Revision + Short Notes |\n` +
               `| 3:30 – 5:00 PM | ${subjects[1]} | MCQ Practice + DPP |\n\n` +
               `**🕔 Evening Block (5:00 PM – 10:00 PM)**\n` +
               `| Time | Subject | Activity |\n|------|---------|----------|\n` +
               `| 5:00 – 5:30 PM | Break | Walk / music / refresh |\n` +
               `| 5:30 – 7:30 PM | ${subjects[2]} | Advanced Problems |\n` +
               `| 7:30 – 8:30 PM | Dinner + Family | Relax |\n` +
               `| 8:30 – 10:00 PM | Weak Subject | Focus on lowest-scoring topic |\n` +
               `| 10:00 – 10:30 PM | Daily Recap | Revise formulas + sticky notes |\n` +
               `| 10:30 PM | Sleep | 6.5–7 hrs minimum |\n\n` +
               `**📋 Weekly Targets:**\n` +
               `- **Mon–Fri**: Follow full timetable above\n` +
               `- **Saturday**: Full-length mock test (3 hrs) + analysis\n` +
               `- **Sunday**: Revision of the week + formula sheet update\n\n` +
               `**💡 Key Rules:**\n` +
               `1. Never skip the **5:30 AM** slot — it's your highest-retention window\n` +
               `2. Solve at least **30 MCQs** daily per subject\n` +
               `3. Maintain an **error notebook** — review it every Sunday\n` +
               `4. Use **Pomodoro** (25 min focus + 5 min break) within each block\n\n` +
               `---DIDYOUKNOW---\n💡 **Did You Know?** Top AIR-1 rankers study 12–14 hours daily but with **structured breaks** — not continuous cramming!\n\n` +
               `---CHALLENGE---\n{"question": "What is the recommended daily study hours for JEE/NEET toppers?", "options": ["6-8 hours", "8-10 hours", "12-14 hours", "15+ hours"], "correct": 2}`;
    }

};
