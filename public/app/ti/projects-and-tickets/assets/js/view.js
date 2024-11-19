let choicesInstance, choicesInstanceEdit, SCategories, SEditing_Categories;

async function memberEquip(project) {
    const listUser = await makeRequest('/api/users/ListUserByDep/7');
    const teamMember = document.querySelector('.member_team_equip');

    teamMember.innerHTML = '';

    for (let i = 0; i < listUser.length; i++) {
        const item = listUser[i];

        teamMember.innerHTML += `
                                <div class="text-center">
                                    <span class="avatar avatar-md bd-purple shadow-sm avatar-rounded mb-2"> 
                                        <i class="bi bi-person-circle fs-20"></i>
                                        <img src="https://cdn.conlinebr.com.br/colaboradores/${item.id_headcargo}" alt=""> 
                                    </span>
                                    <p class="fs-14 fw-semibold mb-2">Developer</p>
                                    <div class="d-flex align-items-center justify-content-center flex-wrap">
                                        <h5 class="mb-0 fw-semibold">${item.username} ${item.familyName}</h5> 
                                    </div>
                                </div>`;   
        
    }
}





// ESPERA A PAGINA SER COMPLETAMENTE CARREGADA
document.addEventListener("DOMContentLoaded", async () => {

    // remover loader
    document.querySelector('#loader2').classList.add('d-none');

    
})