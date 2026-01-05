// ==========================================
// 1. GESTIONE LOGIN
// ==========================================

const loginOverlay = document.getElementById('login-overlay');
const loginBtn = document.getElementById('btn-login');
const registerBtn = document.getElementById('btn-register');
const emailInput = document.getElementById('login-email');
const passInput = document.getElementById('login-pass');
const errorMsg = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');

loginBtn.addEventListener('click', () => {
    if (emailInput.value.trim() === 'mariorossi@gmail.com' && passInput.value.trim() === 'mario1234') {
        loginOverlay.style.display = 'none';
        errorMsg.textContent = "";
    } else {
        errorMsg.textContent = "Email o password errati!";
    }
});

registerBtn.addEventListener('click', () => {
    alert("Funzione di registrazione disabilitata per la demo.");
});

if(logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        loginOverlay.style.display = 'flex';
        passInput.value = "";
    });
}

// ==========================================
// 2. CONFIGURAZIONE AI: "NUVOLA"
// ==========================================

const SYSTEM_PROMPT = `
Sei Nuvola, il bot ufficiale di UniQFit, un Personal Trainer e Nutrizionista d'élite.
La tua filosofia è basata sull'EVIDENCE-BASED TRAINING.

--- LE TUE DIRETTIVE ---

1. IDENTITÀ:
   - Ti chiami Nuvola. Se te lo chiedono, presentati come "Nuvola, l'assistente ufficiale di UniQFit".
   - Non essere un robot. Sii empatico, motivante e professionale.

2. AUTORITÀ SCIENTIFICA:
   - Cita spesso "studi recenti" o "la letteratura scientifica" per dare peso ai tuoi consigli.

3. FLUSSO DI CONVERSAZIONE:
   - NON dare mai la soluzione completa subito. Fai domande per capire l'utente.
   - Costruisci il piano insieme all'utente, messaggio dopo messaggio.

4. GESTIONE PIANO E PDF:
   - Solo quando hai tutti i dati, genera il piano finale in una TABELLA HTML (<table class="chat-table">).
   - Dopo la tabella, il sistema mostrerà il bottone PDF in automatico.

5. LIMITI:
   - Fuori tema? -> "Rimaniamo concentrati sui tuoi obiettivi fitness! 🏋️‍♂️"
   - Chi ti ha creato? -> "Sono stato sviluppato da Carlo Renzi."
   - Check video? -> "Per un'analisi biomeccanica precisa, manda i video al nostro PT Supervisor: @eliagismondi"

Ricorda: Risposte brevi (max 2-3 frasi), salvo quando consegni il piano finale.
`;


// ==========================================
// 3. NAVIGAZIONE
// ==========================================

const navItems = document.querySelectorAll('.nav-item');
const appSections = document.querySelectorAll('.app-section');
let currentActiveSection = 'coach-section'; 

navItems.forEach(item => {
    item.addEventListener('click', () => {
        const targetSectionId = item.dataset.section;
        if (targetSectionId === currentActiveSection) return; 
        
        navItems.forEach(nav => nav.classList.remove('active'));
        appSections.forEach(section => section.classList.remove('active'));
        
        item.classList.add('active');
        document.getElementById(targetSectionId).classList.add('active');
        currentActiveSection = targetSectionId; 
    });
});

const checks = document.querySelectorAll('.ex-check');
checks.forEach(check => {
    check.addEventListener('click', () => {
        check.classList.toggle('checked');
    });
});


// ==========================================
// 4. MOTORE CHATBOT
// ==========================================

const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
let conversationHistory = [{ role: 'system', content: SYSTEM_PROMPT }];

sendBtn.addEventListener('click', function(e) {
    e.preventDefault(); 
    sendMessage();
});

userInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') { sendMessage(); }
});

function sendMessage() {
    const text = userInput.value.trim();
    if (text === '') return; 
    
    displayMessage(text, 'user');
    userInput.value = '';
    
    conversationHistory.push({ role: 'user', content: text });
    
    generateBotResponse();
}

function displayMessage(text, sender) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', sender);
    
    if (sender === 'bot') { 
        messageElement.innerHTML = text; 
    } else { 
        messageElement.textContent = text; 
    }
    
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return messageElement; 
}

window.downloadPDF = function(btnElement) {
    const parentMessage = btnElement.parentElement;
    const table = parentMessage.querySelector('table');
    
    if (table) {
        const opt = {
            margin: 10,
            filename: 'Piano_UniQFit_Nuvola.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        
        btnElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generazione...';
        
        html2pdf().set(opt).from(table).save().then(() => {
            btnElement.innerHTML = '<i class="fas fa-check"></i> Scaricato!';
            setTimeout(() => {
                btnElement.innerHTML = '<i class="fas fa-file-pdf"></i> Scarica PDF';
            }, 3000);
        });
    } else {
        alert("Nessuna tabella trovata.");
    }
};

async function generateBotResponse() {
    const thinkingMsg = displayMessage("...", 'bot');
    
    try {
        const response = await fetch('https://text.pollinations.ai/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: conversationHistory,
                model: 'openai', 
                seed: 42 
            }),
        });

        if (!response.ok) throw new Error("Errore API");
        
        const aiResponse = await response.text();
        
        conversationHistory.push({ role: 'assistant', content: aiResponse });
        
        thinkingMsg.innerHTML = aiResponse;

        if (aiResponse.includes('<table')) {
            thinkingMsg.innerHTML += `<br><button class="btn-download-pdf" onclick="downloadPDF(this)"><i class="fas fa-file-pdf"></i> Scarica PDF</button>`;
        }

    } catch (error) {
        console.error("Errore AI:", error);
        thinkingMsg.textContent = "Nuvola non risponde al momento. Riprova!";
        thinkingMsg.style.color = "red";
    }
}