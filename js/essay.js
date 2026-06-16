/* ==========================================================================
   StudySnap AI - Essay Examiner & Board Grader
   ========================================================================== */

const essay = {
    init() {
        this.resetEssay();
    },

    resetEssay() {
        document.getElementById('essay-text-input').value = '';
        document.querySelector('.essay-editor-wrapper').style.display = 'flex';
        document.getElementById('essay-grades-dashboard').style.display = 'none';
    },

    async analyzeEssay() {
        const text = document.getElementById('essay-text-input').value.trim();
        const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;

        if (wordCount < 10) {
            alert("Please write a complete essay of at least 10 words before requesting grader reviews!");
            return;
        }

        const btn = document.querySelector('.essay-editor-wrapper .primary-btn');
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Grading Essay...`;

        try {
            const systemPrompt = "You are a senior board examiner. Analyze the essay text and return ONLY a strict JSON object with these fields, no markdown wrappers and no commentary: {\"grade\": \"Letter Grade e.g. A-\", \"grammar\": integer_score_0_100, \"structure\": integer_score_0_100, \"clarity\": integer_score_0_100, \"feedback\": [{\"critical\": boolean, \"text\": \"Feedback issue explanation\"}]}";
            
            const response = await aiEngine.getCompletion(text, systemPrompt);
            
            const cleanJsonText = studySnapUtils.normalizeJsonResponse(response);

            const report = JSON.parse(cleanJsonText);

            // Display Grades dashboard
            document.querySelector('.essay-editor-wrapper').style.display = 'none';
            document.getElementById('essay-grades-dashboard').style.display = 'flex';

            document.getElementById('essay-letter-grade').textContent = report.grade || 'B';

            this.updateGauge('grammar', typeof report.grammar === 'number' ? report.grammar : 0);
            this.updateGauge('structure', typeof report.structure === 'number' ? report.structure : 0);
            this.updateGauge('clarity', typeof report.clarity === 'number' ? report.clarity : 0);

            // Sync Feedback points
            const feedbackBox = document.getElementById('essay-feedback-bullets');
            feedbackBox.innerHTML = '';

            const feedback = Array.isArray(report.feedback) ? report.feedback : [];
            feedback.forEach(fb => {
                const bullet = document.createElement('div');
                bullet.className = `feedback-bullet ${fb.critical ? 'critical' : ''}`;
                
                const icon = fb.critical 
                    ? '<i class="fa-solid fa-triangle-exclamation" style="color:var(--accent-red); margin-right:8px;"></i>'
                    : '<i class="fa-solid fa-circle-check" style="color:var(--accent-green); margin-right:8px;"></i>';
                
                bullet.innerHTML = `${icon} <span>${studySnapUtils.escapeHtml(fb.text)}</span>`;
                feedbackBox.appendChild(bullet);
            });

            // Reward completion XP & Coins
            gamification.addXP(100, document.getElementById('essay-grades-dashboard'));
            gamification.addCoins(20);

            // Badge achievements triggers
            if (String(report.grade || '').startsWith('A')) {
                gamification.unlockBadge('essay_master');
                gamification.triggerConfetti();
            }

        } catch (error) {
            console.error(error);
            alert("Grading process failed. Check your network or simplify your text length.");
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    },

    updateGauge(id, value) {
        const circle = document.getElementById(`score-circle-${id}`);
        const textVal = document.getElementById(`score-val-${id}`);
        const totalOffset = 150.7;

        textVal.textContent = `${value}%`;
        
        // Calculate dashoffset stroke
        const offset = totalOffset - (totalOffset * value) / 100;
        circle.style.strokeDashoffset = offset;
    }
};
