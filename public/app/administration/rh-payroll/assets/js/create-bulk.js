let sAllResponsible

// Função para buscar os Responsáveis
async function getAllUsers() {
    const listAllUsers = await makeRequest(`/api/users/listAllUsers`);

    const listUsers = listAllUsers.map(function (element) {
        return {
            value: `${element.id_colab}`,
            label: `${element.username + ' ' + element.familyName}`,
        };
    });

    if (sAllResponsible) {
        sAllResponsible.destroy();
    }

    sAllResponsible = new Choices('select[name="responsible"]', {
        choices: listUsers,
        shouldSort: false,
        removeItemButton: true,
        noChoicesText: 'Não há opções disponíveis',
    });
};

// Função para formatar o campo de Mês/Ano
function configurarFlatpickrMesAno() {
    const inputsMesAno = document.querySelectorAll('.flatpickr-mes-ano'); // Apenas campos de Mês/Ano
    inputsMesAno.forEach(input => {
        flatpickr(input, {
            plugins: [
                new monthSelectPlugin({
                    shorthand: true, // Exibe os meses abreviados
                    dateFormat: "m/Y", // Formato do mês e ano (MM/YYYY)
                    altFormat: "F Y", // Formato alternativo (exibe "Maio 2024")
                })
            ]
        });
    });
};

// Função para formatar os campos Datas
async function initializeDatePicker() {
    flatpickr(".flatpickr-input", {
        dateFormat: "d/m/Y", // Formato de data corrigido para DD/MM/AAAA
        defaultDate: new Date(), // Data padrão definida para hoje
    });
};

// Função para adicionar uma nova linha de descrição e valor
function adicionarDescricao() {
    const container = document.querySelector('#descricao-container');
    const novaLinha = document.createElement('div');
    novaLinha.classList.add('row', 'descricao-row');

    novaLinha.innerHTML = `
        <div class="col-xl-3 col-lg-4 col-md-4 col-sm-12">
            <label class="form-label">Desconto</label>
            <select class="form-control" name="descricao[]">
                <option value="">Selecione um desconto</option>
                <option value="odonto">Odonto</option>
                <option value="odonto_dependente">Odonto - Dependente</option>
                <option value="unimed">Unimed Coparticipação</option>
                <option value="unimed_dependente">Unimed - Dependente</option>
                <option value="farmais">Farmais</option>
                <option value="farma_sesi">FarmaSesi</option>
                <option value="farma_farma">Farma & Farma</option>
                <option value="outros">Outros</option>
            </select>
        </div> 
        <div class="col-xl-3 col-lg-4 col-md-4 col-sm-12">
            <label class="form-label">Valor R$</label>
            <input type="number" step="0.01" name="valor[]" class="form-control campo-valor" placeholder="Digite um valor">
        </div>                                
        <div class="col-xl-3 col-lg-4 col-md-4 col-sm-12">
            <label class="form-label">Anexar Documento</label>
            <input type="file" name="documento[]" class="form-control">
        </div>
        <div class="col-xl-3 col-lg-4 col-md-4 col-sm-12 d-flex align-items-end">
            <button type="button" class="btn btn-danger" onclick="removerDescricao(this)">Remover</button>
        </div>
    `;

    container.appendChild(novaLinha);

    // Reaplica os eventos nos novos inputs
    configurarFormatacaoValor();
};

// Função para formatar o valor para pt-br
function formatarValorBrasileiro(input, formatFinal = false) {
    let valor = input.value.replace(/\D/g, ''); // Remove todos os caracteres não numéricos
    if (!valor) return; // Evita erro se o campo estiver vazio

    let valorFormatado = (parseInt(valor, 10) / 100).toFixed(2); // Converte para decimal com 2 casas

    if (formatFinal) {
        // Aplica o formato com ponto e vírgula
        valorFormatado = valorFormatado.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }

    input.value = valorFormatado;
};

// Função para configurar os eventos nos inputs de valor
function configurarFormatacaoValor() {
    document.querySelectorAll('#descricao-container .campo-valor').forEach((input) => {
        if (!input.hasAttribute('data-listener')) {
            input.addEventListener('input', () => formatarValorBrasileiro(input));
            input.setAttribute('data-listener', 'true'); // Marca o input para evitar duplicar o evento
        }
    });
};

// Função para remover uma linha
function removerDescricao(botao) {
    const linha = botao.closest('.descricao-row');
    linha.remove();
};



// ESPERA A PAGINA SER COMPLETAMENTE CARREGADA
document.addEventListener("DOMContentLoaded", async () => {

    await getAllUsers();
    await initializeDatePicker();

    // Inicializa a configuração para os campos específicos
    configurarFlatpickrMesAno();

    // Inicializa a configuração para os inputs existentes
    configurarFormatacaoValor();

})



