const table = [];
let inputSelectProposal;
const alteredFees = []; // Array para armazenar as taxas alteradas

document.addEventListener('DOMContentLoaded', async function() {
    await getAllProcessByRef()
    createDatatable([]);
    
    // document.querySelector('[name=referenceProcess]').addEventListener('input', async function() {
    //     if (this.value.length > 6) {
    //         const data = await getfees(this.value);
    //         createDatatable(data);
    //     }
    // });

    // Adiciona o evento de clique para o botão Enviar
    document.querySelector('#sendButton').addEventListener('click', collectAndSendAlteredFees);
});

async function getfees(reference) {
    const response = await makeRequest('/api/headcargo/repurchase-management/getTaxasProcessByRef', 'POST', { reference });
    return response;
}

function createDatatable(data) {
    if (table['tableTaxasProcessos']) {
        table['tableTaxasProcessos'].destroy();
    }

    table['tableTaxasProcessos'] = $('#tableTaxasProcessos').DataTable({
        searching: false,
        paging: false,
        fixedHeader: true,
        info: false,
        scrollY: 'calc(100vh - 400px)',
        data: data,
        columns: [
            {
                data: 'idTaxa',
                render: function(data, type, row) {
                    return `<input type="checkbox" class="form-check-input checkbox-row" id="${data}">
                            <input type="checkbox" class="form-check-input checkbox-zero" id="zero-${data}" style="margin-left: 10px;" title="Zerar valores antigos">`;
                },
                orderable: false,
            },
            { data: 'Nome_Taxa' },
            {
                data: 'Valor_Pagamento_Total',
                render: function(data, type, row) {
                    if (data === null) return '';
                    return data.toLocaleString('pt-BR', { style: 'currency', currency: row.Moeda_Pgto });
                },
            },
            {
                data: 'Valor_Recebimento_Total',
                render: function(data, type, row) {
                    if (data === null) return '';
                    return data.toLocaleString('pt-BR', { style: 'currency', currency: row.Moeda_Receb });
                },
            }
        ],
        language: {
            searchPlaceholder: 'Pesquisar...',
            sSearch: '',
            url: '../../assets/libs/datatables/pt-br.json'
        }
    });

    $('#tableTaxasProcessos tbody').on('change', '.checkbox-row', function() {
        const checkbox = $(this);
        const row = checkbox.closest('tr');

        if (checkbox.is(':checked')) {
            showDetails(row);
        } else {
            hideDetails(row);
        }
    });

    $('#tableTaxasProcessos tbody').on('change', '.checkbox-zero', function() {
        const checkbox = $(this);
        const row = checkbox.closest('tr');
        const rowData = table['tableTaxasProcessos'].row(row).data();
    
        if (checkbox.is(':checked')) {
            // Zera os valores no objeto original
            rowData.Valor_Pagamento_Total = 0;
            rowData.Valor_Recebimento_Total = 0;
    
            // Atualiza o array de taxas alteradas
            const alteredIndex = alteredFees.findIndex(item => item.idTaxa === rowData.idTaxa);
            if (alteredIndex > -1) {
                alteredFees[alteredIndex].oldValorCompra = 0;
                alteredFees[alteredIndex].oldValorVenda = 0;
            } else {
                alteredFees.push({
                    idProcessos: rowData.idProcessos,
                    idTaxa: rowData.idTaxa,
                    Nome_Taxa: rowData.Nome_Taxa,
                    referenceProcess: document.querySelector('[name=referenceProcess]').value,
                    moedaCompra: rowData.Moeda_Pgto,
                    oldValorCompra: 0,
                    oldValorVenda: 0,
                    moedaVenda: rowData.Moeda_Receb,
                    newValorCompra: null,
                    newValorVenda: null,
                });
            }
        }
    });

  
    
}

function showDetails(row) {
    if (row.next('.details-row').length) return;

    const rowData = table['tableTaxasProcessos'].row(row).data();
    const detailsRow = document.createElement('tr');
    detailsRow.className = 'details-row';
    detailsRow.innerHTML = `
       <td></td>
       <td></td>
       <td><input type="text" class="form-control newValorCompra" value="${rowData.Valor_Pagamento_Total || ''}"></td>
       <td><input type="text" class="form-control newValorVenda" value="${rowData.Valor_Recebimento_Total || ''}"></td>
    `;

    row.after(detailsRow);

    // Adiciona eventos de mudança nos inputs de valor
    detailsRow.querySelector('.newValorCompra').addEventListener('input', () => trackChanges(rowData, detailsRow));
    detailsRow.querySelector('.newValorVenda').addEventListener('input', () => trackChanges(rowData, detailsRow));
}

function hideDetails(row) {
    row.next('.details-row').remove();
}

function trackChanges(rowData, detailsRow) {
    const newValorCompra = detailsRow.querySelector('.newValorCompra').value;
    const newValorVenda = detailsRow.querySelector('.newValorVenda').value;

    // Verifica se houve mudança nos valores
    if (newValorCompra !== rowData.Valor_Pagamento_Total || newValorVenda !== rowData.Valor_Recebimento_Total) {
        // Adiciona ou atualiza a taxa alterada na lista
        const alteredIndex = alteredFees.findIndex(item => item.idTaxa === rowData.idTaxa);

        if (alteredIndex > -1) {
            // Atualiza valores caso a taxa já esteja na lista
            alteredFees[alteredIndex].newValorCompra = parseFloat(newValorCompra);
            alteredFees[alteredIndex].newValorVenda = parseFloat(newValorVenda);
        } else {
            // Adiciona nova taxa alterada na lista
            alteredFees.push({
                idProcessos: rowData.idProcessos,
                idTaxa: rowData.idTaxa,
                Nome_Taxa: rowData.Nome_Taxa,
                referenceProcess: document.querySelector('[name=referenceProcess]').value,
                moedaCompra: rowData.Moeda_Pgto,
                oldValorCompra: rowData.Valor_Pagamento_Total,
                oldValorVenda: rowData.Valor_Recebimento_Total,
                moedaVenda: rowData.Moeda_Receb,
                newValorCompra: newValorCompra ? parseFloat(newValorCompra) : null,
                newValorVenda: newValorVenda ? parseFloat(newValorVenda) : null,
            });
        }
    }
}

async function collectAndSendAlteredFees() {
    const checkedRows = $('#tableTaxasProcessos tbody .checkbox-row:checked').closest('tr');

    if (alteredFees.length === 0 || checkedRows.length === 0) {
        alert("Nenhuma taxa foi alterada ou selecionada.");
        return;
    }

    // Atualiza os valores preenchidos antes de enviar
    checkedRows.each(function() {
        const row = $(this);
        const rowData = table['tableTaxasProcessos'].row(row).data();
        const detailsRow = row.next('.details-row');

        if (detailsRow.length) {
            const newValorCompra = detailsRow.find('.newValorCompra').val();
            const newValorVenda = detailsRow.find('.newValorVenda').val();

            const alteredIndex = alteredFees.findIndex(item => item.idTaxa === rowData.idTaxa);
            if (alteredIndex > -1) {
                alteredFees[alteredIndex].newValorCompra = newValorCompra ? parseFloat(newValorCompra) : null;
                alteredFees[alteredIndex].newValorVenda = newValorVenda ? parseFloat(newValorVenda) : null;
            }
        }
    });

    const selectedAlteredFees = alteredFees.filter(item =>
        Array.from(checkedRows).some(row => {
            const rowData = table['tableTaxasProcessos'].row(row).data();
            return item.idTaxa === rowData.idTaxa;
        })
    );

    const observation = document.querySelector('[name=observation]').value;
    const user = await getInfosLogin();
    const idCollaborator = parseInt(user.system_collaborator_id);

    try {
        const response = await makeRequest('/api/headcargo/repurchase-management/CreateRepurchase', 'POST', { alteredFees: selectedAlteredFees, observation, idCollaborator });
        console.log('Alterações enviadas:', response);
        alert("Taxas enviadas para aprovação com sucesso!");
        window.close();
    } catch (error) {
        console.error('Erro ao enviar taxas para aprovação:', error);
        alert("Erro ao enviar as taxas para aprovação.");
    }

    // Limpa a lista de taxas alteradas após o envio
    alteredFees.length = 0;
}


// Verifica informações no localStorage do usuario logado
async function getInfosLogin() {
    const StorageGoogleData = localStorage.getItem('StorageGoogle');
    const StorageGoogle = JSON.parse(StorageGoogleData);
    return StorageGoogle;
};


async function getAllProcessByRef(){
    
    // Destrua a instância anterior do Choices (se existir)
    if (inputSelectProposal) {
       inputSelectProposal.destroy();
   }


   inputSelectProposal = new Choices('select[name="referenceProcess"]', {
       removeItemButton: true,
       noChoicesText: 'Não há opções disponíveis'
   });


//    new Cleave(inputSelectProposal.input.element, {
//        // prefix: 'PF',
//        // delimiter: '/',
//        // blocks: [8, 2],
//        uppercase: true
//    });


   // Adicione um ouvinte de evento 'search'
   inputSelectProposal.passedElement.element.addEventListener('search', async function(event) {
       // event.detail.value contém o valor da pesquisa
       const searchTerm = event.detail.value || '';

       if(searchTerm.length > 5){
           const filteredOptions = await makeRequest(`/api/headcargo/repurchase-management/getAllHeadProcessByRef`, 'POST', {body:searchTerm})

       
           inputSelectProposal.setChoices(filteredOptions, 'value', 'label', true);
       }

      
   });


   document.querySelector('select[name="referenceProcess"]').addEventListener(
       'addItem',
       async function(event) {
       const data = await getfees(this.value);
       console.log(data)
        createDatatable(data);
       },
       false,
     );
}
