let sAllCategories, sAllResponsible, sAllDepartments, choicesInstanceEdit;

// Função para listar as categorias do calendario criado na API
async function ListCategory(data) {
  const calendarCategories = document.querySelector('.calendar-categories')
  let divMeetingControl = ''

  for (let i = 0; i < data.length; i++) {
    const item = data[i];

    divMeetingControl += `<div class="row">
                              <div class="col-11 fc-event fc-h-event fc-daygrid-event fc-daygrid-block-event border" style="background-color: ${item.color}; cursor: auto;">
                                  <div class="fc-event-main">${item.name}</div>
                              </div>
                              <div id="${item.id}" class="col-1 fc-event fc-h-event fc-daygrid-event fc-daygrid-block-event border" style="background-color: ${item.color}; cursor: pointer;" onclick="openRegister(this.id)">
                                  <div class="fc-event-main">+</div>
                              </div>
                          </div>`
  }

  calendarCategories.innerHTML = divMeetingControl

}

async function openRegister(data){
  const body = {
      url: `/app/ti/meeting-control/create?categoryId=${data}`,
      width: 1200,
      height: 715,
      resizable: true,
      max: true
  }
  window.ipcRenderer.invoke('open-exWindow', body);
}

async function updateEventDate(info) {
  await makeRequest(`/api/meeting-control/updateEventDate`, 'POST', { id: info.event.id, days: info.delta.days });
}

function registerNewEvent() {
  const body = {
    url: '/app/ti/meeting-control/create',
    width: 1000,
    height: 760,
    resizable: false
  }

  window.ipcRenderer.invoke('open-exWindow', body);
}

async function getAllResponsible(collabId) {
  // carrega os usuarios responsaveis
  const Responsible = await makeRequest(`/api/users/listAllUsers`);

  // Formate o array para ser usado com o Choices.js (Biblioteca)
  const listaDeOpcoes = Responsible.map(function (element) {
      return {
          value: `${element.id_colab}`,
          label: `${element.username + ' ' + element.familyName}`,
          selected: element.id_colab === collabId
      };
  });

  // verifica se o select ja existe, caso exista destroi
  if (sAllResponsible) {
      sAllResponsible.destroy();
  }

  // renderiza o select com as opções formatadas
  sAllResponsible = new Choices('select[name="responsible"]', {
      choices: listaDeOpcoes,
      shouldSort: false,
      removeItemButton: false,
      noChoicesText: 'Não há opções disponíveis',
  });

  sAllResponsible.setChoiceByValue(`${collabId}`)

}

async function getAllDepartments() {
  // carrega os usuarios responsaveis
  const Departments = await makeRequest(`/api/users/getAllDept`);

  // Formate o array para ser usado com o Choices.js
  const listaDeOpcoes = Departments.map(function (element) {
      return {
          value: `${element.id}`,
          label: `${element.name}`,
      };
  });

  // verifica se o select ja existe, caso exista destroi
  if (sAllDepartments) {
      sAllDepartments.destroy();
  }

  // renderiza o select com as opções formatadas
  sAllDepartments = new Choices('select[name="departments"]', {
      choices: listaDeOpcoes,
      shouldSort: false,
      removeItemButton: true,
      noChoicesText: 'Não há opções disponíveis',

  });

}

async function getAllCategories(categoryId) {

  // carrega os usuarios responsaveis
  const categories = await makeRequest(`/api/meeting-control/getAllCategoryCalendar`);

  // Formate o array para ser usado com o Choices.js (Biblioteca)
  const listaDeOpcoes = categories.map(function (element) {
      return {
          value: `${element.id}`,
          label: `${element.name}`,
          selected: element.id === categoryId
      };
  });
  // verifica se o select ja existe, caso exista destroi
  if (sAllCategories) {
      sAllCategories.destroy();
  }
  // renderiza o select com as opções formatadas
  sAllCategories = new Choices('select[name="category"]', {
      choices: listaDeOpcoes,
      shouldSort: false,
      removeItemButton: false,
      noChoicesText: 'Não há opções disponíveis',
  });

  sAllCategories.setChoiceByValue(`${categoryId}`)

  for (let index = 0; index < categories.length; index++) {
    if (categories[index].id == categoryId){
      document.querySelector('.modal-header').style.backgroundColor = categories[index].color;
      document.querySelector('.modal-header').style.backgroundColor = categories[index].color;
    }
  }
}

async function disableOptions(responsibleId, userId) {
  const fields = document.querySelectorAll('.form-control');
  
  fields.forEach(function (field) {
    field.disabled = false;
  });

  if (responsibleId != userId) {
    fields.forEach(function (field) {
      field.disabled = true;
    });
  }
}

async function printEventData(eventId) {

  let data = await makeRequest('/api/meeting-control/getById', 'POST', { id: eventId });
  data = data[0];

  
  const loggedData = await getInfosLogin();
  const collabData = await makeRequest(`/api/meeting-control/getCollabData`, 'POST', loggedData);
  const saveButton = document.querySelector('.updateEventButton');
  saveButton.id = eventId;
  
  await getAllDepartments();
  await getAllCategories(data.id_category);
  await getAllResponsible(data.id_collaborator);
  
  document.querySelector('input[name="title"]').value = data.title;
  document.querySelector('textarea[name="description"]').value = data.description;
  document.querySelector('input[name="timeInit"]').value = data.init_date ? formatDate(data.init_date) : '';
  document.querySelector('input[name="timeEnd"]').value = data.end_date ? formatDate(data.end_date) : '';
  
  let departmentsbyEvent = await makeRequest('/api/meeting-control/getDepartmentsbyEvent', 'POST', {id: eventId});
  
  const departments = departmentsbyEvent.map(department => department.department_id.toString());
  sAllDepartments.setChoiceByValue(departments);
  
  await disableOptions(data.id_collaborator, collabData[0].collabId);

  let modalElement = document.getElementById('add-task');
  let modalInstance = new bootstrap.Modal(modalElement);
  modalInstance.show();
}

function formatDate(value) {
  const dataAtual = value ? new Date(value) : new Date();
  const ano = dataAtual.getFullYear();
  const mes = String(dataAtual.getMonth() + 1).padStart(2, '0');
  const dia = String(dataAtual.getDate()).padStart(2, '0');
  const horas = String(dataAtual.getHours()).padStart(2, '0');
  const minutos = String(dataAtual.getMinutes()).padStart(2, '0');

  return `${ano}-${mes}-${dia} ${horas}:${minutos}`;
}

function updateEvent(id){
  const title = document.querySelector('input[name="title"]').value;
  const responsible = document.querySelector('select[name="responsible"]').value;
  const eventCategory = document.querySelector('select[name="category"]').value;
  const departments = Array.from(document.querySelectorAll('select[name="departments"] option:checked')).map(option => option.value);
  const description = document.querySelector('textarea[name="description"]').value;
  const timeInit = document.querySelector('input[name="timeInit"]').value;
  const timeEnd = document.querySelector('input[name="timeEnd"]').value;

  const eventData = {id, title, responsible, eventCategory, departments, description, timeInit, timeEnd}
  
  makeRequest(`/api/meeting-control/updateEvent`, 'POST', eventData);
}

async function getInfosLogin() {
  const StorageGoogleData = localStorage.getItem('StorageGoogle');
  const StorageGoogle = JSON.parse(StorageGoogleData);

  return StorageGoogle;
};

document.addEventListener('DOMContentLoaded', async function () {

  const categoryCalendar = await makeRequest(`/api/meeting-control/getAllCategoryCalendar`);

  await ListCategory(categoryCalendar);

  const allEvents = await makeRequest(`/api/meeting-control/getAllEvents`)
 
  let calendarEl = document.getElementById('calendar');

  let calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth', // Exibição inicial
    locale: 'pt-br',

    events: allEvents,
    eventDrop: function (info) {
      updateEventDate(info);
    },
    editable: true, // Permite arrastar e soltar eventos
    selectable: true, // Permite selecionar datas
    eventClick: async function (info) {
      await printEventData(info.event.id);
    },
  });

  calendar.render();
});