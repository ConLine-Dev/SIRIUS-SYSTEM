// Função que gera a tabela de faturas a partir dos dados recebidos de uma API.
async function invoicesTable(situacao = 1) {
    // Fazer a requisição à API
    const totalInvoices = await makeRequest(`/api/financial-indicators/totalInvoices`, 'POST', {situacao: situacao});
    console.log(totalInvoices)
    const divlistInvoices = document.getElementById('listInvoices');
    
    let printlistInvoices = '';

    for (let index = 0; index < totalInvoices.length; index++) {

        let color = ''
        if (totalInvoices[index].Modal == 'LCL') {
            color = 'var(--lcl-color)';
        }
        if (totalInvoices[index].Modal == 'FCL') {
            color = 'var(--fcl-color)';
        }
        if (totalInvoices[index].Modal == 'Aéreo') {
            color = 'var(--air-color)';
        }
        if (totalInvoices[index].Moeda == 'USD') {
            formattedValue = totalInvoices[index].Valor.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
        } else if (totalInvoices[index].Moeda == 'BRL') {
            formattedValue = totalInvoices[index].Valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        }
        
    
      

        const date = await formattedDateTime(totalInvoices[index].Data);
        const clientName = totalInvoices[index].Pessoa

        printlistInvoices += `
            <a href="javascript:void(0);" class="border-0">
                <div class="list-group-item border-0">
                   <div class="d-flex align-items-start"> <span class="bg-primary" style="background-color: ${color}!important"></span>
                        <div class="w-100">
                            <div class="d-flex align-items-top justify-content-between">
                                <div class="mt-0">
                                    <p class="mb-0 fw-semibold"><span class="fs-13 me-3">${clientName}</span>
                                    </p><span class="mb-0 fs-13 text-muted">${totalInvoices[index].Numero_Processo}</span>
                                </div>
                                <div class="text-muted fs-20 text-center"></div> 
                                <span class="ms-auto"> 
                                    <span class="text-end text-danger d-block fs-15">${formattedValue}</span> 
                                    <span class="text-end text-muted d-block fs-13">${date}</span> 
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </a>`

      
    }

    divlistInvoices.innerHTML = printlistInvoices
    
}

async function formattedDateTime(time) {
    const date = new Date(time);

    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // meses começam de 0 a 11, então adicionamos 1
    const day = String(date.getUTCDate()).padStart(2, '0');

    return `${day}/${month}/${year}`;
}

async function limitByCharacter(text, limit) {
    if (text.length > limit) {
        return text.substring(0, limit) + "...";
    }
    return text;
}


document.addEventListener("DOMContentLoaded", async () => {

    // Inicia a lista das faturas com a situação em aberta
    await invoicesTable(1);


    // document.querySelector('#loader2').classList.add('d-none')
})