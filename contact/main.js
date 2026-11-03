const form = document.querySelector('#party-form');
const date = form.elements.date;
const now = new Date();
date.min = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
form.addEventListener('submit', event => {
 event.preventDefault();
 const data = new FormData(form);
 const fields = [['date','Дата'],['age','Възраст на детето'],['children','Деца'],['adults','Възрастни'],['duration','Продължителност'],['budget','Бюджет'],['ideas','Идеи']];
 const lines = fields.filter(([key]) => data.get(key)).map(([key,label]) => `${label}: ${data.get(key)}`);
 document.querySelector('#message').value = ['Здравейте! Бих искал/а да попитам за празник в Моменти.',...lines,'Моля, споделете дали датата е свободна и какви са актуалните възможности и цени. Благодаря!'].join('\n');
 const result = document.querySelector('.result'); result.hidden = false; result.scrollIntoView({block:'nearest',behavior:'smooth'});
});
document.querySelector('#copy').addEventListener('click', async () => { const message=document.querySelector('#message'); try { await navigator.clipboard.writeText(message.value); document.querySelector('#status').textContent='Копирано. Изпратете съобщението във Facebook.'; } catch { message.focus(); message.select(); document.querySelector('#status').textContent='Маркирайте и копирайте текста, след което го изпратете във Facebook.'; } });
