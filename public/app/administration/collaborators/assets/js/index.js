async function editCollaborator(id) {
    try {
        const collaborator = await makeRequest(`/api/collaborators-management/collaborators/${id}`);
        document.getElementById('fullName').value = collaborator.full_name;
        document.getElementById('cpf').value = collaborator.cpf;
        document.getElementById('birthDate').value = collaborator.birth_date;
        document.getElementById('gender').value = collaborator.gender;
        document.getElementById('maritalStatus').value = collaborator.marital_status;
        document.getElementById('nationality').value = collaborator.nationality;
        document.getElementById('rg').value = collaborator.rg;
        document.getElementById('rgIssuer').value = collaborator.rg_issuer;
        document.getElementById('rgIssueDate').value = collaborator.rg_issue_date;
        document.getElementById('voterTitle').value = collaborator.voter_title;
        document.getElementById('passportNumber').value = collaborator.passport_number;
        document.getElementById('birthCity').value = collaborator.birth_city;
        document.getElementById('birthState').value = collaborator.birth_state;
        document.getElementById('motherName').value = collaborator.mother_name;
        document.getElementById('fatherName').value = collaborator.father_name;
        document.getElementById('jobPosition').value = collaborator.job_position;
        document.getElementById('department').value = collaborator.department;
        document.getElementById('admissionDate').value = collaborator.admission_date;
        document.getElementById('resignationDate').value = collaborator.resignation_date;
        document.getElementById('employeeId').value = collaborator.employee_id;
        document.getElementById('salary').value = collaborator.salary;
        document.getElementById('contractType').value = collaborator.contract_type;
        document.getElementById('weeklyHours').value = collaborator.weekly_hours;
        document.getElementById('immediateSupervisor').value = collaborator.immediate_supervisor;
        document.getElementById('pisPasepNumber').value = collaborator.pis_pasep_number;
        document.getElementById('workCardNumber').value = collaborator.work_card_number;
        document.getElementById('workCardSeries').value = collaborator.work_card_series;
        document.getElementById('education').value = collaborator.education;
        document.getElementById('collaboratorId').value = collaborator.id;
        document.getElementById('collaboratorModalLabel').innerText = 'Editar Colaborador';
        new bootstrap.Modal(document.getElementById('collaboratorModal')).show();
    } catch (error) {
        console.error('Erro ao buscar colaborador:', error);
    }
}

async function deleteCollaborator(id) {
    if (confirm('Tem certeza que deseja excluir este colaborador?')) {
        try {
            await makeRequest(`/api/collaborators-management/collaborators/${id}`, 'DELETE');


        } catch (error) {
            console.error('Erro ao excluir colaborador:', error);
        }
    }
}

async function ListCollaborators(){
    const collaboratorsTable = document.querySelector('.bodyCards');
    const collaborators = await makeRequest(`/api/collaborators-management/collaborators/`);
    console.log(collaborators)
    collaboratorsTable.innerHTML = '';
    let row = ''
        collaborators.forEach(collaborator => {
            
            row += `<div class="col-3">
            <div class="card custom-card team-member-card">
                <div class="teammember-cover-image"> <img src="../../assets/images/media/capa.jpeg" class="card-img-top" alt="..."> 
                    <span class="avatar avatar-xl avatar-rounded"> 
                        <img src="https://cdn.conlinebr.com.br/colaboradores/${collaborator.id_headcargo}" alt=""> 
                    </span>
                </div>
                <div class="card-body p-0">
                    <div class="d-flex flex-wrap align-item-center mt-sm-0 mt-5 justify-content-between border-bottom border-block-end-dashed p-3">
                        <div class="team-member-details flex-fill">
                            <p class="mb-0 fw-semibold fs-16 text-truncate"> <a href="javascript:void(0);">${collaborator.name+' '+collaborator.family_name}</a> </p>
                            <p class="mb-0 fs-12 text-muted text-break">${collaborator.email_business}</p>
                        </div>
                        <div class="dropdown">
                            <button class="btn btn-sm btn-icon btn-light btn-wave waves-effect waves-light" type="button" data-bs-toggle="dropdown" aria-expanded="false"> <i class="ti ti-dots-vertical"></i> </button>
                            <ul class="dropdown-menu">
                                <li><a class="dropdown-item" href="javascript:void(0);">Editar</a></li>
                                <li><a class="dropdown-item" href="javascript:void(0);">Desativar</a></li>
                            </ul>
                        </div>
                    </div>
                    <div class="team-member-stats d-sm-flex justify-content-evenly">
                        <div class="text-center p-3 my-auto">
                            <p class="fw-semibold mb-0">Escritório</p><span class="text-muted fs-12">${collaborator.companie_name}</span> </div>
                        <div class="text-center p-3 my-auto">
                            <p class="fw-semibold mb-0">Ani. Empresa</p><span class="text-muted fs-12">${collaborator.admission_day_month} | ${collaborator.time_with_company}</span> </div>
                        <div class="text-center p-3 my-auto">
                            <p class="fw-semibold mb-0">Contrato</p><span class="text-muted fs-12">${collaborator.contract_name}</span> </div>
                    </div>
                </div>
            </div>
        </div>`;
        });

        collaboratorsTable.innerHTML = row

}

async function searchInputCollaborators(){
    document.getElementById('searchInput').addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const cards = document.querySelectorAll('.bodyCards .col-3');

        cards.forEach(function(card) {
            const name = card.querySelector('.team-member-details p a').textContent.toLowerCase();
            if (name.includes(searchTerm)) {
                card.classList.remove('hidden');
            } else {
                card.classList.add('hidden');
            }
        });
    });
}

document.addEventListener("DOMContentLoaded", async () => {

    await ListCollaborators()
    await searchInputCollaborators()


    
    document.querySelector('#loader2').classList.add('d-none')
})


