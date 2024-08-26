// Função que gera a tabela de faturas a partir dos dados recebidos de uma API.
async function invoicesTable() {
    // Fazer a requisição à API
    const totalInvoices = await makeRequest(`/api/financial-indicators/totalInvoices`, 'POST');
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
        
        if (totalInvoices[index].Natureza == '') {
            if (totalInvoices[index].Situacao_Fatura == '') {

                const date = await formattedDateTime(totalInvoices[index].Data);
                const clientName = await limitByCharacter(totalInvoices[index].Pessoa, 27);

        printlistInvoices += `
            <a href="javascript:void(0);" class="border-0">
                <div class="list-group-item border-0">
                    <div class="d-flex align-items-start"> <span class="tansaction-icon bg-primary" style="background-color: ${color}!important"> <svg xmlns="http://www.w3.org/2000/svg" class="svg-white" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M18,6h-2c0-2.21-1.79-4-4-4S8,3.79,8,6H6C4.9,6,4,6.9,4,8v12c0,1.1,0.9,2,2,2h12c1.1,0,2-0.9,2-2V8C20,6.9,19.1,6,18,6z M12,4c1.1,0,2,0.9,2,2h-4C10,4.9,10.9,4,12,4z M18,20H6V8h2v2c0,0.55,0.45,1,1,1s1-0.45,1-1V8h4v2c0,0.55,0.45,1,1,1s1-0.45,1-1V8 h2V20z"></path></g></svg> </span>
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
        }
    }

    divlistInvoices.innerHTML = printlistInvoices
    
}


document.addEventListener("DOMContentLoaded", async () => {

    await invoicesTable();

    document.querySelector('#loader2').classList.add('d-none')
})