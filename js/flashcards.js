/* ==========================================================================
   StudySnap AI - Smart Flashcard Generator (3D Study Deck)
   ========================================================================== */

const flashcards = {
    deck: [],
    currentIndex: 0,
    stats: { correct: 0, incorrect: 0 },
    isTransitioning: false,
    
    init() {
        this.resetSession();
    },

    resetSession() {
        this.deck = [];
        this.currentIndex = 0;
        this.stats = { correct: 0, incorrect: 0 };
        this.isTransitioning = false;
        
        document.getElementById('flashcard-deck-creator').style.display = 'flex';
        document.getElementById('flashcard-session-view').style.display = 'none';
        
        // Reset card state
        const card = document.getElementById('flashcard-main-card');
        if (card) {
            card.classList.remove('flipped');
            card.style.left = '0px';
            card.style.opacity = '1';
        }

        // Close global overlay modal if open
        if (typeof app !== 'undefined' && app.closeModal) {
            app.closeModal();
        }
    },

    /* Generate Deck via AI Engine */
    async generateDeck() {
        const textInput = document.getElementById('flashcard-text-input').value.trim();
        
        if (!textInput) {
            alert("Please paste study materials or upload a file first!");
            return;
        }

        // Visual loading spinner simulation
        const btn = document.querySelector('#flashcard-deck-creator .primary-btn');
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Generating Cards...`;

        try {
            const systemPrompt = "You are a professional flashcard generator. Analyze the user text and output ONLY a strict JSON array of question/answer pairs, with no markdown wrappers, conversational text or commentary. Structure: [{\"q\": \"Term or short question\", \"a\": \"Brief definition or explanation\"}]";
            
            const response = await aiEngine.getCompletion(textInput, systemPrompt);
            
            // Handle possible markdown JSON wrappers (e.g. ```json ... ```)
            const cleanJsonText = studySnapUtils.normalizeJsonResponse(response);
                
            this.deck = JSON.parse(cleanJsonText).filter(item => item && item.q && item.a);
            if (this.deck.length === 0) {
                throw new Error('No flashcards generated');
            }
            this.currentIndex = 0;
            this.stats = { correct: 0, incorrect: 0 };

            // Transition UI to active deck session
            document.getElementById('flashcard-deck-creator').style.display = 'none';
            document.getElementById('flashcard-session-view').style.display = 'flex';
            
            this.loadCard();

            // Reward initial creation XP
            gamification.addXP(30, document.getElementById('flashcard-session-view'));
            gamification.unlockBadge('first_flashcard');

        } catch (error) {
            console.error(error);
            alert("Failed to parse notes. Let's try again with simpler notes.");
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    },

    loadCard() {
        if (this.currentIndex >= this.deck.length) {
            this.completeDeckSession();
            return;
        }

        // Reset Card Flip State
        const card = document.getElementById('flashcard-main-card');
        card.classList.remove('flipped');
        card.style.left = '0px';
        card.style.opacity = '1';

        const item = this.deck[this.currentIndex];
        document.getElementById('card-text-front').textContent = item.q;
        document.getElementById('card-text-back').textContent = item.a;
        
        // Subject Badge
        const boardMode = document.body.className;
        let cat = "Science";
        if (boardMode.includes("cbse")) cat = "CBSE Board";
        if (boardMode.includes("jee")) cat = "JEE Main";
        document.getElementById('card-badge-cat').textContent = cat;

        // Progress bar updates
        document.getElementById('flashcard-counter').textContent = `${this.currentIndex + 1} / ${this.deck.length}`;
        const progressPct = (this.currentIndex / this.deck.length) * 100;
        document.getElementById('flashcard-progress-bar').style.width = `${progressPct}%`;
    },

    flipCard() {
        const card = document.getElementById('flashcard-main-card');
        card.classList.toggle('flipped');
    },

    swipeCard(isCorrect) {
        if (this.isTransitioning) return;
        this.isTransitioning = true;

        const card = document.getElementById('flashcard-main-card');
        
        // Add statistics
        if (isCorrect) this.stats.correct++;
        else {
            this.stats.incorrect++;
            if (typeof tools !== 'undefined' && tools.logMistake) {
                tools.logMistake(this.deck[this.currentIndex].q, this.deck[this.currentIndex].a);
            }
        }

        // Increment Daily Study Goal
        if (typeof gamification !== 'undefined') {
            gamification.incrementFlashcardGoal();
        }

        // 3D slide animations
        card.style.transition = 'left 0.25s ease, opacity 0.25s ease';
        card.style.left = isCorrect ? '250px' : '-250px';
        card.style.opacity = '0';

        setTimeout(() => {
            // Unbind animation, slide to opposite end, increment index, reload
            card.style.transition = 'none';
            this.currentIndex++;
            this.loadCard();
            this.isTransitioning = false; // Release lock
        }, 250);
    },

    completeDeckSession() {
        const modal = document.getElementById('global-modal');
        const content = document.getElementById('modal-content-area');
        
        const successRate = Math.round((this.stats.correct / this.deck.length) * 100);
        
        content.innerHTML = `
            <div style="text-align:center; padding:20px; display:flex; flex-direction:column; gap:12px; align-items:center;">
                <span style="font-size:54px;">🧠</span>
                <h3 style="font-size:20px; font-family:var(--font-heading);">Revision Completed!</h3>
                <p style="font-size:13px; color:var(--text-secondary);">Success Ratio: <strong>${successRate}%</strong> Mastered</p>
                
                <div class="settings-group-box" style="text-align:left; font-size:11.5px; width:100%; margin-top:8px;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
                        <span>Cards Studied:</span>
                        <span>${this.deck.length}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
                        <span>Coins Earned:</span>
                        <span style="color:var(--accent-amber); font-weight:700;">+20 🪙</span>
                    </div>
                    <div style="display:flex; justify-content:space-between;">
                        <span>XP Gained:</span>
                        <span style="color:var(--accent-green); font-weight:700;">+100 XP</span>
                    </div>
                </div>

                <button class="primary-btn" onclick="flashcards.resetSession()" style="margin-top:15px;">Study Another Deck</button>
            </div>
        `;
        
        gamification.addXP(100, document.getElementById('flashcard-session-view'));
        gamification.addCoins(20);
        gamification.triggerConfetti();
        
        modal.style.display = 'flex';
    },

    /* MOCK File Upload Handlers (creates mock decks immediately for testing) */
    handlePdfUpload(event) {
        const file = event.target.files[0];
        if (file) {
            document.getElementById('flashcard-text-input').value = `[Uploaded PDF Notes: ${file.name}. Standard photosynthesis and chemical reaction topics parsed successfully.]`;
            gamification.addXP(10, document.getElementById('screen-flashcards'));
        }
    },

    handleHandwrittenUpload(event) {
        const file = event.target.files[0];
        if (file) {
            document.getElementById('flashcard-text-input').value = `[Scanned Notes Image: ${file.name}. Reading messy handwriting and converting to standard textbook definitions...]`;
            gamification.addXP(10, document.getElementById('screen-flashcards'));
        }
    }
};
