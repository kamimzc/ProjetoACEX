
// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBg_LBg0LoH7ADKPHN571ARxEjhgUN2TmE",
    authDomain: "bazar-46805.firebaseapp.com",
    projectId: "bazar-46805",
    storageBucket: "bazar-46805.firebasestorage.app",
    messagingSenderId: "296506105856",
    appId: "1:296506105856:web:bb261ba6c4a2406d52b8e5"
};

// Inicialize o Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Elementos da UI
const statusMessage = document.getElementById('statusMessage');
const form = document.getElementById('itemForm');

// Função para mostrar mensagens de status
function showStatus(message, type, details = '') {
    statusMessage.innerHTML = message + (details ? `<div class="error-details">${details}</div>` : '');
    statusMessage.className = 'status-message ' + type;
    
    // Rolagem automática para a mensagem
    statusMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Função para traduzir erros comuns do Firebase
function translateFirebaseError(error) {
    const errorMap = {
        'permission-denied': 'Permissão negada: Você não tem acesso ao banco de dados',
        'unauthenticated': 'Não autenticado: Faça login novamente',
        'invalid-argument': 'Dados inválidos foram enviados',
        'not-found': 'Coleção não encontrada',
        'already-exists': 'Documento já existe',
        'resource-exhausted': 'Limite de cota excedido',
        'failed-precondition': 'Operação não permitida no estado atual',
        'aborted': 'Operação abortada',
        'unavailable': 'Serviço indisponível no momento',
        'internal': 'Erro interno do servidor'
    };
    
    return errorMap[error.code] || error.message;
}

// Adiciona evento de submit ao formulário
form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Mostra mensagem de conexão
    showStatus("🔌 Conectando ao banco de dados...", "connecting");
    
    // Desabilita o botão para evitar múltiplos cliques
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;

    try {
        // Captura os valores dos campos
        const valor = parseFloat(document.getElementById('itemValor').value);
        const quantidadeitens = parseFloat(document.getElementById('itemQuantidade').value);
         const formaPagamento = document.getElementById('formaPagamento').value || '';
        const data = document.getElementById('itemData').value;
        const comprador = document.getElementById('itemComprador').value || 'Anônimo';
        const telefone = document.getElementById('itemTelefone').value || '';
        const email = document.getElementById('itemEmail').value || '';

        // Validação avançada
        if (isNaN(valor)) {
            throw new Error('O valor deve ser um número');
        }
        
        if (valor <= 0) {
            throw new Error('O valor deve ser maior que zero');
        }
        
        if (!data) {
            throw new Error('A data é obrigatória');
        }

        // Mostra que está enviando dados
        showStatus("📤 Enviando dados para o servidor...", "connecting");

        // Salva no Firestore
        const docRef = await db.collection('vendas').add({
            valor: valor,
            quantidadeitens: quantidadeitens,
            formaPagamento: formaPagamento,
            data: data,
            comprador: comprador,
            telefone: telefone,
            email: email,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Mensagem de sucesso com ID do documento
        showStatus("Venda registrada com sucesso!", "success");
        
        // Limpa o formulário
        form.reset();
        document.getElementById('itemData').value = getCurrentDate();
        
        // Oculta a mensagem após 5 segundos
        setTimeout(() => {
            statusMessage.style.display = 'none';
        }, 5000);
        
    } catch (error) {
        console.error("Erro detalhado:", error);
        
        // Mensagem de erro detalhada
        let errorMessage = "❌ Erro ao registrar venda";
        let errorDetails = "";
        
        if (error.code) {
            // Erro do Firebase
            errorMessage = translateFirebaseError(error);
            errorDetails = `Código: ${error.code}\nMensagem: ${error.message}`;
            
            // Se for erro de permissão, sugere ação
            if (error.code === 'permission-denied') {
                errorDetails += "\n\nVerifique se você está logado e tem permissões suficientes.";
            }
        } else {
            // Erro de validação ou outro erro JavaScript
            errorDetails = error.message;
        }
        
        showStatus(errorMessage, "error", errorDetails);
        
        // Se for erro de conexão, sugere tentar novamente
        if (error.code === 'unavailable' || error.message.includes('offline')) {
            showStatus(`${errorMessage} - Tentando reconectar...`, "warning", errorDetails);
            
            // Tenta reconectar após 5 segundos
            setTimeout(() => {
                showStatus("Tentando reconectar ao banco de dados...", "connecting");
            }, 5000);
        }
        
    } finally {
        submitButton.disabled = false;
    }
});

// Funções auxiliares
function getCurrentDate() {
    const now = new Date();
    return now.toISOString().split('T')[0];
}

document.getElementById('itemData').value = getCurrentDate();

function sair() {
    if(confirm('Tem certeza que deseja sair do sistema?')) {
        firebase.auth().signOut().then(() => {
            window.location.href = '/index.html';
        });
    }
}

// Monitora o estado da conexão
firebase.firestore().enableNetwork()
    .then(() => console.log("Online"))
    .catch(err => console.error("Erro de conexão:", err));

// Verificação de autenticação
firebase.auth().onAuthStateChanged((user) => {
    if (!user) {
        window.location.href = '/index.html';
    } else {
        // Verifica permissões ao carregar a página
        db.collection('vendas').limit(1).get()
            .then(() => console.log("Permissões OK"))
            .catch(err => {
                showStatus("Verifique suas permissões de acesso", "warning", 
                        translateFirebaseError(err));
            });
    }
});