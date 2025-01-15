
function toggleFilters() {
    const content = document.getElementById('content');
    const sidebar = document.getElementById('sidebar');


    content.classList.toggle('active');
    sidebar.classList.toggle('active');
}


function initializeEventListeners() {
    const toggleFiltersButton = document.getElementById('sidebarToggle');
    toggleFiltersButton.addEventListener('click', toggleFilters);

    const sidebarCloseButton = document.getElementById('sidebarClose');
    sidebarCloseButton.addEventListener('click', toggleFilters);

    
}

document.addEventListener("DOMContentLoaded", async () => {

    document.querySelector('#loader2').classList.add('d-none');
});