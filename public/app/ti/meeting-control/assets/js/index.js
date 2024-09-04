async function ListCategory(data) {
  const calendarCategories = document.querySelector('.calendar-categories')
  let divMeetingControl = ''

  for (let i = 0; i < data.length; i++) {
    const item = data[i];

    divMeetingControl += `<div class="fc-event fc-h-event fc-daygrid-event fc-daygrid-block-event border" style="background-color: ${item.color};">
                                <div class="fc-event-main">${item.name}</div>
                            </div>`
    
  }

  calendarCategories.innerHTML = divMeetingControl

}


document.addEventListener('DOMContentLoaded', async function() {

  const categoryCalendar = await makeRequest(`/api/meeting-control/getAllCategoryCalendar`, 'POST');
  console.log(categoryCalendar)

  await ListCategory(categoryCalendar)



    // let calendarEl = document.getElementById('calendar');
  
    // let calendar = new FullCalendar.Calendar(calendarEl, {
    //   initialView: 'dayGridMonth', // Exibição inicial
    //   locale: 'pt-br',

    //   events: [
    //     {
    //       title: 'Evento 1',
    //       start: '2024-09-10',
    //       end: '2024-09-12',
    //       color: '#ff0000'
    //     },
    //     {
    //       title: 'Evento 2',
    //       start: '2024-09-15',
    //     }
    //   ],
    //   // eventColor: '#ff0000',
    //   editable: true, // Permite arrastar e soltar eventos
    //   selectable: true, // Permite selecionar datas
    //   dateClick: function(info) {
    //     alert('Data clicada: ' + info.dateStr);
    //   },
    //   // height: '100%',
    // });
  
    // calendar.render();
  });
  