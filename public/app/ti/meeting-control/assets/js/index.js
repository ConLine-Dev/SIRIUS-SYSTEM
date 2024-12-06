let sAllCategories, sAllResponsible, sAllDepartments, sAllResponsibles2, choicesInstanceEdit, calendar;

let modalElement = document.getElementById('add-task');
let modalInstance = new bootstrap.Modal(modalElement);

// Função para listar as categorias do calendario criado na API
async function ListCategory(data) {
  const calendarCategories = document.querySelector('.calendar-categories')
  let divMeetingControl = ''

  for (let i = 0; i < data.length; i++) {
    const item = data[i];

    divMeetingControl += `<div class="row">
                              <div id="${item.id}" class="col-11 fc-event fc-h-event fc-daygrid-event fc-daygrid-block-event border" style="background-color: ${item.color}; cursor: pointer;" onclick="printEventsList(this.id, 'category')">
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

async function getAllResponsibles2() {
  // carrega os usuarios responsaveis
  const Responsible = await makeRequest(`/api/users/listAllUsers`);

  // Formate o array para ser usado com o Choices.js (Biblioteca)
  const listaDeOpcoes = Responsible.map(function (element) {
      return {
          value: `${element.id_colab}`,
          label: `${element.username + ' ' + element.familyName}`,
      };
  });

  // verifica se o select ja existe, caso exista destroi
  if (sAllResponsibles2) {
      sAllResponsibles2.destroy();
  }

  // renderiza o select com as opções formatadas
  sAllResponsibles2 = new Choices('select[name="responsibles"]', {
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

  for (let index = 0; index < fields.length; index++) {
    const element = fields[index];
    element.disabled = false;
  }
  
  if (responsibleId != userId) {
    for (let index = 0; index < fields.length; index++) {
      const element = fields[index];
      element.disabled = true;
    }
  }
}

async function printEventData(eventId) {

  let data = await makeRequest('/api/meeting-control/getById', 'POST', { id: eventId });
  data = data[0];

  const loggedData = await getInfosLogin();
  const collabData = await makeRequest(`/api/meeting-control/getCollabData`, 'POST', loggedData);
  const deleteButton = document.querySelector('.deleteEventButton');
  const saveButton = document.querySelector('.updateEventButton');
  saveButton.id = eventId;
  deleteButton.id = eventId;

  await getAllDepartments();
  await getAllResponsibles2();
  await getAllCategories(data.id_category);
  await getAllResponsible(data.id_collaborator);
  
  document.querySelector('input[name="title"]').value = data.title;
  document.querySelector('textarea[name="description"]').value = data.description;
  document.querySelector('input[name="timeInit"]').value = data.init_date ? formatDate(data.init_date) : '';
  document.querySelector('input[name="timeEnd"]').value = data.end_date ? formatDate(data.end_date) : '';
  
  let departmentsbyEvent = await makeRequest('/api/meeting-control/getDepartmentsbyEvent', 'POST', {id: eventId});
  let responsiblesbyEvent = await makeRequest('/api/meeting-control/getResponsiblesbyEvent', 'POST', {id: eventId});

  const departments = departmentsbyEvent.map(department => department.department_id.toString());
  sAllDepartments.setChoiceByValue(departments);

  const responsibles = responsiblesbyEvent.map(responsible => responsible.collaborator_id.toString());
  sAllResponsibles2.setChoiceByValue(responsibles);

  await disableOptions(data.id_collaborator, collabData[0].collabId);

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

async function updateEvent(id){
  const title = document.querySelector('input[name="title"]').value;
  const responsible = document.querySelector('select[name="responsible"]').value;
  const eventCategory = document.querySelector('select[name="category"]').value;
  const departments = Array.from(document.querySelectorAll('select[name="departments"] option:checked')).map(option => option.value);
  const responsibles = Array.from(document.querySelectorAll('select[name="responsibles"] option:checked')).map(option2 => option2.value);
  const description = document.querySelector('textarea[name="description"]').value;
  const timeInit = document.querySelector('input[name="timeInit"]').value;
  const timeEnd = document.querySelector('input[name="timeEnd"]').value;

  const eventData = {id, title, responsible, eventCategory, departments, responsibles, description, timeInit, timeEnd}
  
  await makeRequest(`/api/meeting-control/updateEvent`, 'POST', eventData);

  calendar.destroy();
  await initializeCalendar()
  modalInstance.hide();
}

async function deleteEvent(id){

  await makeRequest(`/api/meeting-control/deleteEvent`, 'POST', {id: id});

  calendar.destroy();
  await initializeCalendar()
  modalInstance.hide();

}

async function printEventsList(date, param){
  const eventsList = document.querySelector('#eventsList');
  let divEventsList = ''
  const eventsTitle = document.querySelector('#eventsTitle');
  let divEventsTitle = '';

  const categoryCalendar = await makeRequest(`/api/meeting-control/getAllCategoryCalendar`);
  const allEvents = await makeRequest(`/api/meeting-control/getAllEventsFull`);

  if (param == 'day') { 

    divEventsTitle = `<h6 class="fw-semibold">Eventos do dia:</h6>`

    for (let index = 0; index < allEvents.length; index++) {
      if (allEvents[index].start == date){
        let datetime = formatDateTime(allEvents[index].init_date, allEvents[index].end_date);
        divEventsList += `<li>
                            <div class="d-flex align-items-center justify-content-between flex-wrap">
                              <p class="mb-1 fw-semibold"> ${datetime.formattedDate} </p>
                              <span class="badge bg-light text-default mb-1"> ${datetime.formattedTime} </span>
                            </div>
                            <p class="mb-0 text-muted fs-12" style="color:${allEvents[index].color}!important"> ${allEvents[index].category} </p>
                          </li>`
      }
    }
  }
  
  if (param == 'category') {
    const category = date;
    const actualMonth = new Date().getMonth() + 1;
    

    for (let index = 0; index < categoryCalendar.length; index++) {
      if(categoryCalendar[index].id == category) {
        divEventsTitle = `<h6 class="fw-semibold">${categoryCalendar[index].name} do mês:</h6>`
      } 
    }
    for (let index = 0; index < allEvents.length; index++) {
      if (allEvents[index].id_category == category) {
        const eventMonth = new Date(allEvents[index].start).getMonth() + 1;
        if (eventMonth == actualMonth) {
          let datetime = formatDateTime(allEvents[index].init_date, allEvents[index].end_date);
          divEventsList += `<li>
                              <div class="d-flex align-items-center justify-content-between flex-wrap">
                                <p class="mb-1 fw-semibold"> ${datetime.formattedDate} </p>
                                <span class="badge bg-light text-default mb-1"> ${datetime.formattedTime} </span>
                              </div>
                              <p class="mb-0 text-muted fs-12" style="color:${allEvents[index].color}!important"> ${allEvents[index].category} </p>
                            </li>`
        }
      }
    }
  }
  eventsTitle.innerHTML = divEventsTitle;
  eventsList.innerHTML = divEventsList;
}

function formatDateTime(initDate, endDate) {
  const optionsDate = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };

  const optionsTime = {
    hour: '2-digit',
    minute: '2-digit',
  };

  const init = new Date(initDate);
  const end = new Date(endDate);

  const formattedDate = init.toLocaleDateString('pt-BR', optionsDate);
  const startTime = init.toLocaleTimeString('pt-BR', optionsTime);
  const endTime = end.toLocaleTimeString('pt-BR', optionsTime);

  return {
    formattedDate,
    formattedTime: `${startTime} - ${endTime}`
  };
}

async function initializeCalendar(){

  const loggedData = await getInfosLogin();

  let calendarEl = document.getElementById('calendar');
  calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    locale: 'pt-br',
    editable: true,
    selectable: true,
    events: async function (fetchInfo, successCallback, failureCallback) {
      const loggedData = await getInfosLogin();
      const events = await makeRequest(`/api/meeting-control/getEventsByUser`, 'POST', loggedData);
      successCallback(events);
    },
    eventDrop: function (info) {
      updateEventDate(info);
    },
    eventClick: async function (info) {
      await printEventData(info.event.id);
    },
    dateClick: function (info) {
      printEventsList(info.dateStr, 'day');
    }
  });

  calendar.render();
}

async function getInfosLogin() {
  const StorageGoogleData = localStorage.getItem('StorageGoogle');
  const StorageGoogle = JSON.parse(StorageGoogleData);

  return StorageGoogle;
};

function initializeDatePicker() {
  flatpickr(".targetDate", {
      enableTime: true,
      dateFormat: "Y-m-d H:i",
  });
}

document.addEventListener('DOMContentLoaded', async function () {

  introMain();

  const categoryCalendar = await makeRequest(`/api/meeting-control/getAllCategoryCalendar`);

  const socket = io();

  socket.on('updateCalendarEvents', (data) => {
    calendar.refetchEvents();
  })

  let date = new Date();
  date = formatDate(date);
  date = date.split(" ")[0];
  await printEventsList(date, 'day');

  initializeDatePicker();
  await ListCategory(categoryCalendar);
  await initializeCalendar();

});