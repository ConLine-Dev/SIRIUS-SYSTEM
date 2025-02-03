let selectTypes, selectCustomers, currentTable;

async function getInfosLogin() {
    const StorageGoogleData = localStorage.getItem('StorageGoogle');
    const StorageGoogle = JSON.parse(StorageGoogleData);
    return StorageGoogle;
}

async function sendComment() {
    let login = await getInfosLogin();
    let collabId = login.system_collaborator_id;
    let type = document.querySelector('select[name="serviceName"]').value;
    let customer = document.querySelector('select[name="customerName"]').value;
    let date = document.getElementById('date').value;
    let description = document.querySelector('textarea[name="description"]').value;

    if (date) {
        date = formatToWorkbench(date);
    }

    const answer = {type, customer, date, description, collabId};
    
    await makeRequest(`/api/customer-negotiations/saveRecord`, 'POST', answer);

    Swal.fire({
        icon: "success",
        title: "Pedido enviado!",
    });

    createTable();
    await resetInputs(login);
}

async function resetInputs(login) {
    document.querySelector('select[name="serviceName"]').value = '';
    document.querySelector('select[name="customerName"]').value = '';
    document.getElementById('date').value = '';
    document.querySelector('textarea[name="description"]').value = '';

    await getServices();
    await getCustomers();
}

async function getServices() {
    const types = await makeRequest(`/api/customer-negotiations/getServices`);
    const selectList = [
        { value: '', label: 'Selecione o tipo do pedido', disabled: true, selected: true },
        ...types.map(element => ({
            value: `${element.id}`,
            label: `${element.name}`,
        })),
    ];
    if (selectTypes) {
        selectTypes.destroy();
    }

    selectTypes = new Choices('select[name="serviceName"]', {
        choices: selectList,
        shouldSort: false,
        removeItemButton: false,
        noChoicesText: 'Não há opções disponíveis',
        searchEnabled: false,
        allowHTML: true,
    });
}

async function getCustomers() {
    const types = await makeRequest(`/api/customer-negotiations/getCustomers`);
    const selectList = [
        { value: '', label: 'Selecione a qual cliente atribuir', disabled: true, selected: true },
        ...types.map(element => ({
            value: `${element.IdPessoa}`,
            label: `${element.Nome}`,
        })),
    ];
    if (selectCustomers) {
        selectCustomers.destroy();
    }

    selectCustomers = new Choices('select[name="customerName"]', {
        choices: selectList,
        shouldSort: false,
        removeItemButton: false,
        noChoicesText: 'Não há opções disponíveis',
        searchEnabled: true,
        allowHTML: true,
    });
}

function formatToWorkbench(datetime) {
    const date = new Date(datetime);

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

function formatDateTime(datetime) {
    const date = new Date(datetime);

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
}

function formatText(text, max) {
    if (text.length > max) {
        text = text.slice(0, max) + '...';
    }
    return text;
}

async function createTable() {

    const printData = [];
    const tableData = await makeRequest(`/api/customer-negotiations/getRecords`);
    const divFullTable = document.getElementById('fullTable');
    let printFullTable = '';

    printFullTable = `
        <thead>
            <tr>
                <th scope="col" class="col-2">Pedido</th>
                <th scope="col" class="col-2">Cliente</th>
                <th scope="col" class="col-6">Descrição</th>
                <th scope="col" class="col-1">Data</th>
                <th scope="col" class="col-1">Status</th>
            </tr>
        </thead>`

    for (let i = 0; i < tableData.length; i++) {
        const item = tableData[i];
        item.date = formatDateTime(item.date);
        let reducedName = formatText(item.customerName, 20);

        printData.push({
            id: item.id,
            name: item.name,
            customer: reducedName,
            description: item.description,
            date: item.date,
            status: item.status,
        });
    }

    if (currentTable) {
        currentTable.destroy();
        divFullTable.innerHTML = '';
    }

    divFullTable.innerHTML = printFullTable;

    currentTable = $('#fullTable').DataTable({
        "data": printData,
        "columns": [
            { "data": "name" },
            { "data": "customer" },
            { "data": "description" },
            { "data": "date" },
            { "data": "status" },
        ],
        "language": {
            url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/pt-BR.json'
        },
        "order": [[2, 'asc']],
        "lengthMenu": [[9], [9]],
        "pageLength": 9,
        "searching": true,
        "scrollX": true,
        "createdRow": function (row, data, printData) {
            $(row).attr('id', printData.id);
        }
    });

    $('#fullTable tbody').on('click', 'tr', function () {
        const rowData = currentTable.row(this).data();
        if (rowData) {
            openModal(rowData.id);
        }
    });
}

function formatToDateTimeLocal(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

async function rejectNegotiation(id) {
    let status = 'Reprovado'
    await makeRequest(`/api/customer-negotiations/update`, 'POST', {id, status});

    const modal = document.querySelector('#changePrevInicio');
    await createTable();
    $(modal).modal('hide');

    const confirmReject = document.querySelector('.confirmReject');
    confirmReject.setAttribute('id', id);
    
    const rejectModal = document.querySelector('#rejectModal');
    $(rejectModal).modal('show');
}

async function approveNegotiation(id) {
    let status = 'Aprovado'
    await makeRequest(`/api/customer-negotiations/update`, 'POST', {id, status});

    const modal = document.querySelector('#changePrevInicio');
    await createTable();
    $(modal).modal('hide');
}

async function updateNegotiation(id) {
    let status = 'Pendente'
    await makeRequest(`/api/customer-negotiations/update`, 'POST', {id, status});
    
    let description = document.querySelector('textarea[name="newDescription"]').value;
    let login = await getInfosLogin();
    let collabId = login.system_collaborator_id;

    reply = {id, description, collabId}
    await makeRequest(`/api/customer-negotiations/addReply`, 'POST', {reply});

    document.querySelector('textarea[name="newDescription"]').value = '';

    const modal = document.querySelector('#changePrevInicio');
    await createTable();
    $(modal).modal('hide');
}

async function confirmReject(id) {
    let description = document.getElementById('rejectDescription').value;
    let login = await getInfosLogin();
    let collabId = login.system_collaborator_id;

    reply = {id, description, collabId}
    await makeRequest(`/api/customer-negotiations/addReply`, 'POST', {reply});

    document.getElementById('rejectDescription').value = '';

    const modal = document.querySelector('#rejectModal');
    await createTable();
    $(modal).modal('hide');
}

async function openModal(id) {

    const lineData = await makeRequest(`/api/customer-negotiations/getById`, 'POST', {id: id});

    const approveNegotiation = document.querySelector('.approveNegotiation');
    approveNegotiation.setAttribute('id', lineData[0].id);
    const rejectNegotiation = document.querySelector('.rejectNegotiation');
    rejectNegotiation.setAttribute('id', lineData[0].id);
    const updateNegotiation = document.querySelector('.updateNegotiation');
    updateNegotiation.setAttribute('id', lineData[0].id);
    const negotiationControl = document.getElementById('negotiationControl');

    negotiationControl.style.display = 'none';
    updateNegotiation.style.display = 'none';
    if (lineData[0].status == 'Pendente') {
        negotiationControl.style.display = 'block';
    }
    if (lineData[0].status == 'Reprovado') {
        updateNegotiation.style.display = 'block';
    }

    document.querySelector('#modalNegotiationType').value = lineData[0].name;
    document.querySelector('#modalDate').value = formatToDateTimeLocal(lineData[0].date);
    document.querySelector('#modalCustomer').value = lineData[0].customerName;
    document.querySelector('#modalResponsible').value = `${lineData[0].collabName} ${lineData[0].collabFName}`;
    document.querySelector('#modalDescription').value = lineData[0].description;

    await printReplies(lineData[0].id);

    const modal = document.querySelector('#changePrevInicio');
    $(modal).modal('show');
}

async function printReplies(id) {
    const replies = await makeRequest(`/api/customer-negotiations/getReplies`, 'POST', { id: id });
    const lineData = await makeRequest(`/api/customer-negotiations/getById`, 'POST', {id: id});
    const divReplies = document.getElementById('replyDiv');
    let printReplies = '';

    divReplies.style.display = 'none';
    if (replies.length > 0) {
        divReplies.style.display = 'block';
    }

    for (let index = 0; index < replies.length; index++) {
        printReplies += `<label>[${replies[index].name} ${replies[index].family_name}] Retorno ${index+1}</label>
        <textarea class="form-control" disabled>${replies[index].reply}</textarea>`
    }

    if (lineData[0].status == 'Reprovado') {
        printReplies += `<label>Nova Descrição:</label>
        <textarea class="form-control" name="newDescription"></textarea>`
    }

    divReplies.innerHTML = printReplies;
}

window.addEventListener("load", async () => {
    let login = await getInfosLogin();
    await getServices();
    await getCustomers();
    await createTable();

    document.querySelector('#loader2').classList.add('d-none')

})