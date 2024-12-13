const table = []


// Verifica informações no localStorage do usuario logado
// Esta função recupera e retorna os dados armazenados localmente relacionados ao login do Google.
async function getInfosLogin() {
    const StorageGoogleData = localStorage.getItem('StorageGoogle');
    const StorageGoogle = JSON.parse(StorageGoogleData);
    return StorageGoogle;   
};

// Função para exibir os detalhes abaixo dos descontos
async function showDiscountDetails(discountId) {
    try {

        // Função auxiliar para formatar moeda BRL
        function formatCurrency(value, currency) {
            return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value);
        }

        // Exibe a tabela de detalhes abaixo da linha do processo
        const tableRow = $(`#table_rh_payroll tr[discount-id="${discountId}"]`);
        const button = tableRow[0]
        const icon  = button.querySelector('i')

        if (tableRow.next().hasClass('details-row')) {
            tableRow.next().remove(); // Remove a linha se já estiver exibida
            icon.classList.remove("ri-eye-line"); // Alterna o ícone para "olho fechado"
            icon.classList.add("ri-eye-close-line");
        } else {
            const details = await makeRequest(`/api/rh-payroll/getDiscountById?id=${discountId}`);

        // Gera as linhas de detalhes
        let detailRows = details.map(fee => {
            return `
                <tr>
                    <td>${fee.name_discount}</td>
                    <td>${formatarData(fee.effective_date)}</td>
                    <td>${formatCurrency(fee.value,'BRL')}</td>
                    <td>
                        <div class="btn-list">
                            <a href="javascript:void(0);" class="btn btn-icon btn-wave waves-effect waves-light btn-sm btn-primary-light" title="Visualizar PDF">
                                <i class="ri-file-pdf-line"></i>
                            </a>
                            <a href="javascript:void(0);" class="btn btn-sm btn-icon btn-warning-light" title="Editar">
                                <i class="ri-pencil-line"></i>
                            </a>
                            <a href="javascript:void(0);" class="btn btn-icon btn-sm btn-purple-light" title="Deletar">
                                <i class="ri-delete-bin-line"></i>
                            </a>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
        
        // Adicionando uma linha extra com a observação
        detailRows += `
            <tr>
                <td colspan="4" style="text-align: left; color: gray; font-style: italic;">
                    Observação: Esta é uma observação geral sobre os dados apresentados.
                </td>
            </tr>
        `;
        


        // Define a estrutura da tabela de detalhes
        const detailTable = `
            <table class="table table-sm table-bordered mt-2">
                <thead>
                    <tr>
                        <th>Descrição</th>
                        <th>Data Vigência</th>
                        <th>Valor R$</th>
                        <th class="intro-btn-action">Ação</th>
                    </tr>
                </thead>
                <tbody>${detailRows}</tbody>
            </table>
        `;

        tableRow.after(`<tr class="details-row"><td colspan="10">${detailTable}</td></tr>`);
        icon.classList.remove("ri-eye-close-line"); // Alterna o ícone para "olho aberto"
        icon.classList.add("ri-eye-line");
        }
    } catch (error) {
        console.error('Erro ao buscar detalhes das taxas:', error);
    }
};

function formatarData(dataISO) {
    const data = new Date(dataISO);
    // Subtrai 3 horas da data
    data.setHours(data.getHours() - 3);
    
    return data.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};




document.addEventListener("DOMContentLoaded", async () => {

    


    document.querySelector('#loader2').classList.add('d-none');
});