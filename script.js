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
// 2. CONFIGURAZIONE AI "NUVOLA" (AGGIORNATA)
// ==========================================

const SYSTEM_PROMPT = `
Sei Nuvola, l'assistente ufficiale di UniQFit.
Il tuo compito è creare piani di allenamento e dieta scientifici.

--- REGOLE ASSOLUTE PER LE TABELLE (IMPORTANTE) ---
1. VIETATO usare il formato Markdown (NO stanghette '|', NO trattini '---').
2. Se devi fare una lista o una tabella, DEVI SCRIVERE SOLO CODICE HTML PURO.
3. Sintassi OBBLIGATORIA per le tabelle:
   <table class="chat-table">
     <tr><th>Ingrediente</th><th>Quantità</th></tr>
     <tr><td>Pollo</td><td>100g</td></tr>
   </table>
4. Se non usi i tag <table>, <tr> e <td>, il sistema si rompe. USA SOLO HTML.

--- ALTRE REGOLE ---
- Step 1: Chiedi Obiettivo e Dati.
- Step 2: Genera il piano (in HTML).
- Non ripetere domande già fatte.
- Sii breve e conciso.
- Identità: Sei un'IA creata da Carlo Renzi.
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
// 4. MOTORE CHATBOT (CON PULIZIA CODICE)
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
    
    // InnerHTML permette di vedere la tabella formattata bene
    if (sender === 'bot') { 
        messageElement.innerHTML = text; 
    } else { 
        messageElement.textContent = text; 
    }
    
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return messageElement; 
}

// --- FUNZIONE PDF BLINDATA ---
window.downloadPDF = function(btnElement) {
    // Risaliamo al contenitore del messaggio per trovare la tabella
    const parentMessage = btnElement.closest('.message'); 
    const table = parentMessage ? parentMessage.querySelector('table') : null;
    
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
            btnElement.innerHTML = '<i class="fas fa-check"></i> Fatto!';
            setTimeout(() => { btnElement.innerHTML = '<i class="fas fa-file-pdf"></i> Scarica PDF'; }, 2000);
        }).catch(err => {
            console.error(err);
            btnElement.innerHTML = 'Errore PDF';
            alert("Impossibile generare il PDF. La tabella non è standard.");
        });
    } else {
        alert("Errore: Non trovo una tabella valida da scaricare.");
    }
};

async function generateBotResponse() {
    const thinkingMsg = displayMessage("...", 'bot');
    
    try {
        // Inviamo solo gli ultimi 8 messaggi per non confondere l'AI
        const recentMessages = conversationHistory.slice(-8); 
        const messagesToSend = [conversationHistory[0], ...recentMessages];

        const response = await fetch('[https://text.pollinations.ai/](https://text.pollinations.ai/)', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: messagesToSend, 
                model: 'openai', 
                seed: 123 // Seed cambiato per forzare un refresh mentale del bot
            }),
        });

        if (!response.ok) throw new Error("Errore API");
        
        let aiResponse = await response.text();
        
        // --- 1. PULIZIA PUBBLICITÀ ---
        const adMarkers = ["Support Pollinations.AI", "Pollinations.AI", "--- **Support"];
        adMarkers.forEach(marker => {
            if (aiResponse.includes(marker)) {
                aiResponse = aiResponse.split(marker)[0];
            }
        });

        // --- 2. PULIZIA CODICE MARKDOWN (IMPORTANTE PER LE TABELLE) ---
        // A volte l'AI scrive ```html all'inizio e ``` alla fine. Lo togliamo.
        aiResponse = aiResponse.replace(/```html/g, "").replace(/```/g, "").trim();

        // Salvataggio memoria
        conversationHistory.push({ role: 'assistant', content: aiResponse });
        
        // Visualizzazione
        thinkingMsg.innerHTML = aiResponse;

        // Se c'è il tag <table>, mostra il bottone PDF
        if (aiResponse.includes('<table')) {
            thinkingMsg.innerHTML += `<br><button class="btn-download-pdf" onclick="downloadPDF(this)"><i class="fas fa-file-pdf"></i> Scarica PDF</button>`;
        }

    } catch (error) {
        console.error("Errore AI:", error);
        thinkingMsg.textContent = "Nuvola sta riposando (Errore connessione). Riprova!";
        thinkingMsg.style.color = "red";
    }
}
