async function printOffers() {
    const totalOffers = await makeRequest(`/api/executive-analytics-dashboard/totalOffers`, 'POST', { day: 0, week: null, month: null });
    const countOffers = await makeRequest('/api/executive-analytics-dashboard/countOffers');
    const countProcesses = await makeRequest('/api/executive-analytics-dashboard/countProcesses');
    const totalProcesses = await makeRequest(`/api/executive-analytics-dashboard/totalProcesses`, 'POST', { day: 0, week: null, month: null });

    const divApprovedOffers = document.getElementById('approvedOffers');
    let printApprovedOffers = '';
    const divApprovedOffersTitle = document.getElementById('approvedOffersTitle');
    let printApprovedOffersTitle = '';
    const divPendingOffersTitle = document.getElementById('pendingOffersTitle');
    let printPendingOffersTitle = '';
    const divRejectedOffers = document.getElementById('rejectedOffers');
    let printRejectedOffers = '';
    const divPendingOffers = document.getElementById('pendingOffers');
    let printPendingOffers = '';
    const divPendingProcessesTitle = document.getElementById('pendingProcessesTitle');
    let printPendingProcessesTitle = '';
    const divCompletedProcesses = document.getElementById('completedProcesses');
    let printCompletedProcesses = '';
    const divCompletedProcessesTitle = document.getElementById('completedProcessesTitle');
    let printCompletedProcessesTitle = '';
    let totalCompletedProcesses = 0;
    let totalPendingProcesses = 0;
    let totalApprovedOffers = 0;
    let totalPendingOffers = 0;

    for (let index = 0; index < countOffers.length; index++) {
        if (countOffers[index].Status == 'Aprovada') {
            totalApprovedOffers = countOffers[index].Quantidade;
        }
        if (countOffers[index].Status != 'Aprovada' && countOffers[index].Status != 'Reprovada') {
            totalPendingOffers += countOffers[index].Quantidade;
        }
    }

    for (let index = 0; index < countProcesses.length; index++) {
        if (countProcesses[index].Status == 'Auditado') {
            totalCompletedProcesses = countProcesses[index].Quantidade;
        }
        if (countProcesses[index].Status != 'Auditado' && countProcesses[index].Status != 'Cancelado') {
            totalPendingProcesses += countProcesses[index].Quantidade;
        }
    }

    for (let index = 0; index < totalOffers.length; index++) {

        let color = '';
        if (totalOffers[index].Modal == 'LCL') {
            color = 'var(--lcl-color)';
        } else if (totalOffers[index].Modal == 'FCL') {
            color = 'var(--fcl-color)'
        } else if (totalOffers[index].Modal == 'Aéreo') {
            color = 'var(--air-color)'
        }

        if (totalOffers[index].Situação == 'Aprovada') {


            const date = await formattedDateTime(totalOffers[index]['Data Abertura']);
            const clientName = await limitByCharacter(totalOffers[index].Cliente, 27);

            printApprovedOffers += `
                <a href="javascript:void(0);" class="border-0" id="${totalOffers[index].Referência}" data-bs-toggle="modal" data-bs-target="#exampleModalToggle2" onclick="printModalData.call(this)">
                    <div class="list-group-item border-0">
                        <div class="d-flex align-items-start"> <span class="tansaction-icon bg-primary" style="background-color: ${color}!important"> <svg xmlns="http://www.w3.org/2000/svg" class="svg-white" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"></path><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12zM10 9h8v2h-8zm0 3h4v2h-4zm0-6h8v2h-8z"></path></svg> </span>
                            <div class="w-100">
                                <div class="d-flex align-items-top justify-content-between">
                                    <div class="mt-0">
                                        <p class="mb-0 fw-semibold"><span class="me-3">${clientName}</span></p><span class="mb-0 fs-12 text-muted">${totalOffers[index].Vendedor}</span> </div>
                                    <div class="text-muted fs-12 text-center"></div>
                                    <span class="ms-auto">
                                        <span class="text-end text-danger d-block"> ${totalOffers[index].Referência} </span>
                                        <span class="text-end text-muted d-block fs-12">${date}</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </a>`
        }

        if (totalOffers[index].Situação == 'Reprovada') {

            const date = await formattedDateTime(totalOffers[index]['Data Abertura']);
            const clientName = await limitByCharacter(totalOffers[index].Cliente, 27);

            printRejectedOffers += `
                <a href="javascript:void(0);" class="border-0" id="${totalOffers[index].Referência}" data-bs-toggle="modal" data-bs-target="#exampleModalToggle2" onclick="printModalData.call(this)">
                    <div class="list-group-item border-0">
                        <div class="d-flex align-items-start"> <span class="tansaction-icon bg-primary" style="background-color: ${color}!important"> <svg xmlns="http://www.w3.org/2000/svg" class="svg-white" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"></path><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12zM10 9h8v2h-8zm0 3h4v2h-4zm0-6h8v2h-8z"></path></svg> </span>
                            <div class="w-100">
                                <div class="d-flex align-items-top justify-content-between">
                                    <div class="mt-0">
                                        <p class="mb-0 fw-semibold"><span class="me-3">${clientName}</span></p><span class="mb-0 fs-12 text-muted">${totalOffers[index].Vendedor}</span> </div>
                                    <div class="text-muted fs-12 text-center"></div>
                                    <span class="ms-auto">
                                        <span class="text-end text-danger d-block"> ${totalOffers[index].Referência} </span>
                                        <span class="text-end text-muted d-block fs-12">${date}</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </a>`
        }

        if (totalOffers[index].Situação == 'Aguardando Aprovação') {

            const date = await formattedDateTime(totalOffers[index]['Data Abertura']);
            const clientName = await limitByCharacter(totalOffers[index].Cliente, 27);

            printPendingOffers += `
                <a href="javascript:void(0);" class="border-0" id="${totalOffers[index].Referência}" data-bs-toggle="modal" data-bs-target="#exampleModalToggle2" onclick="printModalData.call(this)">
                    <div class="list-group-item border-0">
                        <div class="d-flex align-items-start"> <span class="tansaction-icon bg-primary" style="background-color: ${color}!important"> <svg xmlns="http://www.w3.org/2000/svg" class="svg-white" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"></path><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12zM10 9h8v2h-8zm0 3h4v2h-4zm0-6h8v2h-8z"></path></svg> </span>
                            <div class="w-100">
                                <div class="d-flex align-items-top justify-content-between">
                                    <div class="mt-0">
                                        <p class="mb-0 fw-semibold"><span class="me-3">${clientName}</span></p><span class="mb-0 fs-12 text-muted">${totalOffers[index].Vendedor}</span> </div>
                                    <div class="text-muted fs-12 text-center"></div>
                                    <span class="ms-auto">
                                        <span class="text-end text-danger d-block"> ${totalOffers[index].Referência} </span>
                                        <span class="text-end text-muted d-block fs-12">${date}</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </a>`
        }
    }

    for (let index = 0; index < totalProcesses.length; index++) {

        let color = '';
        if (totalProcesses[index].Modal == 'LCL') {
            color = 'var(--lcl-color)';
        } else if (totalProcesses[index].Modal == 'FCL') {
            color = 'var(--fcl-color)'
        } else if (totalProcesses[index].Modal == 'Aéreo') {
            color = 'var(--air-color)'
        }

        if (totalProcesses[index].Situação == 'Auditado' || totalProcesses[index].Situação == 'Finalizado') {

            const date = await formattedDateTime(totalProcesses[index]['Data Abertura']);
            if (!totalProcesses[index].Cliente) {
                totalProcesses[index].Cliente = '[SEM CLIENTE LANÇADO]'
            }
            const clientName = await limitByCharacter(totalProcesses[index].Cliente, 27);

            printCompletedProcesses += `
                <a href="javascript:void(0);" class="border-0" id="${totalProcesses[index].Referência}" data-bs-toggle="modal" data-bs-target="#exampleModalToggle2" onclick="printModalData.call(this)">
                    <div class="list-group-item border-0">
                        <div class="d-flex align-items-start"> <span class="tansaction-icon bg-primary" style="background-color: ${color}!important"> <svg xmlns="http://www.w3.org/2000/svg" class="svg-white" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"></path><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12zM10 9h8v2h-8zm0 3h4v2h-4zm0-6h8v2h-8z"></path></svg> </span>
                            <div class="w-100">
                                <div class="d-flex align-items-top justify-content-between">
                                    <div class="mt-0">
                                        <p class="mb-0 fw-semibold"><span class="me-3">${clientName}</span></p><span class="mb-0 fs-12 text-muted">${totalProcesses[index].Vendedor}</span> </div>
                                    <div class="text-muted fs-12 text-center"></div>
                                    <span class="ms-auto">
                                        <span class="text-end text-danger d-block"> ${totalProcesses[index].Referência} </span>
                                        <span class="text-end text-muted d-block fs-12">${date}</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </a>`

        }

    }

    printApprovedOffersTitle = `
        <p class="mb-2"> <span class="fs-16">Propostas Aprovadas</span> </p>
        <p class="mb-2 fs-12"> <span class="fs-25 fw-semibold lh-1 vertical-bottom mb-0">${totalApprovedOffers}</span> <span class="d-block fs-10 fw-semibold text-muted">ANO ATUAL</span> </p><a href="javascript:void(0);" class="fs-12 mb-0 text-primary">Ver completa<i class="ti ti-chevron-right ms-1"></i></a>`

    printPendingOffersTitle = `
        <p class="mb-2"> <span class="fs-16">Propostas Pendentes</span> </p>
        <p class="mb-2 fs-12"> <span class="fs-25 fw-semibold lh-1 vertical-bottom mb-0">${totalPendingOffers}</span> <span class="d-block fs-10 fw-semibold text-muted">ANO ATUAL</span> </p><a href="javascript:void(0);" class="fs-12 mb-0 text-primary">Ver completa<i class="ti ti-chevron-right ms-1"></i></a>`

    printPendingProcessesTitle = `
        <p class="mb-2"> <span class="fs-16">Processos em Andamento</span> </p>
        <p class="mb-2 fs-12"> <span class="fs-25 fw-semibold lh-1 vertical-bottom mb-0">${totalPendingProcesses}</span> <span class="d-block fs-10 fw-semibold text-muted">ANO ATUAL</span> </p><a href="javascript:void(0);" class="fs-12 mb-0 text-primary">Ver completa<i class="ti ti-chevron-right ms-1"></i></a>`

    printCompletedProcessesTitle = `
        <p class="mb-2"> <span class="fs-16">Processos Auditados</span> </p>
        <p class="mb-2 fs-12"> <span class="fs-25 fw-semibold lh-1 vertical-bottom mb-0">${totalCompletedProcesses}</span> <span class="d-block fs-10 fw-semibold text-muted">ANO ATUAL</span> </p><a href="javascript:void(0);" class="fs-12 mb-0 text-primary">Ver completa<i class="ti ti-chevron-right ms-1"></i></a>`

    divApprovedOffers.innerHTML = printApprovedOffers;
    divRejectedOffers.innerHTML = printRejectedOffers;
    divPendingOffers.innerHTML = printPendingOffers;
    divCompletedProcesses.innerHTML = printCompletedProcesses;
    divApprovedOffersTitle.innerHTML = printApprovedOffersTitle;
    divPendingOffersTitle.innerHTML = printPendingOffersTitle;
    divPendingProcessesTitle.innerHTML = printPendingProcessesTitle;
    divCompletedProcessesTitle.innerHTML = printCompletedProcessesTitle;

    introMain()

}

async function reprintCompleteReceipts(day, week, month) {

    const totalInvoices = await makeRequest(`/api/executive-analytics-dashboard/totalInvoices`, 'POST', { day: day, week: week, month: month });
    const divCompletedReceipts = document.getElementById('completedReceipts');
    let printCompletedReceipts = '';
    const divCompletedReceiptsTitle = document.getElementById('completedReceiptsTitle');
    let printCompletedReceiptsTitle = '';
    let totalCompletedReceipts = 0;

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
        
        if (totalInvoices[index].Natureza == 'Recebimento') {
            if (totalInvoices[index].Situacao_Fatura == 'Quitada') {

                const date = await formattedDateTime(totalInvoices[index].Data);
                const clientName = await limitByCharacter(totalInvoices[index].Pessoa, 27);

                printCompletedReceipts += `
                <a href="javascript:void(0);" class="border-0" id="${totalInvoices[index].Numero_Processo}" data-bs-toggle="modal" data-bs-target="#exampleModalToggle2" onclick="printModalData.call(this)">
                    <div class="list-group-item border-0">
                        <div class="d-flex align-items-start"> <span class="tansaction-icon bg-primary" style="background-color: ${color}!important"> <svg xmlns="http://www.w3.org/2000/svg" class="svg-white" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"></path><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12zM10 9h8v2h-8zm0 3h4v2h-4zm0-6h8v2h-8z"></path></svg> </span>
                            <div class="w-100">
                                <div class="d-flex align-items-top justify-content-between">
                                    <div class="mt-0">
                                        <p class="mb-0 fw-semibold"><span class="me-3">${clientName}</span></p><span class="mb-0 fs-12 text-muted">${totalInvoices[index].Numero_Processo}</span> </div>
                                    <div class="text-muted fs-12 text-center"></div>
                                    <span class="ms-auto">
                                        <span class="text-end text-danger d-block"> ${totalInvoices[index].Moeda} ${totalInvoices[index].Valor} </span>
                                        <span class="text-end text-muted d-block fs-12">${date}</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </a>`

                if (totalInvoices[index].Valor_Total < 1) {
                    totalCompletedReceipts = totalCompletedReceipts + totalInvoices[index].Valor;
                } else {
                    totalCompletedReceipts = totalCompletedReceipts + totalInvoices[index].Valor_Total;
                }
            }
        }
    }

    totalCompletedReceipts = totalCompletedReceipts.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    printCompletedReceiptsTitle = `
        <div class="me-3"> <span class="avatar avatar-rounded bg-secondary"> <i class="ti ti-arrow-big-up-line fs-16"></i> </span> </div>
        <div> <span class="d-block text-muted">Recebimento Total Baixado</span> <span class="fs-16 fw-semibold">BRL ${totalCompletedReceipts}</span> </div>`

    divCompletedReceiptsTitle.innerHTML = printCompletedReceiptsTitle;
    divCompletedReceipts.innerHTML = printCompletedReceipts;
}

async function reprintCompletePayments(day, week, month) {

    const totalInvoices = await makeRequest(`/api/executive-analytics-dashboard/totalInvoices`, 'POST', { day: day, week: week, month: month });
    const divCompletedPayments = document.getElementById('completedPayments');
    let printCompletedPayments = '';
    const divCompletedPaymentsTitle = document.getElementById('completedPaymentsTitle');
    let printCompletedPaymentsTitle = '';
    let totalCompletedPayments = 0;

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

        if (totalInvoices[index].Natureza == 'Pagamento') {
            if (totalInvoices[index].Situacao_Fatura == 'Quitada') {

                const date = await formattedDateTime(totalInvoices[index].Data);
                const clientName = await limitByCharacter(totalInvoices[index].Pessoa, 27);

                printCompletedPayments += `
                <a href="javascript:void(0);" class="border-0" id="${totalInvoices[index].Numero_Processo}" data-bs-toggle="modal" data-bs-target="#exampleModalToggle2" onclick="printModalData.call(this)">
                    <div class="list-group-item border-0">
                        <div class="d-flex align-items-start"> <span class="tansaction-icon bg-primary" style="background-color: ${color}!important"> <svg xmlns="http://www.w3.org/2000/svg" class="svg-white" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"></path><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12zM10 9h8v2h-8zm0 3h4v2h-4zm0-6h8v2h-8z"></path></svg> </span>
                            <div class="w-100">
                                <div class="d-flex align-items-top justify-content-between">
                                    <div class="mt-0">
                                        <p class="mb-0 fw-semibold"><span class="me-3">${clientName}</span></p><span class="mb-0 fs-12 text-muted">${totalInvoices[index].Numero_Processo}</span> </div>
                                    <div class="text-muted fs-12 text-center"></div>
                                    <span class="ms-auto">
                                        <span class="text-end text-danger d-block"> ${totalInvoices[index].Moeda} ${totalInvoices[index].Valor} </span>
                                        <span class="text-end text-muted d-block fs-12">${date}</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </a>`

                if (totalInvoices[index].Valor_Total < 1) {
                    totalCompletedPayments = totalCompletedPayments + totalInvoices[index].Valor;
                } else {
                    totalCompletedPayments = totalCompletedPayments + totalInvoices[index].Valor_Total;
                }
            }
        }
    }

    totalCompletedPayments = totalCompletedPayments.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    printCompletedPaymentsTitle = `
        <div class="me-3"> <span class="avatar avatar-rounded bg-secondary"> <i class="ti ti-arrow-big-up-line fs-16"></i> </span> </div>
        <div> <span class="d-block text-muted">Pagamento Total Baixado</span> <span class="fs-16 fw-semibold">BRL ${totalCompletedPayments}</span> </div>`

    divCompletedPaymentsTitle.innerHTML = printCompletedPaymentsTitle;
    divCompletedPayments.innerHTML = printCompletedPayments;
}

async function reprintPendingReceipts(day, week, month) {

    const totalInvoices = await makeRequest(`/api/executive-analytics-dashboard/totalInvoices`, 'POST', { day: day, week: week, month: month });
    const divPendingReceipts = document.getElementById('pendingReceipts');
    let printPendingReceipts = '';
    const divPendingReceiptsTitle = document.getElementById('pendingReceiptsTitle');
    let printPendingReceiptsTitle = '';
    let totalPendingReceipts = 0;

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

        if (totalInvoices[index].Natureza == 'Recebimento') {
            if (totalInvoices[index].Situacao_Fatura != 'Quitada') {

                const date = await formattedDateTime(totalInvoices[index].Data);
                const clientName = await limitByCharacter(totalInvoices[index].Pessoa, 27);

                printPendingReceipts += `
                <a href="javascript:void(0);" class="border-0" id="${totalInvoices[index].Numero_Processo}" data-bs-toggle="modal" data-bs-target="#exampleModalToggle2" onclick="printModalData.call(this)">
                    <div class="list-group-item border-0">
                        <div class="d-flex align-items-start"> <span class="tansaction-icon bg-primary" style="background-color: ${color}!important"> <svg xmlns="http://www.w3.org/2000/svg" class="svg-white" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"></path><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12zM10 9h8v2h-8zm0 3h4v2h-4zm0-6h8v2h-8z"></path></svg> </span>
                            <div class="w-100">
                                <div class="d-flex align-items-top justify-content-between">
                                    <div class="mt-0">
                                        <p class="mb-0 fw-semibold"><span class="me-3">${clientName}</span></p><span class="mb-0 fs-12 text-muted">${totalInvoices[index].Numero_Processo}</span> </div>
                                    <div class="text-muted fs-12 text-center"></div>
                                    <span class="ms-auto">
                                        <span class="text-end text-danger d-block"> ${totalInvoices[index].Moeda} ${totalInvoices[index].Valor} </span>
                                        <span class="text-end text-muted d-block fs-12">${date}</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </a>`

                if (totalInvoices[index].Valor_Total < 1) {
                    totalPendingReceipts = totalPendingReceipts + totalInvoices[index].Valor;
                } else {
                    totalPendingReceipts = totalPendingReceipts + totalInvoices[index].Valor_Total;
                }
            }
        }
    }

    totalPendingReceipts = totalPendingReceipts.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    printPendingReceiptsTitle = `
        <div class="me-3"> <span class="avatar avatar-rounded bg-secondary"> <i class="ti ti-arrow-big-up-line fs-16"></i> </span> </div>
        <div> <span class="d-block text-muted">Recebimento Total Pendente</span> <span class="fs-16 fw-semibold">BRL ${totalPendingReceipts}</span> </div>`

    divPendingReceiptsTitle.innerHTML = printPendingReceiptsTitle;
    divPendingReceipts.innerHTML = printPendingReceipts;
}

async function reprintPendingPayments(day, week, month) {

    const totalInvoices = await makeRequest(`/api/executive-analytics-dashboard/totalInvoices`, 'POST', { day: day, week: week, month: month });
    const divPendingPayments = document.getElementById('pendingPayments');
    let printPendingPayments = '';
    const divPendingPaymentsTitle = document.getElementById('pendingPaymentsTitle');
    let printPendingPaymentsTitle = '';
    let totalPendingPayments = 0;

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

        if (totalInvoices[index].Natureza == 'Pagamento') {
            if (totalInvoices[index].Situacao_Fatura != 'Quitada') {

                const date = await formattedDateTime(totalInvoices[index].Data);
                const clientName = await limitByCharacter(totalInvoices[index].Pessoa, 27);

                printPendingPayments += `
                <a href="javascript:void(0);" class="border-0" id="${totalInvoices[index].Numero_Processo}" data-bs-toggle="modal" data-bs-target="#exampleModalToggle2" onclick="printModalData.call(this)">
                    <div class="list-group-item border-0">
                        <div class="d-flex align-items-start"> <span class="tansaction-icon bg-primary" style="background-color: ${color}!important"> <svg xmlns="http://www.w3.org/2000/svg" class="svg-white" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"></path><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12zM10 9h8v2h-8zm0 3h4v2h-4zm0-6h8v2h-8z"></path></svg> </span>
                            <div class="w-100">
                                <div class="d-flex align-items-top justify-content-between">
                                    <div class="mt-0">
                                        <p class="mb-0 fw-semibold"><span class="me-3">${clientName}</span></p><span class="mb-0 fs-12 text-muted">${totalInvoices[index].Numero_Processo}</span> </div>
                                    <div class="text-muted fs-12 text-center"></div>
                                    <span class="ms-auto">
                                        <span class="text-end text-danger d-block"> ${totalInvoices[index].Moeda} ${totalInvoices[index].Valor} </span>
                                        <span class="text-end text-muted d-block fs-12">${date}</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </a>`

                if (totalInvoices[index].Valor_Total < 1) {
                    totalPendingPayments = totalPendingPayments + totalInvoices[index].Valor;
                } else {
                    totalPendingPayments = totalPendingPayments + totalInvoices[index].Valor_Total;
                }
            }
        }
    }

    totalPendingPayments = totalPendingPayments.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    printPendingPaymentsTitle = `
        <div class="me-3"> <span class="avatar avatar-rounded bg-secondary"> <i class="ti ti-arrow-big-up-line fs-16"></i> </span> </div>
        <div> <span class="d-block text-muted">Pagamento Total Pendente</span> <span class="fs-16 fw-semibold">BRL ${totalPendingPayments}</span> </div>`

    divPendingPaymentsTitle.innerHTML = printPendingPaymentsTitle;
    divPendingPayments.innerHTML = printPendingPayments;
}

async function reprintApprovedOffers(day, week, month) {

    const totalOffers = await makeRequest(`/api/executive-analytics-dashboard/totalOffers`, 'POST', { day: day, week: week, month: month });
    const divApprovedOffers = document.getElementById('approvedOffers');
    let printApprovedOffers = '';

    for (let index = 0; index < totalOffers.length; index++) {

        let color = '';
        if (totalOffers[index].Modal == 'LCL') {
            color = 'var(--lcl-color)';
        } else if (totalOffers[index].Modal == 'FCL') {
            color = 'var(--fcl-color)'
        } else if (totalOffers[index].Modal == 'Aéreo') {
            color = 'var(--air-color)'
        }
        if (totalOffers[index].Situação == 'Aprovada') {

            const date = await formattedDateTime(totalOffers[index]['Data Abertura']);
            if (!totalOffers[index].Cliente) {
                totalOffers[index].Cliente = '[SEM CLIENTE LANÇADO]'
            }
            const clientName = await limitByCharacter(totalOffers[index].Cliente, 27);

            printApprovedOffers += `
                <a href="javascript:void(0);" class="border-0" id="${totalOffers[index].Referência}" data-bs-toggle="modal" data-bs-target="#exampleModalToggle2" onclick="printModalData.call(this)">
                    <div class="list-group-item border-0">
                        <div class="d-flex align-items-start"> <span class="tansaction-icon bg-primary" style="background-color: ${color}!important"> <svg xmlns="http://www.w3.org/2000/svg" class="svg-white" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"></path><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12zM10 9h8v2h-8zm0 3h4v2h-4zm0-6h8v2h-8z"></path></svg> </span>
                            <div class="w-100">
                                <div class="d-flex align-items-top justify-content-between">
                                    <div class="mt-0">
                                        <p class="mb-0 fw-semibold"><span class="me-3">${clientName}</span></p><span class="mb-0 fs-12 text-muted">${totalOffers[index].Vendedor}</span> </div>
                                    <div class="text-muted fs-12 text-center"></div>
                                    <span class="ms-auto">
                                        <span class="text-end text-danger d-block"> ${totalOffers[index].Referência} </span>
                                        <span class="text-end text-muted d-block fs-12">${date}</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </a>`
        }
    }
    divApprovedOffers.innerHTML = printApprovedOffers;
}

async function reprintPendingOffers(day, week, month) {

    const totalOffers = await makeRequest(`/api/executive-analytics-dashboard/totalOffers`, 'POST', { day: day, week: week, month: month });
    const divPendingOffers = document.getElementById('pendingOffers');
    let printPendingOffers = '';

    for (let index = 0; index < totalOffers.length; index++) {

        let color = '';
        if (totalOffers[index].Modal == 'LCL') {
            color = 'var(--lcl-color)';
        } else if (totalOffers[index].Modal == 'FCL') {
            color = 'var(--fcl-color)'
        } else if (totalOffers[index].Modal == 'Aéreo') {
            color = 'var(--air-color)'
        }
        if (totalOffers[index].Situação == 'Aguardando Aprovação') {

            const date = await formattedDateTime(totalOffers[index]['Data Abertura']);
            if (!totalOffers[index].Cliente) {
                totalOffers[index].Cliente = '[SEM CLIENTE LANÇADO]'
            }
            const clientName = await limitByCharacter(totalOffers[index].Cliente, 27);

            printPendingOffers += `
                <a href="javascript:void(0);" class="border-0" id="${totalOffers[index].Referência}" data-bs-toggle="modal" data-bs-target="#exampleModalToggle2" onclick="printModalData.call(this)">
                    <div class="list-group-item border-0">
                        <div class="d-flex align-items-start"> <span class="tansaction-icon bg-primary" style="background-color: ${color}!important"> <svg xmlns="http://www.w3.org/2000/svg" class="svg-white" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"></path><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12zM10 9h8v2h-8zm0 3h4v2h-4zm0-6h8v2h-8z"></path></svg> </span>
                            <div class="w-100">
                                <div class="d-flex align-items-top justify-content-between">
                                    <div class="mt-0">
                                        <p class="mb-0 fw-semibold"><span class="me-3">${clientName}</span></p><span class="mb-0 fs-12 text-muted">${totalOffers[index].Vendedor}</span> </div>
                                    <div class="text-muted fs-12 text-center"></div>
                                    <span class="ms-auto">
                                        <span class="text-end text-danger d-block"> ${totalOffers[index].Referência} </span>
                                        <span class="text-end text-muted d-block fs-12">${date}</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </a>`
        }
    }
    divPendingOffers.innerHTML = printPendingOffers;
}

async function reprintRejectedOffers(day, week, month) {

    const totalOffers = await makeRequest(`/api/executive-analytics-dashboard/totalOffers`, 'POST', { day: day, week: week, month: month });
    const divRejectedOffers = document.getElementById('rejectedOffers');
    let printRejectedOffers = '';

    for (let index = 0; index < totalOffers.length; index++) {

        let color = '';
        if (totalOffers[index].Modal == 'LCL') {
            color = 'var(--lcl-color)';
        } else if (totalOffers[index].Modal == 'FCL') {
            color = 'var(--fcl-color)'
        } else if (totalOffers[index].Modal == 'Aéreo') {
            color = 'var(--air-color)'
        }
        if (totalOffers[index].Situação == 'Reprovada') {

            const date = await formattedDateTime(totalOffers[index]['Data Abertura']);
            if (!totalOffers[index].Cliente) {
                totalOffers[index].Cliente = '[SEM CLIENTE LANÇADO]'
            }
            const clientName = await limitByCharacter(totalOffers[index].Cliente, 27);

            printRejectedOffers += `
                <a href="javascript:void(0);" class="border-0" id="${totalOffers[index].Referência}" data-bs-toggle="modal" data-bs-target="#exampleModalToggle2" onclick="printModalData.call(this)">
                    <div class="list-group-item border-0">
                        <div class="d-flex align-items-start"> <span class="tansaction-icon bg-primary" style="background-color: ${color}!important"> <svg xmlns="http://www.w3.org/2000/svg" class="svg-white" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"></path><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12zM10 9h8v2h-8zm0 3h4v2h-4zm0-6h8v2h-8z"></path></svg> </span>
                            <div class="w-100">
                                <div class="d-flex align-items-top justify-content-between">
                                    <div class="mt-0">
                                        <p class="mb-0 fw-semibold"><span class="me-3">${clientName}</span></p><span class="mb-0 fs-12 text-muted">${totalOffers[index].Vendedor}</span> </div>
                                    <div class="text-muted fs-12 text-center"></div>
                                    <span class="ms-auto">
                                        <span class="text-end text-danger d-block"> ${totalOffers[index].Referência} </span>
                                        <span class="text-end text-muted d-block fs-12">${date}</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </a>`
        }
    }
    divRejectedOffers.innerHTML = printRejectedOffers;
}

async function reprintCompleteProcesses(day, week, month) {

    const totalProcesses = await makeRequest(`/api/executive-analytics-dashboard/totalProcesses`, 'POST', { day: day, week: week, month: month });
    const divCompletedProcesses = document.getElementById('completedProcesses');
    let printCompletedProcesses = '';

    for (let index = 0; index < totalProcesses.length; index++) {

        let color = '';
        if (totalProcesses[index].Modal == 'LCL') {
            color = 'var(--lcl-color)';
        } else if (totalProcesses[index].Modal == 'FCL') {
            color = 'var(--fcl-color)'
        } else if (totalProcesses[index].Modal == 'Aéreo') {
            color = 'var(--air-color)'
        }
        if (totalProcesses[index].Situação == 'Auditado' || totalProcesses[index].Situação == 'Finalizado') {

            const date = await formattedDateTime(totalProcesses[index]['Data Abertura']);
            if (!totalProcesses[index].Cliente) {
                totalProcesses[index].Cliente = '[SEM CLIENTE LANÇADO]'
            }
            const clientName = await limitByCharacter(totalProcesses[index].Cliente, 27);

            printCompletedProcesses += `
                <a href="javascript:void(0);" class="border-0" id="${totalProcesses[index].Referência}" data-bs-toggle="modal" data-bs-target="#exampleModalToggle2" onclick="printModalData.call(this)">
                    <div class="list-group-item border-0">
                        <div class="d-flex align-items-start"> <span class="tansaction-icon bg-primary" style="background-color: ${color}!important"> <svg xmlns="http://www.w3.org/2000/svg" class="svg-white" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"></path><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12zM10 9h8v2h-8zm0 3h4v2h-4zm0-6h8v2h-8z"></path></svg> </span>
                            <div class="w-100">
                                <div class="d-flex align-items-top justify-content-between">
                                    <div class="mt-0">
                                        <p class="mb-0 fw-semibold"><span class="me-3">${clientName}</span></p><span class="mb-0 fs-12 text-muted">${totalProcesses[index].Vendedor}</span> </div>
                                    <div class="text-muted fs-12 text-center"></div>
                                    <span class="ms-auto">
                                        <span class="text-end text-danger d-block"> ${totalProcesses[index].Referência} </span>
                                        <span class="text-end text-muted d-block fs-12">${date}</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </a>`

        }
    }
    divCompletedProcesses.innerHTML = printCompletedProcesses;

}

async function printValues() {
    totalInvoices = await makeRequest(`/api/executive-analytics-dashboard/totalInvoices`, 'POST', { day: 0, week: null, month: null });
    const divCompletedReceiptsTitle = document.getElementById('completedReceiptsTitle');
    let printCompletedReceiptsTitle = '';
    const divcompletedPaymentsTitle = document.getElementById('completedPaymentsTitle');
    let printcompletedPaymentsTitle = '';
    const divPendingReceiptsTitle = document.getElementById('pendingReceiptsTitle');
    let printPendingReceiptsTitle = '';
    const divPendingPaymentsTitle = document.getElementById('pendingPaymentsTitle');
    let printPendingPaymentsTitle = '';
    const divCompletedReceipts = document.getElementById('completedReceipts');
    let printCompletedReceipts = '';
    const divcompletedPayments = document.getElementById('completedPayments');
    let printCompletedPayments = '';
    const divPendingReceipts = document.getElementById('pendingReceipts');
    let printPendingReceipts = '';
    const divPendingPayments = document.getElementById('pendingPayments');
    let printPendingPayments = '';
    let totalCompletedReceipts = 0;
    let totalCompletedPayments = 0;
    let totalPendingReceipts = 0;
    let totalPendingPayments = 0;
    let dollarRate = 0;

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

        if (totalInvoices[index].Natureza == 'Recebimento') {
            if (totalInvoices[index].Situacao_Fatura == 'Quitada') {

                const date = await formattedDateTime(totalInvoices[index].Data);
                const clientName = await limitByCharacter(totalInvoices[index].Pessoa, 27);

                printCompletedReceipts += `
                <a href="javascript:void(0);" class="border-0" id="${totalInvoices[index].Numero_Processo}" data-bs-toggle="modal" data-bs-target="#exampleModalToggle2" onclick="printModalData.call(this)">
                    <div class="list-group-item border-0">
                        <div class="d-flex align-items-start"> <span class="tansaction-icon bg-primary" style="background-color: ${color}!important"> <svg xmlns="http://www.w3.org/2000/svg" class="svg-white" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"></path><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12zM10 9h8v2h-8zm0 3h4v2h-4zm0-6h8v2h-8z"></path></svg> </span>
                            <div class="w-100">
                                <div class="d-flex align-items-top justify-content-between">
                                    <div class="mt-0">
                                        <p class="mb-0 fw-semibold"><span class="me-3">${clientName}</span></p><span class="mb-0 fs-12 text-muted">${totalInvoices[index].Numero_Processo}</span> </div>
                                    <div class="text-muted fs-12 text-center"></div>
                                    <span class="ms-auto">
                                        <span class="text-end text-danger d-block"> ${totalInvoices[index].Moeda} ${totalInvoices[index].Valor} </span>
                                        <span class="text-end text-muted d-block fs-12">${date}</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </a>`

                if (totalInvoices[index].Moeda == 'USD') {
                    totalInvoices[index].Valor = totalInvoices[index].Valor * dollarRate;
                }
                totalCompletedReceipts = totalCompletedReceipts + totalInvoices[index].Valor;
            }
            else {

                const date = await formattedDateTime(totalInvoices[index].Data);
                const clientName = await limitByCharacter(totalInvoices[index].Pessoa, 27);

                printPendingReceipts += `
                <a href="javascript:void(0);" class="border-0" id="${totalInvoices[index].Numero_Processo}" data-bs-toggle="modal" data-bs-target="#exampleModalToggle2" onclick="printModalData.call(this)">
                    <div class="list-group-item border-0">
                        <div class="d-flex align-items-start"> <span class="tansaction-icon bg-primary" style="background-color: ${color}!important"> <svg xmlns="http://www.w3.org/2000/svg" class="svg-white" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"></path><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12zM10 9h8v2h-8zm0 3h4v2h-4zm0-6h8v2h-8z"></path></svg> </span>
                            <div class="w-100">
                                <div class="d-flex align-items-top justify-content-between">
                                    <div class="mt-0">
                                        <p class="mb-0 fw-semibold"><span class="me-3">${clientName}</span></p><span class="mb-0 fs-12 text-muted">${totalInvoices[index].Numero_Processo}</span> </div>
                                    <div class="text-muted fs-12 text-center"></div>
                                    <span class="ms-auto">
                                        <span class="text-end text-danger d-block"> ${totalInvoices[index].Moeda} ${totalInvoices[index].Valor} </span>
                                        <span class="text-end text-muted d-block fs-12">${date}</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </a>`

                if (totalInvoices[index].Moeda == 'USD') {
                    totalInvoices[index].Valor = totalInvoices[index].Valor * dollarRate;
                }
                totalPendingReceipts = totalPendingReceipts + totalInvoices[index].Valor;
            }
        }
        if (totalInvoices[index].Natureza == 'Pagamento') {
            if (totalInvoices[index].Situacao_Fatura == 'Quitada') {

                const date = await formattedDateTime(totalInvoices[index].Data);
                const clientName = await limitByCharacter(totalInvoices[index].Pessoa, 27);

                printCompletedPayments += `
                <a href="javascript:void(0);" class="border-0" id="${totalInvoices[index].Numero_Processo}" data-bs-toggle="modal" data-bs-target="#exampleModalToggle2" onclick="printModalData.call(this)">
                    <div class="list-group-item border-0">
                        <div class="d-flex align-items-start"> <span class="tansaction-icon bg-primary" style="background-color: ${color}!important"> <svg xmlns="http://www.w3.org/2000/svg" class="svg-white" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"></path><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12zM10 9h8v2h-8zm0 3h4v2h-4zm0-6h8v2h-8z"></path></svg> </span>
                            <div class="w-100">
                                <div class="d-flex align-items-top justify-content-between">
                                    <div class="mt-0">
                                        <p class="mb-0 fw-semibold"><span class="me-3">${clientName}</span></p><span class="mb-0 fs-12 text-muted">${totalInvoices[index].Numero_Processo}</span> </div>
                                    <div class="text-muted fs-12 text-center"></div>
                                    <span class="ms-auto">
                                        <span class="text-end text-danger d-block"> ${totalInvoices[index].Moeda} ${totalInvoices[index].Valor} </span>
                                        <span class="text-end text-muted d-block fs-12">${date}</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </a>`

                if (totalInvoices[index].Moeda == 'USD') {
                    totalInvoices[index].Valor = totalInvoices[index].Valor * dollarRate;
                }
                totalCompletedPayments = totalCompletedPayments + totalInvoices[index].Valor;
            } else {

                const date = await formattedDateTime(totalInvoices[index].Data);
                const clientName = await limitByCharacter(totalInvoices[index].Pessoa, 27);

                printPendingPayments += `
                <a href="javascript:void(0);" class="border-0" id="${totalInvoices[index].Numero_Processo}" data-bs-toggle="modal" data-bs-target="#exampleModalToggle2" onclick="printModalData.call(this)">
                    <div class="list-group-item border-0">
                        <div class="d-flex align-items-start"> <span class="tansaction-icon bg-primary" style="background-color: ${color}!important"> <svg xmlns="http://www.w3.org/2000/svg" class="svg-white" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M0 0h24v24H0V0z" fill="none"></path><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12zM10 9h8v2h-8zm0 3h4v2h-4zm0-6h8v2h-8z"></path></svg> </span>
                            <div class="w-100">
                                <div class="d-flex align-items-top justify-content-between">
                                    <div class="mt-0">
                                        <p class="mb-0 fw-semibold"><span class="me-3">${clientName}</span></p><span class="mb-0 fs-12 text-muted">${totalInvoices[index].Numero_Processo}</span> </div>
                                    <div class="text-muted fs-12 text-center"></div>
                                    <span class="ms-auto">
                                        <span class="text-end text-danger d-block"> ${totalInvoices[index].Moeda} ${totalInvoices[index].Valor} </span>
                                        <span class="text-end text-muted d-block fs-12">${date}</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </a>`

                if (totalInvoices[index].Moeda == 'USD') {
                    totalInvoices[index].Valor = totalInvoices[index].Valor * dollarRate;
                }
                totalPendingPayments = totalPendingPayments + totalInvoices[index].Valor;
            }
        }
    }

    totalCompletedReceipts = totalCompletedReceipts.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    totalCompletedPayments = totalCompletedPayments.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    totalPendingReceipts = totalPendingReceipts.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    totalPendingPayments = totalPendingPayments.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    printCompletedReceiptsTitle = `
        <div class="me-3"> <span class="avatar avatar-rounded bg-secondary"> <i class="ti ti-arrow-big-up-line fs-16"></i> </span> </div>
        <div> <span class="d-block text-muted">Recebimento Total Baixado</span> <span class="fs-16 fw-semibold">BRL ${totalCompletedReceipts}</span> </div>`

    printcompletedPaymentsTitle = `
        <div class="me-3"> <span class="avatar avatar-rounded bg-secondary"> <i class="ti ti-arrow-big-up-line fs-16"></i> </span> </div>
        <div> <span class="d-block text-muted">Pagamento Total Baixado</span> <span class="fs-16 fw-semibold">BRL ${totalCompletedPayments}</span> </div>`

    printPendingReceiptsTitle = `
        <div class="me-3"> <span class="avatar avatar-rounded bg-secondary"> <i class="ti ti-arrow-big-up-line fs-16"></i> </span> </div>
        <div> <span class="d-block text-muted">Recebimento Total Pendente</span> <span class="fs-16 fw-semibold">BRL ${totalPendingReceipts}</span> </div>`
    printPendingPaymentsTitle = `
        <div class="me-3"> <span class="avatar avatar-rounded bg-secondary"> <i class="ti ti-arrow-big-up-line fs-16"></i> </span> </div>
        <div> <span class="d-block text-muted">Pagamento Total Pendente</span> <span class="fs-16 fw-semibold">BRL ${totalPendingPayments}</span> </div>`

    divCompletedReceiptsTitle.innerHTML = printCompletedReceiptsTitle;
    divcompletedPaymentsTitle.innerHTML = printcompletedPaymentsTitle;
    divPendingReceiptsTitle.innerHTML = printPendingReceiptsTitle;
    divPendingPaymentsTitle.innerHTML = printPendingPaymentsTitle;
    divCompletedReceipts.innerHTML = printCompletedReceipts;
    divPendingReceipts.innerHTML = printPendingReceipts;
    divcompletedPayments.innerHTML = printCompletedPayments;
    divPendingPayments.innerHTML = printPendingPayments;
}

async function printModalData() {

    const id = this.id;
    const divProcessesModal = document.getElementById('detailsModal');
    let printProcessesModal = '';
    const divDetailsModalTitle = document.getElementById('detailsModalTitle');
    let printDetailsModalTitle = '';
    const divValuesModal = document.getElementById('valuesModal');
    let printValuesModal = '';
    var modalDetails = '';

    if (id.includes('PF')){
        modalDetails = await makeRequest(`/api/executive-analytics-dashboard/offerDetails?reference=${id}`);

        let totalPayment = modalDetails[0].Total_Pagamento;
        totalPayment = totalPayment.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
        let totalReceipt = modalDetails[0].Total_Recebimento;
        totalReceipt = totalReceipt.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
        let totalProfit = modalDetails[0].Lucro_Estimado;
        totalProfit = totalProfit.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});

        printValuesModal = `
        <div class="col-12 col-md-4 ms-auto mt-3 text-start">
            <div class="row">
                <label class="form-label mb-0 ms-0" style="font-size: 15px; color: var(--bs-danger)">Pagamento Estimado</label>
                <label class="mb-0 ms-0" style="color: var(--bs-danger)">${totalPayment}</label>
            </div>
        </div>
        <div class="col-12 col-md-4 ms-auto mt-3 text-start">
            <div class="row">
                <label class="form-label mb-0 ms-0" style="font-size: 15px; color: var(--bs-success)">Recebimento Estimado</label>
                <label class="mb-0 ms-0" style="color: var(--bs-success)">${totalReceipt}</label>
            </div>
        </div>
        <div class="col-12 col-md-4 ms-auto mt-3 text-start">
            <div class="row">
                <label class="form-label mb-0 ms-0" style="font-size: 15px; color: var(--bs-primary)">Lucro Estimado</label>
                <label class="mb-0 ms-0" style="color: var(--bs-primary)">${totalProfit}</label>
            </div>
        </div>`
        
        printDetailsModalTitle = `
            <label>Detalhes do Processo - ${modalDetails[0].Referência}</label>`

    } else {
        modalDetails = await makeRequest(`/api/executive-analytics-dashboard/processDetails?reference=${id}`);

        let totalPayment = modalDetails[0].Total_Pagamento;
        totalPayment = totalPayment.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
        let totalReceipt = modalDetails[0].Total_Recebimento;
        totalReceipt = totalReceipt.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
        let actualPayment = modalDetails[0].Total_Pago;
        actualPayment = actualPayment.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
        let actualReceipt = modalDetails[0].Total_Recebido;
        actualReceipt = actualReceipt.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
        let totalProfit = modalDetails[0].Lucro_Estimado;
        totalProfit = totalProfit.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
        let actualProfit = modalDetails[0].Lucro_Efetivo;
        actualProfit = actualProfit.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
        
        printDetailsModalTitle = `
            <label>Detalhes do Processo - ${modalDetails[0].Processo}</label>`

        printValuesModal = `
            <div class="col-12 col-md-6 ms-auto mt-3 text-start">
                <div class="row">
                    <label class="form-label mb-0 ms-0" style="font-size: 15px; color: var(--bs-danger)">Pagamento Estimado</label>
                    <label class="mb-0 ms-0" style="color: var(--bs-danger)">${totalPayment}</label>
                </div>
            </div>
            <div class="col-12 col-md-6 ms-auto mt-3 text-start">
                <div class="row">
                    <label class="form-label mb-0 ms-0" style="font-size: 15px; color: var(--bs-danger)">Pagamento Efetivo</label>
                    <label class="mb-0 ms-0" style="color: var(--bs-danger)">${actualPayment}</label>
                </div>
            </div>
            <div class="col-12 col-md-6 ms-auto mt-3 text-start">
                <div class="row">
                    <label class="form-label mb-0 ms-0" style="font-size: 15px; color: var(--bs-success)">Recebimento Estimado</label>
                    <label class="mb-0 ms-0" style="color: var(--bs-success)">${totalReceipt}</label>
                </div>
            </div>
            <div class="col-12 col-md-6 ms-auto mt-3 text-start">
                <div class="row">
                    <label class="form-label mb-0 ms-0" style="font-size: 15px; color: var(--bs-success)">Recebimento Efetivo</label>
                    <label class="mb-0 ms-0" style="color: var(--bs-success)">${actualReceipt}</label>
                </div>
            </div>
            <div class="col-12 col-md-6 ms-auto mt-3 text-start">
                <div class="row">
                    <label class="form-label mb-0 ms-0" style="font-size: 15px; color: var(--bs-primary)">Lucro Estimado</label>
                    <label class="mb-0 ms-0" style="color: var(--bs-primary)">${totalProfit}</label>
                </div>
            </div>
            <div class="col-12 col-md-6 ms-auto mt-3 text-start">
                <div class="row">
                    <label class="form-label mb-0 ms-0" style="font-size: 15px; color: var(--bs-primary)">Lucro Efetivo</label>
                    <label class="mb-0 ms-0" style="color: var(--bs-primary)">${actualProfit}</label>
                </div>
            </div>`
    }

    if (modalDetails[0].Cliente == null) {
        modalDetails[0].Cliente = '';
    }
    if (modalDetails[0].Consignee == null) {
        modalDetails[0].Consignee = '';
    }
    if (modalDetails[0].Shipper == null) {
        modalDetails[0].Shipper = '';
    }
    if (modalDetails[0].Armador == null) {
        modalDetails[0].Armador = '';
    }
    let clientName = await limitByCharacter(modalDetails[0].Cliente, 30);
    let consigneeName = await limitByCharacter(modalDetails[0].Consignee, 30);
    let shipperName = await limitByCharacter(modalDetails[0].Shipper, 30);
    let carrierName = await limitByCharacter(modalDetails[0].Armador, 30);

    printProcessesModal = `
        <div class="col-12 col-md-6 ms-auto mt-3 text-start" id="clientName">
            <div class="row">
                <label class="form-label mb-0 ms-0" style="font-size: 15px;">Cliente</label>
                <label class="mb-0 ms-0">${clientName}</label>
            </div>
        </div>
        <div class="col-12 col-md-6 ms-auto mt-3 text-start">
            <div class="row">
                <label class="form-label mb-0 ms-0" style="font-size: 15px;">Vendedor</label>
                <label class="mb-0 ms-0">${modalDetails[0].Vendedor}</label>
            </div>
        </div>
        <div class="col-12 col-md-6 ms-auto mt-3 text-start">
            <div class="row">
                <label class="form-label mb-0 ms-0" style="font-size: 15px;">Importador</label>
                <label class="mb-0 ms-0">${consigneeName}</label>
            </div>
        </div>
        <div class="col-12 col-md-6 ms-auto mt-3 text-start">
            <div class="row">
                <label class="form-label mb-0 ms-0" style="font-size: 15px;">Exportador</label>
                <label class="mb-0 ms-0">${shipperName}</label>
            </div>
        </div>
        <div class="col-12 col-md-6 ms-auto mt-3 text-start">
            <div class="row">
                <label class="form-label mb-0 ms-0" style="font-size: 15px;">Origem</label>
                <label class="mb-0 ms-0">${modalDetails[0].Origem}</label>
            </div>
        </div>
        <div class="col-12 col-md-6 ms-auto mt-3 text-start">
            <div class="row">
                <label class="form-label mb-0 ms-0" style="font-size: 15px;">Destino</label>
                <label class="mb-0 ms-0">${modalDetails[0].Destino}</label>
            </div>
        </div>
        <div class="col-12 col-md-6 ms-auto mt-3 text-start">
            <div class="row">
                <label class="form-label mb-0 ms-0" style="font-size: 15px;">Cia. Transporte</label>
                <label class="mb-0 ms-0">${carrierName}</label>
            </div>
        </div>
        <div class="col-12 col-md-6 ms-auto mt-3 text-start">
            <div class="row">
                <label class="form-label mb-0 ms-0" style="font-size: 15px;">Container</label>
                <label class="mb-0 ms-0">${modalDetails[0].Equipamentos}</label>
            </div>
        </div>`

    divDetailsModalTitle.innerHTML = printDetailsModalTitle
    divProcessesModal.innerHTML = printProcessesModal
    divValuesModal.innerHTML = printValuesModal
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

async function limitByWord(text, limit) {
    const words = text.split(" ");
    if (words.length > limit) {
        return words.slice(0, limit).join(" ");
    }
    return text;
}

document.addEventListener("DOMContentLoaded", async () => {

    await printOffers();
    await printValues();

    document.querySelector('#loader2').classList.add('d-none')
})