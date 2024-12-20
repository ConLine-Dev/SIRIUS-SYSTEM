let selectDepts, currentTable;

async function getInfosLogin() {
    const StorageGoogleData = localStorage.getItem('StorageGoogle');
    const StorageGoogle = JSON.parse(StorageGoogleData);
    return StorageGoogle;
}

async function sendComment() {
    let login = await getInfosLogin();
    let collabId = login.system_collaborator_id;
    let service = document.querySelector('select[name="serviceName"]').value;
    let startDate = document.getElementById('startDate').value;
    let endDate = document.getElementById('endDate').value;
    let description = document.querySelector('textarea[name="description"]').value;

    console.log(startDate)
    startDate = formatToWorkbench(startDate);
    console.log(startDate)

    if (endDate) {
        endDate = formatToWorkbench(endDate);
    }

    const answer = {service, description, startDate, endDate, collabId};
    await makeRequest(`/api/external-systems/saveRecord`, 'POST', answer);
    
    Swal.fire({
        icon: "success",
        title: "Comentário enviado!",
    });

    createTable();
    await resetInputs(login);
}

async function resetInputs(login) {
    document.querySelector('select[name="serviceName"]').value = '';
    document.getElementById('startDate').value = '';
    document.getElementById('endDate').value = '';
    document.querySelector('textarea[name="description"]').value = '';

    await getServices();
}

async function getServices() {
    const depts = await makeRequest(`/api/external-systems/getServices`);
    const selectList = [
        { value: '', label: 'Selecione o serviço indisponível', disabled: true, selected: true }, // Item vazio inicial
        ...depts.map(element => ({
            value: `${element.id}`,
            label: `${element.name}`,
        })),
    ];
    if (selectDepts) {
        selectDepts.destroy();
    }

    selectDepts = new Choices('select[name="serviceName"]', {
        choices: selectList,
        shouldSort: false,
        removeItemButton: false,
        noChoicesText: 'Não há opções disponíveis',
        searchEnabled: false,
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
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

async function createTable() {

    const printData = [];
    const tableData = await makeRequest(`/api/external-systems/getRecords`);
    const divFullTable = document.getElementById('fullTable');
    let printFullTable = '';
    let availability = 0;

    printFullTable = `
        <thead>
            <tr>
                <th scope="col" class="col-1">Sistema</th>
                <th scope="col" class="col-6">Descrição</th>
                <th scope="col" class="col-2">Início da indisponibilidade</th>
                <th scope="col" class="col-2">Fim da indisponibilidade</th>
            </tr>
        </thead>`

    for (let i = 0; i < tableData.length; i++) {
        const item = tableData[i];
        item.date_start = formatDateTime(item.date_start);
        
        if (item.date_end) {
            item.date_end = formatDateTime(item.date_end);
        }

        printData.push({
            id: item.id,
            name: item.name,
            description: item.description,
            startDate: item.date_start,
            endDate: item.date_end,
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
            { "data": "description" },
            { "data": "startDate" },
            { "data": "endDate" },
        ],
        "language": {
            url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/pt-BR.json' // Tradução para o português do Brasil
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

async function updateServiceRecord(lineId){
    let startDate = document.querySelector('#editStartDate').value;
    let endDate = document.querySelector('#editEndDate').value;
    const description = document.querySelector('#editDescription').value;

    console.log(startDate)
    startDate = formatToWorkbench(startDate);
    console.log(startDate)

    if (endDate) {
        endDate = formatToWorkbench(endDate);
    }

    const lineData = {lineId, startDate, endDate, description}
    await makeRequest(`/api/external-systems/updateServiceRecord`, 'POST', lineData);

    const modal = document.querySelector('#changePrevInicio');
    await createTable();
    $(modal).modal('hide');

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
    await createTable();

    document.querySelector('#loader2').classList.add('d-none')

})