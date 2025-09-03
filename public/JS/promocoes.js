async function getEmails() {
  const querySnapshot = await getDocs(collection(db, "vendas"));
  const emailsSet = new Set();
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    if (data.email) {
      emailsSet.add(data.email);
    }
  });
  return Array.from(emailsSet);
}


// 3. Extrair e-mails únicos da coleção "vendas"
async function extrairEmailsUnicos() {
  const snapshot = await db.collection("vendas").get();

  const emailsSet = new Set();

  snapshot.forEach((doc) => {
    const data = doc.data();
    if (data.email) {
      emailsSet.add(data.email.trim().toLowerCase());
    } 
  });

  return Array.from(emailsSet);
}

// 4. Enviar e-mail para cada endereço com EmailJS
async function enviarEmails() {
  const emails = await extrairEmailsUnicos();

  for (const email of emails) {
    const templateParams = {
      to_email: email,
      subject: "Promoção especial do Bazar São Jerônimo!",
      message: "Estamos com descontos incríveis! Venha conferir!"
    };

    try {
      const response = await emailjs.send(
        "service_djnecof",   // substitua pelo seu ID do serviço
        "template_e7e7dzn",  // substitua pelo ID do template
        templateParams
      );
      console.log(`E-mail enviado para ${email}:`, response.status);
    } catch (error) {
      console.error(`Erro ao enviar para ${email}:`, error);
    }
  }
}

// Adiciona uma nova categoria (input) ao clicar no botão
document.addEventListener("DOMContentLoaded", () => {

// Mostrar campo de nova categoria
document.getElementById("btnAddCategoria").addEventListener("click", () => {
  document.getElementById("novaCategoriaDiv").style.display = "block";
});
async function carregarCategorias() {
  const categoriasSelect = document.getElementById("categorias");
  categoriasSelect.innerHTML = "<option value=''>Selecione uma categoria</option>";

  const snapshot = await firebase.firestore().collection("categorias").get();
  snapshot.forEach(doc => {
    const option = document.createElement("option");
    option.value = doc.data().nome;
    option.textContent = doc.data().nome;
    categoriasSelect.appendChild(option);
  });
}

// Salvar nova categoria no banco
const db = firebase.firestore();
const categoriasRef = db.collection("categorias"); 
// Teste de conexão com Firestore
db.collection("test").add({ ok: true })
  .then(() => console.log("Firestore conectado!"))
  .catch(err => console.error("Erro de conexão Firestore:", err));


document.getElementById("salvarCategoria").addEventListener("click", async () => {
  const input = document.getElementById("novaCategoriaInput");
  if (input.value.trim() !== "") {
    await categoriasRef.add({ nome: input.value });
    input.value = "";
    document.getElementById("novaCategoriaDiv").style.display = "none";
    carregarCategorias(); // atualiza o select
  }
});

// Enviar promoção
document.getElementById("btnEnviarPromocao").addEventListener("click", async () => {
  const categoria = document.getElementById("categorias").value;
  if (!categoria) {
    alert("Selecione uma categoria!");
    return;
  }

  await db.collection("promocoes").add({
    categoria: categoria,
    data: new Date()
  });

  alert("Promoção enviada com sucesso!");
});

// Carregar categorias ao iniciar
carregarCategorias();

});


// Captura o envio do formulário e envia os e-mails
document.getElementById("promoForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const date = document.getElementById("promoDate").value;
    const discount = document.getElementById("promoDiscount").value;
    const categoryInputs = document.querySelectorAll(".categoryInput");
    const categories = Array.from(categoryInputs)
        .map(input => input.value)
        .filter(Boolean)
        .join(", ");

    const emails = await extrairEmailsUnicos();

    for (const email of emails) {
        const templateParams = {
            to_email: email,       // opcional, se quiser usar no template
            data: date,
            desconto: discount + "%",
            categoria: categories
        };

        try {
            const response = await emailjs.send(
                "service_djnecof",
                "template_e7e7dzn",
                templateParams
            );
            console.log(`E-mail enviado para ${email}:`, response.status);
        } catch (error) {
            console.error(`Erro ao enviar para ${email}:`, error);
        }
    }

    alert("Promoções enviadas com sucesso!");
});

function sair() {
    if(confirm('Tem certeza que deseja sair do sistema?')) {
        firebase.auth().signOut().then(() => {
            window.location.href = '/index.html';
        });
    }
}

// Verifica se o usuário está autenticado
firebase.auth().onAuthStateChanged(user => {
  if (user) {
    console.log("Usuário logado:", user.email);
  } else {
    console.log("Nenhum usuário logado, redirecionando...");
    window.location.href = "/index.html"; // ou a página de login
  }
});

