document.addEventListener('DOMContentLoaded', async function () {
    const processId = getUrlParameter('processId');
    if (processId) {
        await OpenDetailsProcess(processId);
    } else {
        window.close();
    }

    // Inicializar o DataTables com scroll e responsividade
    const table = $('#tableTaxasProcessos').DataTable({
        scrollY: 'calc(100vh - 300px)',  // Define a altura dinamicamente
        scrollCollapse: false,  // Permite que a rolagem seja usada somente quando necessário
        paging: false, // Desativar paginação
        searching: false, // Desativar barra de pesquisa
        info: false, // Desativar informações de "Mostrando X de Y"
        responsive: true // Habilitar a responsividade
    });

    
        

    // Atualizar o DataTables ao redimensionar a janela
    window.addEventListener('resize', function () {
        table.columns.adjust().draw(); // Ajusta as colunas ao tamanho da janela
    });

    document.querySelector('#loader2').classList.add('d-none');
});

function getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search); // Obtém os parâmetros da URL
    return urlParams.has(name) ? urlParams.get(name) : null; // Retorna o valor se existir, caso contrário null
}

async function OpenDetailsProcess(process_id) {
    const process = await makeRequest('/api/headcargo/repurchase-management/GetRepurchasesInfoProcess?process_id=' + process_id);
    console.log(process)
    populateTable(process.fees); // Passa o array para a função que irá preencher a tabela

    
    document.querySelector(`input[name="Cliente"]`).value = process.processValues[0].Cliente
    document.querySelector(`input[name="Exportador"]`).value = process.processValues[0].Exportador
    document.querySelector(`input[name="Importador"]`).value = process.processValues[0].Importador
    document.querySelector(`input[name="Vendedor"]`).value = process.processValues[0].Vendedor
    document.querySelector(`input[name="NumeroProcesso"]`).value = process.processValues[0].Numero_Processo
    document.querySelector(`title`).textContent = 'PROCESSO ' + process.processValues[0].Numero_Processo
    

    document.querySelector(`input[name="EstimatedProfit"]`).value = formatCurrency(process.processValues[0].Lucro_Estimado, 'BRL')
    document.querySelector(`input[name="EfetiveProfit"]`).value = formatCurrency(process.processValues[0].Lucro_Efetivo, 'BRL')
    document.querySelector(`input[name="OpeningProfit"]`).value = formatCurrency(process.processValues[0].Lucro_Abertura, 'BRL')

}

function populateTable(feesArray) {
    const tableBody = document.querySelector('.files-list'); // Seleciona o corpo da tabela
    tableBody.innerHTML = ''; // Limpa a tabela antes de preenchê-la

    // Agrupar taxas por ID para evitar duplicação
    const groupedFees = feesArray.reduce((acc, fee) => {
        const key = fee.IdTaxa_Logistica_Exibicao; // Usa o ID da taxa como chave
        if (!acc[key]) {
            acc[key] = {
                Taxa: fee.Taxa,
                MoedaPagamento: null,
                ValorPagamento: null,
                MoedaRecebimento: null,
                ValorRecebimento: null
            };
        }
        // Preencher informações de pagamento ou recebimento
        if (fee.Tipo === 'Pagamento') {
            acc[key].MoedaPagamento = fee.Sigla;
            acc[key].ValorPagamento = fee.Valor_Recebimento_Total;
        } else if (fee.Tipo === 'Recebimento') {
            acc[key].MoedaRecebimento = fee.Sigla;
            acc[key].ValorRecebimento = fee.Valor_Recebimento_Total;
        }
        return acc;
    }, {});

    // Iterar sobre os grupos para preencher a tabela
    Object.values(groupedFees).forEach(fee => {
        const row = document.createElement('tr'); // Cria uma nova linha

        // Cria as células da linha
        const taxaCell = document.createElement('td');
        taxaCell.textContent = fee.Taxa;

        const moedaPagamentoCell = document.createElement('td');
        moedaPagamentoCell.textContent = fee.MoedaPagamento || '-';

        const valorPagamentoCell = document.createElement('td');
        valorPagamentoCell.textContent = fee.ValorPagamento
            ? formatCurrency(fee.ValorPagamento, fee.MoedaPagamento)
            : '-';

        const moedaRecebimentoCell = document.createElement('td');
        moedaRecebimentoCell.textContent = fee.MoedaRecebimento || '-';

        const valorRecebimentoCell = document.createElement('td');
        valorRecebimentoCell.textContent = fee.ValorRecebimento
            ? formatCurrency(fee.ValorRecebimento, fee.MoedaRecebimento)
            : '-';

        // Adiciona as células à linha
        row.appendChild(taxaCell);
        row.appendChild(moedaPagamentoCell);
        row.appendChild(valorPagamentoCell);
        row.appendChild(moedaRecebimentoCell);
        row.appendChild(valorRecebimentoCell);

        // Adiciona a linha ao corpo da tabela
        tableBody.appendChild(row);
    });
}

// Função para formatar valores de acordo com a moeda
function formatCurrency(value, currency) {
    if (!currency) return value;

    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: currency
    }).format(value);
}
