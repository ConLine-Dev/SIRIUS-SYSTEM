let occurrenceTable;

async function getInfosLogin() {
    const StorageGoogleData = localStorage.getItem('StorageGoogle');
    const StorageGoogle = JSON.parse(StorageGoogleData);
    return StorageGoogle;
}

async function createTable() {
    const listTable = [];
    const people = await makeRequest(`/api/people/getAllPeople`);

    for (let index = 0; index < people.length; index++) {
        const item = people[index];

        listTable.push({
            id: item.id,
            name: item.name,
            fantasyName: item.fantasy_name,
            cpfCnpj: item.cnpj_cpf,
        });
    }

    if ($.fn.DataTable.isDataTable("#occurrenceTable")) {
        $('#occurrenceTable').DataTable().clear().destroy();
    }

    $('#occurrenceTable tbody').empty();

    occurrenceTable = $('#occurrenceTable').DataTable({
        dom: 'frtip',
        pageInfo: false,
        data: listTable,
        columns: [
            { data: "name" },
            { data: "fantasyName" },
            {
                data: "cpfCnpj",
                render: function (data) {
                    if (!data) return "";
                    if (data.length === 11) {
                        return data.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
                    } else if (data.length === 14) {
                        return data.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
                    }
                    return data;
                }
            }
        ],
        language: {
            url: 'https://cdn.datatables.net/plug-ins/1.13.7/i18n/pt-BR.json'
        },
        order: [[0, 'desc']],
        lengthMenu: [[15], [15]],
        searching: true,
        rowCallback: function (row, data) {
            $(row).attr('occurrence-id', data.id);
        },
        drawCallback: function () {
            // Remove o antigo e adiciona novamente o duplo clique
            $('#occurrenceTable tbody tr').off('dblclick').on('dblclick', async function (e) {
                e.preventDefault();
                const id = $(this).attr('occurrence-id');
                if (id) {
                    const body = {
                        url: `/app/people/get-people?id=${id}`,
                        width: 1200,
                        height: 475,
                        resizable: true,
                        max: false
                    };
                    window.ipcRenderer.invoke('open-exWindow', body);
                }
            });
        }
    });
}

async function openRegister() {
    const body = {
        url: `/app/people/create-people/`,
        width: 700,
        height: 700,
        resizable: false,
        max: false
    }
    window.ipcRenderer.invoke('open-exWindow', body);
}

window.addEventListener("load", async () => {

    const socket = io();

    socket.on('updateRefunds', (data) => {
        updateTableData()
    })

    await createTable();


    document.querySelector('#loader2').classList.add('d-none')
})