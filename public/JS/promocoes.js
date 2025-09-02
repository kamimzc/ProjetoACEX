emailjs.init("jxlPp_eP3O_5Dv6BF");

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
   function addCategory() {
    const input = document.getElementById("newCategory");
    const newCategory = input.value.trim(); // pega o texto digitado

    if (newCategory) {
      const select = document.getElementById("categorySelect");

      // cria a nova opção
      const option = document.createElement("option");
      option.value = newCategory.toLowerCase();
      option.textContent = newCategory;

      // adiciona no select
      select.appendChild(option);

      // limpa o campo de texto
      input.value = "";
    } else {
      alert("Digite uma categoria antes de adicionar!");
    }
  }

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


