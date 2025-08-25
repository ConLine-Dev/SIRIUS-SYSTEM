async function getInfosLogin() {
    const StorageGoogleData = localStorage.getItem('StorageGoogle');
    const StorageGoogle = JSON.parse(StorageGoogleData);

    return StorageGoogle;
};

async function createCategories() {
    const category = document.getElementById('category');
    const categories = await makeRequest(`/api/refunds/getCategories`);

    for (let index = 0; index < categories.length; index++) {
        const option = document.createElement("option");
        option.value = categories[index].id;
        option.text = categories[index].description;
        category.appendChild(option);
    }
}



//   for (let index = 0; index < newFile.length; index++) {
//     if (newFile[index].files[0]) {
//       formData.append('fileList', newFile[index].files[0]);
//     }
//   }

async function saveRefund() {

    let title = document.getElementById('title').value;
    let pix = document.getElementById('pix').value;

    let category = []
    let subcategory = []
    let description = []
    let value = []
    let categories = document.querySelectorAll('.category')
    let subcategories = document.querySelectorAll('.subcategory')
    let descriptions = document.querySelectorAll('.description');
    let values = document.querySelectorAll('.value');
    let userData = await getInfosLogin();
    let collabId = userData.system_collaborator_id
    let newFile = document.querySelectorAll('.newFile');

    let allFiles = [];
    for (let i = 0; i < newFile.length; i++) {
        let files = newFile[i].files;
        for (let j = 0; j < files.length; j++) {
            allFiles.push(files[j]);
        }
    }
        for (let index = 0; index < contador - 1; index++) {
        category[index] = categories[index].value
        subcategory[index] = subcategories[index].value
        description[index] = descriptions[index].value
        value[index] = values[index].value
    }

    const formData = new FormData();

    formData.append('title', title);
    formData.append('pix', pix);
    formData.append('collabId', collabId);

    category.forEach((cat, index) => {
        formData.append(`category[${index}]`, cat);
    });
    subcategory.forEach((subcat, index) => {
        formData.append(`subcategory[${index}]`, subcat);
    });
    description.forEach((desc, index) => {
        formData.append(`description[${index}]`, desc);
    });
    value.forEach((val, index) => {
        formData.append(`value[${index}]`, val);
    });

    allFiles.forEach((file, index) => {
        formData.append('files[]', file);
    });

    await makeRequest(`/api/refunds/upload`, 'POST', formData);
    
    Swal.fire({
        title: "Pedido Registrado!",
        text: "Dados já enviados para aprovação e seguimento dos responsáveis.",
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

let contador = 1;

function addRow() {
    const tabela = document.getElementById("minhaTabela").getElementsByTagName("tbody")[0];
    const novaLinha = tabela.insertRow();

    const celula1 = novaLinha.insertCell(0);
    const celula2 = novaLinha.insertCell(1);
    const celula3 = novaLinha.insertCell(2);
    const celula4 = novaLinha.insertCell(3);
    const celula5 = novaLinha.insertCell(4);
    const celula6 = novaLinha.insertCell(5); // célula do botão X

    celula1.textContent = contador;
    celula2.innerHTML = `<select class="category form-control me-2 intro-search-user-ticket">
                            <option value="0">Selecione</option>
                            <option value="1">Alimentação</option>
                            <option value="2">Hospedagem</option>
                            <option value="3">Deslocamento</option>
                            <option value="4">Extras Clientes</option>
                            <option value="5">Administrativo</option>
                        </select>`;
    celula3.innerHTML = `<select class="subcategory form-control me-2 intro-search-user-ticket"></select>`;
    celula4.innerHTML = `<input type="text" class="description form-control me-2 intro-search-user-ticket">`;
    celula5.innerHTML = `<input type="text" class="value form-control me-2 intro-search-user-ticket">`;

    // botão de excluir
    celula6.innerHTML = `<button class="btn btn-danger btn-sm" onclick="deleteRow(this)">X</button>`;

    contador++;
}

function deleteRow(botao) {
    const linha = botao.closest("tr"); // pega a linha do botão
    linha.remove(); // remove a linha
}

function formatFileName(name) {

    const now = new Date();

    // Formata a data e hora
    const pad = num => String(num).padStart(2, '0');
    const formattedDate = [
        now.getFullYear(),
        pad(now.getMonth() + 1),
        pad(now.getDate())
    ].join('-');

    const formattedHour = [
        pad(now.getHours()),
        pad(now.getMinutes()),
        pad(now.getSeconds())
    ].join(':');

    let fileName = `${formattedDate}_${formattedHour}_${name}`;
    return fileName;
}

function openWindow(url, width, height) {
    window.open(url, '_blank', `width=${width},height=${height},resizable=yes,scrollbars=yes`);
}

document.addEventListener('DOMContentLoaded', async function () {

    // const socket = io();

    // socket.on('updateCalendarEvents', (data) => {
    //   calendar.refetchEvents();
    // })

    // await createCategories()

    $('#minhaTabela').on('change', '.category', async function () {
        const categoryId = $(this).val();
        const linha = $(this).closest('tr');
        const subcategory = linha.find('.subcategory')[0]; // pega o select da subcategoria nessa linha

        subcategory.innerHTML = ''; // limpa o select

        const subcategories = await makeRequest(`/api/refunds/getSubcategories`, 'POST', { categoryId });

        for (let i = 0; i < subcategories.length; i++) {
            const option = document.createElement("option");
            option.value = subcategories[i].id;
            option.text = subcategories[i].description;
            subcategory.appendChild(option);
        }
    });

    document.querySelector('#loader2').classList.add('d-none')
});