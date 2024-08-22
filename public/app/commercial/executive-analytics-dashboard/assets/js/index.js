async function printOffers() {
    const totalOffers = await makeRequest(`/api/executive-analytics-dashboard/totalOffers`, 'POST', {day: 0, week: null, month: null});
    const countOffers = await makeRequest('/api/executive-analytics-dashboard/countOffers');
    const countProcesses = await makeRequest('/api/executive-analytics-dashboard/countProcesses');
    const totalProcesses = await makeRequest(`/api/executive-analytics-dashboard/totalProcesses`, 'POST', {day: 0, week: null, month: null});

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
                <a href="javascript:void(0);" class="border-0">
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
                <a href="javascript:void(0);" class="border-0">
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
                <a href="javascript:void(0);" class="border-0">
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
            if(!totalProcesses[index].Cliente){
                totalProcesses[index].Cliente = '[SEM CLIENTE LANÇADO]'
            }
            const clientName = await limitByCharacter(totalProcesses[index].Cliente, 27);

            printCompletedProcesses += `
                <a href="javascript:void(0);" class="border-0">
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

}

async function reprintApprovedOffers(day, week, month) {

    const totalOffers = await makeRequest(`/api/executive-analytics-dashboard/totalOffers`, 'POST', {day: day, week: week, month: month});
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
            if(!totalOffers[index].Cliente){
                totalOffers[index].Cliente = '[SEM CLIENTE LANÇADO]'
            }
            const clientName = await limitByCharacter(totalOffers[index].Cliente, 27);

            printApprovedOffers += `
                <a href="javascript:void(0);" class="border-0">
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

    const totalOffers = await makeRequest(`/api/executive-analytics-dashboard/totalOffers`, 'POST', {day: day, week: week, month: month});
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
            if(!totalOffers[index].Cliente){
                totalOffers[index].Cliente = '[SEM CLIENTE LANÇADO]'
            }
            const clientName = await limitByCharacter(totalOffers[index].Cliente, 27);

            printPendingOffers += `
                <a href="javascript:void(0);" class="border-0">
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

    const totalOffers = await makeRequest(`/api/executive-analytics-dashboard/totalOffers`, 'POST', {day: day, week: week, month: month});
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
            if(!totalOffers[index].Cliente){
                totalOffers[index].Cliente = '[SEM CLIENTE LANÇADO]'
            }
            const clientName = await limitByCharacter(totalOffers[index].Cliente, 27);

            printRejectedOffers += `
                <a href="javascript:void(0);" class="border-0">
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

    const totalProcesses = await makeRequest(`/api/executive-analytics-dashboard/totalProcesses`, 'POST', {day: day, week: week, month: month});
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
            if(!totalProcesses[index].Cliente){
                totalProcesses[index].Cliente = '[SEM CLIENTE LANÇADO]'
            }
            const clientName = await limitByCharacter(totalProcesses[index].Cliente, 27);

            printCompletedProcesses += `
                <a href="javascript:void(0);" class="border-0">
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

async function setDateFilter(range) {

    let today = new Date();
    let filterDate = new Date(today);
    filterDate.setUTCDate(today.getUTCDate() - range);

    const year = filterDate.getUTCFullYear();
    const month = String(filterDate.getUTCMonth() + 1).padStart(2, '0'); // meses começam de 0 a 11, então adicionamos 1
    const day = String(filterDate.getUTCDate()).padStart(2, '0');

    return `'${year}-${month}-${day}'`;
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

    document.querySelector('#loader2').classList.add('d-none')
})