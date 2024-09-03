document.addEventListener('DOMContentLoaded', function() {
    let calendarEl = document.getElementById('calendar');
  
    let calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth', // Exibição inicial
      locale: 'pt-br',

      events: [
        {
          title: 'Evento 1',
          start: '2024-09-10',
          end: '2024-09-12'
        },
        {
          title: 'Evento 2',
          start: '2024-09-15',
        }
      ],
      editable: true, // Permite arrastar e soltar eventos
      selectable: true, // Permite selecionar datas
      dateClick: function(info) {
        alert('Data clicada: ' + info.dateStr);
      },
      // height: '100%',
    });
  
    calendar.render();
  });
  