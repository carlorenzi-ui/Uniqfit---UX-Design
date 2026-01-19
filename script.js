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
    alert("Funzione disabilitata per la demo.");
});

if(logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        loginOverlay.style.display = 'flex';
        passInput.value = "";
    });
}

// ==========================================
// 2. CONFIGURAZIONE AI "NUVOLA" (MODALITÀ DIRETTA)
// ==========================================

const SYSTEM_PROMPT = `
Sei Nuvola, l'assistente ufficiale di UniQFit.
Il tuo compito è essere UTILE, VELOCE e SCIENTIFICO.

--- REGOLE D'ORO (DA SEGUIRE SEMPRE) ---

1. RISPOSTA DIRETTA (NO INTERVISTE):
   - Se l'utente chiede una sostituzione (es: "Cosa mangio al posto del pollo?"), NON fare domande su calorie o macro.
   - RISPONDI SUBITO con l'elenco delle alternative.
   - Esempio corretto: "Al posto di 150g di pollo puoi usare: 140g di Tacchino, 180g di Tofu o 200g di Albumi."

2. TABELLE HTML OBBLIGATORIE:
   - Se devi fare un elenco (dieta, scheda, sostituzioni), USA SOLO HTML PURO: <table class="chat-table">...</table>.
   - VIETATO usare markdown (no '|', no '---'). Se usi markdown il PDF non funziona.

3. MEMORIA E RIPETIZIONI:
   - Non chiedere mai dati che l'utente ti ha già detto.
   - Se hai già chiesto l'obiettivo, non chiederlo di nuovo.

4. IDENTITÀ E SICUREZZA:
   - Creatore: Carlo Renzi.
   - Check video: "Manda il video a @eliagismondi".

5. STILE:
   - Sii conciso. Massimo 1 frase di introduzione, poi subito la tabella o la risposta.
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
// 4. MOTORE CHATBOT (OTTIMIZZATO)
// ==========================================

const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

// Inizializziamo la storia
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

// Funzione PDF
window.downloadPDF = function(btnElement) {
    const parentMessage = btnElement.closest('.message'); 
    const table = parentMessage ? parentMessage.querySelector('table') : null;
    
    if (table) {
        const opt = {
            margin: 10,
            filename: 'Scheda_UniQFit.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        
        btnElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generazione...';
        
        html2pdf().set(opt).from(table).save().then(() => {
            btnElement.innerHTML = '<i class="fas fa-check"></i> Fatto!';
            setTimeout(() => { btnElement.innerHTML = '<i class="fas fa-file-pdf"></i> Scarica PDF'; }, 2000);
        }).catch(err => {
            console.error(err);
            btnElement.innerHTML = 'Errore Formato';
            alert("Tabella non standard. Riprova chiedendo una 'tabella HTML'.");
        });
    } else {
        alert("Errore: Nessuna tabella trovata.");
    }
};

async function generateBotResponse() {
    const thinkingMsg = displayMessage("...", 'bot');
    
    try {
        // Manteniamo la memoria corta (ultimi 6 messaggi) per evitare confusione
        const recentMessages = conversationHistory.slice(-6); 
        const messagesToSend = [conversationHistory[0], ...recentMessages];

        const response = await fetch('https://text.pollinations.ai/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: messagesToSend, 
                model: 'openai', 
                seed: Math.floor(Math.random() * 1000) // Random seed per risposte fresche
            }),
        });

        if (!response.ok) throw new Error("Errore API");
        
        let aiResponse = await response.text();
        
        // --- FILTRI DI PULIZIA ---
        
        // 1. Rimuove pubblicità
        const adMarkers = ["Support Pollinations.AI", "Pollinations.AI", "--- **Support"];
        adMarkers.forEach(marker => {
            if (aiResponse.includes(marker)) aiResponse = aiResponse.split(marker)[0];
        });

        // 2. Rimuove markdown code blocks
        aiResponse = aiResponse.replace(/```html/g, "").replace(/```/g, "").trim();

        // -------------------------

        conversationHistory.push({ role: 'assistant', content: aiResponse });
        
        thinkingMsg.innerHTML = aiResponse;

        if (aiResponse.includes('<table')) {
            thinkingMsg.innerHTML += `<br><button class="btn-download-pdf" onclick="downloadPDF(this)"><i class="fas fa-file-pdf"></i> Scarica PDF</button>`;
        }

    } catch (error) {
        console.error("Errore AI:", error);
        thinkingMsg.textContent = "Errore di connessione. Riprova!";
        thinkingMsg.style.color = "red";
    }
}
