(function(){
  var input = document.getElementById('search');
  var cards = Array.prototype.slice.call(document.querySelectorAll('.card'));
  var countEl = document.getElementById('resultCount');

  function normalize(s){
    return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  function applyFilter(){
    var q = normalize(input.value.trim());
    var visible = 0;
    var perCat = {};
    cards.forEach(function(card){
      var hay = normalize(card.getAttribute('data-search') || '');
      var match = q === '' || hay.indexOf(q) !== -1;
      card.classList.toggle('is-hidden', !match);
      if (match) {
        visible++;
        var cat = card.getAttribute('data-cat');
        perCat[cat] = (perCat[cat] || 0) + 1;
      }
    });
    document.querySelectorAll('[data-noresults]').forEach(function(el){
      var cat = el.getAttribute('data-noresults');
      el.hidden = (perCat[cat] || 0) > 0;
    });
    countEl.textContent = q === '' ? '' : (visible + (visible === 1 ? ' resultado' : ' resultados'));
  }

  input.addEventListener('input', applyFilter);
  applyFilter();

  document.querySelectorAll('[data-jump]').forEach(function(btn){
    btn.addEventListener('click', function(){
      var target = document.getElementById(btn.getAttribute('data-jump'));
      if (target) {
        document.querySelectorAll('[data-jump]').forEach(function(item){item.removeAttribute('aria-current');});
        btn.setAttribute('aria-current','location');
        target.scrollIntoView({behavior:'smooth', block:'start'});
      }
    });
  });

  /* ---- product photo galleries ---- */
  var galleries = Array.prototype.slice.call(document.querySelectorAll('[data-gallery]')).map(function(gallery){
    var track = gallery.querySelector('.gallery-track');
    var slides = Array.prototype.slice.call(gallery.querySelectorAll('.gallery-slide'));
    var dots = Array.prototype.slice.call(gallery.querySelectorAll('.dot'));
    var captionEl = gallery.querySelector('.gallery-caption');
    var state = {index: 0};
    if(slides.length < 2) gallery.classList.add('single-image');
    slides.forEach(function(slide){if(!slide.getAttribute('aria-label')) slide.setAttribute('aria-label','Ampliar imagen de ' + gallery.closest('.card').querySelector('h3').textContent);});

    function render(){
      track.style.transform = 'translateX(-' + (state.index * 100) + '%)';
      dots.forEach(function(d, di){ d.classList.toggle('is-active', di === state.index); });
      captionEl.textContent = slides[state.index].getAttribute('data-caption') + ' · ' + (state.index + 1) + '/' + slides.length;
    }
    function go(i){
      state.index = (i + slides.length) % slides.length;
      render();
    }

    gallery.querySelector('.gallery-nav.prev').addEventListener('click', function(e){ e.stopPropagation(); go(state.index - 1); });
    gallery.querySelector('.gallery-nav.next').addEventListener('click', function(e){ e.stopPropagation(); go(state.index + 1); });
    dots.forEach(function(d, di){ d.addEventListener('click', function(e){ e.stopPropagation(); go(di); }); });
    slides.forEach(function(slide, si){
      slide.addEventListener('click', function(){ openLightbox(gallery, slides, si); });
    });

    return {gallery: gallery, go: go};
  });

  /* ---- lightbox ---- */
  var lightbox = document.getElementById('lightbox');
  var lbMedia = document.getElementById('lbMedia');
  var lbCaption = document.getElementById('lbCaption');
  var lbDownload = document.getElementById('lbDownload');
  var lbState = {gallery: null, slides: [], index: 0};

  function renderLightbox(){
    var slide = lbState.slides[lbState.index];
    lbMedia.innerHTML = slide.innerHTML;
    var total = lbState.slides.length;
    lbCaption.textContent = slide.getAttribute('data-caption') + ' · ' + (lbState.index + 1) + '/' + total;
    if (slide.getAttribute('data-slide-type') === 'specsheet') {
      lbDownload.hidden = false;
      lbDownload.href = lbState.gallery.getAttribute('data-pdf-href') || ('data:application/pdf;base64,' + lbState.gallery.getAttribute('data-pdf-b64'));
      lbDownload.setAttribute('download', lbState.gallery.getAttribute('data-pdf-filename'));
      lbDownload.textContent = 'Descargar ficha técnica (PDF)';
    } else {
      lbDownload.hidden = true;
    }
  }

  function openLightbox(gallery, slides, index){
    lbState = {gallery: gallery, slides: slides, index: index};
    renderLightbox();
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    lightbox.classList.toggle('single-image', slides.length < 2);
    document.body.style.overflow='hidden';
    lightbox.querySelector('.lightbox-close').focus();
  }
  function closeLightbox(){
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow='';
    if(lbState.slides[lbState.index]) lbState.slides[lbState.index].focus();
  }
  lightbox.querySelectorAll('[data-lb-close]').forEach(function(el){
    el.addEventListener('click', closeLightbox);
  });
  lightbox.querySelector('.lightbox-prev').addEventListener('click', function(){
    lbState.index = (lbState.index - 1 + lbState.slides.length) % lbState.slides.length;
    renderLightbox();
  });
  lightbox.querySelector('.lightbox-next').addEventListener('click', function(){
    lbState.index = (lbState.index + 1) % lbState.slides.length;
    renderLightbox();
  });
  document.addEventListener('keydown', function(e){
    if (!lightbox.classList.contains('is-open')) return;
    if (e.key === 'Tab') {
      var controls = Array.prototype.slice.call(lightbox.querySelectorAll('button, a[href]')).filter(function(el){return el.offsetParent !== null;});
      var first = controls[0], last = controls[controls.length-1];
      if(e.shiftKey && document.activeElement === first){e.preventDefault();last.focus();}
      else if(!e.shiftKey && document.activeElement === last){e.preventDefault();first.focus();}
    }
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') lightbox.querySelector('.lightbox-prev').click();
    if (e.key === 'ArrowRight') lightbox.querySelector('.lightbox-next').click();
  });

  var form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var name = form.elements['name'].value.trim();
      var category = form.elements['category'].value;
      var message = form.elements['message'].value.trim();
      var subject = 'Consulta web — ' + category;
      var body = 'Nombre y empresa: ' + name + '\r\n' +
                 'Categoría de interés: ' + category + '\r\n\r\n' +
                 message;
      var mailto = 'mailto:galfer.import@gmail.com?subject=' + encodeURIComponent(subject) +
                   '&body=' + encodeURIComponent(body);
      window.location.href = mailto;
    });
  }
})();