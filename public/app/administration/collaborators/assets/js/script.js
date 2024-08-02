async function editCollaborator(id) {
    try {
        const response = await fetch(`/api/collaborators-management/collaborators/${id}`);
        const collaborator = await response.json();
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
            await fetch(`/api/collaborators-management/collaborators/${id}`, {
                method: 'DELETE',
            });
            fetchCollaborators(currentPage);
        } catch (error) {
            console.error('Erro ao excluir colaborador:', error);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const collaboratorsTable = document.getElementById('collaboratorsTable').getElementsByTagName('tbody')[0];
    const pagination = document.getElementById('pagination');
    const searchInput = document.getElementById('searchInput');
    let currentPage = 1;

    async function fetchCollaborators(page = 1, search = '') {
        try {
            const response = await fetch(`/api/collaborators-management/collaborators/`);
            const data = await response.json();
            updateTable(data);
        } catch (error) {
            console.error('Erro ao buscar colaboradores:', error);
        }
    }

    function updateTable(collaborators) {
        collaboratorsTable.innerHTML = '';
        collaborators.forEach(collaborator => {
            const row = collaboratorsTable.insertRow();
            row.innerHTML = `
                <td>${collaborator.id}</td>
                <td>${collaborator.full_name}</td>
                <td>${collaborator.cpf}</td>
                <td>${collaborator.job_position}</td>
                <td>${collaborator.department}</td>
                <td>
                    <button class="btn btn-warning btn-sm" onclick="editCollaborator(${collaborator.id})">Editar</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteCollaborator(${collaborator.id})">Excluir</button>
                </td>
            `;
        });
    }






    document.getElementById('collaboratorForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        const id = document.getElementById('collaboratorId').value;
        const method = id ? 'PUT' : 'POST';
        const url = id ? `/api/collaborators-management/collaborators/${id}` : '/api/collaborators-management/collaborators';
        const formData = {
            full_name: document.getElementById('fullName').value,
            cpf: document.getElementById('cpf').value,
            birth_date: document.getElementById('birthDate').value,
            gender: document.getElementById('gender').value,
            marital_status: document.getElementById('maritalStatus').value,
            nationality: document.getElementById('nationality').value,
            rg: document.getElementById('rg').value,
            rg_issuer: document.getElementById('rgIssuer').value,
            rg_issue_date: document.getElementById('rgIssueDate').value,
            voter_title: document.getElementById('voterTitle').value,
            passport_number: document.getElementById('passportNumber').value,
            birth_city: document.getElementById('birthCity').value,
            birth_state: document.getElementById('birthState').value,
            mother_name: document.getElementById('motherName').value,
            father_name: document.getElementById('fatherName').value,
            job_position: document.getElementById('jobPosition').value,
            department: document.getElementById('department').value,
            admission_date: document.getElementById('admissionDate').value,
            resignation_date: document.getElementById('resignationDate').value,
            employee_id: document.getElementById('employeeId').value,
            salary: parseFloat(document.getElementById('salary').value),
            contract_type: document.getElementById('contractType').value,
            weekly_hours: parseInt(document.getElementById('weeklyHours').value),
            immediate_supervisor: document.getElementById('immediateSupervisor').value,
            pis_pasep_number: document.getElementById('pisPasepNumber').value,
            work_card_number: document.getElementById('workCardNumber').value,
            work_card_series: document.getElementById('workCardSeries').value,
            education: document.getElementById('education').value,
        };
        try {
            await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });
            new bootstrap.Modal(document.getElementById('collaboratorModal')).hide();
            fetchCollaborators(currentPage);
        } catch (error) {
            console.error('Erro ao salvar colaborador:', error);
        }
    });

    searchInput.addEventListener('input', () => {
        fetchCollaborators(currentPage, searchInput.value);
    });

    fetchCollaborators();
});
