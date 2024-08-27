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
        
    
      

                const date = await formattedDateTime(totalInvoices[index].Data);
                const clientName = totalInvoices[index].Pessoa

        printlistInvoices += `
            <a href="javascript:void(0);" class="border-0">
                <div class="list-group-item border-0">
                   <div class="d-flex align-items-start"> <span class="tansaction-icon bg-primary" style="background-color: ${color}!important"> <svg xmlns="http://www.w3.org/2000/svg" class="svg-white" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"></path><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12zM10 9h8v2h-8zm0 3h4v2h-4zm0-6h8v2h-8z"></path></svg> </span>
                        <div class="w-100">
                            <div class="d-flex align-items-top justify-content-between">
                                <div class="mt-0">
                                    <p class="mb-0 fw-semibold"><span class="fs-13 me-3">${clientName}</span>
                                    </p><span class="mb-0 fs-13 text-muted">${totalInvoices[index].Numero_Processo}</span>
                                </div>
                                <div class="text-muted fs-20 text-center"></div> 
                                <span class="ms-auto"> 
                                    <span class="text-end text-danger d-block fs-15">${totalInvoices[index].Moeda} ${totalInvoices[index].Valor}</span> 
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