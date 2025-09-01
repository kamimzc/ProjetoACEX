        // Configuração do Firebase
        const firebaseConfig = {
            apiKey: "AIzaSyBg_LBg0LoH7ADKPHN571ARxEjhgUN2TmE",
            authDomain: "bazar-46805.firebaseapp.com",
            projectId: "bazar-46805",
            storageBucket: "bazar-46805.appspot.com",
            messagingSenderId: "296506105856",
            appId: "1:296506105856:web:bb261ba6c4a2406d52b8e5"
        };

        // Inicialize o Firebase
        firebase.initializeApp(firebaseConfig);
        const db = firebase.firestore();
        
        // Inicialize o EmailJS com seu User ID
        emailjs.init('M7OQR6vfh7wY1EgdG');
        
        // Variável para armazenar os dados das vendas
        let salesData = [];
        
        // Função para mostrar mensagens de status
        function showStatus(message, type) {
            const statusMessage = document.getElementById('statusMessage');
            statusMessage.textContent = message;
            statusMessage.className = 'status-message ' + type;
        }
        
        // Função para carregar os dados das vendas
        async function loadSalesData() {
            showStatus("Carregando dados...", "connecting");
            
            try {
                let query = db.collection('vendas').orderBy('data', 'desc');
                
                // Aplicar filtros
                const startDate = document.getElementById('startDate').value;
                const endDate = document.getElementById('endDate').value;
                const buyerName = document.getElementById('searchBuyer').value.toLowerCase();
                
                if (startDate) {
                    query = query.where('data', '>=', startDate);
                }
                
                if (endDate) {
                    query = query.where('data', '<=', endDate);
                }
                
                const querySnapshot = await query.get();
                salesData = [];
                
                querySnapshot.forEach(doc => {
                    const sale = doc.data();
                    sale.id = doc.id;
                    
                    // Aplicar filtro por nome do comprador (se existir)
                    if (!buyerName || sale.comprador.toLowerCase().includes(buyerName)) {
                        salesData.push(sale);
                    }
                });
                
                renderSalesTable();
                showStatus(`Carregadas ${salesData.length} vendas`, "success");
                
            } catch (error) {
                console.error("Erro ao carregar vendas:", error);
                showStatus("Erro ao carregar vendas: " + error.message, "error");
            }
        }
        
        // Função para renderizar a tabela de vendas
        function renderSalesTable() {
            const tableBody = document.getElementById('salesTableBody');
            tableBody.innerHTML = '';
            
            if (salesData.length === 0) {
                const row = document.createElement('tr');
                row.innerHTML = '<td colspan="6" style="text-align: center;">Nenhuma venda encontrada</td>';
                tableBody.appendChild(row);
                return;
            }
            
            let total = 0;
            
            salesData.forEach(sale => {
                const row = document.createElement('tr');
                
                row.innerHTML = `
                    <td>${formatDate(sale.data)}</td>
                    <td>R$ ${sale.valor.toFixed(2)}</td>
                    <td>${sale.comprador}</td>
                    <td class="truncate-cell" title="${sale.telefone || '-'}">${sale.telefone || '-'}</td>
                    <td class="truncate-cell" title="${sale.email || '-'}">${sale.email || '-'}</td>
                    <td class="action-buttons">
                        <button class="btn-pdf" onclick="generateSalePDF('${sale.id}')">Baixar PDF</button>
                        ${sale.email ? `<button class="btn-email" onclick="generateSalePDF('${sale.id}', '${sale.email}')">Enviar Email</button>` : ''}
                    </td>
                `;
                
                tableBody.appendChild(row);
                total += sale.valor;
            });
            
            // Adicionar linha de total
            const totalRow = document.createElement('tr');
            totalRow.style.fontWeight = 'bold';
            totalRow.style.backgroundColor = '#fee8f0';
            totalRow.innerHTML = `
                <td>TOTAL</td>
                <td>R$ ${total.toFixed(2)}</td>
                <td colspan="4"></td>
            `;
            tableBody.appendChild(totalRow);
        }
        
        // Função para formatar a data
        function formatDate(dateString) {
            if (!dateString) return '-';
            const date = new Date(dateString);
            return date.toLocaleDateString('pt-BR');
        }
        
        // Função para exportar para CSV
        function exportToCSV() {
            if (salesData.length === 0) {
                showStatus("Nenhum dado para exportar", "error");
                return;
            }
            
            try {
                // Criar cabeçalho CSV
                const headers = ['Data', 'Valor (R$)', 'Comprador', 'Telefone', 'Email'];
                let csvContent = headers.join(';') + '\n';
                
                // Adicionar linhas de dados
                salesData.forEach(sale => {
                    const row = [
                        formatDate(sale.data),
                        sale.valor.toFixed(2).replace('.', ','),
                        `"${sale.comprador.replace(/"/g, '""')}"`,
                        sale.telefone || '',
                        sale.email || ''
                    ];
                    csvContent += row.join(';') + '\n';
                });
                
                // Criar e baixar o arquivo CSV
                const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                
                link.setAttribute('href', url);
                link.setAttribute('download', `vendas_bazar.csv`);
                link.style.display = 'none';
                
                document.body.appendChild(link);
                link.click();
                
                // Limpeza
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                
                showStatus("Arquivo CSV gerado com sucesso!", "success");
                
            } catch (error) {
                console.error("Erro ao exportar CSV:", error);
                showStatus("Erro ao exportar CSV: " + error.message, "error");
            }
        }
        
       async function sendSaleByEmail(saleId, recipientEmail) {
    try {
        showStatus("Preparando para enviar email...", "connecting");
        
        
        // Buscar os dados da venda
        const saleDoc = await db.collection('vendas').doc(saleId).get();
        const sale = saleDoc.data();
        
        // Enviar email via EmailJS
        const response = await emailjs.send('service_t7ygerp', 'template_ckzs5vu', {
            to_email: recipientEmail,
            to_name: sale.comprador,
            from_name: "Bazar São Jerônimo",
            sale_id: saleId,
            sale_date: formatDate(sale.data),
            sale_amount: `R$ ${sale.valor.toFixed(2)}`,
            message: "Segue as informações da sua compra no Bazar Beneficente São Jerônimo."
        });
        
        showStatus("Email enviado com sucesso para " + recipientEmail, "success");
        return response;
    } catch (error) {
        console.error("Erro ao enviar email:", error);
        showStatus("Erro ao enviar email: " + error.message, "error");
        throw error;
    }
}       
        // Função para gerar PDF completo (com logo e formatação para download)
async function generatePDFForEmail(saleId) {
    try {
        const saleDoc = await db.collection('vendas').doc(saleId).get();
        const sale = saleDoc.data();

        const { jsPDF } = window.jspdf;

        // Criar documento no formato de ticket (80mm x 200mm)
       const doc = new jsPDF({
    unit: "mm",
    format: [80, 200] // largura 80mm, altura ajustável
});

let y = 10;

// Adicionar logo (opcional)
const logoData = await loadLogo();
if (logoData) {
    doc.addImage(logoData, "PNG", 25, y, 30, 20);
    y += 25;
}

// Cabeçalho oficial
doc.setFontSize(14);
doc.setFont(undefined, "bold");
doc.text("Comprovante de Venda", 40, y, { align: "center" });
y += 8;

doc.setFontSize(11);
doc.setFont(undefined, "normal");
doc.text("Bazar Beneficente São Jerônimo", 40, y, { align: "center" }); y += 6;
doc.text("CNPJ: 00.000.000/0001-00", 40, y, { align: "center" }); y += 6;
doc.text("Rua Exemplo, 123 - Centro - Cidade/UF", 40, y, { align: "center" }); y += 8;
doc.line(5, y, 75, y); y += 8;

// Dados da venda
doc.setFontSize(10);
doc.text(`Venda ID: ${saleId}`, 5, y); y += 5;
doc.text(`Data/Hora: ${sale.data}`, 5, y); y += 5;
doc.text(`Comprador: ${sale.comprador || "Não informado"}`, 5, y); y += 5;
doc.text(`Telefone: ${sale.telefone || "Não informado"}`, 5, y); y += 5;
doc.text(`Email: ${sale.email || "Não informado"}`, 5, y); y += 8;
doc.line(5, y, 75, y); y += 8;

// Mostrar quantidade de itens
doc.text(`Quantidade total de itens: ${sale.quantidadeitens}`, 5, y);  y += 5;
doc.text(`Forma de pagamento: ${sale.formaPagamento}`, 5, y);  y += 5;
y += 8;

// Total
doc.setFont(undefined, "bold");
doc.setFontSize(11);
doc.text(`VALOR TOTAL: R$ ${sale.valor.toFixed(2)}`, 75, y, { align: "right" });
y += 12;

// Rodapé
doc.setFontSize(9);
doc.setFont(undefined, "normal");
doc.text("Este documento comprova a venda realizada", 40, y, { align: "center" }); y += 4;
doc.text("no Bazar Beneficente São Jerônimo.", 40, y, { align: "center" }); y += 4;
doc.text("Obrigado por apoiar nossa causa!", 40, y, { align: "center" });

// Retorna o PDF como base64
return doc.output("dataurlstring");

    } catch (error) {
        console.error("Erro ao gerar PDF:", error);
        throw error;
    }
}

        // Função principal para gerar PDF (com opção de enviar por email)
        async function generateSalePDF(saleId, email = null) {
            try {
                if (email) {
                    // Se tiver email, envia por email usando a versão simplificada
                    return await sendSaleByEmail(saleId, email);
                } else {
                    // Caso contrário, faz download usando a versão completa
                    const pdfData = await generatePDFForEmail(saleId);
                    const blob = dataURItoBlob(pdfData);
                    saveAs(blob, `comprovante_venda.pdf`);
                    showStatus("PDF gerado com sucesso!", "success");
                }
            } catch (error) {
                console.error("Erro ao gerar PDF:", error);
                showStatus("Erro ao gerar PDF: " + error.message, "error");
            }
        }
        
        // Função auxiliar para carregar logo
        async function loadLogo() {
            try {
                const response = await fetch('/public/docs/imagens/logo.png');
                const blob = await response.blob();
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.readAsDataURL(blob);
                });
            } catch {
                return null;
            }
        }
        
        // Função para converter data URI para Blob
        function dataURItoBlob(dataURI) {
            const byteString = atob(dataURI.split(',')[1]);
            const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            
            for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }
            
            return new Blob([ab], { type: mimeString });
        }
        
        // Função para salvar o Blob como arquivo
        function saveAs(blob, filename) {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        
        // Função para sair do sistema
        function sair() {
            if(confirm('Tem certeza que deseja sair do sistema?')) {
                firebase.auth().signOut().then(() => {
                    window.location.href = '/index.html';
                });
            }
        }
        
        // Verificação de autenticação ao carregar a página
        firebase.auth().onAuthStateChanged((user) => {
            if (!user) {
                window.location.href = '/index.html';
            } else {
                // Carrega os dados quando a página é aberta
                loadSalesData();
                
                // Define a data final como hoje e a inicial como 30 dias atrás
                const endDate = new Date();
                const startDate = new Date();
                startDate.setDate(startDate.getDate() - 30);
                
                document.getElementById('endDate').valueAsDate = endDate;
                document.getElementById('startDate').valueAsDate = startDate;
            }
        });