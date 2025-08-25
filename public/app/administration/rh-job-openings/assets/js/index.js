(function(){
  const apiBase = '/api/hr-job-openings';
  let meta = null;
  let socket = null;

  // Inicializar Socket.IO
  function initializeSocket() {
    socket = io();
    
    console.log('Socket.IO inicializado para RH Job Openings');
    
    // Event listeners do Socket.IO
    socket.on('hr:job_created', (data) => {
      console.log('Nova vaga criada:', data);
      showNotification(`Nova vaga criada: ${data.title}`, 'success');
      loadBoard(); // Recarregar board
    });
    
    socket.on('hr:job_updated', (data) => {
      console.log('Vaga atualizada:', data);
      showNotification(`Vaga atualizada: ${data.title}`, 'info');
      loadBoard(); // Recarregar board
    });
    
    socket.on('hr:job_deleted', (data) => {
      console.log('Vaga removida:', data);
      showNotification(`Vaga removida: ${data.title}`, 'warning');
      loadBoard(); // Recarregar board
    });
    
    socket.on('hr:application_created', (data) => {
      console.log('Novo candidato criado:', data);
      showNotification(`Novo candidato: ${data.candidate_name}`, 'success');
      // Se estiver na página de visualização da vaga, recarregar
      const currentJobId = new URLSearchParams(window.location.search).get('jobId');
      if (currentJobId && currentJobId == data.job_id) {
        // Recarregar board de candidatos se estiver na página de visualização
        if (typeof loadApplicationsBoard === 'function') {
          loadApplicationsBoard();
        }
      }
    });
    
    socket.on('hr:public_application_created', (data) => {
      console.log('Nova candidatura pública:', data);
      showNotification(`Nova candidatura via site: ${data.candidate_name} - ${data.job_title}`, 'success');
      // Se estiver na página de visualização da vaga, recarregar
      const currentJobId = new URLSearchParams(window.location.search).get('jobId');
      if (currentJobId && currentJobId == data.job_id) {
        // Recarregar board de candidatos se estiver na página de visualização
        if (typeof loadApplicationsBoard === 'function') {
          loadApplicationsBoard();
        }
      }
    });
    
    socket.on('hr:application_deleted', (data) => {
      console.log('Candidato removido:', data);
      showNotification(`Candidato removido: ${data.candidate_name}`, 'warning');
      // Se estiver na página de visualização da vaga, recarregar
      const currentJobId = new URLSearchParams(window.location.search).get('jobId');
      if (currentJobId && currentJobId == data.job_id) {
        // Recarregar board de candidatos se estiver na página de visualização
        if (typeof loadApplicationsBoard === 'function') {
          loadApplicationsBoard();
        }
      }
    });
    
    socket.on('hr:internal_note_added', (data) => {
      console.log('Nova nota interna:', data);
      showNotification(`Nova observação interna adicionada`, 'info');
      // Se estiver na página de visualização do candidato, recarregar
      const currentApplicationId = new URLSearchParams(window.location.search).get('applicationId');
      if (currentApplicationId && currentApplicationId == data.application_id) {
        // Recarregar notas se estiver na página de visualização
        if (typeof loadInternalNotes === 'function') {
          loadInternalNotes();
        }
      }
    });
    
    socket.on('hr:internal_note_removed', (data) => {
      console.log('Nota interna removida:', data);
      showNotification(`Observação interna removida`, 'warning');
      // Se estiver na página de visualização do candidato, recarregar
      if (typeof loadInternalNotes === 'function') {
        loadInternalNotes();
      }
    });
    
    socket.on('hr:attachment_added', (data) => {
      console.log('Novo anexo adicionado:', data);
      showNotification(`Novo anexo: ${data.file_name}`, 'success');
      // Se estiver na página de visualização do candidato, recarregar
      const currentApplicationId = new URLSearchParams(window.location.search).get('applicationId');
      if (currentApplicationId && currentApplicationId == data.application_id) {
        // Recarregar anexos se estiver na página de visualização
        if (typeof loadAttachments === 'function') {
          loadAttachments();
        }
      }
    });
    
    socket.on('hr:attachment_removed', (data) => {
      console.log('Anexo removido:', data);
      showNotification(`Anexo removido: ${data.file_name}`, 'warning');
      // Se estiver na página de visualização do candidato, recarregar
      if (typeof loadAttachments === 'function') {
        loadAttachments();
      }
    });
    
    socket.on('hr:settings_item_created', (data) => {
      console.log('Item de configuração criado:', data);
      showNotification(`Novo ${data.table.replace('hr_', '')}: ${data.name}`, 'success');
      // Recarregar metadados se necessário
      loadMeta();
    });
    
    socket.on('hr:settings_item_updated', (data) => {
      console.log('Item de configuração atualizado:', data);
      showNotification(`${data.table.replace('hr_', '')} atualizado: ${data.name}`, 'info');
      // Recarregar metadados se necessário
      loadMeta();
    });
    
    socket.on('hr:settings_item_deleted', (data) => {
      console.log('Item de configuração removido:', data);
      showNotification(`${data.table.replace('hr_', '')} removido: ${data.name}`, 'warning');
      // Recarregar metadados se necessário
      loadMeta();
    });

    socket.on('hr:application_reassigned', (data) => {
      console.log('Candidato remanejado:', data);
      showNotification(`Candidato ${data.candidate_name} remanejado de "${data.old_job_title}" para "${data.new_job_title}"`, 'info');
      loadBoard();
    });
    
    socket.on('disconnect', () => {
      console.log('Socket.IO desconectado');
    });
  }

  // Função para mostrar notificações
  function showNotification(message, type = 'info') {
    const toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true
    });
    
    toast.fire({
      icon: type,
      title: message
    });
  }

  function toBr(ymd){ if(!ymd) return ''; const [y,m,d]=ymd.split('-'); return `${d}/${m}/${y}`; }
  function openWindow(url, w=1100, h=700){ const left=(screen.width-w)/2; const top=(screen.height-h)/2; window.open(url,'_blank',`width=${w},height=${h},left=${left},top=${top},resizable=yes,scrollbars=yes`); }

  async function deleteJob(jobId, jobTitle) {
    const result = await Swal.fire({
      title: 'Confirmar exclusão',
      text: `Tem certeza que deseja excluir a vaga "${jobTitle}"? Esta ação não pode ser desfeita.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sim, excluir',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`${apiBase}/${jobId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
          await Swal.fire({
            icon: 'success',
            title: 'Vaga excluída!',
            text: 'A vaga foi excluída com sucesso.',
            timer: 1500,
            showConfirmButton: false
          });
          await loadBoard(); // Recarregar o board
        } else {
          const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
          throw new Error(errorData.message);
        }
      } catch (error) {
        console.error('Erro ao excluir vaga:', error);
        Swal.fire({
          icon: 'error',
          title: 'Erro ao excluir vaga',
          text: error.message || 'Ocorreu um erro ao excluir a vaga.'
        });
      }
    }
  }

  async function fetchBoard(){ const res = await fetch(`${apiBase}/board`); if(!res.ok) throw new Error('Falha ao carregar board'); return res.json(); }
  async function fetchMeta(){ const r = await fetch(`${apiBase}/meta`); return r.json(); }

  function fillSelect(sel, items, placeholder){
    const el = document.getElementById(sel); if(!el) return;
    el.innerHTML = '';
    const opt0 = document.createElement('option'); opt0.value=''; opt0.textContent = placeholder || 'Todos'; el.appendChild(opt0);
    (items||[]).forEach(i=>{ const o=document.createElement('option'); o.value=i.id; o.textContent=i.name; el.appendChild(o); });
    if(el.hasAttribute('data-choices')) new Choices(el, { searchEnabled:true, itemSelectText:'', noResultsText:'Sem resultados' });
  }

  function matchesFilters(card, filters){
    // Filtros simples baseados nos dados no DOM (data-attrs no card)
    const dep = card.getAttribute('data-department');
    const loc = card.getAttribute('data-location');
    const mod = card.getAttribute('data-modality');
    const status = card.closest('.jobs-col')?.querySelector('.col-header')?.textContent || '';
    const text = card.innerText.toLowerCase();

    if(filters.keyword && !text.includes(filters.keyword.toLowerCase())) return false;
    if(filters.department && String(filters.department)!==String(dep)) return false;
    if(filters.location && String(filters.location)!==String(loc)) return false;
    if(filters.modality && String(filters.modality)!==String(mod)) return false;
    if(filters.status && status.toLowerCase().indexOf(filters.status.toLowerCase()) === -1) return false;
    return true;
  }

  function applyFilters(){
    const filters = {
      keyword: document.getElementById('filter-keyword').value.trim(),
      department: document.getElementById('filter-department').value,
      location: document.getElementById('filter-location').value,
      modality: document.getElementById('filter-modality').value,
      status: document.getElementById('filter-status').value
    };
    let visibleCount = 0;
    document.querySelectorAll('.job-card').forEach(card => {
      const ok = matchesFilters(card, filters);
      card.style.display = ok ? '' : 'none';
      if(ok) visibleCount++;
    });
    document.getElementById('jobs-count-display').textContent = `${visibleCount} vagas encontradas`;
  }

  function renderBoard(board){
    const wrap = document.getElementById('jobsBoard');
    wrap.innerHTML='';
    const columns = board || [];

    columns.forEach(col => {
      const colEl = document.createElement('div');
      colEl.className = 'jobs-col';
      colEl.innerHTML = `<div class="col-header">${col.status_label}</div><div class=\"droptarget\" data-status=\"${col.status}\"></div>`;
      const zone = colEl.querySelector('.droptarget');

      (col.jobs || []).forEach(job => {
        const card = document.createElement('div');
        card.className = 'job-card';
        card.draggable = true;
        card.setAttribute('data-job-id', job.id);
        // guardar IDs para filtros
        card.setAttribute('data-department', job.department_id || '');
        card.setAttribute('data-location', job.location_id || '');
        card.setAttribute('data-modality', job.modality_id || '');
        card.innerHTML = `
          <div class="fw-bold text-truncate" title="${job.title}">${job.title}</div>
          <div class="job-meta">${job.department_name} • ${job.location_name}</div>
          <div class="d-flex justify-content-between align-items-center mt-1">
            <span class="job-meta"><i class="ri-calendar-line me-1"></i>${toBr(job.posted_at_ymd)}</span>
            <span class="badge bg-secondary">${job.applications_count} candidatos</span>
          </div>
          <div class="d-flex gap-2 mt-2">
            <button class="btn btn-light btn-sm" data-action="view" data-id="${job.id}"><i class="ri-eye-line"></i></button>
            <button class="btn btn-primary btn-sm" data-action="edit" data-id="${job.id}"><i class="ri-edit-line"></i></button>
            <button class="btn btn-danger btn-sm" data-action="delete" data-id="${job.id}"><i class="ri-delete-bin-line"></i></button>
          </div>
        `;
        card.addEventListener('dragstart', ev => { ev.dataTransfer.setData('text/plain', JSON.stringify({ jobId: job.id })); });
        zone.appendChild(card);
      });

      zone.addEventListener('dragover', ev => ev.preventDefault());
      zone.addEventListener('drop', async ev => {
        ev.preventDefault();
        const data = JSON.parse(ev.dataTransfer.getData('text/plain'));
        const toStatus = zone.getAttribute('data-status');
        const jobId = data.jobId;
        
        // Encontrar o card que está sendo movido
        const card = document.querySelector(`[data-job-id="${jobId}"]`);
        if (!card) return;
        
        // OTIMISTIC UPDATE: Mover o card imediatamente
        const originalParent = card.parentElement;
        zone.appendChild(card);
        
        // Aplicar filtros após mover
        applyFilters();
        
        // Fazer a requisição para o backend
        try {
          const r = await fetch(`${apiBase}/board/move`, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ job_id: jobId, to_status: toStatus }) 
          });
          
          if (!r.ok) {
            // Se falhou, reverter o movimento
            originalParent.appendChild(card);
            applyFilters();
            
            const errorData = await r.json();
            if (typeof Swal !== 'undefined') {
              Swal.fire({
                icon: 'error',
                title: 'Erro ao mover vaga',
                text: errorData.message || 'Falha ao mover vaga'
              });
            } else {
              alert('Falha ao mover vaga');
            }
          } else {
            // Sucesso - mostrar notificação sutil
            showNotification('Vaga movida com sucesso', 'success');
          }
        } catch (error) {
          // Se houve erro de rede, reverter o movimento
          originalParent.appendChild(card);
          applyFilters();
          
          console.error('Erro ao mover vaga:', error);
          if (typeof Swal !== 'undefined') {
            Swal.fire({
              icon: 'error',
              title: 'Erro ao mover vaga',
              text: 'Erro de conexão. Tente novamente.'
            });
          } else {
            alert('Erro de conexão. Tente novamente.');
          }
        }
      });

      colEl.addEventListener('click', (ev) => {
        const btn = ev.target.closest('button[data-action]');
        if(!btn) return;
        const id = btn.getAttribute('data-id');
        const action = btn.getAttribute('data-action');
        if(action === 'edit') openWindow(`/app/administration/rh-job-openings/edit.html?id=${id}`);
        if(action === 'view') openWindow(`/app/administration/rh-job-openings/view.html?id=${id}`);
        if(action === 'delete') {
          const jobTitle = btn.closest('.job-card').querySelector('.fw-bold').textContent;
          deleteJob(id, jobTitle);
        }
      });

      document.getElementById('jobsBoard').appendChild(colEl);
    });

    // Aplica filtros no board renderizado
    applyFilters();
  }

  async function loadBoard(){ const payload = await fetchBoard(); renderBoard(payload.board); }

  // Filtros
  document.addEventListener('input', (ev) => {
    if(['filter-keyword','filter-department','filter-location','filter-modality','filter-status'].includes(ev.target.id)){
      applyFilters();
    }
  });
  document.getElementById('btn-clear-filters').addEventListener('click', () => {
    document.getElementById('filter-keyword').value = '';
    ['filter-department','filter-location','filter-modality','filter-status'].forEach(id => { const el = document.getElementById(id); el.value=''; el.dispatchEvent(new Event('change')); });
    applyFilters();
  });

  document.getElementById('btnNewJob').addEventListener('click', (e) => { e.preventDefault(); openWindow('/app/administration/rh-job-openings/create.html'); });
  document.getElementById('btnSettings').addEventListener('click', (e) => { e.preventDefault(); openWindow('/app/administration/rh-job-openings/settings.html'); });
  document.getElementById('btnTalentBank').addEventListener('click', (e) => { e.preventDefault(); openWindow('/app/administration/rh-job-openings/talent-bank.html'); });

  (async function init(){
    // Inicializar Socket.IO
    initializeSocket();
    
    meta = await fetchMeta();
    fillSelect('filter-department', meta.departments, 'Todos');
    fillSelect('filter-location', meta.locations, 'Todos');
    fillSelect('filter-modality', meta.modalities, 'Todos');
    fillSelect('filter-status', [{ id:'Draft', name:'Rascunho'},{ id:'Published', name:'Publicado'},{ id:'Closed', name:'Encerrado'},{ id:'Archived', name:'Arquivado'}], 'Todos');
    await loadBoard();
  })();
})(); 