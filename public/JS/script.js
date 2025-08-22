// Configuração do Firebase (substitua com suas credenciais)
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

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const messageDiv = document.getElementById('message');
    
    try {
        // Autenticação com Firebase
        const userCredential = await firebase.auth().signInWithEmailAndPassword(username, password);
        
        messageDiv.textContent = 'Login bem-sucedido! Redirecionando...';
        messageDiv.style.color = 'green';
        
        setTimeout(() => {
            window.location.href = '/public/docs/inicio.html';
        }, 1000);
        
    } catch (error) {
        let errorMessage = 'Erro ao fazer login';
        if (error.code === 'auth/user-not-found') {
            errorMessage = 'Usuário não encontrado';
        } else if (error.code === 'auth/wrong-password') {
            errorMessage = 'Senha incorreta';
        }
        
        messageDiv.textContent = errorMessage;
        messageDiv.style.color = 'red';
        console.error('Erro:', error);
    }
});