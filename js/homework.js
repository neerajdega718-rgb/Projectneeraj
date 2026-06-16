/* ==========================================================================
   StudySnap AI - AI Homework Helper (WhatsApp Doubt Chat)
   ========================================================================== */

const homework = {
    currentTutor: 'coach',
    chatHistory: [],

    greetings: {
        coach: "Hello! I am your Friendly Coach. 🌟 Bring me any math problem, science question, or syllabus doubt and we'll solve it step-by-step together. What are we learning today?",
        buddy: "Yo! What's up? I'm your Study Buddy. 😎 Let's crush this homework together. Paste your question, snap a photo, or just yell out your doubts — let's get those easy XP!"
    },

    systemPrompts: {
        coach: "You are an expert Indian JEE/NEET/CBSE study coach. Give detailed, comprehensive answers with step-by-step explanations, tables, bullet points, and examples. For timetables, give hour-by-hour schedules with subject names, break times, and revision slots. For doubts, explain with formulas and diagrams. Be thorough and complete — never give short one-line answers.",
        buddy: "You are a funny, smart study buddy who knows Indian JEE/NEET/CBSE syllabus well. Give detailed answers with step-by-step explanations, examples, and tips. For timetables, give full hour-by-hour schedules. For doubts, explain with formulas. Be thorough — never give short answers."
    },

    init() {
        this.resetChat();
    },

    resetChat() {
        const container = document.getElementById('chat-messages-container');
        container.innerHTML = '';
        this.chatHistory = [];
        
        // Add Initial Tutor Greeting Bubble
        this.addBubble(this.greetings[this.currentTutor], 'tutor');
    },

    changePersonality() {
        const selector = document.getElementById('tutor-personality-select');
        this.currentTutor = selector.value;
        this.resetChat();
    },

    /* UI Helper: Create bubbles */
    addBubble(text, sender, attachmentData = null) {
        const container = document.getElementById('chat-messages-container');
        const bubble = document.createElement('div');
        bubble.className = `chat-bubble ${sender}`;
        
        // Include attachment preview if present
        if (attachmentData) {
            const img = document.createElement('img');
            img.src = attachmentData;
            img.style.cssText = 'width: 100%; border-radius: 8px; margin-bottom: 8px; max-height: 150px; object-fit: cover;';
            bubble.appendChild(img);
        }

        const msgContent = document.createElement('div');
        
        // If it's a tutor response, strip DIDYOUKNOW and CHALLENGE sections
        if (sender === 'tutor') {
            let clean = text;
            if (clean.includes('---DIDYOUKNOW---')) {
                clean = clean.split('---DIDYOUKNOW---')[0].trim();
            }
            if (clean.includes('---CHALLENGE---')) {
                clean = clean.split('---CHALLENGE---')[0].trim();
            }
            msgContent.innerHTML = this.formatMarkdown(clean || text);
            bubble.appendChild(msgContent);
        } else {
            msgContent.innerHTML = this.formatMarkdown(text);
            bubble.appendChild(msgContent);
        }

        const meta = document.createElement('div');
        meta.className = 'bubble-meta';
        const now = new Date();
        meta.textContent = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
        bubble.appendChild(meta);

        container.appendChild(bubble);
        container.scrollTop = container.scrollHeight;
    },

    /* Handle Image snaps (files) */
    uploadedImageSrc: null,
    handleImageUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.uploadedImageSrc = e.target.result;
                // Add mini preview directly in chat input or prompt user
                gamification.addXP(10, document.getElementById('screen-homework'));
                this.sendMessage("[Attached Photo: Homework scan loaded successfully. Analyzing details...]");
            };
            reader.readAsDataURL(file);
        }
    },

    checkKey(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.sendMessage();
        }
    },

    async sendMessage(customText = null) {
        const textInput = document.getElementById('chat-user-input');
        const queryText = (customText || textInput.value).trim();
        
        if (!queryText && !this.uploadedImageSrc) return;
        
        // Clear inputs
        if (!customText) textInput.value = '';

        // Add Student bubble to chat
        this.addBubble(queryText || "📸 Sent a photo query", 'student', this.uploadedImageSrc);
        
        const cachedImg = this.uploadedImageSrc;
        this.uploadedImageSrc = null; // Clear image cache

        // Show Tutor typing indicator
        const typing = document.getElementById('tutor-typing-indicator');
        typing.style.display = 'flex';
        document.getElementById('chat-messages-container').scrollTop = document.getElementById('chat-messages-container').scrollHeight;

        // Perform mock or API call
        const systemPrompt = this.systemPrompts[this.currentTutor];
        
        try {
            const response = await aiEngine.getCompletion(queryText, systemPrompt);
            
            // Wait 1.2s to feel completely organic
            setTimeout(() => {
                typing.style.display = 'none';
                this.addBubble(response, 'tutor');
                
                // Add standard study XP
                gamification.addXP(20, document.getElementById('chat-messages-container'));
            }, 1200);

        } catch (error) {
            typing.style.display = 'none';
            this.addBubble("Oops, I encountered a connection issue. Let me reset my circuits! Let's try again.", 'tutor');
        }
    },

    answerChallenge(btn, isCorrect, question, correctVal) {
        const optionsHolder = btn.parentElement;
        const buttons = optionsHolder.querySelectorAll('.challenge-opt');
        
        // Disable all options once answered
        buttons.forEach(b => b.disabled = true);

        if (isCorrect) {
            btn.style.cssText = 'background:var(--accent-green-light); border-color:var(--accent-green); color:var(--accent-green);';
            gamification.addXP(30, btn);
            gamification.addCoins(10);
            
            const congrat = document.createElement('p');
            congrat.style.cssText = 'font-size:10px; color:var(--accent-green); font-weight:700; margin-top:8px;';
            congrat.innerHTML = '🎉 Correct answer! +30 XP & +10 Coins.';
            optionsHolder.appendChild(congrat);
        } else {
            btn.style.cssText = 'background:var(--accent-red-light); border-color:var(--accent-red); color:var(--accent-red);';
            
            // Color correct button as green
            buttons.forEach(b => {
                if (b.textContent === correctVal) {
                    b.style.cssText = 'background:var(--accent-green-light); border-color:var(--accent-green); color:var(--accent-green);';
                }
            });

            // Log error in Mistake Book
            if (typeof tools !== 'undefined' && tools.logMistake) tools.logMistake(question, `Correct: ${correctVal}`);
            
            const failure = document.createElement('p');
            failure.style.cssText = 'font-size:10px; color:var(--accent-red); font-weight:700; margin-top:8px;';
            failure.innerHTML = '❌ Incorrect. Added to your Mistake Book for revision.';
            optionsHolder.appendChild(failure);
        }
    },

    /* Basic Markdown formatter helper */
    formatMarkdown(text) {
        return studySnapUtils.escapeHtml(text)
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/### (.*?)\n/g, '<h4 style="font-size:14px; font-family:var(--font-heading); color:var(--accent-violet); margin:6px 0;">$1</h4>')
            .replace(/## (.*?)\n/g, '<h3 style="font-size:15px; font-family:var(--font-heading); color:var(--accent-saffron); margin:8px 0;">$1</h3>')
            .replace(/\n/g, '<br>');
    }
};
