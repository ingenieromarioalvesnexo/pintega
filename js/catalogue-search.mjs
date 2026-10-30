// Shared retrieval: the server selects facts from its own catalogue, never from the visitor.
export function normalize(text = '') {
  return String(text).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\b(pt|nd|ql|dhd|fyx)\s+(\d)/g, '$1$2');
}
const stop = new Set('de del la el los las un una unos unas que cual cuales quiero necesito para por con sin en y o a al me mi tu sus hay tiene tienen ver saber caracteristicas ficha informacion compara comparar entre sobre puedes favor hola gracias'.split(' '));
export function retrieve(catalogue, question, history = []) {
  const tokens = [...new Set(normalize(question).match(/[a-z0-9]+/g) || [])].filter(t => !stop.has(t) && t.length > 1);
  const rank = (words) => catalogue.map((p, index) => {
    const name = normalize(p.name), category = normalize(p.category);
    const all = normalize([p.name,p.category,p.description,...p.specs.map(s=>s.label+' '+s.value)].join(' '));
    let score=0, exact=false;
    for (const t of words) {
      const model=/[a-z]+\d/.test(t);
      const terms = name.match(/[a-z0-9]+/g) || [];
      if (terms.includes(t)) {score += model ? 100 : 12; if(model) exact=true;}
      else if (!model && name.includes(t)) score += 7;
      else if (!model && category.includes(t)) score += 5;
      else if (!model && all.includes(t)) score += 1;
    }
    return {product:p,score,exact,index};
  }).filter(r=>r.score>0).sort((a,b)=>b.score-a.score||a.index-b.index);
  let ranked=rank(tokens);
  // Only short follow-up questions inherit prior product names.
  const followup = tokens.length <= 3 && !ranked.some(r=>r.exact);
  if (followup && history.length) {
    const previous=history.filter(m=>m.role==='user').slice(-2).map(m=>m.content).join(' ');
    const earlier=(normalize(previous).match(/[a-z0-9]+/g)||[]).filter(t=>/[a-z]+\d/.test(t));
    if(earlier.length) ranked=rank([...tokens,...earlier]);
  }
  if (ranked.some(r=>r.exact)) ranked=ranked.filter(r=>r.exact);
  return ranked.slice(0,4).map(r=>r.product);
}
export function contactURL(question, products=[]) {
  return 'mailto:galfer.import@gmail.com?subject='+encodeURIComponent('Consulta del catálogo Pintega')+'&body='+encodeURIComponent('Hola Pintega,\r\n\r\n'+question+'\r\n\r\nReferencias: '+products.map(p=>p.name).join(', ')+'\r\n\r\nUn saludo,');
}
export function catalogueAnswer(products, reason='') {
  if(!products.length) return 'No encuentro una ficha que permita responder con seguridad. Indica el modelo o la familia (compresores, perforadoras o martillos) o prepara una consulta para Pintega.';
  return (reason ? reason+'\n\n' : '')+'Estas son las fichas relacionadas con tu consulta. Puedes consultar sus datos y abrir cada producto. Pintega debe confirmar precios, disponibilidad, compatibilidades y cualquier dato marcado como pendiente.';
}
