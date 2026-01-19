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
// 2. CONFIGURAZIONE AI "NUVOLA" (FIXATA PER TABELLE)
// ==========================================

const SYSTEM_PROMPT = `
Sei Nuvola, l'assistente ufficiale di UniQFit.
Il tuo compito è creare piani di allenamento e dieta basati su evidenze scientifiche.

--- REGOLE SUPREME (DA RISPETTARE SEMPRE) ---

1. FORMATO RISPOSTA (CRUCIALE PER IL PDF):
   - Quando devi creare una scheda o una dieta, NON usare mai il Markdown (niente |colonna|colonna|).
   - Devi SCRIVERE DIRETTAMENTE IN CODICE HTML.
   - Usa il tag: <table class="chat-table"> ... </table>.
   - Se non usi il tag <table>, il PDF verrà vuoto e l'esame fallirà.

2. FLUSSO INTELLIGENTE (NO LOOP):
   - Step 1: Chiedi l'obiettivo (es. Massa/Definizione).
   - Step 2: Chiedi i dati fisici (Peso/Altezza/Giorni a settimana).
   - Step 3: STOP DOMANDE. Genera SUBITO il piano in tabella HTML.
   - Non chiedere le stesse cose due volte. Se hai i dati, procedi.

3. STILE:
   - Sii breve (max 2 frasi di testo prima della tabella).
   - Usa emoji.
   - Se chiedono check video: "Manda il video a @eliagismondi".

4. IDENTITÀ:
   - Sei un'IA, il tuo creatore è Carlo Renzi.
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
    
    // InnerHTML serve per renderizzare la TABELLA HTML che ci manda il bot
    if (sender === 'bot') { 
        messageElement.innerHTML = text; 
    } else { 
        messageElement.textContent = text; 
    }
    
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return messageElement; 
}

// Funzione PDF (Con controllo errore)
window.downloadPDF = function(btnElement) {
    const parentMessage = btnElement.parentElement;
    const table = parentMessage.querySelector('table'); // Cerca il tag <table>
    
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
            alert("Errore nella creazione del PDF.");
            btnElement.innerHTML = 'Errore';
        });
    } else {
        alert("Errore: Il bot non ha generato una tabella HTML valida. Riprova chiedendo 'Fammi una tabella'.");
    }
};

async function generateBotResponse() {
    const thinkingMsg = displayMessage("...", 'bot');
    
    try {
        // --- FIX MEMORIA (IMPORTANTE) ---
        // Per evitare che il bot impazzisca o vada in loop, 
        // inviamo sempre il System Prompt [0] + gli ultimi 10 messaggi.
        // Così non si "sovraccarica" di dati vecchi.
        const recentMessages = conversationHistory.slice(-10); 
        const messagesToSend = [conversationHistory[0], ...recentMessages];

        const response = await fetch('https://text.pollinations.ai/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: messagesToSend, 
                model: 'openai', 
                seed: 42 // Seed casuale per variare un po' le risposte ma rimanere coerenti
            }),
        });

        if (!response.ok) throw new Error("Errore API");
        
        let aiResponse = await response.text();
        
        // --- FILTRO ANTI-PUBBLICITÀ ---
        const adMarkers = ["Support Pollinations.AI", "Pollinations.AI", "--- **Support"];
        adMarkers.forEach(marker => {
            if (aiResponse.includes(marker)) {
                aiResponse = aiResponse.split(marker)[0];
            }
        });
        aiResponse = aiResponse.trim();
        // -------------------------------

        // Salviamo la risposta pulita
        conversationHistory.push({ role: 'assistant', content: aiResponse });
        
        thinkingMsg.innerHTML = aiResponse;

        // Se c'è la tabella HTML, mostriamo il bottone
        if (aiResponse.includes('<table')) {
            thinkingMsg.innerHTML += `<br><button class="btn-download-pdf" onclick="downloadPDF(this)"><i class="fas fa-file-pdf"></i> Scarica PDF</button>`;
        }

    } catch (error) {
        console.error("Errore AI:", error);
        thinkingMsg.textContent = "Nuvola ha un problema di connessione. Riprova tra un attimo!";
        thinkingMsg.style.color = "red";
    }
}
