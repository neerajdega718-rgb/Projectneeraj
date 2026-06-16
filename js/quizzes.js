/* ==========================================================================
   StudySnap AI - Timed Quiz Generator
   ========================================================================== */

const quizzes = {
    questions: [],
    currentIndex: 0,
    score: 0,
    timeLeft: 30,
    timerInterval: null,

    init() {
        this.resetQuiz();
    },

    resetQuiz() {
        this.questions = [];
        this.currentIndex = 0;
        this.score = 0;
        clearInterval(this.timerInterval);

        document.getElementById('quiz-builder-panel').style.display = 'flex';
        document.getElementById('quiz-active-panel').style.display = 'none';
        document.getElementById('quiz-report-panel').style.display = 'none';
    },

    /* Generate multiple choice questions via AI */
    async generateQuiz() {
        const textNotes = document.getElementById('quiz-source-notes').value.trim();
        if (!textNotes) {
            alert("Please type a topic or paste revision notes first!");
            return;
        }

        const btn = document.querySelector('#quiz-builder-panel .primary-btn');
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Building Quiz...`;

        try {
            const systemPrompt = "You are an expert multiple-choice examiner. Analyze the text and generate a quiz. Output ONLY a strict JSON array of 5 questions, with no conversational text or markdown wrappers. Structure: [{\"q\": \"Question Text\", \"o\": [\"Option A\", \"Option B\", \"Option C\", \"Option D\"], \"c\": index_of_correct_option}]";
            
            const response = await aiEngine.getCompletion(textNotes, systemPrompt);
            
            const cleanJsonText = studySnapUtils.normalizeJsonResponse(response);

            const parsed = JSON.parse(cleanJsonText);
            if (!Array.isArray(parsed)) throw new Error("Invalid format: response is not an array");

            this.questions = parsed.map(item => ({
                q: item.q || item.question || '',
                o: item.o || item.options || [],
                c: item.c !== undefined ? item.c : (item.correct !== undefined ? item.correct : 0)
            })).filter(item => item.q && Array.isArray(item.o) && item.o.length > 0 && Number.isInteger(Number(item.c)) && item.c >= 0 && item.c < item.o.length);

            if (this.questions.length === 0) {
                throw new Error("Invalid format: no valid questions parsed");
            }

            this.currentIndex = 0;
            this.score = 0;

            // Transition Panels
            document.getElementById('quiz-builder-panel').style.display = 'none';
            document.getElementById('quiz-active-panel').style.display = 'flex';

            this.loadQuestion();

        } catch (error) {
            console.error(error);
            alert("Quiz creation failed. Please simplify the input text topic.");
            this.resetQuiz();
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    },

    loadQuestion() {
        if (this.currentIndex >= this.questions.length) {
            this.finishQuiz();
            return;
        }

        // Clear active timer
        clearInterval(this.timerInterval);

        const q = this.questions[this.currentIndex];
        document.getElementById('quiz-question-text').textContent = q.q;

        // Sync Syllabus Tags
        const boardMode = document.body.className;
        let tag = "NCERT Syllabus";
        if (boardMode.includes("cbse")) tag = "CBSE Class 10";
        if (boardMode.includes("jee")) tag = "JEE Prep PYQ";
        document.getElementById('quiz-subject-tag-val').textContent = tag;

        // Render Option Cards
        const optionsHolder = document.getElementById('quiz-options-holder');
        optionsHolder.innerHTML = '';
        
        q.o.forEach((opt, idx) => {
            const card = document.createElement('div');
            card.className = 'quiz-option-card';
            const label = document.createElement('span');
            label.textContent = opt;
            const icon = document.createElement('i');
            icon.className = 'fa-regular fa-circle';
            card.append(label, icon);
            card.onclick = () => this.selectOption(card, idx === q.c, idx, q.o[q.c]);
            optionsHolder.appendChild(card);
        });

        // Set Timer parameters
        this.timeLeft = 30;
        this.startTimer();
    },

    startTimer() {
        const dial = document.getElementById('quiz-timer-dial');
        const numText = document.getElementById('quiz-timer-number');
        const totalOffset = 100.5; // Circumference of r=16 circle

        numText.textContent = this.timeLeft;
        dial.style.strokeDashoffset = '0';

        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            numText.textContent = this.timeLeft;

            // Sync SVG offsets
            const offset = totalOffset - (totalOffset * this.timeLeft) / 30;
            dial.style.strokeDashoffset = offset;

            if (this.timeLeft <= 0) {
                clearInterval(this.timerInterval);
                this.timeOutAnswer();
            }
        }, 1000);
    },

    selectOption(cardEl, isCorrect, clickedIdx, correctText) {
        clearInterval(this.timerInterval);
        
        // Disable click handlers
        const cards = document.querySelectorAll('.quiz-option-card');
        cards.forEach(c => c.onclick = null);

        if (isCorrect) {
            this.score++;
            cardEl.className = 'quiz-option-card correct';
            cardEl.querySelector('i').className = 'fa-solid fa-circle-check';
            gamification.addXP(20, cardEl);
        } else {
            cardEl.className = 'quiz-option-card wrong';
            cardEl.querySelector('i').className = 'fa-solid fa-circle-xmark';
            
            // Highlight Correct Answer
            cards.forEach((c, idx) => {
                if (idx === this.questions[this.currentIndex].c) {
                    c.className = 'quiz-option-card correct';
                    c.querySelector('i').className = 'fa-solid fa-circle-check';
                }
            });

            // Log mistakes to Mistake Book
            if (typeof tools !== 'undefined' && tools.logMistake) tools.logMistake(this.questions[this.currentIndex].q, `Correct: ${correctText}`);
        }

        // Advance to next question after 1.5s
        setTimeout(() => {
            this.currentIndex++;
            this.loadQuestion();
        }, 1500);
    },

    timeOutAnswer() {
        const cards = document.querySelectorAll('.quiz-option-card');
        cards.forEach(c => c.onclick = null);

        // Highlight correct options
        const q = this.questions[this.currentIndex];
        cards.forEach((c, idx) => {
            if (idx === q.c) {
                c.className = 'quiz-option-card correct';
                c.querySelector('i').className = 'fa-solid fa-circle-check';
            }
        });

        if (typeof tools !== 'undefined' && tools.logMistake) tools.logMistake(q.q, `Timeout! Correct: ${q.o[q.c]}`);

        setTimeout(() => {
            this.currentIndex++;
            this.loadQuestion();
        }, 2000);
    },

    finishQuiz() {
        clearInterval(this.timerInterval);

        document.getElementById('quiz-active-panel').style.display = 'none';
        document.getElementById('quiz-report-panel').style.display = 'flex';

        const finalScoreVal = `${this.score} / ${this.questions.length}`;
        document.getElementById('quiz-final-score').textContent = finalScoreVal;

        // Increment Daily Study Goal
        if (typeof gamification !== 'undefined') {
            gamification.incrementQuizGoal();
        }

        // Custom headlines based on score
        const head = document.getElementById('quiz-report-headline');
        if (this.score === this.questions.length) {
            head.textContent = "🏆 Perfect Score!";
            gamification.unlockBadge('perfect_quiz');
            gamification.addCoins(30);
            gamification.addXP(150, document.getElementById('quiz-report-panel'));
            gamification.triggerConfetti();
        } else if (this.score >= this.questions.length - 2) {
            head.textContent = "🔥 Excellent Work!";
            gamification.addCoins(15);
            gamification.addXP(100, document.getElementById('quiz-report-panel'));
        } else {
            head.textContent = "📚 Keep Studying!";
            gamification.addCoins(5);
            gamification.addXP(50, document.getElementById('quiz-report-panel'));
        }
    },

    restartQuiz() {
        this.resetQuiz();
    }
};
