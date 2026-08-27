// State Variables
let shuffledQuestions = [];
let userAnswers = {}; // Store answers { questionIndex: selectedOptionIndex }
let currentQuestionIndex = 0;
let timeLeft = 105 * 60; // 1 hr 45 min in seconds
let timerInterval;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('total-q-start').innerText = originalQuestions.length;
    document.getElementById('total-q-exam').innerText = originalQuestions.length;
});

// Utility: Shuffle Array (Fisher-Yates)
function shuffleArray(array) {
    let newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
}

// Format Time
function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

function startExam() {
    shuffledQuestions = shuffleArray(originalQuestions);
    userAnswers = {};
    currentQuestionIndex = 0;
    timeLeft = 105 * 60;
    
    generatePalette();
    renderQuestion();
    switchScreen('exam-screen');
    
    timerInterval = setInterval(() => {
        timeLeft--;
        document.getElementById('timer').innerText = formatTime(timeLeft);
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            calculateAndShowResult();
        }
    }, 1000);
}

function generatePalette() {
    const palette = document.getElementById('question-palette');
    palette.innerHTML = '';
    shuffledQuestions.forEach((_, idx) => {
        const btn = document.createElement('button');
        btn.className = 'palette-btn';
        btn.innerText = idx + 1;
        btn.onclick = () => jumpToQuestion(idx);
        btn.id = `pal-btn-${idx}`;
        palette.appendChild(btn);
    });
}

function updatePaletteUI() {
    shuffledQuestions.forEach((_, idx) => {
        const btn = document.getElementById(`pal-btn-${idx}`);
        // Reset classes
        btn.className = 'palette-btn';
        if (userAnswers[idx] !== undefined) {
            btn.classList.add('attempted');
        }
        if (idx === currentQuestionIndex) {
            btn.classList.add('active');
        }
    });
}

function renderQuestion() {
    const q = shuffledQuestions[currentQuestionIndex];
    document.getElementById('current-q-num').innerText = currentQuestionIndex + 1;
    document.getElementById('question-text').innerText = q.q;
    
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';
    
    q.options.forEach((opt, idx) => {
        const label = document.createElement('label');
        label.className = 'option-label';
        if (userAnswers[currentQuestionIndex] === idx) {
            label.classList.add('selected');
        }
        
        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'option';
        radio.value = idx;
        radio.checked = (userAnswers[currentQuestionIndex] === idx);
        radio.onchange = () => selectOption(idx);
        
        label.appendChild(radio);
        label.appendChild(document.createTextNode(opt));
        optionsContainer.appendChild(label);
    });

    // Update buttons
    document.getElementById('prev-btn').disabled = currentQuestionIndex === 0;
    document.getElementById('next-btn').disabled = currentQuestionIndex === shuffledQuestions.length - 1;
    
    updatePaletteUI();
}

function selectOption(idx) {
    userAnswers[currentQuestionIndex] = idx;
    renderQuestion(); // Re-render to show selected style
}

function clearAnswer() {
    delete userAnswers[currentQuestionIndex];
    renderQuestion();
}

function nextQuestion() {
    if (currentQuestionIndex < shuffledQuestions.length - 1) {
        currentQuestionIndex++;
        renderQuestion();
    }
}

function prevQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        renderQuestion();
    }
}

function jumpToQuestion(idx) {
    currentQuestionIndex = idx;
    renderQuestion();
}

function confirmSubmit() {
    const unattempted = shuffledQuestions.length - Object.keys(userAnswers).length;
    let msg = 'શું તમે ચોક્કસ પરીક્ષા સબમિટ કરવા માંગો છો?';
    if(unattempted > 0) {
        msg += `\nતમે ${unattempted} પ્રશ્નોના જવાબ આપ્યા નથી. પ્રશ્ન છોડવા પર -1 માર્ક કપાશે!`;
    }
    if (confirm(msg)) {
        clearInterval(timerInterval);
        calculateAndShowResult();
    }
}

function calculateAndShowResult() {
    let correct = 0;
    let wrong = 0;
    let unattempted = 0;
    let score = 0;

    shuffledQuestions.forEach((q, idx) => {
        const userAns = userAnswers[idx];
        if (userAns === undefined) {
            unattempted++;
            score -= 1; // Unattempted penalty
        } else if (userAns === q.correct) {
            correct++;
            score += 1; // Correct
        } else {
            wrong++;
            score -= 1.33; // Wrong penalty
        }
    });

    document.getElementById('final-score').innerText = score.toFixed(2);
    document.getElementById('total-score-max').innerText = shuffledQuestions.length;
    
    const detailsHtml = `
        <p><strong>કુલ પ્રયાસ (Attempted):</strong> ${correct + wrong}</p>
        <p><strong>છોડી દીધેલ (Unattempted):</strong> ${unattempted} <span class="red">(-${unattempted} માર્કસ)</span></p>
        <p style="color: #27ae60;"><strong>સાચા જવાબો (Correct):</strong> ${correct} (+${correct} માર્કસ)</p>
        <p style="color: #c0392b;"><strong>ખોટા જવાબો (Wrong):</strong> ${wrong} (-${(wrong * 1.33).toFixed(2)} માર્કસ)</p>
    `;
    document.getElementById('score-details').innerHTML = detailsHtml;

    switchScreen('result-screen');
}

function showSolutions() {
    const container = document.getElementById('solutions-container');
    container.innerHTML = '';

    shuffledQuestions.forEach((q, idx) => {
        const userAns = userAnswers[idx];
        const card = document.createElement('div');
        card.className = 'solution-card';
        
        let statusText = '';
        if (userAns === undefined) {
            card.classList.add('unattempted');
            statusText = '<span style="color:#f39c12; font-weight:bold;">છોડી દીધેલ (Unattempted) [-1]</span>';
        } else if (userAns === q.correct) {
            card.classList.add('correct');
            statusText = '<span style="color:#27ae60; font-weight:bold;">સાચો જવાબ (Correct) [+1]</span>';
        } else {
            card.classList.add('wrong');
            statusText = '<span style="color:#c0392b; font-weight:bold;">ખોટો જવાબ (Wrong) [-1.33]</span>';
        }

        let optionsHtml = '<div class="sol-options">';
        q.options.forEach((opt, optIdx) => {
            let optClass = '';
            let marker = '';
            
            if (optIdx === q.correct) {
                optClass = 'correct-ans';
                marker = ' (✓ સાચો જવાબ)';
            } else if (optIdx === userAns && userAns !== q.correct) {
                optClass = 'wrong-ans';
                marker = ' (તમારો ખોટો જવાબ)';
            }
            optionsHtml += `<p class="${optClass}">${optIdx + 1}. ${opt} ${marker}</p>`;
        });
        optionsHtml += '</div>';

        card.innerHTML = `
            <h3>પ્રશ્ન ${idx + 1}: ${q.q}</h3>
            <p>સ્ટેટસ: ${statusText}</p>
            ${optionsHtml}
        `;
        container.appendChild(card);
    });

    switchScreen('solution-screen');
}
