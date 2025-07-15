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

  // let createDate = new Date(getDetails[0].createDate)
  // createDate = createDate.toLocaleDateString('pt-BR')
  let collabName = `${getDetails[0].name} ${getDetails[0].family_name}`
  let value = getDetails[0].value.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
  document.getElementById('refundResponsible').value = collabName;
  document.getElementById('refundStatus').value = getDetails[0].status;
  document.getElementById('refundPix').value = getDetails[0].pix;
  document.getElementById('refundCategory').value = getDetails[0].category;
  document.getElementById('refundSubcategory').value = getDetails[0].subcategory;
  document.getElementById('refundValue').value = value;
  document.getElementById('description').value = getDetails[0].description;

  let id = getDetails[0].id;
  let titleId = getDetails[0].title_id;

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
    let value = getFromTitle[index].value.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
    printRelatedRefunds += `<tr>
                              <td>${getFromTitle[index].category}</td>
                              <td>${getFromTitle[index].subcategory}</td>
                              <td>${getFromTitle[index].description}</td>
                              <td>${value}</td>
                              <td>${getFromTitle[index].status}</td>
                            </tr>`
  }
  printRelatedRefunds += `</tbody></table>`;
  divRelatedRefunds.innerHTML = printRelatedRefunds;

  const attachments = await makeRequest(`/api/refunds/getAttachments`, 'POST', { titleId });
  const divAttachments = document.getElementById('attachments');
  let printAttachments = '';

  for (let index = 0; index < attachments.length; index++) {
    let fileName = attachments[index].file;
    let fileUrl = `/uploads/refunds-attachments/${fileName}`;
    printAttachments += `
            <div class="mt-sm-0 mt-2 col-3" style="margin: 10px">
                <span class="bg-primary-transparent fw-semibold mx-1">Anexo ${index+1}</span>
                <a href="${fileUrl}" class="btn btn-icon btn-sm btn-success" title="Baixar" download><i class="ri-download-2-line"></i></a>
                <a href="${fileUrl}" class="btn btn-icon btn-sm btn-info" title="Visualizar" target="_blank"><i class="ri-eye-line"></i></a>
            </div>`
  }
  divAttachments.innerHTML = printAttachments;
}

document.addEventListener('DOMContentLoaded', async function () {

  // const socket = io();

  // socket.on('updateCalendarEvents', (data) => {
  //   calendar.refetchEvents();
  // })

  await printOcurrenceDetails()

  document.querySelector('#loader2').classList.add('d-none')
});