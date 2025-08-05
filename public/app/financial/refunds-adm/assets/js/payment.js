function getLinkParams() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    return id;
}

async function printOcurrenceDetails() {
    const titleId = getLinkParams();
    const getToPay = await makeRequest(`/api/refunds/getToPay`, 'POST', { titleId });

    let collabName = `${getToPay[0].name} ${getToPay[0].family_name}`

    document.getElementById('refundResponsible').value = collabName;
    document.getElementById('refundPix').value = getToPay[0].pix;
    document.getElementById('refundTitle').value = getToPay[0].title;

    await printTable(getToPay); // renderiza a tabela uma vez

    const checkboxes = document.querySelectorAll('.valueSelect');

    // Adiciona evento para atualizar o total dinamicamente
    checkboxes.forEach((checkbox) => {
        checkbox.addEventListener('change', updateTotal);
    });

    const attachments = await makeRequest(`/api/refunds/getAttachments`, 'POST', { refundId: titleId });
    const divAttachments = document.getElementById('attachments');
    let printAttachments = '';

    for (let index = 0; index < attachments.length; index++) {
        let fileName = attachments[index].file;
        let fileUrl = `/uploads/refunds-attachments/${fileName}`;
        printAttachments += `
            <div class="mt-sm-0 mt-2 col-3" style="margin: 10px">
                <span class="bg-primary-transparent fw-semibold mx-1">Anexo ${index + 1}</span>
                <a href="${fileUrl}" class="btn btn-icon btn-sm btn-success" title="Baixar" download><i class="ri-download-2-line"></i></a>
                <a href="${fileUrl}" class="btn btn-icon btn-sm btn-info" title="Visualizar" target="_blank"><i class="ri-eye-line"></i></a>
            </div>`
    }
    divAttachments.innerHTML = printAttachments;
}

async function printTable(getToPay) {
    const divRelatedRefunds = document.getElementById('relatedRefunds');
    let printRelatedRefunds = `<table class="table text-nowrap table-bordered w-100" id="occurrenceTable">
                                <thead>
                                    <tr>
                                        <th scope="col"></th>
                                        <th scope="col">Categoria</th>
                                        <th scope="col">Subcategoria</th>
                                        <th scope="col">Descrição</th>
                                        <th scope="col">Valor</th>
                                    </tr>
                                </thead>
                                <tbody>`;

    for (let index = 0; index < getToPay.length; index++) {
        let value = getToPay[index].value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        printRelatedRefunds += `<tr>
                                <td><input type="checkbox" class="valueSelect" id="${getToPay[index].id}"></td>
                                <td>${getToPay[index].category}</td>
                                <td>${getToPay[index].subcategory}</td>
                                <td>${getToPay[index].description}</td>
                                <td>${value}</td>
                            </tr>`
    }

    printRelatedRefunds += `<tr>
                            <td colspan="4" style="text-align: right; font-weight: bold;">Valor Total:</td>
                            <td id="valorTotalSelecionado">R$ 0,00</td>
                          </tr></tbody></table>`;

    divRelatedRefunds.innerHTML = printRelatedRefunds;
}

function updateTotal() {
    const checkboxes = document.querySelectorAll('.valueSelect');
    let total = 0;

    checkboxes.forEach((cb) => {
        if (cb.checked) {
            const row = cb.closest('tr');
            const valueText = row.querySelectorAll('td')[4].textContent.trim();
            const numericValue = parseFloat(valueText.replace(/[R$\s.]/g, '').replace(',', '.'));
            total += numericValue;
        }
    });

    // Atualiza apenas o campo do total
    const totalCell = document.getElementById('valorTotalSelecionado');
    totalCell.textContent = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function confirmPayment() {
    const checkboxes = document.querySelectorAll('.valueSelect');
    let total = 0;
    let selectedLines = [];

    checkboxes.forEach((cb) => {
        if (cb.checked) {
            const row = cb.closest('tr');
            const valueText = row.querySelectorAll('td')[4].textContent.trim();
            const numericValue = parseFloat(valueText.replace(/[R$\s.]/g, '').replace(',', '.'));
            total += numericValue;
            selectedLines.push(cb.id);
        }
    });

    if (total === 0) {
        Swal.fire({
            icon: "error",
            title: "Calma aí!",
            text: "Você precisa selecionar pelo menos um custo.",
        });
        return;
    }

    const valorFormatado = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    Swal.fire({
        title: `Deseja seguir com o pagamento de ${valorFormatado}?`,
        showDenyButton: true,
        showCancelButton: false,
        confirmButtonText: "Sim",
        denyButtonText: `Ainda não`
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire({
                title: "Confirmado!",
                html: `Anexe o comprovante de pagamento:<br><br>
                   <input type="file" id="paymentFile" class="form-control newFile">`,
                icon: "success",
                confirmButtonText: "OK"
            }).then(() => {
                // Aqui você pode acessar o(s) arquivo(s) depois do OK, se quiser
                const file = document.getElementById("paymentFile").files[0];
                const titleId = getLinkParams();
                const formData = new FormData();
                formData.append("file", file);
                formData.append("titleId", titleId);
                formData.append("selectedLines", JSON.stringify(selectedLines));
                fetch('/api/refunds/savePayment', { method: 'POST', body: formData });
                Swal.fire({
                    title: "Confirmado!",
                    text: "Enviamos a confirmação do pagamento ao solicitante.",
                    icon: "success",
                    confirmButtonText: "OK"
                }).then(() => {
                    window.close();
                });
            });
        }
    });

}

document.addEventListener('DOMContentLoaded', async function () {

    // const socket = io();

    // socket.on('updateCalendarEvents', (data) => {
    //   calendar.refetchEvents();
    // })

    await printOcurrenceDetails();

    document.querySelector('#loader2').classList.add('d-none')
});