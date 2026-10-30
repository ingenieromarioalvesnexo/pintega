import {retrieve,contactURL,catalogueAnswer} from './catalogue-search.mjs';
const panel=document.getElementById('chat-panel'),launcher=document.getElementById('chat-launcher'),close=document.getElementById('chat-close');
const form=document.getElementById('chat-form'),input=document.getElementById('chat-input'),send=document.getElementById('chat-send'),log=document.getElementById('chat-messages'),status=document.getElementById('chat-status'),mode=document.getElementById('chat-mode');
let cataloguePromise,history=[],busy=false,controller=null,revision=0;
const catalogue=()=>cataloguePromise||(cataloguePromise=fetch(new URL('catalogue.json',import.meta.url)).then(r=>{if(!r.ok)throw Error();return r.json();}).catch(e=>{cataloguePromise=null;throw e;}));
function show(open){panel.hidden=!open;launcher.setAttribute('aria-expanded',String(open));if(open)input.focus();else launcher.focus();}
launcher.addEventListener('click',()=>show(panel.hidden));close.addEventListener('click',()=>show(false));
panel.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();show(false);}});
input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();form.requestSubmit();}});
function append(text,role){const node=document.createElement('div');node.className='chat-message chat-message-'+role;node.textContent=text;log.append(node);log.scrollTop=log.scrollHeight;return node;}
function productCards(products,parent){
 for(const p of products){
  const card=document.createElement('div');card.className='chat-product';
  const link=document.createElement('a');link.href=p.url;link.textContent=p.name;link.addEventListener('click',()=>{const search=document.getElementById('search');if(search.value){search.value='';search.dispatchEvent(new Event('input'));}show(false);});card.append(link);
  for(const s of p.specs.slice(0,4)){const row=document.createElement('p');row.textContent=s.label+': '+s.value;card.append(row);}
  if(p.pdf){const pdf=document.createElement('a');pdf.href=p.pdf;pdf.textContent='Ficha técnica (PDF)';pdf.target='_blank';pdf.rel='noopener';card.append(pdf);}
  parent.append(card);
 }
}
async function ask(question){
 if(busy||!question.trim())return;question=question.trim().slice(0,500);busy=true;send.disabled=true;input.value='';const version=revision;
 append(question,'user');status.textContent='Consultando el catálogo…';document.getElementById('chat-suggestions').hidden=true;
 controller=new AbortController();const timer=setTimeout(()=>controller?.abort(),25000);
 try {
  let result;
  try {const r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:question,history:history.slice(-2)}),signal:controller.signal});if(!r.ok)throw Error('Endpoint unavailable');result=await r.json();if(typeof result.answer!=='string'||!Array.isArray(result.products))throw Error('Invalid response');}
  catch {const items=retrieve(await catalogue(),question,history);result={mode:'catalogue',answer:catalogueAnswer(items,'La IA no está disponible ahora; te muestro las fichas del catálogo.'),products:items,contact:contactURL(question,items)};}
  if(version!==revision)return;
  mode.textContent=result.mode==='ai'?'IA de Cloudflare · Consulta de catálogo':'Consulta de catálogo · Datos de las fichas';
  const message=append(result.answer,'assistant');productCards(result.products,message);
  const contact=document.createElement('a');contact.className='chat-contact';contact.href=result.contact;contact.textContent='Preparar consulta por correo';message.append(contact);
  history.push({role:'user',content:question});history=history.slice(-2);log.scrollTop=log.scrollHeight;
 }catch {if(version===revision)append('No he podido consultar el catálogo. Puedes usar el buscador de la web o escribir a galfer.import@gmail.com.','assistant');}
 finally {clearTimeout(timer);if(version===revision){busy=false;send.disabled=false;status.textContent='';controller=null;input.focus();}}
}
form.addEventListener('submit',e=>{e.preventDefault();ask(input.value);});
document.querySelectorAll('#chat-suggestions button').forEach(b=>b.addEventListener('click',()=>ask(b.textContent)));
document.getElementById('chat-clear').addEventListener('click',()=>{revision++;controller?.abort();controller=null;busy=false;send.disabled=false;history=[];log.replaceChildren();status.textContent='';append('Conversación borrada. ¿Qué máquina quieres consultar?','assistant');document.getElementById('chat-suggestions').hidden=false;input.focus();});
