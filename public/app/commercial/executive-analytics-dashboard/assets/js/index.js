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

        let color = ''
        let icon = ''
        if (totalOffers[index].Modal == 'LCL') {
            color = 'var(--lcl-color)';
            icon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="rgba(255,255,255,1)"><path d="M9 4H14.4458C14.7905 4 15.111 4.17762 15.2938 4.47L18.75 10H23.1577C23.4339 10 23.6577 10.2239 23.6577 10.5C23.6577 10.5837 23.6367 10.666 23.5967 10.7394L19.6364 18H19C18.4694 18 17.9548 17.9311 17.4648 17.8018L20.63 12H3.4L4.44833 17.824C3.9845 17.939 3.49937 18 3 18H2.45455L1.21434 11.1789C1.11555 10.6355 1.47595 10.1149 2.01933 10.0161C2.07835 10.0054 2.13822 10 2.19821 10H3V5C3 4.44772 3.44772 4 4 4H5V1H9V4ZM5 10H16.3915L13.8915 6H5V10ZM3 20C4.53671 20 5.93849 19.4223 7 18.4722C8.06151 19.4223 9.46329 20 11 20C12.5367 20 13.9385 19.4223 15 18.4722C16.0615 19.4223 17.4633 20 19 20H21V22H19C17.5429 22 16.1767 21.6104 15 20.9297C13.8233 21.6104 12.4571 22 11 22C9.54285 22 8.17669 21.6104 7 20.9297C5.82331 21.6104 4.45715 22 3 22H1V20H3Z"></path></svg>';
        }
        if (totalOffers[index].Modal == 'FCL') {
            color = 'var(--fcl-color)';
            icon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="rgba(255,255,255,1)"><path d="M9 4H14.4458C14.7905 4 15.111 4.17762 15.2938 4.47L18.75 10H23.1577C23.4339 10 23.6577 10.2239 23.6577 10.5C23.6577 10.5837 23.6367 10.666 23.5967 10.7394L19.6364 18H19C18.4694 18 17.9548 17.9311 17.4648 17.8018L20.63 12H3.4L4.44833 17.824C3.9845 17.939 3.49937 18 3 18H2.45455L1.21434 11.1789C1.11555 10.6355 1.47595 10.1149 2.01933 10.0161C2.07835 10.0054 2.13822 10 2.19821 10H3V5C3 4.44772 3.44772 4 4 4H5V1H9V4ZM5 10H16.3915L13.8915 6H5V10ZM3 20C4.53671 20 5.93849 19.4223 7 18.4722C8.06151 19.4223 9.46329 20 11 20C12.5367 20 13.9385 19.4223 15 18.4722C16.0615 19.4223 17.4633 20 19 20H21V22H19C17.5429 22 16.1767 21.6104 15 20.9297C13.8233 21.6104 12.4571 22 11 22C9.54285 22 8.17669 21.6104 7 20.9297C5.82331 21.6104 4.45715 22 3 22H1V20H3Z"></path></svg>';
        }
        if (totalOffers[index].Modal == 'Aéreo') {
            color = 'var(--air-color)';
            icon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="rgba(255,255,255,1)"><path d="M14 8.94737L22 14V16L14 13.4737V18.8333L17 20.5V22L12.5 21L8 22V20.5L11 18.8333V13.4737L3 16V14L11 8.94737V3.5C11 2.67157 11.6716 2 12.5 2C13.3284 2 14 2.67157 14 3.5V8.94737Z"></path></svg>';
        }
        if (totalOffers[index].Modal == 'Rodoviário') {
            icon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="rgba(255,255,255,1)"><path d="M8.96456 18C8.72194 19.6961 7.26324 21 5.5 21C3.73676 21 2.27806 19.6961 2.03544 18H1V6C1 5.44772 1.44772 5 2 5H16C16.5523 5 17 5.44772 17 6V8H20L23 12.0557V18H20.9646C20.7219 19.6961 19.2632 21 17.5 21C15.7368 21 14.2781 19.6961 14.0354 18H8.96456ZM15 7H3V15.0505C3.63526 14.4022 4.52066 14 5.5 14C6.8962 14 8.10145 14.8175 8.66318 16H14.3368C14.5045 15.647 14.7296 15.3264 15 15.0505V7ZM17 13H21V12.715L18.9917 10H17V13ZM17.5 19C18.1531 19 18.7087 18.5826 18.9146 18C18.9699 17.8436 19 17.6753 19 17.5C19 16.6716 18.3284 16 17.5 16C16.6716 16 16 16.6716 16 17.5C16 17.6753 16.0301 17.8436 16.0854 18C16.2913 18.5826 16.8469 19 17.5 19ZM7 17.5C7 16.6716 6.32843 16 5.5 16C4.67157 16 4 16.6716 4 17.5C4 17.6753 4.03008 17.8436 4.08535 18C4.29127 18.5826 4.84689 19 5.5 19C6.15311 19 6.70873 18.5826 6.91465 18C6.96992 17.8436 7 17.6753 7 17.5Z"></path></svg>';
        }

        if (totalOffers[index].Situação == 'Aprovada') {


            const date = await formattedDateTime(totalOffers[index]['Data Abertura']);
            const clientName = await limitByCharacter(totalOffers[index].Cliente, 27);

            printApprovedOffers += `
                <a href="javascript:void(0);" class="border-0" id="${totalOffers[index].Referência}" data-bs-toggle="modal" data-bs-target="#exampleModalToggle2" onclick="printModalData.call(this)">
                    <div class="list-group-item border-0">
                        <div class="d-flex align-items-start"> <span class="tansaction-icon bg-primary" title="${totalOffers[index].Modal}" style="background-color: ${color}!important"> ${icon} </span>
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
                        <div class="d-flex align-items-start"> <span class="tansaction-icon bg-primary" title="${totalOffers[index].Modal}" style="background-color: ${color}!important"> ${icon} </span>
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
                        <div class="d-flex align-items-start"> <span class="tansaction-icon bg-primary" title="${totalOffers[index].Modal}" style="background-color: ${color}!important"> ${icon} </span>
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

        let color = ''
        let icon = ''
        if (totalProcesses[index].Modal == 'LCL') {
            color = 'var(--lcl-color)';
            icon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="rgba(255,255,255,1)"><path d="M9 4H14.4458C14.7905 4 15.111 4.17762 15.2938 4.47L18.75 10H23.1577C23.4339 10 23.6577 10.2239 23.6577 10.5C23.6577 10.5837 23.6367 10.666 23.5967 10.7394L19.6364 18H19C18.4694 18 17.9548 17.9311 17.4648 17.8018L20.63 12H3.4L4.44833 17.824C3.9845 17.939 3.49937 18 3 18H2.45455L1.21434 11.1789C1.11555 10.6355 1.47595 10.1149 2.01933 10.0161C2.07835 10.0054 2.13822 10 2.19821 10H3V5C3 4.44772 3.44772 4 4 4H5V1H9V4ZM5 10H16.3915L13.8915 6H5V10ZM3 20C4.53671 20 5.93849 19.4223 7 18.4722C8.06151 19.4223 9.46329 20 11 20C12.5367 20 13.9385 19.4223 15 18.4722C16.0615 19.4223 17.4633 20 19 20H21V22H19C17.5429 22 16.1767 21.6104 15 20.9297C13.8233 21.6104 12.4571 22 11 22C9.54285 22 8.17669 21.6104 7 20.9297C5.82331 21.6104 4.45715 22 3 22H1V20H3Z"></path></svg>';
        }
        if (totalProcesses[index].Modal == 'FCL') {
            color = 'var(--fcl-color)';
            icon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="rgba(255,255,255,1)"><path d="M9 4H14.4458C14.7905 4 15.111 4.17762 15.2938 4.47L18.75 10H23.1577C23.4339 10 23.6577 10.2239 23.6577 10.5C23.6577 10.5837 23.6367 10.666 23.5967 10.7394L19.6364 18H19C18.4694 18 17.9548 17.9311 17.4648 17.8018L20.63 12H3.4L4.44833 17.824C3.9845 17.939 3.49937 18 3 18H2.45455L1.21434 11.1789C1.11555 10.6355 1.47595 10.1149 2.01933 10.0161C2.07835 10.0054 2.13822 10 2.19821 10H3V5C3 4.44772 3.44772 4 4 4H5V1H9V4ZM5 10H16.3915L13.8915 6H5V10ZM3 20C4.53671 20 5.93849 19.4223 7 18.4722C8.06151 19.4223 9.46329 20 11 20C12.5367 20 13.9385 19.4223 15 18.4722C16.0615 19.4223 17.4633 20 19 20H21V22H19C17.5429 22 16.1767 21.6104 15 20.9297C13.8233 21.6104 12.4571 22 11 22C9.54285 22 8.17669 21.6104 7 20.9297C5.82331 21.6104 4.45715 22 3 22H1V20H3Z"></path></svg>';
        }
        if (totalProcesses[index].Modal == 'Aéreo') {
            color = 'var(--air-color)';
            icon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="rgba(255,255,255,1)"><path d="M14 8.94737L22 14V16L14 13.4737V18.8333L17 20.5V22L12.5 21L8 22V20.5L11 18.8333V13.4737L3 16V14L11 8.94737V3.5C11 2.67157 11.6716 2 12.5 2C13.3284 2 14 2.67157 14 3.5V8.94737Z"></path></svg>';
        }
        if (totalProcesses[index].Modal == 'Rodoviário') {
            icon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="rgba(255,255,255,1)"><path d="M8.96456 18C8.72194 19.6961 7.26324 21 5.5 21C3.73676 21 2.27806 19.6961 2.03544 18H1V6C1 5.44772 1.44772 5 2 5H16C16.5523 5 17 5.44772 17 6V8H20L23 12.0557V18H20.9646C20.7219 19.6961 19.2632 21 17.5 21C15.7368 21 14.2781 19.6961 14.0354 18H8.96456ZM15 7H3V15.0505C3.63526 14.4022 4.52066 14 5.5 14C6.8962 14 8.10145 14.8175 8.66318 16H14.3368C14.5045 15.647 14.7296 15.3264 15 15.0505V7ZM17 13H21V12.715L18.9917 10H17V13ZM17.5 19C18.1531 19 18.7087 18.5826 18.9146 18C18.9699 17.8436 19 17.6753 19 17.5C19 16.6716 18.3284 16 17.5 16C16.6716 16 16 16.6716 16 17.5C16 17.6753 16.0301 17.8436 16.0854 18C16.2913 18.5826 16.8469 19 17.5 19ZM7 17.5C7 16.6716 6.32843 16 5.5 16C4.67157 16 4 16.6716 4 17.5C4 17.6753 4.03008 17.8436 4.08535 18C4.29127 18.5826 4.84689 19 5.5 19C6.15311 19 6.70873 18.5826 6.91465 18C6.96992 17.8436 7 17.6753 7 17.5Z"></path></svg>';
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
                        <div class="d-flex align-items-start"> <span class="tansaction-icon bg-primary" title="${totalProcesses[index].Modal}" style="background-color: ${color}!important"> ${icon} </span>
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
        <p class="mb-2 fs-12"> <span class="fs-25 fw-semibold lh-1 vertical-bottom mb-0">${totalApprovedOffers}</span> <span class="d-block fs-10 fw-semibold text-muted">ANO ATUAL</span> </p><a href="javascript:void(0);" class="fs-12 mb-0 text-primary" onclick="redirectToTable('Offers', 'Aprovada')">Ver completa<i class="ti ti-chevron-right ms-1"></i></a>`

    printPendingOffersTitle = `
        <p class="mb-2"> <span class="fs-16">Propostas Pendentes</span> </p>
        <p class="mb-2 fs-12"> <span class="fs-25 fw-semibold lh-1 vertical-bottom mb-0">${totalPendingOffers}</span> <span class="d-block fs-10 fw-semibold text-muted">ANO ATUAL</span> </p><a href="javascript:void(0);" class="fs-12 mb-0 text-primary" onclick="redirectToTable('Offers', 'Outros')">Ver completa<i class="ti ti-chevron-right ms-1"></i></a>`

    printPendingProcessesTitle = `
        <p class="mb-2"> <span class="fs-16">Processos em Andamento</span> </p>
        <p class="mb-2 fs-12"> <span class="fs-25 fw-semibold lh-1 vertical-bottom mb-0">${totalPendingProcesses}</span> <span class="d-block fs-10 fw-semibold text-muted">ANO ATUAL</span> </p><a href="javascript:void(0);" class="fs-12 mb-0 text-primary" onclick="redirectToTable('Processes', 'Outros')">Ver completa<i class="ti ti-chevron-right ms-1"></i></a>`

    printCompletedProcessesTitle = `
        <p class="mb-2"> <span class="fs-16">Processos Auditados</span> </p>
        <p class="mb-2 fs-12"> <span class="fs-25 fw-semibold lh-1 vertical-bottom mb-0">${totalCompletedProcesses}</span> <span class="d-block fs-10 fw-semibold text-muted">ANO ATUAL</span> </p><a href="javascript:void(0);" class="fs-12 mb-0 text-primary" onclick="redirectToTable('Processes', 'Auditado')">Ver completa<i class="ti ti-chevron-right ms-1"></i></a>`

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
    let formattedValue = 0;

    for (let index = 0; index < totalInvoices.length; index++) {

        let color = ''
        let icon = ''
        if (totalInvoices[index].Modal == 'LCL') {
            color = 'var(--lcl-color)';
            icon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="rgba(255,255,255,1)"><path d="M9 4H14.4458C14.7905 4 15.111 4.17762 15.2938 4.47L18.75 10H23.1577C23.4339 10 23.6577 10.2239 23.6577 10.5C23.6577 10.5837 23.6367 10.666 23.5967 10.7394L19.6364 18H19C18.4694 18 17.9548 17.9311 17.4648 17.8018L20.63 12H3.4L4.44833 17.824C3.9845 17.939 3.49937 18 3 18H2.45455L1.21434 11.1789C1.11555 10.6355 1.47595 10.1149 2.01933 10.0161C2.07835 10.0054 2.13822 10 2.19821 10H3V5C3 4.44772 3.44772 4 4 4H5V1H9V4ZM5 10H16.3915L13.8915 6H5V10ZM3 20C4.53671 20 5.93849 19.4223 7 18.4722C8.06151 19.4223 9.46329 20 11 20C12.5367 20 13.9385 19.4223 15 18.4722C16.0615 19.4223 17.4633 20 19 20H21V22H19C17.5429 22 16.1767 21.6104 15 20.9297C13.8233 21.6104 12.4571 22 11 22C9.54285 22 8.17669 21.6104 7 20.9297C5.82331 21.6104 4.45715 22 3 22H1V20H3Z"></path></svg>';
        }
        if (totalInvoices[index].Modal == 'FCL') {
            color = 'var(--fcl-color)';
            icon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="rgba(255,255,255,1)"><path d="M9 4H14.4458C14.7905 4 15.111 4.17762 15.2938 4.47L18.75 10H23.1577C23.4339 10 23.6577 10.2239 23.6577 10.5C23.6577 10.5837 23.6367 10.666 23.5967 10.7394L19.6364 18H19C18.4694 18 17.9548 17.9311 17.4648 17.8018L20.63 12H3.4L4.44833 17.824C3.9845 17.939 3.49937 18 3 18H2.45455L1.21434 11.1789C1.11555 10.6355 1.47595 10.1149 2.01933 10.0161C2.07835 10.0054 2.13822 10 2.19821 10H3V5C3 4.44772 3.44772 4 4 4H5V1H9V4ZM5 10H16.3915L13.8915 6H5V10ZM3 20C4.53671 20 5.93849 19.4223 7 18.4722C8.06151 19.4223 9.46329 20 11 20C12.5367 20 13.9385 19.4223 15 18.4722C16.0615 19.4223 17.4633 20 19 20H21V22H19C17.5429 22 16.1767 21.6104 15 20.9297C13.8233 21.6104 12.4571 22 11 22C9.54285 22 8.17669 21.6104 7 20.9297C5.82331 21.6104 4.45715 22 3 22H1V20H3Z"></path></svg>';
        }
        if (totalInvoices[index].Modal == 'Aéreo') {
            color = 'var(--air-color)';
            icon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="rgba(255,255,255,1)"><path d="M14 8.94737L22 14V16L14 13.4737V18.8333L17 20.5V22L12.5 21L8 22V20.5L11 18.8333V13.4737L3 16V14L11 8.94737V3.5C11 2.67157 11.6716 2 12.5 2C13.3284 2 14 2.67157 14 3.5V8.94737Z"></path></svg>';
        }
        if (totalInvoices[index].Modal == 'Rodoviário') {
            icon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="rgba(255,255,255,1)"><path d="M8.96456 18C8.72194 19.6961 7.26324 21 5.5 21C3.73676 21 2.27806 19.6961 2.03544 18H1V6C1 5.44772 1.44772 5 2 5H16C16.5523 5 17 5.44772 17 6V8H20L23 12.0557V18H20.9646C20.7219 19.6961 19.2632 21 17.5 21C15.7368 21 14.2781 19.6961 14.0354 18H8.96456ZM15 7H3V15.0505C3.63526 14.4022 4.52066 14 5.5 14C6.8962 14 8.10145 14.8175 8.66318 16H14.3368C14.5045 15.647 14.7296 15.3264 15 15.0505V7ZM17 13H21V12.715L18.9917 10H17V13ZM17.5 19C18.1531 19 18.7087 18.5826 18.9146 18C18.9699 17.8436 19 17.6753 19 17.5C19 16.6716 18.3284 16 17.5 16C16.6716 16 16 16.6716 16 17.5C16 17.6753 16.0301 17.8436 16.0854 18C16.2913 18.5826 16.8469 19 17.5 19ZM7 17.5C7 16.6716 6.32843 16 5.5 16C4.67157 16 4 16.6716 4 17.5C4 17.6753 4.03008 17.8436 4.08535 18C4.29127 18.5826 4.84689 19 5.5 19C6.15311 19 6.70873 18.5826 6.91465 18C6.96992 17.8436 7 17.6753 7 17.5Z"></path></svg>';
        }

        if (totalInvoices[index].Moeda == 'USD') {
            formattedValue = totalInvoices[index].Valor.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
        } else if (totalInvoices[index].Moeda == 'BRL') {
            formattedValue = totalInvoices[index].Valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        }
        
        if (totalInvoices[index].Natureza == 'Recebimento') {
            if (totalInvoices[index].Situacao_Fatura == 'Quitada') {

                const date = await formattedDateTime(totalInvoices[index].Data);
                const clientName = await limitByCharacter(totalInvoices[index].Pessoa, 27);

                printCompletedReceipts += `
                <a href="javascript:void(0);" class="border-0" id="${totalInvoices[index].Numero_Processo}" data-bs-toggle="modal" data-bs-target="#exampleModalToggle2" onclick="printModalData.call(this)">
                    <div class="list-group-item border-0">
                        <div class="d-flex align-items-start"> <span class="tansaction-icon bg-primary" title="${totalInvoices[index].Modal}" style="background-color: ${color}!important"> ${icon} </span>
                            <div class="w-100">
                                <div class="d-flex align-items-top justify-content-between">
                                    <div class="mt-0">
                                        <p class="mb-0 fw-semibold"><span class="me-3">${clientName}</span>
                                        </p><span class="mb-0 fs-12 text-muted">${totalInvoices[index].Numero_Processo}</span>
                                    </div>
                                    <div class="text-muted fs-12 text-center"></div>
                                    <span class="ms-auto">
                                        <span class="text-end text-danger d-block"> ${formattedValue} </span>
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

    totalCompletedReceipts = totalCompletedReceipts.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    printCompletedReceiptsTitle = `
        <div class="me-3"> <span class="avatar avatar-rounded bg-secondary"> <i class="ti ti-arrow-big-up-line fs-16"></i> </span> </div>
        <div> <span class="d-block text-muted">Recebimento Total Baixado</span> <span class="fs-16 fw-semibold">${totalCompletedReceipts}</span> </div>`

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
    let formattedValue = 0;

    for (let index = 0; index < totalInvoices.length; index++) {

        let color = ''
        let icon = ''
        if (totalInvoices[index].Modal == 'LCL') {
            color = 'var(--lcl-color)';
            icon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="rgba(255,255,255,1)"><path d="M9 4H14.4458C14.7905 4 15.111 4.17762 15.2938 4.47L18.75 10H23.1577C23.4339 10 23.6577 10.2239 23.6577 10.5C23.6577 10.5837 23.6367 10.666 23.5967 10.7394L19.6364 18H19C18.4694 18 17.9548 17.9311 17.4648 17.8018L20.63 12H3.4L4.44833 17.824C3.9845 17.939 3.49937 18 3 18H2.45455L1.21434 11.1789C1.11555 10.6355 1.47595 10.1149 2.01933 10.0161C2.07835 10.0054 2.13822 10 2.19821 10H3V5C3 4.44772 3.44772 4 4 4H5V1H9V4ZM5 10H16.3915L13.8915 6H5V10ZM3 20C4.53671 20 5.93849 19.4223 7 18.4722C8.06151 19.4223 9.46329 20 11 20C12.5367 20 13.9385 19.4223 15 18.4722C16.0615 19.4223 17.4633 20 19 20H21V22H19C17.5429 22 16.1767 21.6104 15 20.9297C13.8233 21.6104 12.4571 22 11 22C9.54285 22 8.17669 21.6104 7 20.9297C5.82331 21.6104 4.45715 22 3 22H1V20H3Z"></path></svg>';
        }
        if (totalInvoices[index].Modal == 'FCL') {
            color = 'var(--fcl-color)';
            icon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="rgba(255,255,255,1)"><path d="M9 4H14.4458C14.7905 4 15.111 4.17762 15.2938 4.47L18.75 10H23.1577C23.4339 10 23.6577 10.2239 23.6577 10.5C23.6577 10.5837 23.6367 10.666 23.5967 10.7394L19.6364 18H19C18.4694 18 17.9548 17.9311 17.4648 17.8018L20.63 12H3.4L4.44833 17.824C3.9845 17.939 3.49937 18 3 18H2.45455L1.21434 11.1789C1.11555 10.6355 1.47595 10.1149 2.01933 10.0161C2.07835 10.0054 2.13822 10 2.19821 10H3V5C3 4.44772 3.44772 4 4 4H5V1H9V4ZM5 10H16.3915L13.8915 6H5V10ZM3 20C4.53671 20 5.93849 19.4223 7 18.4722C8.06151 19.4223 9.46329 20 11 20C12.5367 20 13.9385 19.4223 15 18.4722C16.0615 19.4223 17.4633 20 19 20H21V22H19C17.5429 22 16.1767 21.6104 15 20.9297C13.8233 21.6104 12.4571 22 11 22C9.54285 22 8.17669 21.6104 7 20.9297C5.82331 21.6104 4.45715 22 3 22H1V20H3Z"></path></svg>';
        }
        if (totalInvoices[index].Modal == 'Aéreo') {
            color = 'var(--air-color)';
            icon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="rgba(255,255,255,1)"><path d="M14 8.94737L22 14V16L14 13.4737V18.8333L17 20.5V22L12.5 21L8 22V20.5L11 18.8333V13.4737L3 16V14L11 8.94737V3.5C11 2.67157 11.6716 2 12.5 2C13.3284 2 14 2.67157 14 3.5V8.94737Z"></path></svg>';
        }
        if (totalInvoices[index].Modal == 'Rodoviário') {
            icon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="rgba(255,255,255,1)"><path d="M8.96456 18C8.72194 19.6961 7.26324 21 5.5 21C3.73676 21 2.27806 19.6961 2.03544 18H1V6C1 5.44772 1.44772 5 2 5H16C16.5523 5 17 5.44772 17 6V8H20L23 12.0557V18H20.9646C20.7219 19.6961 19.2632 21 17.5 21C15.7368 21 14.2781 19.6961 14.0354 18H8.96456ZM15 7H3V15.0505C3.63526 14.4022 4.52066 14 5.5 14C6.8962 14 8.10145 14.8175 8.66318 16H14.3368C14.5045 15.647 14.7296 15.3264 15 15.0505V7ZM17 13H21V12.715L18.9917 10H17V13ZM17.5 19C18.1531 19 18.7087 18.5826 18.9146 18C18.9699 17.8436 19 17.6753 19 17.5C19 16.6716 18.3284 16 17.5 16C16.6716 16 16 16.6716 16 17.5C16 17.6753 16.0301 17.8436 16.0854 18C16.2913 18.5826 16.8469 19 17.5 19ZM7 17.5C7 16.6716 6.32843 16 5.5 16C4.67157 16 4 16.6716 4 17.5C4 17.6753 4.03008 17.8436 4.08535 18C4.29127 18.5826 4.84689 19 5.5 19C6.15311 19 6.70873 18.5826 6.91465 18C6.96992 17.8436 7 17.6753 7 17.5Z"></path></svg>';
        }

        if (totalInvoices[index].Moeda == 'USD') {
            formattedValue = totalInvoices[index].Valor.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
        } else if (totalInvoices[index].Moeda == 'BRL') {
            formattedValue = totalInvoices[index].Valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        }
        
        if (totalInvoices[index].Natureza == 'Pagamento') {
            if (totalInvoices[index].Situacao_Fatura == 'Quitada') {

                const date = await formattedDateTime(totalInvoices[index].Data);
                const clientName = await limitByCharacter(totalInvoices[index].Pessoa, 27);

                printCompletedPayments += `
                <a href="javascript:void(0);" class="border-0" id="${totalInvoices[index].Numero_Processo}" data-bs-toggle="modal" data-bs-target="#exampleModalToggle2" onclick="printModalData.call(this)">
                    <div class="list-group-item border-0">
                        <div class="d-flex align-items-start"> <span class="tansaction-icon bg-primary" title="${totalInvoices[index].Modal}" style="background-color: ${color}!important"> ${icon} </span>
                            <div class="w-100">
                                <div class="d-flex align-items-top justify-content-between">
                                    <div class="mt-0">
                                        <p class="mb-0 fw-semibold"><span class="me-3">${clientName}</span></p><span class="mb-0 fs-12 text-muted">${totalInvoices[index].Numero_Processo}</span> </div>
                                    <div class="text-muted fs-12 text-center"></div>
                                    <span class="ms-auto">
                                        <span class="text-end text-danger d-block"> ${formattedValue} </span>
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

    totalCompletedPayments = totalCompletedPayments.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    printCompletedPaymentsTitle = `
        <div class="me-3"> <span class="avatar avatar-rounded bg-secondary"> <i class="ti ti-arrow-big-up-line fs-16"></i> </span> </div>
        <div> <span class="d-block text-muted">Pagamento Total Baixado</span> <span class="fs-16 fw-semibold">${totalCompletedPayments}</span> </div>`

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
    let formattedValue = 0;

    for (let index = 0; index < totalInvoices.length; index++) {

        let color = ''
        let icon = ''
        if (totalInvoices[index].Modal == 'LCL') {
            color = 'var(--lcl-color)';
            icon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="rgba(255,255,255,1)"><path d="M9 4H14.4458C14.7905 4 15.111 4.17762 15.2938 4.47L18.75 10H23.1577C23.4339 10 23.6577 10.2239 23.6577 10.5C23.6577 10.5837 23.6367 10.666 23.5967 10.7394L19.6364 18H19C18.4694 18 17.9548 17.9311 17.4648 17.8018L20.63 12H3.4L4.44833 17.824C3.9845 17.939 3.49937 18 3 18H2.45455L1.21434 11.1789C1.11555 10.6355 1.47595 10.1149 2.01933 10.0161C2.07835 10.0054 2.13822 10 2.19821 10H3V5C3 4.44772 3.44772 4 4 4H5V1H9V4ZM5 10H16.3915L13.8915 6H5V10ZM3 20C4.53671 20 5.93849 19.4223 7 18.4722C8.06151 19.4223 9.46329 20 11 20C12.5367 20 13.9385 19.4223 15 18.4722C16.0615 19.4223 17.4633 20 19 20H21V22H19C17.5429 22 16.1767 21.6104 15 20.9297C13.8233 21.6104 12.4571 22 11 22C9.54285 22 8.17669 21.6104 7 20.9297C5.82331 21.6104 4.45715 22 3 22H1V20H3Z"></path></svg>';
        }
        if (totalInvoices[index].Modal == 'FCL') {
            color = 'var(--fcl-color)';
            icon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="rgba(255,255,255,1)"><path d="M9 4H14.4458C14.7905 4 15.111 4.17762 15.2938 4.47L18.75 10H23.1577C23.4339 10 23.6577 10.2239 23.6577 10.5C23.6577 10.5837 23.6367 10.666 23.5967 10.7394L19.6364 18H19C18.4694 18 17.9548 17.9311 17.4648 17.8018L20.63 12H3.4L4.44833 17.824C3.9845 17.939 3.49937 18 3 18H2.45455L1.21434 11.1789C1.11555 10.6355 1.47595 10.1149 2.01933 10.0161C2.07835 10.0054 2.13822 10 2.19821 10H3V5C3 4.44772 3.44772 4 4 4H5V1H9V4ZM5 10H16.3915L13.8915 6H5V10ZM3 20C4.53671 20 5.93849 19.4223 7 18.4722C8.06151 19.4223 9.46329 20 11 20C12.5367 20 13.9385 19.4223 15 18.4722C16.0615 19.4223 17.4633 20 19 20H21V22H19C17.5429 22 16.1767 21.6104 15 20.9297C13.8233 21.6104 12.4571 22 11 22C9.54285 22 8.17669 21.6104 7 20.9297C5.82331 21.6104 4.45715 22 3 22H1V20H3Z"></path></svg>';
        }
        if (totalInvoices[index].Modal == 'Aéreo') {
            color = 'var(--air-color)';
            icon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="rgba(255,255,255,1)"><path d="M14 8.94737L22 14V16L14 13.4737V18.8333L17 20.5V22L12.5 21L8 22V20.5L11 18.8333V13.4737L3 16V14L11 8.94737V3.5C11 2.67157 11.6716 2 12.5 2C13.3284 2 14 2.67157 14 3.5V8.94737Z"></path></svg>';
        }
        if (totalInvoices[index].Modal == 'Rodoviário') {
            icon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="rgba(255,255,255,1)"><path d="M8.96456 18C8.72194 19.6961 7.26324 21 5.5 21C3.73676 21 2.27806 19.6961 2.03544 18H1V6C1 5.44772 1.44772 5 2 5H16C16.5523 5 17 5.44772 17 6V8H20L23 12.0557V18H20.9646C20.7219 19.6961 19.2632 21 17.5 21C15.7368 21 14.2781 19.6961 14.0354 18H8.96456ZM15 7H3V15.0505C3.63526 14.4022 4.52066 14 5.5 14C6.8962 14 8.10145 14.8175 8.66318 16H14.3368C14.5045 15.647 14.7296 15.3264 15 15.0505V7ZM17 13H21V12.715L18.9917 10H17V13ZM17.5 19C18.1531 19 18.7087 18.5826 18.9146 18C18.9699 17.8436 19 17.6753 19 17.5C19 16.6716 18.3284 16 17.5 16C16.6716 16 16 16.6716 16 17.5C16 17.6753 16.0301 17.8436 16.0854 18C16.2913 18.5826 16.8469 19 17.5 19ZM7 17.5C7 16.6716 6.32843 16 5.5 16C4.67157 16 4 16.6716 4 17.5C4 17.6753 4.03008 17.8436 4.08535 18C4.29127 18.5826 4.84689 19 5.5 19C6.15311 19 6.70873 18.5826 6.91465 18C6.96992 17.8436 7 17.6753 7 17.5Z"></path></svg>';
        }

        if (totalInvoices[index].Moeda == 'USD') {
            formattedValue = totalInvoices[index].Valor.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
        } else if (totalInvoices[index].Moeda == 'BRL') {
            formattedValue = totalInvoices[index].Valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        }
        
        if (totalInvoices[index].Natureza == 'Recebimento') {
            if (totalInvoices[index].Situacao_Fatura != 'Quitada') {

                const date = await formattedDateTime(totalInvoices[index].Data);
                const clientName = await limitByCharacter(totalInvoices[index].Pessoa, 27);

                printPendingReceipts += `
                <a href="javascript:void(0);" class="border-0" id="${totalInvoices[index].Numero_Processo}" data-bs-toggle="modal" data-bs-target="#exampleModalToggle2" onclick="printModalData.call(this)">
                    <div class="list-group-item border-0">
                        <div class="d-flex align-items-start"> <span class="tansaction-icon bg-primary" title="${totalInvoices[index].Modal}" style="background-color: ${color}!important"> ${icon} </span>
                            <div class="w-100">
                                <div class="d-flex align-items-top justify-content-between">
                                    <div class="mt-0">
                                        <p class="mb-0 fw-semibold"><span class="me-3">${clientName}</span></p><span class="mb-0 fs-12 text-muted">${totalInvoices[index].Numero_Processo}</span> </div>
                                    <div class="text-muted fs-12 text-center"></div>
                                    <span class="ms-auto">
                                        <span class="text-end text-danger d-block"> ${formattedValue} </span>
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

    totalPendingReceipts = totalPendingReceipts.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    printPendingReceiptsTitle = `
        <div class="me-3"> <span class="avatar avatar-rounded bg-secondary"> <i class="ti ti-arrow-big-up-line fs-16"></i> </span> </div>
        <div> <span class="d-block text-muted">Recebimento Total Pendente</span> <span class="fs-16 fw-semibold">${totalPendingReceipts}</span> </div>`

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
    let formattedValue = 0;

    for (let index = 0; index < totalInvoices.length; index++) {

        let color = ''
        let icon = ''
        if (totalInvoices[index].Modal == 'LCL') {
            color = 'var(--lcl-color)';
            icon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="rgba(255,255,255,1)"><path d="M9 4H14.4458C14.7905 4 15.111 4.17762 15.2938 4.47L18.75 10H23.1577C23.4339 10 23.6577 10.2239 23.6577 10.5C23.6577 10.5837 23.6367 10.666 23.5967 10.7394L19.6364 18H19C18.4694 18 17.9548 17.9311 17.4648 17.8018L20.63 12H3.4L4.44833 17.824C3.9845 17.939 3.49937 18 3 18H2.45455L1.21434 11.1789C1.11555 10.6355 1.47595 10.1149 2.01933 10.0161C2.07835 10.0054 2.13822 10 2.19821 10H3V5C3 4.44772 3.44772 4 4 4H5V1H9V4ZM5 10H16.3915L13.8915 6H5V10ZM3 20C4.53671 20 5.93849 19.4223 7 18.4722C8.06151 19.4223 9.46329 20 11 20C12.5367 20 13.9385 19.4223 15 18.4722C16.0615 19.4223 17.4633 20 19 20H21V22H19C17.5429 22 16.1767 21.6104 15 20.9297C13.8233 21.6104 12.4571 22 11 22C9.54285 22 8.17669 21.6104 7 20.9297C5.82331 21.6104 4.45715 22 3 22H1V20H3Z"></path></svg>';
        }
        if (totalInvoices[index].Modal == 'FCL') {
            color = 'var(--fcl-color)';
            icon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="rgba(255,255,255,1)"><path d="M9 4H14.4458C14.7905 4 15.111 4.17762 15.2938 4.47L18.75 10H23.1577C23.4339 10 23.6577 10.2239 23.6577 10.5C23.6577 10.5837 23.6367 10.666 23.5967 10.7394L19.6364 18H19C18.4694 18 17.9548 17.9311 17.4648 17.8018L20.63 12H3.4L4.44833 17.824C3.9845 17.939 3.49937 18 3 18H2.45455L1.21434 11.1789C1.11555 10.6355 1.47595 10.1149 2.01933 10.0161C2.07835 10.0054 2.13822 10 2.19821 10H3V5C3 4.44772 3.44772 4 4 4H5V1H9V4ZM5 10H16.3915L13.8915 6H5V10ZM3 20C4.53671 20 5.93849 19.4223 7 18.4722C8.06151 19.4223 9.46329 20 11 20C12.5367 20 13.9385 19.4223 15 18.4722C16.0615 19.4223 17.4633 20 19 20H21V22H19C17.5429 22 16.1767 21.6104 15 20.9297C13.8233 21.6104 12.4571 22 11 22C9.54285 22 8.17669 21.6104 7 20.9297C5.82331 21.6104 4.45715 22 3 22H1V20H3Z"></path></svg>';
        }
        if (totalInvoices[index].Modal == 'Aéreo') {
            color = 'var(--air-color)';
            icon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="rgba(255,255,255,1)"><path d="M14 8.94737L22 14V16L14 13.4737V18.8333L17 20.5V22L12.5 21L8 22V20.5L11 18.8333V13.4737L3 16V14L11 8.94737V3.5C11 2.67157 11.6716 2 12.5 2C13.3284 2 14 2.67157 14 3.5V8.94737Z"></path></svg>';
        }
        if (totalInvoices[index].Modal == 'Rodoviário') {
            icon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="rgba(255,255,255,1)"><path d="M8.96456 18C8.72194 19.6961 7.26324 21 5.5 21C3.73676 21 2.27806 19.6961 2.03544 18H1V6C1 5.44772 1.44772 5 2 5H16C16.5523 5 17 5.44772 17 6V8H20L23 12.0557V18H20.9646C20.7219 19.6961 19.2632 21 17.5 21C15.7368 21 14.2781 19.6961 14.0354 18H8.96456ZM15 7H3V15.0505C3.63526 14.4022 4.52066 14 5.5 14C6.8962 14 8.10145 14.8175 8.66318 16H14.3368C14.5045 15.647 14.7296 15.3264 15 15.0505V7ZM17 13H21V12.715L18.9917 10H17V13ZM17.5 19C18.1531 19 18.7087 18.5826 18.9146 18C18.9699 17.8436 19 17.6753 19 17.5C19 16.6716 18.3284 16 17.5 16C16.6716 16 16 16.6716 16 17.5C16 17.6753 16.0301 17.8436 16.0854 18C16.2913 18.5826 16.8469 19 17.5 19ZM7 17.5C7 16.6716 6.32843 16 5.5 16C4.67157 16 4 16.6716 4 17.5C4 17.6753 4.03008 17.8436 4.08535 18C4.29127 18.5826 4.84689 19 5.5 19C6.15311 19 6.70873 18.5826 6.91465 18C6.96992 17.8436 7 17.6753 7 17.5Z"></path></svg>';
        }

        if (totalInvoices[index].Moeda == 'USD') {
            formattedValue = totalInvoices[index].Valor.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
        } else if (totalInvoices[index].Moeda == 'BRL') {
            formattedValue = totalInvoices[index].Valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        }
        
        if (totalInvoices[index].Natureza == 'Pagamento') {
            if (totalInvoices[index].Situacao_Fatura != 'Quitada') {

                const date = await formattedDateTime(totalInvoices[index].Data);
                const clientName = await limitByCharacter(totalInvoices[index].Pessoa, 27);

                printPendingPayments += `
                <a href="javascript:void(0);" class="border-0" id="${totalInvoices[index].Numero_Processo}" data-bs-toggle="modal" data-bs-target="#exampleModalToggle2" onclick="printModalData.call(this)">
                    <div class="list-group-item border-0">
                        <div class="d-flex align-items-start"> <span class="tansaction-icon bg-primary" title="${totalInvoices[index].Modal}" style="background-color: ${color}!important"> ${icon} </span>
                            <div class="w-100">
                                <div class="d-flex align-items-top justify-content-between">
                                    <div class="mt-0">
                                        <p class="mb-0 fw-semibold"><span class="me-3">${clientName}</span></p><span class="mb-0 fs-12 text-muted">${totalInvoices[index].Numero_Processo}</span> </div>
                                    <div class="text-muted fs-12 text-center"></div>
                                    <span class="ms-auto">
                                        <span class="text-end text-danger d-block"> ${formattedValue} </span>
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

    totalPendingPayments = totalPendingPayments.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    printPendingPaymentsTitle = `
        <div class="me-3"> <span class="avatar avatar-rounded bg-secondary"> <i class="ti ti-arrow-big-up-line fs-16"></i> </span> </div>
        <div> <span class="d-block text-muted">Pagamento Total Pendente</span> <span class="fs-16 fw-semibold">${totalPendingPayments}</span> </div>`

    divPendingPaymentsTitle.innerHTML = printPendingPaymentsTitle;
    divPendingPayments.innerHTML = printPendingPayments;
}

async function reprintApprovedOffers(day, week, month) {

    const totalOffers = await makeRequest(`/api/executive-analytics-dashboard/totalOffers`, 'POST', { day: day, week: week, month: month });
    const divApprovedOffers = document.getElementById('approvedOffers');
    let printApprovedOffers = '';

    for (let index = 0; index < totalOffers.length; index++) {

        let color = ''
        let icon = ''
        if (totalOffers[index].Modal == 'LCL') {
            color = 'var(--lcl-color)';
            icon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="rgba(255,255,255,1)"><path d="M9 4H14.4458C14.7905 4 15.111 4.17762 15.2938 4.47L18.75 10H23.1577C23.4339 10 23.6577 10.2239 23.6577 10.5C23.6577 10.5837 23.6367 10.666 23.5967 10.7394L19.6364 18H19C18.4694 18 17.9548 17.9311 17.4648 17.8018L20.63 12H3.4L4.44833 17.824C3.9845 17.939 3.49937 18 3 18H2.45455L1.21434 11.1789C1.11555 10.6355 1.47595 10.1149 2.01933 10.0161C2.07835 10.0054 2.13822 10 2.19821 10H3V5C3 4.44772 3.44772 4 4 4H5V1H9V4ZM5 10H16.3915L13.8915 6H5V10ZM3 20C4.53671 20 5.93849 19.4223 7 18.4722C8.06151 19.4223 9.46329 20 11 20C12.5367 20 13.9385 19.4223 15 18.4722C16.0615 19.4223 17.4633 20 19 20H21V22H19C17.5429 22 16.1767 21.6104 15 20.9297C13.8233 21.6104 12.4571 22 11 22C9.54285 22 8.17669 21.6104 7 20.9297C5.82331 21.6104 4.45715 22 3 22H1V20H3Z"></path></svg>';
        }
        if (totalOffers[index].Modal == 'FCL') {
            color = 'var(--fcl-color)';
            icon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="rgba(255,255,255,1)"><path d="M9 4H14.4458C14.7905 4 15.111 4.17762 15.2938 4.47L18.75 10H23.1577C23.4339 10 23.6577 10.2239 23.6577 10.5C23.6577 10.5837 23.6367 10.666 23.5967 10.7394L19.6364 18H19C18.4694 18 17.9548 17.9311 17.4648 17.8018L20.63 12H3.4L4.44833 17.824C3.9845 17.939 3.49937 18 3 18H2.45455L1.21434 11.1789C1.11555 10.6355 1.47595 10.1149 2.01933 10.0161C2.07835 10.0054 2.13822 10 2.19821 10H3V5C3 4.44772 3.44772 4 4 4H5V1H9V4ZM5 10H16.3915L13.8915 6H5V10ZM3 20C4.53671 20 5.93849 19.4223 7 18.4722C8.06151 19.4223 9.46329 20 11 20C12.5367 20 13.9385 19.4223 15 18.4722C16.0615 19.4223 17.4633 20 19 20H21V22H19C17.5429 22 16.1767 21.6104 15 20.9297C13.8233 21.6104 12.4571 22 11 22C9.54285 22 8.17669 21.6104 7 20.9297C5.82331 21.6104 4.45715 22 3 22H1V20H3Z"></path></svg>';
        }
        if (totalOffers[index].Modal == 'Aéreo') {
            color = 'var(--air-color)';
            icon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="rgba(255,255,255,1)"><path d="M14 8.94737L22 14V16L14 13.4737V18.8333L17 20.5V22L12.5 21L8 22V20.5L11 18.8333V13.4737L3 16V14L11 8.94737V3.5C11 2.67157 11.6716 2 12.5 2C13.3284 2 14 2.67157 14 3.5V8.94737Z"></path></svg>';
        }
        if (totalOffers[index].Modal == 'Rodoviário') {
            icon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="rgba(255,255,255,1)"><path d="M8.96456 18C8.72194 19.6961 7.26324 21 5.5 21C3.73676 21 2.27806 19.6961 2.03544 18H1V6C1 5.44772 1.44772 5 2 5H16C16.5523 5 17 5.44772 17 6V8H20L23 12.0557V18H20.9646C20.7219 19.6961 19.2632 21 17.5 21C15.7368 21 14.2781 19.6961 14.0354 18H8.96456ZM15 7H3V15.0505C3.63526 14.4022 4.52066 14 5.5 14C6.8962 14 8.10145 14.8175 8.66318 16H14.3368C14.5045 15.647 14.7296 15.3264 15 15.0505V7ZM17 13H21V12.715L18.9917 10H17V13ZM17.5 19C18.1531 19 18.7087 18.5826 18.9146 18C18.9699 17.8436 19 17.6753 19 17.5C19 16.6716 18.3284 16 17.5 16C16.6716 16 16 16.6716 16 17.5C16 17.6753 16.0301 17.8436 16.0854 18C16.2913 18.5826 16.8469 19 17.5 19ZM7 17.5C7 16.6716 6.32843 16 5.5 16C4.67157 16 4 16.6716 4 17.5C4 17.6753 4.03008 17.8436 4.08535 18C4.29127 18.5826 4.84689 19 5.5 19C6.15311 19 6.70873 18.5826 6.91465 18C6.96992 17.8436 7 17.6753 7 17.5Z"></path></svg>';
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
                        <div class="d-flex align-items-start"> <span class="tansaction-icon bg-primary" title="${totalOffers[index].Modal}" style="background-color: ${color}!important"> ${icon} </span>
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

        let color = ''
        let icon = ''
        if (totalOffers[index].Modal == 'LCL') {
            color = 'var(--lcl-color)';
            icon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="rgba(255,255,255,1)"><path d="M9 4H14.4458C14.7905 4 15.111 4.17762 15.2938 4.47L18.75 10H23.1577C23.4339 10 23.6577 10.2239 23.6577 10.5C23.6577 10.5837 23.6367 10.666 23.5967 10.7394L19.6364 18H19C18.4694 18 17.9548 17.9311 17.4648 17.8018L20.63 12H3.4L4.44833 17.824C3.9845 17.939 3.49937 18 3 18H2.45455L1.21434 11.1789C1.11555 10.6355 1.47595 10.1149 2.01933 10.0161C2.07835 10.0054 2.13822 10 2.19821 10H3V5C3 4.44772 3.44772 4 4 4H5V1H9V4ZM5 10H16.3915L13.8915 6H5V10ZM3 20C4.53671 20 5.93849 19.4223 7 18.4722C8.06151 19.4223 9.46329 20 11 20C12.5367 20 13.9385 19.4223 15 18.4722C16.0615 19.4223 17.4633 20 19 20H21V22H19C17.5429 22 16.1767 21.6104 15 20.9297C13.8233 21.6104 12.4571 22 11 22C9.54285 22 8.17669 21.6104 7 20.9297C5.82331 21.6104 4.45715 22 3 22H1V20H3Z"></path></svg>';
        }
        if (totalOffers[index].Modal == 'FCL') {
            color = 'var(--fcl-color)';
            icon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="rgba(255,255,255,1)"><path d="M9 4H14.4458C14.7905 4 15.111 4.17762 15.2938 4.47L18.75 10H23.1577C23.4339 10 23.6577 10.2239 23.6577 10.5C23.6577 10.5837 23.6367 10.666 23.5967 10.7394L19.6364 18H19C18.4694 18 17.9548 17.9311 17.4648 17.8018L20.63 12H3.4L4.44833 17.824C3.9845 17.939 3.49937 18 3 18H2.45455L1.21434 11.1789C1.11555 10.6355 1.47595 10.1149 2.01933 10.0161C2.07835 10.0054 2.13822 10 2.19821 10H3V5C3 4.44772 3.44772 4 4 4H5V1H9V4ZM5 10H16.3915L13.8915 6H5V10ZM3 20C4.53671 20 5.93849 19.4223 7 18.4722C8.06151 19.4223 9.46329 20 11 20C12.5367 20 13.9385 19.4223 15 18.4722C16.0615 19.4223 17.4633 20 19 20H21V22H19C17.5429 22 16.1767 21.6104 15 20.9297C13.8233 21.6104 12.4571 22 11 22C9.54285 22 8.17669 21.6104 7 20.9297C5.82331 21.6104 4.45715 22 3 22H1V20H3Z"></path></svg>';
        }
        if (totalOffers[index].Modal == 'Aéreo') {
            color = 'var(--air-color)';
            icon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="rgba(255,255,255,1)"><path d="M14 8.94737L22 14V16L14 13.4737V18.8333L17 20.5V22L12.5 21L8 22V20.5L11 18.8333V13.4737L3 16V14L11 8.94737V3.5C11 2.67157 11.6716 2 12.5 2C13.3284 2 14 2.67157 14 3.5V8.94737Z"></path></svg>';
        }
        if (totalOffers[index].Modal == 'Rodoviário') {
            icon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="rgba(255,255,255,1)"><path d="M8.96456 18C8.72194 19.6961 7.26324 21 5.5 21C3.73676 21 2.27806 19.6961 2.03544 18H1V6C1 5.44772 1.44772 5 2 5H16C16.5523 5 17 5.44772 17 6V8H20L23 12.0557V18H20.9646C20.7219 19.6961 19.2632 21 17.5 21C15.7368 21 14.2781 19.6961 14.0354 18H8.96456ZM15 7H3V15.0505C3.63526 14.4022 4.52066 14 5.5 14C6.8962 14 8.10145 14.8175 8.66318 16H14.3368C14.5045 15.647 14.7296 15.3264 15 15.0505V7ZM17 13H21V12.715L18.9917 10H17V13ZM17.5 19C18.1531 19 18.7087 18.5826 18.9146 18C18.9699 17.8436 19 17.6753 19 17.5C19 16.6716 18.3284 16 17.5 16C16.6716 16 16 16.6716 16 17.5C16 17.6753 16.0301 17.8436 16.0854 18C16.2913 18.5826 16.8469 19 17.5 19ZM7 17.5C7 16.6716 6.32843 16 5.5 16C4.67157 16 4 16.6716 4 17.5C4 17.6753 4.03008 17.8436 4.08535 18C4.29127 18.5826 4.84689 19 5.5 19C6.15311 19 6.70873 18.5826 6.91465 18C6.96992 17.8436 7 17.6753 7 17.5Z"></path></svg>';
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
                        <div class="d-flex align-items-start"> <span class="tansaction-icon bg-primary" title="${totalOffers[index].Modal}" style="background-color: ${color}!important"> ${icon} </span>
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

        let color = ''
        let icon = ''
        if (totalOffers[index].Modal == 'LCL') {
            color = 'var(--lcl-color)';
            icon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="rgba(255,255,255,1)"><path d="M9 4H14.4458C14.7905 4 15.111 4.17762 15.2938 4.47L18.75 10H23.1577C23.4339 10 23.6577 10.2239 23.6577 10.5C23.6577 10.5837 23.6367 10.666 23.5967 10.7394L19.6364 18H19C18.4694 18 17.9548 17.9311 17.4648 17.8018L20.63 12H3.4L4.44833 17.824C3.9845 17.939 3.49937 18 3 18H2.45455L1.21434 11.1789C1.11555 10.6355 1.47595 10.1149 2.01933 10.0161C2.07835 10.0054 2.13822 10 2.19821 10H3V5C3 4.44772 3.44772 4 4 4H5V1H9V4ZM5 10H16.3915L13.8915 6H5V10ZM3 20C4.53671 20 5.93849 19.4223 7 18.4722C8.06151 19.4223 9.46329 20 11 20C12.5367 20 13.9385 19.4223 15 18.4722C16.0615 19.4223 17.4633 20 19 20H21V22H19C17.5429 22 16.1767 21.6104 15 20.9297C13.8233 21.6104 12.4571 22 11 22C9.54285 22 8.17669 21.6104 7 20.9297C5.82331 21.6104 4.45715 22 3 22H1V20H3Z"></path></svg>';
        }
        if (totalOffers[index].Modal == 'FCL') {
            color = 'var(--fcl-color)';
            icon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="rgba(255,255,255,1)"><path d="M9 4H14.4458C14.7905 4 15.111 4.17762 15.2938 4.47L18.75 10H23.1577C23.4339 10 23.6577 10.2239 23.6577 10.5C23.6577 10.5837 23.6367 10.666 23.5967 10.7394L19.6364 18H19C18.4694 18 17.9548 17.9311 17.4648 17.8018L20.63 12H3.4L4.44833 17.824C3.9845 17.939 3.49937 18 3 18H2.45455L1.21434 11.1789C1.11555 10.6355 1.47595 10.1149 2.01933 10.0161C2.07835 10.0054 2.13822 10 2.19821 10H3V5C3 4.44772 3.44772 4 4 4H5V1H9V4ZM5 10H16.3915L13.8915 6H5V10ZM3 20C4.53671 20 5.93849 19.4223 7 18.4722C8.06151 19.4223 9.46329 20 11 20C12.5367 20 13.9385 19.4223 15 18.4722C16.0615 19.4223 17.4633 20 19 20H21V22H19C17.5429 22 16.1767 21.6104 15 20.9297C13.8233 21.6104 12.4571 22 11 22C9.54285 22 8.17669 21.6104 7 20.9297C5.82331 21.6104 4.45715 22 3 22H1V20H3Z"></path></svg>';
        }
        if (totalOffers[index].Modal == 'Aéreo') {
            color = 'var(--air-color)';
            icon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="rgba(255,255,255,1)"><path d="M14 8.94737L22 14V16L14 13.4737V18.8333L17 20.5V22L12.5 21L8 22V20.5L11 18.8333V13.4737L3 16V14L11 8.94737V3.5C11 2.67157 11.6716 2 12.5 2C13.3284 2 14 2.67157 14 3.5V8.94737Z"></path></svg>';
        }
        if (totalOffers[index].Modal == 'Rodoviário') {
            icon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="rgba(255,255,255,1)"><path d="M8.96456 18C8.72194 19.6961 7.26324 21 5.5 21C3.73676 21 2.27806 19.6961 2.03544 18H1V6C1 5.44772 1.44772 5 2 5H16C16.5523 5 17 5.44772 17 6V8H20L23 12.0557V18H20.9646C20.7219 19.6961 19.2632 21 17.5 21C15.7368 21 14.2781 19.6961 14.0354 18H8.96456ZM15 7H3V15.0505C3.63526 14.4022 4.52066 14 5.5 14C6.8962 14 8.10145 14.8175 8.66318 16H14.3368C14.5045 15.647 14.7296 15.3264 15 15.0505V7ZM17 13H21V12.715L18.9917 10H17V13ZM17.5 19C18.1531 19 18.7087 18.5826 18.9146 18C18.9699 17.8436 19 17.6753 19 17.5C19 16.6716 18.3284 16 17.5 16C16.6716 16 16 16.6716 16 17.5C16 17.6753 16.0301 17.8436 16.0854 18C16.2913 18.5826 16.8469 19 17.5 19ZM7 17.5C7 16.6716 6.32843 16 5.5 16C4.67157 16 4 16.6716 4 17.5C4 17.6753 4.03008 17.8436 4.08535 18C4.29127 18.5826 4.84689 19 5.5 19C6.15311 19 6.70873 18.5826 6.91465 18C6.96992 17.8436 7 17.6753 7 17.5Z"></path></svg>';
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
                        <div class="d-flex align-items-start"> <span class="tansaction-icon bg-primary" title="${totalOffers[index].Modal}" style="background-color: ${color}!important"> ${icon} </span>
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

        let color = ''
        let icon = ''
        if (totalProcesses[index].Modal == 'LCL') {
            color = 'var(--lcl-color)';
            icon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="rgba(255,255,255,1)"><path d="M9 4H14.4458C14.7905 4 15.111 4.17762 15.2938 4.47L18.75 10H23.1577C23.4339 10 23.6577 10.2239 23.6577 10.5C23.6577 10.5837 23.6367 10.666 23.5967 10.7394L19.6364 18H19C18.4694 18 17.9548 17.9311 17.4648 17.8018L20.63 12H3.4L4.44833 17.824C3.9845 17.939 3.49937 18 3 18H2.45455L1.21434 11.1789C1.11555 10.6355 1.47595 10.1149 2.01933 10.0161C2.07835 10.0054 2.13822 10 2.19821 10H3V5C3 4.44772 3.44772 4 4 4H5V1H9V4ZM5 10H16.3915L13.8915 6H5V10ZM3 20C4.53671 20 5.93849 19.4223 7 18.4722C8.06151 19.4223 9.46329 20 11 20C12.5367 20 13.9385 19.4223 15 18.4722C16.0615 19.4223 17.4633 20 19 20H21V22H19C17.5429 22 16.1767 21.6104 15 20.9297C13.8233 21.6104 12.4571 22 11 22C9.54285 22 8.17669 21.6104 7 20.9297C5.82331 21.6104 4.45715 22 3 22H1V20H3Z"></path></svg>';
        }
        if (totalProcesses[index].Modal == 'FCL') {
            color = 'var(--fcl-color)';
            icon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="rgba(255,255,255,1)"><path d="M9 4H14.4458C14.7905 4 15.111 4.17762 15.2938 4.47L18.75 10H23.1577C23.4339 10 23.6577 10.2239 23.6577 10.5C23.6577 10.5837 23.6367 10.666 23.5967 10.7394L19.6364 18H19C18.4694 18 17.9548 17.9311 17.4648 17.8018L20.63 12H3.4L4.44833 17.824C3.9845 17.939 3.49937 18 3 18H2.45455L1.21434 11.1789C1.11555 10.6355 1.47595 10.1149 2.01933 10.0161C2.07835 10.0054 2.13822 10 2.19821 10H3V5C3 4.44772 3.44772 4 4 4H5V1H9V4ZM5 10H16.3915L13.8915 6H5V10ZM3 20C4.53671 20 5.93849 19.4223 7 18.4722C8.06151 19.4223 9.46329 20 11 20C12.5367 20 13.9385 19.4223 15 18.4722C16.0615 19.4223 17.4633 20 19 20H21V22H19C17.5429 22 16.1767 21.6104 15 20.9297C13.8233 21.6104 12.4571 22 11 22C9.54285 22 8.17669 21.6104 7 20.9297C5.82331 21.6104 4.45715 22 3 22H1V20H3Z"></path></svg>';
        }
        if (totalProcesses[index].Modal == 'Aéreo') {
            color = 'var(--air-color)';
            icon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="rgba(255,255,255,1)"><path d="M14 8.94737L22 14V16L14 13.4737V18.8333L17 20.5V22L12.5 21L8 22V20.5L11 18.8333V13.4737L3 16V14L11 8.94737V3.5C11 2.67157 11.6716 2 12.5 2C13.3284 2 14 2.67157 14 3.5V8.94737Z"></path></svg>';
        }
        if (totalProcesses[index].Modal == 'Rodoviário') {
            icon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="rgba(255,255,255,1)"><path d="M8.96456 18C8.72194 19.6961 7.26324 21 5.5 21C3.73676 21 2.27806 19.6961 2.03544 18H1V6C1 5.44772 1.44772 5 2 5H16C16.5523 5 17 5.44772 17 6V8H20L23 12.0557V18H20.9646C20.7219 19.6961 19.2632 21 17.5 21C15.7368 21 14.2781 19.6961 14.0354 18H8.96456ZM15 7H3V15.0505C3.63526 14.4022 4.52066 14 5.5 14C6.8962 14 8.10145 14.8175 8.66318 16H14.3368C14.5045 15.647 14.7296 15.3264 15 15.0505V7ZM17 13H21V12.715L18.9917 10H17V13ZM17.5 19C18.1531 19 18.7087 18.5826 18.9146 18C18.9699 17.8436 19 17.6753 19 17.5C19 16.6716 18.3284 16 17.5 16C16.6716 16 16 16.6716 16 17.5C16 17.6753 16.0301 17.8436 16.0854 18C16.2913 18.5826 16.8469 19 17.5 19ZM7 17.5C7 16.6716 6.32843 16 5.5 16C4.67157 16 4 16.6716 4 17.5C4 17.6753 4.03008 17.8436 4.08535 18C4.29127 18.5826 4.84689 19 5.5 19C6.15311 19 6.70873 18.5826 6.91465 18C6.96992 17.8436 7 17.6753 7 17.5Z"></path></svg>';
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
                        <div class="d-flex align-items-start"> <span class="tansaction-icon bg-primary" title="${totalProcesses[index].Modal}" style="background-color: ${color}!important"> ${icon} </span>
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
    let formattedValue = 0;

    for (let index = 0; index < totalInvoices.length; index++) {

        let color = ''
        let icon = ''
        if (totalInvoices[index].Modal == 'LCL') {
            color = 'var(--lcl-color)';
            icon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="rgba(255,255,255,1)"><path d="M9 4H14.4458C14.7905 4 15.111 4.17762 15.2938 4.47L18.75 10H23.1577C23.4339 10 23.6577 10.2239 23.6577 10.5C23.6577 10.5837 23.6367 10.666 23.5967 10.7394L19.6364 18H19C18.4694 18 17.9548 17.9311 17.4648 17.8018L20.63 12H3.4L4.44833 17.824C3.9845 17.939 3.49937 18 3 18H2.45455L1.21434 11.1789C1.11555 10.6355 1.47595 10.1149 2.01933 10.0161C2.07835 10.0054 2.13822 10 2.19821 10H3V5C3 4.44772 3.44772 4 4 4H5V1H9V4ZM5 10H16.3915L13.8915 6H5V10ZM3 20C4.53671 20 5.93849 19.4223 7 18.4722C8.06151 19.4223 9.46329 20 11 20C12.5367 20 13.9385 19.4223 15 18.4722C16.0615 19.4223 17.4633 20 19 20H21V22H19C17.5429 22 16.1767 21.6104 15 20.9297C13.8233 21.6104 12.4571 22 11 22C9.54285 22 8.17669 21.6104 7 20.9297C5.82331 21.6104 4.45715 22 3 22H1V20H3Z"></path></svg>';
        }
        if (totalInvoices[index].Modal == 'FCL') {
            color = 'var(--fcl-color)';
            icon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="rgba(255,255,255,1)"><path d="M9 4H14.4458C14.7905 4 15.111 4.17762 15.2938 4.47L18.75 10H23.1577C23.4339 10 23.6577 10.2239 23.6577 10.5C23.6577 10.5837 23.6367 10.666 23.5967 10.7394L19.6364 18H19C18.4694 18 17.9548 17.9311 17.4648 17.8018L20.63 12H3.4L4.44833 17.824C3.9845 17.939 3.49937 18 3 18H2.45455L1.21434 11.1789C1.11555 10.6355 1.47595 10.1149 2.01933 10.0161C2.07835 10.0054 2.13822 10 2.19821 10H3V5C3 4.44772 3.44772 4 4 4H5V1H9V4ZM5 10H16.3915L13.8915 6H5V10ZM3 20C4.53671 20 5.93849 19.4223 7 18.4722C8.06151 19.4223 9.46329 20 11 20C12.5367 20 13.9385 19.4223 15 18.4722C16.0615 19.4223 17.4633 20 19 20H21V22H19C17.5429 22 16.1767 21.6104 15 20.9297C13.8233 21.6104 12.4571 22 11 22C9.54285 22 8.17669 21.6104 7 20.9297C5.82331 21.6104 4.45715 22 3 22H1V20H3Z"></path></svg>';
        }
        if (totalInvoices[index].Modal == 'Aéreo') {
            color = 'var(--air-color)';
            icon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="rgba(255,255,255,1)"><path d="M14 8.94737L22 14V16L14 13.4737V18.8333L17 20.5V22L12.5 21L8 22V20.5L11 18.8333V13.4737L3 16V14L11 8.94737V3.5C11 2.67157 11.6716 2 12.5 2C13.3284 2 14 2.67157 14 3.5V8.94737Z"></path></svg>';
        }
        if (totalInvoices[index].Modal == 'Rodoviário') {
            icon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="rgba(255,255,255,1)"><path d="M8.96456 18C8.72194 19.6961 7.26324 21 5.5 21C3.73676 21 2.27806 19.6961 2.03544 18H1V6C1 5.44772 1.44772 5 2 5H16C16.5523 5 17 5.44772 17 6V8H20L23 12.0557V18H20.9646C20.7219 19.6961 19.2632 21 17.5 21C15.7368 21 14.2781 19.6961 14.0354 18H8.96456ZM15 7H3V15.0505C3.63526 14.4022 4.52066 14 5.5 14C6.8962 14 8.10145 14.8175 8.66318 16H14.3368C14.5045 15.647 14.7296 15.3264 15 15.0505V7ZM17 13H21V12.715L18.9917 10H17V13ZM17.5 19C18.1531 19 18.7087 18.5826 18.9146 18C18.9699 17.8436 19 17.6753 19 17.5C19 16.6716 18.3284 16 17.5 16C16.6716 16 16 16.6716 16 17.5C16 17.6753 16.0301 17.8436 16.0854 18C16.2913 18.5826 16.8469 19 17.5 19ZM7 17.5C7 16.6716 6.32843 16 5.5 16C4.67157 16 4 16.6716 4 17.5C4 17.6753 4.03008 17.8436 4.08535 18C4.29127 18.5826 4.84689 19 5.5 19C6.15311 19 6.70873 18.5826 6.91465 18C6.96992 17.8436 7 17.6753 7 17.5Z"></path></svg>';
        }

        if (totalInvoices[index].Moeda == 'USD') {
            formattedValue = totalInvoices[index].Valor.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
        } else if (totalInvoices[index].Moeda == 'BRL') {
            formattedValue = totalInvoices[index].Valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        }

        if (totalInvoices[index].Natureza == 'Recebimento') {
            if (totalInvoices[index].Situacao_Fatura == 'Quitada') {

                const date = await formattedDateTime(totalInvoices[index].Data);
                const clientName = await limitByCharacter(totalInvoices[index].Pessoa, 27);

                printCompletedReceipts += `
                <a href="javascript:void(0);" class="border-0" id="${totalInvoices[index].Numero_Processo}" data-bs-toggle="modal" data-bs-target="#exampleModalToggle2" onclick="printModalData.call(this)">
                    <div class="list-group-item border-0">
                        <div class="d-flex align-items-start"> <span class="tansaction-icon bg-primary" title="${totalInvoices[index].Modal}" style="background-color: ${color}!important"> ${icon} </span>
                            <div class="w-100">
                                <div class="d-flex align-items-top justify-content-between">
                                    <div class="mt-0">
                                        <p class="mb-0 fw-semibold"><span class="me-3">${clientName}</span></p><span class="mb-0 fs-12 text-muted">${totalInvoices[index].Numero_Processo}</span> </div>
                                    <div class="text-muted fs-12 text-center"></div>
                                    <span class="ms-auto">
                                        <span class="text-end text-danger d-block"> ${formattedValue} </span>
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
            else {

                const date = await formattedDateTime(totalInvoices[index].Data);
                const clientName = await limitByCharacter(totalInvoices[index].Pessoa, 27);

                printPendingReceipts += `
                <a href="javascript:void(0);" class="border-0" id="${totalInvoices[index].Numero_Processo}" data-bs-toggle="modal" data-bs-target="#exampleModalToggle2" onclick="printModalData.call(this)">
                    <div class="list-group-item border-0">
                        <div class="d-flex align-items-start"> <span class="tansaction-icon bg-primary" title="${totalInvoices[index].Modal}" style="background-color: ${color}!important"> ${icon} </span>
                            <div class="w-100">
                                <div class="d-flex align-items-top justify-content-between">
                                    <div class="mt-0">
                                        <p class="mb-0 fw-semibold"><span class="me-3">${clientName}</span></p><span class="mb-0 fs-12 text-muted">${totalInvoices[index].Numero_Processo}</span> </div>
                                    <div class="text-muted fs-12 text-center"></div>
                                    <span class="ms-auto">
                                        <span class="text-end text-danger d-block"> ${formattedValue} </span>
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
        if (totalInvoices[index].Natureza == 'Pagamento') {
            if (totalInvoices[index].Situacao_Fatura == 'Quitada') {

                const date = await formattedDateTime(totalInvoices[index].Data);
                const clientName = await limitByCharacter(totalInvoices[index].Pessoa, 27);

                printCompletedPayments += `
                <a href="javascript:void(0);" class="border-0" id="${totalInvoices[index].Numero_Processo}" data-bs-toggle="modal" data-bs-target="#exampleModalToggle2" onclick="printModalData.call(this)">
                    <div class="list-group-item border-0">
                        <div class="d-flex align-items-start"> <span class="tansaction-icon bg-primary" title="${totalInvoices[index].Modal}" style="background-color: ${color}!important"> ${icon} </span>
                            <div class="w-100">
                                <div class="d-flex align-items-top justify-content-between">
                                    <div class="mt-0">
                                        <p class="mb-0 fw-semibold"><span class="me-3">${clientName}</span></p><span class="mb-0 fs-12 text-muted">${totalInvoices[index].Numero_Processo}</span> </div>
                                    <div class="text-muted fs-12 text-center"></div>
                                    <span class="ms-auto">
                                        <span class="text-end text-danger d-block">${formattedValue} </span>
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
            } else {

                const date = await formattedDateTime(totalInvoices[index].Data);
                const clientName = await limitByCharacter(totalInvoices[index].Pessoa, 27);

                printPendingPayments += `
                <a href="javascript:void(0);" class="border-0" id="${totalInvoices[index].Numero_Processo}" data-bs-toggle="modal" data-bs-target="#exampleModalToggle2" onclick="printModalData.call(this)">
                    <div class="list-group-item border-0">
                        <div class="d-flex align-items-start"> <span class="tansaction-icon bg-primary" title="${totalInvoices[index].Modal}" style="background-color: ${color}!important"> ${icon} </span>
                            <div class="w-100">
                                <div class="d-flex align-items-top justify-content-between">
                                    <div class="mt-0">
                                        <p class="mb-0 fw-semibold"><span class="me-3">${clientName}</span></p><span class="mb-0 fs-12 text-muted">${totalInvoices[index].Numero_Processo}</span> </div>
                                    <div class="text-muted fs-12 text-center"></div>
                                    <span class="ms-auto">
                                        <span class="text-end text-danger d-block"> ${formattedValue} </span>
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
    totalCompletedReceipts = totalCompletedReceipts.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    totalCompletedPayments = totalCompletedPayments.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    totalPendingReceipts = totalPendingReceipts.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    totalPendingPayments = totalPendingPayments.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    printCompletedReceiptsTitle = `
        <div class="me-3"> <span class="avatar avatar-rounded" style="background-color: var(--bs-success);"> <i class="ri-money-dollar-circle-line" style="font-size: 28px"></i> </span> </div>
        <div> <span class="d-block text-muted">Recebimento Total Baixado</span> <span class="fs-16 fw-semibold">${totalCompletedReceipts}</span> </div>`

    printcompletedPaymentsTitle = `
        <div class="me-3"> <span class="avatar avatar-rounded" style="background-color: var(--bs-danger);"> <i class="ri-money-dollar-circle-line" style="font-size: 28px"></i> </span> </div>
        <div> <span class="d-block text-muted">Pagamento Total Baixado</span> <span class="fs-16 fw-semibold">${totalCompletedPayments}</span> </div>`

    printPendingReceiptsTitle = `
        <div class="me-3"> <span class="avatar avatar-rounded" style="background-color: var(--bs-success);"> <i class="ri-exchange-dollar-fill" style="font-size: 28px"></i> </span> </div>
        <div> <span class="d-block text-muted">Recebimento Total Pendente</span> <span class="fs-16 fw-semibold">${totalPendingReceipts}</span> </div>`
    printPendingPaymentsTitle = `
        <div class="me-3"> <span class="avatar avatar-rounded" style="background-color: var(--bs-danger);"> <i class="ri-exchange-dollar-fill" style="font-size: 28px"></i> </span> </div>
        <div> <span class="d-block text-muted">Pagamento Total Pendente</span> <span class="fs-16 fw-semibold">${totalPendingPayments}</span> </div>`

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

async function redirectToTable(type, status){

    const body = {
        url: `/app/commercial/executive-analytics-dashboard/tables?type=${type}&status=${status}`,
        width: 1200,
        height: 715,
        resizable: true,
        max: true
    }
    window.ipcRenderer.invoke('open-exWindow', body);
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