document.addEventListener('DOMContentLoaded', function () {
    const apiBaseUrl = '/api';
  
    // Function to fetch and display projects
    const fetchProjects = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/called/projects/listAll`);
        const projects = await response.json();
        const projectList = document.getElementById('project-list');
        projectList.innerHTML = '';
        projects.forEach(project => {
          const li = document.createElement('li');
          li.textContent = `${project.name}: ${project.description}`;
          projectList.appendChild(li);
        });
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };
  
    // Function to fetch and display tickets
    const fetchTickets = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/called/tickets/listAll`);
        const tickets = await response.json();
        const ticketList = document.getElementById('ticket-list');
        ticketList.innerHTML = '';
        tickets.forEach(ticket => {
          const li = document.createElement('li');
          li.textContent = `${ticket.title}: ${ticket.description}`;
          ticketList.appendChild(li);
        });
      } catch (error) {
        console.error('Error fetching tickets:', error);
      }
    };
  
    // Function to fetch and display categories
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/called/categories`);
        const categories = await response.json();
        const categoryList = document.getElementById('category-list');
        categoryList.innerHTML = '';
        categories.forEach(category => {
          const li = document.createElement('li');
          li.textContent = category.name;
          categoryList.appendChild(li);
        });
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
  
    // Event listener for project form submission
    document.getElementById('project-form').addEventListener('submit', async function (e) {
      e.preventDefault();
      const name = document.getElementById('project-name').value;
      const description = document.getElementById('project-description').value;
  
      try {
        await fetch(`${apiBaseUrl}/called/projects/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ name, description })
        });
        fetchProjects();
        document.getElementById('project-form').reset();
      } catch (error) {
        console.error('Error creating project:', error);
      }
    });
  
    // Event listener for ticket form submission
    document.getElementById('ticket-form').addEventListener('submit', async function (e) {
      e.preventDefault();
      const title = document.getElementById('ticket-title').value;
      const description = document.getElementById('ticket-description').value;
      const projectId = document.getElementById('ticket-project-id').value;
      const assignedTo = document.getElementById('ticket-assigned-to').value;
  
      try {
        await fetch(`${apiBaseUrl}/called/tickets/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ title, description, project_id: projectId, assigned_to: assignedTo })
        });
        fetchTickets();
        document.getElementById('ticket-form').reset();
      } catch (error) {
        console.error('Error creating ticket:', error);
      }
    });
  
    // Event listener for category form submission
    document.getElementById('category-form').addEventListener('submit', async function (e) {
      e.preventDefault();
      const name = document.getElementById('category-name').value;
  
      try {
        await fetch(`${apiBaseUrl}/called/create-categories`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ name })
        });
        fetchCategories();
        document.getElementById('category-form').reset();
      } catch (error) {
        console.error('Error creating category:', error);
      }
    });
  
    // Initial fetches
    fetchProjects();
    fetchTickets();
    fetchCategories();
  });
  