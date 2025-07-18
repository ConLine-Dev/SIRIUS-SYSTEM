async function getInfosLogin() {
  const StorageGoogleData = localStorage.getItem('StorageGoogle');
  const StorageGoogle = JSON.parse(StorageGoogleData);

  return StorageGoogle;
};

function getLinkParams() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  return id;
}

async function printOcurrenceDetails() {
  const refundId = getLinkParams();
  const getDetails = await makeRequest(`/api/refunds/getDetails`, 'POST', { refundId });

  if (getDetails[0].status == 'Em aberto') {
    document.getElementById('pay').classList.add('d-none');
  }
  if (getDetails[0].status == 'Aprovado') {
    document.getElementById('save').classList.add('d-none');
  }

  // let createDate = new Date(getDetails[0].createDate)
  // createDate = createDate.toLocaleDateString('pt-BR')
  let collabName = `${getDetails[0].name} ${getDetails[0].family_name}`
  let value = getDetails[0].value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  document.getElementById('refundResponsible').value = collabName;
  document.getElementById('refundStatus').value = getDetails[0].status;
  document.getElementById('refundPix').value = getDetails[0].pix;
  document.getElementById('refundCategory').value = getDetails[0].category;
  document.getElementById('refundSubcategory').value = getDetails[0].subcategory;
  document.getElementById('refundValue').value = value;
  document.getElementById('description').value = getDetails[0].description;

  let id = getDetails[0].id;
  let titleId = getDetails[0].title_id;
  let totalValue = getDetails[0].value;
  const getFromTitle = await makeRequest(`/api/refunds/getFromTitle`, 'POST', { id, titleId });
  const divRelatedRefunds = document.getElementById('relatedRefunds');
  let printRelatedRefunds = `<table class="table text-nowrap table-bordered w-100" id="occurrenceTable">
                                <thead>
                                    <tr>
                                        <th scope="col" class="col-1">Categoria</th>
                                        <th scope="col" class="col-1">Subcategoria</th>
                                        <th scope="col" class="col-8">Descrição</th>
                                        <th scope="col" class="col-1">Valor</th>
                                        <th scope="col" class="col-1">Status</th>
                                    </tr>
                                </thead>
                                <tbody>`;

  for (let index = 0; index < getFromTitle.length; index++) {
    totalValue += getFromTitle[index].value;
    let value = getFromTitle[index].value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    printRelatedRefunds += `<tr>
                              <td>${getFromTitle[index].category}</td>
                              <td>${getFromTitle[index].subcategory}</td>
                              <td>${getFromTitle[index].description}</td>
                              <td>${value}</td>
                              <td>${getFromTitle[index].status}</td>
                            </tr>`
  }
  printRelatedRefunds += `<tr>
                            <td></td>
                            <td></td>
                            <td style="display: flex; justify-content: center; font-weight: bold;">Valor Total: ${totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                            <td></td>
                            <td></td>
                          </tr></tbody></table>`;
  divRelatedRefunds.innerHTML = printRelatedRefunds;

  const attachments = await makeRequest(`/api/refunds/getAttachments`, 'POST', { titleId });
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

async function update() {
  const refundId = getLinkParams();
  let input1;
  let input2;

  const swalWithBootstrapButtons = Swal.mixin({
    customClass: {
      confirmButton: "btn btn-success",
      cancelButton: "btn btn-danger"
    },
    buttonsStyling: false
  });
  swalWithBootstrapButtons.fire({
    title: "Deseja aprovar o pedido?",
    text: "Após isso ele será enviado para pagamento",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Aprovar",
    cancelButtonText: "Reprovar",
    reverseButtons: true
  }).then((result) => {
    if (result.isConfirmed) {
      swalWithBootstrapButtons.fire({
        title: "Aprovado",
        text: "O pedido foi liberado para pagamento.",
        icon: "success"
      }).then(() => {
        makeRequest(`/api/refunds/approveRefund`, 'POST', { refundId });
        window.close();
      });
    } else if (result.dismiss === Swal.DismissReason.cancel) {
      Swal.fire({
        title: 'Editar pedido',
        html:
          '<input id="input1" class="swal2-input" placeholder="Novo valor">' +
          '<input id="input2" class="swal2-input" placeholder="Observações">',
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Salvar',
        cancelButtonText: 'Cancelar',
        preConfirm: () => {
          input1 = document.getElementById('input1').value;
          input2 = document.getElementById('input2').value;
          if (!input1 || !input2) {
            Swal.showValidationMessage('Preencha todos os campos!');
            return false;
          }
          return { input1, input2 };
        }
      }).then((result) => {
        if (result.isConfirmed) {
          const { input1, input2 } = result.value;
          makeRequest(`/api/refunds/approveRefund`, 'POST', { refundId, input1, input2 });
          window.close();
        }
      });
    }
  });
}

async function pay() {
  const body = {
    url: `/app/financial/refunds/create`,
    width: 1300,
    height: 675,
    resizable: false,
    max: false
  }
  window.ipcRenderer.invoke('open-exWindow', body);
}

document.addEventListener('DOMContentLoaded', async function () {

  // const socket = io();

  // socket.on('updateCalendarEvents', (data) => {
  //   calendar.refetchEvents();
  // })

  await printOcurrenceDetails()

  document.querySelector('#loader2').classList.add('d-none')
});