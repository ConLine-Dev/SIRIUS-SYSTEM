let clientsTable, TEUsChart, profitChart;
const socket = io();

socket.on('att-non-compliance', async (msg) => {
    document.querySelector('#loader2').classList.remove('d-none')
    await listAllOccurrences();
    document.querySelector('#loader2').classList.add('d-none')
});

async function getInfosLogin() {
    const StorageGoogleData = localStorage.getItem('StorageGoogle');
    const StorageGoogle = JSON.parse(StorageGoogleData);
    return StorageGoogle;
}

async function createSelects() {

    const userData = await getInfosLogin();
    const collabId = userData.system_collaborator_id;
    const salesSelect = document.getElementById("salesSelect");
    const getCommercial = await makeRequest(`/api/commercial-individual-goal/getCommercial`, 'POST', { collabId });

    for (let index = 0; index < getCommercial.length; index++) {
        let option = document.createElement("option");
        option.value = getCommercial[index].userId;
        option.textContent = `${getCommercial[index].name} ${getCommercial[index].family_name}`;
        salesSelect.appendChild(option);
    }
}

async function saveNewGoal() {
    const teusGoal = document.getElementById('teusGoal').value;
    const profitGoal = document.getElementById('profitGoal').value;
    const salesSelect = document.getElementById('salesSelect').value;
    const monthSelect = document.getElementById('monthSelect').value;

    await makeRequest(`/api/commercial-individual-goal/saveNewGoal`, 'POST', {teusGoal, profitGoal, salesSelect, monthSelect});

    Swal.fire({
      title: "Nova meta registrada!",
      text: "Os números foram adicionados à tela do colaborador selecionado.",
      icon: "success",
      showCancelButton: false,
      confirmButtonColor: "#3085d6",
      confirmButtonText: "Ok!"
    }).then((result) => {
      if (result.isConfirmed) {
        window.close();
      }
    });
}

window.addEventListener("load", async () => {

    const socket = io();

    socket.on('updateRefunds', (data) => {
        // createTable()
    })

    await createSelects();

    document.querySelector('#loader2').classList.add('d-none')
})