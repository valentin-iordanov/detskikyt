const dialog = document.querySelector('#lightbox');
document.querySelectorAll('.gallery-image').forEach(button => button.addEventListener('click', () => {const image=button.querySelector('img'); const preview=dialog.querySelector('img'); preview.src=image.src; preview.alt=image.alt; dialog.showModal();}));
dialog.querySelector('button').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {if(event.target===dialog) dialog.close();});
