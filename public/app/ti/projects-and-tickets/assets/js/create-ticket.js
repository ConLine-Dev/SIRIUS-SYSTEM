

let quill;// Função principal executada ao carregar o DOM
document.addEventListener("DOMContentLoaded", async () => {
    // Gera os elementos da página
    await generateElements();
    // Adiciona os eventos da página
    // addEvents();
});



async function generateElements(){
        /* quill snow editor */
        var toolbarOptions = [
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
            [{ 'font': [] }],
            ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
            ['blockquote', 'code-block'],
    
            [{ 'header': 1 }, { 'header': 2 }],               // custom button values
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'script': 'sub' }, { 'script': 'super' }],      // superscript/subscript
            [{ 'indent': '-1' }, { 'indent': '+1' }],          // outdent/indent
            [{ 'direction': 'rtl' }],                         // text direction
    
            [{ 'size': ['small', false, 'large', 'huge'] }],  // custom dropdown
    
            [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
            [{ 'align': [] }],
    
            ['image'],
            ['clean']                                         // remove formatting button
        ];
        quill = new Quill('#project-descriptioin-editor', {
            modules: {
                toolbar: toolbarOptions
            },
            theme: 'snow'
        });
        /* quill snow editor */

}

// setInterval(() => {
//     const content = quill.root.innerHTML;
//     console.log(content)
// }, 1000);