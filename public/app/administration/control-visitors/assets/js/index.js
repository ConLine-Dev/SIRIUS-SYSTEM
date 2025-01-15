// Array para armazenar os visitantes
let visitantes = [];

//Função para cadastrar novo desconto folha pagamento
function createNewVisitor() {
    // URL da página que será aberta
    const url = '/app/administration/control-visitors/create';

    // Alvo da janela (nova aba/janela)
    const target = '_blank';

    // Configurações da nova janela
    const features = 'width=1200,height=540,resizable=yes,scrollbars=yes,toolbar=no,menubar=no';

    // Abrir a nova janela com os parâmetros definidos
    window.open(url, target, features);
};

// Função para formatar data e hora
function formatDateTime(dateString) {
    return new Date(dateString).toLocaleString('pt-BR');
}

// Função para abrir janela de cadastro
function abrirJanelaCadastro() {
    const form = document.getElementById('visitanteForm');
    form.reset(); // Limpa o formulário
    const modal = new bootstrap.Modal(document.getElementById('cadastroModal'));
    modal.show();
}

// Função para criar novo visitante
function criarVisitante() {
    const form = document.getElementById('visitanteForm');
    const formData = new FormData(form);
    
    const visitante = {
        id: Date.now(),
        nome: formData.get('nome'),
        cpf: formData.get('cpf'),
        cnpj: formData.get('cnpj'),
        telefone: formData.get('telefone'),
        bl: formData.get('bl'),
        responsavel: formData.get('responsavel'),
        filial: formData.get('filial'),
        dataEntrada: formData.get('dataEntrada'),
        dataSaida: formData.get('dataSaida'),
        observacao: formData.get('observacao'),
        anexo: formData.get('anexo').name
    };

    visitantes.push(visitante);
    atualizarTabela();
    
    // Fecha o modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('cadastroModal'));
    modal.hide();
    form.reset();
}

// Função para atualizar a tabela
function atualizarTabela() {
    const tbody = document.getElementById('visitantesTable');
    tbody.innerHTML = '';

    visitantes.forEach(visitante => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${visitante.nome}</td>
            <td>${visitante.cpf || visitante.cnpj}</td>
            <td>${visitante.telefone}</td>
            <td>${visitante.bl}</td>
            <td>${visitante.responsavel}</td>
            <td>${visitante.filial}</td>
            <td>${formatDateTime(visitante.dataEntrada)}</td>
            <td>${formatDateTime(visitante.dataSaida)}</td>
            <td class="action-buttons">
                <button class="btn btn-sm btn-primary" onclick="gerarPDF(${visitante.id})">
                    <i class="bi bi-file-pdf"></i>
                </button>
                <button class="btn btn-sm btn-warning" onclick="editarVisitante(${visitante.id})">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deletarVisitante(${visitante.id})">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Função para gerar PDF
function gerarPDF(id) {
    const visitante = visitantes.find(v => v.id === id);
    if (!visitante) return;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.text('Registro de Visitante', 20, 20);
    doc.text(`Nome: ${visitante.nome}`, 20, 30);
    doc.text(`CPF/CNPJ: ${visitante.cpf || visitante.cnpj}`, 20, 40);
    doc.text(`Telefone: ${visitante.telefone}`, 20, 50);
    doc.text(`Número BL: ${visitante.bl}`, 20, 60);
    doc.text(`Responsável: ${visitante.responsavel}`, 20, 70);
    doc.text(`Filial: ${visitante.filial}`, 20, 80);
    doc.text(`Data de Entrada: ${formatDateTime(visitante.dataEntrada)}`, 20, 90);
    doc.text(`Data de Saída: ${formatDateTime(visitante.dataSaida)}`, 20, 100);
    doc.text(`Observação: ${visitante.observacao}`, 20, 110);

    doc.save(`visitante-${visitante.nome}.pdf`);
}

// Função para editar visitante
function editarVisitante(id) {
    const visitante = visitantes.find(v => v.id === id);
    if (!visitante) return;

    // Preenche o formulário com os dados do visitante
    const form = document.getElementById('visitanteForm');
    Object.keys(visitante).forEach(key => {
        const input = form.elements[key];
        if (input) input.value = visitante[key];
    });

    // Abre o modal de edição
    const modal = new bootstrap.Modal(document.getElementById('editModal'));
    modal.show();
}

// Função para deletar visitante
function deletarVisitante(id) {
    if (confirm('Tem certeza que deseja excluir este registro?')) {
        visitantes = visitantes.filter(v => v.id !== id);
        atualizarTabela();
    }
}

// Máscaras para CPF, CNPJ e telefone
document.addEventListener('DOMContentLoaded', function() {
    const cpfInput = document.querySelector('input[name="cpf"]');
    const cnpjInput = document.querySelector('input[name="cnpj"]');
    const telefoneInput = document.querySelector('input[name="telefone"]');

    cpfInput.addEventListener('input', function() {
        let value = this.value.replace(/\D/g, '');
        if (value.length <= 11) {
            value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
            this.value = value;
        }
    });

    cnpjInput.addEventListener('input', function() {
        let value = this.value.replace(/\D/g, '');
        if (value.length <= 14) {
            value = value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
            this.value = value;
        }
    });

    telefoneInput.addEventListener('input', function() {
        let value = this.value.replace(/\D/g, '');
        if (value.length <= 11) {
            value = value.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3');
            this.value = value;
        }
    });
});



















// //Função para cadastrar novo desconto folha pagamento
// function createNewVisitor() {
//     // URL da página que será aberta
//     const url = '/app/administration/control-visitors/create';

//     // Alvo da janela (nova aba/janela)
//     const target = '_blank';

//     // Configurações da nova janela
//     const features = 'width=1200,height=600,resizable=yes,scrollbars=yes,toolbar=no,menubar=no';

//     // Abrir a nova janela com os parâmetros definidos
//     window.open(url, target, features);
// };

// // Campo de data
// async function initializeDatePicker() {
//     flatpickr("#effectiveDate", {
//         dateFormat: "Y-m-d", // Formato enviado ao banco
//         altFormat: "d-m-Y", // Formato exibido ao usuário
//         altInput: true, // Exibe o formato alternativo no input
//         locale: "pt", // Define o idioma para português
//     });
    
// };

// // Esta função adiciona um evento de clique ao botão de salvar
// async function eventClick() {
//     // ==== Salvar ==== //
//     document.getElementById('btn-save').addEventListener('click', async function (){
//         const inputsValid = await getValuesInputs();
//         const selectsValid = await getValuesFromSelects();

//         if (inputsValid && selectsValid) {
//             await getDiscount();
//         }
        
//     })
//     // ==== /Salvar ==== //
// };

// document.addEventListener("DOMContentLoaded", async () => {

// })

