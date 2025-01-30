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
        { value: '', label: 'Selecione o tipo do pedido', disabled: true, selected: true }, // Item vazio inicial
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
        { value: '', label: 'Selecione a qual cliente atribuir', disabled: true, selected: true }, // Item vazio inicial
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

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${day}/${month}/${year}`;
}

function getDisponibility(dateStart, dateEnd) {
    const start = new Date(dateStart);
    const end = new Date(dateEnd);

    let hourStart = start.getHours()
    let hourEnd = end.getHours()

    let minStart = start.getMinutes() + (hourStart*60)
    let minEnd = end.getMinutes() + (hourEnd*60);
    
    let minResult = minEnd - minStart

    let workday = 600 //minutos do dia trabalhado (8h30) + horário de almoço (1h30)

    return (((workday - minResult)/workday)*100).toFixed(2);
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

    console.log(tableData);

    printFullTable = `
        <thead>
            <tr>
                <th scope="col" class="col-2">Pedido</th>
                <th scope="col" class="col-2">Cliente</th>
                <th scope="col" class="col-7">Descrição</th>
                <th scope="col" class="col-1">Data</th>
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
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Mês começa do 0
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

async function openModal(id) {

    const lineData = await makeRequest(`/api/external-systems/getById`, 'POST', {id: id});

    const modalElement = document.querySelector('.buttonUpdateService');
    modalElement.setAttribute('id', lineData[0].id);

    if (lineData[0].date_end) {
        lineData[0].date_end = formatToDateTimeLocal(lineData[0].date_end);
    }

    document.querySelector('#editServiceName').value = lineData[0].name;
    document.querySelector('#editStartDate').value = formatToDateTimeLocal(lineData[0].date_start);
    document.querySelector('#editEndDate').value = lineData[0].date_end;
    document.querySelector('#editDescription').value = lineData[0].description;

    const modal = document.querySelector('#changePrevInicio');
    $(modal).modal('show');
}

window.addEventListener("load", async () => {
    let login = await getInfosLogin();
    await getServices();
    await getCustomers();
    await createTable();

    document.querySelector('#loader2').classList.add('d-none')

})