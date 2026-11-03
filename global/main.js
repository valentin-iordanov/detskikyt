(() => {
  'use strict';
  const assetBase = new URL('../assets/', document.currentScript.src);
  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const icons = {
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>',
    pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5v14M17 5v14" stroke="currentColor" stroke-width="4"/></svg>',
    volume: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 8q6 4 0 8" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    muted: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="m17 9 5 6m0-6-5 6" stroke="currentColor" stroke-width="2"/></svg>',
    expand: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4H4v5m11-5h5v5M4 15v5h5m11-5v5h-5" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    left: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 5-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    right: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m10 5 7 7-7 7" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" stroke-width="2"/></svg>'
  };
  const toggle = document.querySelector('.menu-toggle');
  const menu = document.querySelector('.nav-links');
  function setMenu(open) {
    if (!toggle || !menu) return;
    menu.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Затвори менюто' : 'Отвори менюто');
  }
  toggle?.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  menu?.addEventListener('click', event => { if (event.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && toggle?.getAttribute('aria-expanded') === 'true') {
      setMenu(false);
      toggle.focus();
    }
  });

  const players = [];
  document.querySelectorAll('.carousel').forEach(carousel => {
    const ids = (carousel.dataset.reels || '').split(',').map(id => id.trim()).filter(id => /^\d+$/.test(id));
    if (!ids.length) return;
    let current = 0;
    let activeVideo = null;
    carousel.innerHTML = `<div class="reel-stage" aria-label="Видеа от Моменти"><button type="button" class="reel-side reel-prev" aria-label="Предишно видео"><img alt="" loading="lazy"><span>Предишно</span></button><div class="reel-frame" tabindex="0" aria-label="Видео от Моменти. Със стрелките сменяте видеото."></div><button type="button" class="reel-side reel-next" aria-label="Следващо видео"><img alt="" loading="lazy"><span>Следващо</span></button></div><div class="reel-controls"><button type="button" class="carousel-arrow prev" aria-label="Предишно видео">${icons.left}</button><span class="reel-count" aria-live="polite" aria-atomic="true"></span><button type="button" class="carousel-arrow next" aria-label="Следващо видео">${icons.right}</button></div><div class="reel-info"><a class="reel-link" target="_blank" rel="noopener">Оригиналът във Facebook</a></div><p class="swipe-hint">Плъзнете за следващото видео</p>`;
    const frame = carousel.querySelector('.reel-frame');
    const stage = carousel.querySelector('.reel-stage');
    const count = carousel.querySelector('.reel-count');
    const source = carousel.querySelector('.reel-link');
    const wrap = index => ((index % ids.length) + ids.length) % ids.length;
    const poster = index => new URL(`reel-${ids[wrap(index)]}.${ids[wrap(index)] === '1515124636897761' ? 'avif' : 'jpg'}`, assetBase).href;
    const timestamp = seconds => {
      const value = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
      return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`;
    };
    function stopCurrent() {
      if (activeVideo) {
        activeVideo.pause();
        activeVideo.removeAttribute('src');
        activeVideo.load();
        activeVideo = null;
      }
    }
    function play() {
      if (activeVideo) {
        document.querySelectorAll('video').forEach(video => { if (video !== activeVideo) video.pause(); });
        if (activeVideo.ended) activeVideo.currentTime = 0;
        activeVideo.play().catch(() => {});
        return;
      }
      document.querySelectorAll('video').forEach(video => video.pause());
      const container = document.createElement('div');
      container.className = 'local-video is-paused';
      const video = document.createElement('video');
      activeVideo = video;
      video.playsInline = true;
      video.preload = 'metadata';
      video.poster = poster(current);
      video.src = new URL(`reel-${ids[current]}.mp4`, assetBase).href;
      video.setAttribute('aria-label', `Моменти — видео ${current + 1}`);
      video.setAttribute('playsinline', '');
      const overlay = document.createElement('button');
      overlay.type = 'button';
      overlay.className = 'local-video-overlay';
      overlay.setAttribute('aria-label', 'Пусни видеото');
      overlay.innerHTML = `<span class="reel-play">${icons.play}</span>`;
      const toolbar = document.createElement('div');
      toolbar.className = 'video-toolbar';
      toolbar.dataset.noSwipe = '';
      toolbar.innerHTML = `<button type="button" class="video-toggle" aria-label="Пауза">${icons.pause}</button><input class="video-progress" type="range" min="0" max="100" value="0" step="0.1" aria-label="Позиция във видеото"><span class="video-time">0:00</span><button type="button" class="video-mute" aria-label="Изключи звука" aria-pressed="false">${icons.volume}</button><button type="button" class="video-fullscreen" aria-label="Цял екран">${icons.expand}</button>`;
      const status = document.createElement('p');
      status.className = 'local-video-error';
      status.hidden = true;
      status.setAttribute('role', 'status');
      const errorText = document.createElement('span');
      errorText.textContent = 'Видеото не се зареди. Опитайте отново или отворете оригинала във Facebook.';
      const retry = document.createElement('button');
      retry.type = 'button';
      retry.className = 'video-retry';
      retry.textContent = 'Опитай отново';
      retry.addEventListener('click', () => {
        status.hidden = true;
        video.load();
        video.play().catch(() => { status.hidden = false; });
      });
      status.append(errorText, retry);
      const progress = toolbar.querySelector('.video-progress');
      const playToggle = toolbar.querySelector('.video-toggle');
      const mute = toolbar.querySelector('.video-mute');
      function togglePlay() {
        if (video.paused || video.ended) {
          if (video.ended) video.currentTime = 0;
          document.querySelectorAll('video').forEach(other => { if (other !== video) other.pause(); });
          video.play().catch(() => { overlay.hidden = false; });
        } else video.pause();
      }
      overlay.addEventListener('click', togglePlay);
      video.addEventListener('click', togglePlay);
      playToggle.addEventListener('click', togglePlay);
      function syncPlayback() {
        const paused = video.paused || video.ended;
        overlay.hidden = !paused;
        overlay.setAttribute('aria-label', video.ended ? 'Пусни отново' : 'Продължи видеото');
        container.classList.toggle('is-paused', paused);
        container.classList.toggle('is-playing', !paused);
        playToggle.innerHTML = paused ? icons.play : icons.pause;
        playToggle.setAttribute('aria-label', paused ? 'Пусни видеото' : 'Пауза');
      }
      video.addEventListener('play', () => { status.hidden = true; syncPlayback(); });
      video.addEventListener('pause', syncPlayback);
      video.addEventListener('ended', syncPlayback);
      video.addEventListener('timeupdate', () => {
        progress.value = Number.isFinite(video.duration) && video.duration > 0 ? String(video.currentTime / video.duration * 100) : '0';
        toolbar.querySelector('.video-time').textContent = timestamp(video.currentTime);
        progress.setAttribute('aria-valuetext', `${timestamp(video.currentTime)} от ${timestamp(video.duration)}`);
      });
      progress.addEventListener('input', () => {
        if (Number.isFinite(video.duration)) video.currentTime = Number(progress.value) / 100 * video.duration;
      });
      mute.addEventListener('click', () => {
        video.muted = !video.muted;
        mute.innerHTML = video.muted ? icons.muted : icons.volume;
        mute.setAttribute('aria-label', video.muted ? 'Включи звука' : 'Изключи звука');
        mute.setAttribute('aria-pressed', String(video.muted));
      });
      const fullscreenButton = toolbar.querySelector('.video-fullscreen');
      fullscreenButton.hidden = !container.requestFullscreen && !video.webkitEnterFullscreen;
      fullscreenButton.addEventListener('click', async () => {
        try {
          if (document.fullscreenElement && document.exitFullscreen) await document.exitFullscreen();
          else if (container.requestFullscreen) await container.requestFullscreen();
          else if (video.webkitEnterFullscreen) video.webkitEnterFullscreen();
        } catch {
          fullscreenButton.setAttribute('aria-label', 'Цял екран не е наличен в този браузър');
        }
      });
      video.addEventListener('error', () => { status.hidden = false; overlay.hidden = true; });
      container.append(video, overlay, toolbar, status);
      frame.replaceChildren(container);
      video.play().catch(() => { overlay.hidden = false; });
    }
    function render() {
      stopCurrent();
      carousel.querySelector('.reel-prev img').src = poster(current - 1);
      carousel.querySelector('.reel-next img').src = poster(current + 1);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'reel-poster';
      button.setAttribute('aria-label', `Пусни видео ${current + 1} от ${ids.length}`);
      const image = document.createElement('img');
      image.src = poster(current);
      image.alt = 'Човек от екипа на Моменти разказва за парти центъра';
      image.width = 540;
      image.height = 960;
      const playIcon = document.createElement('span');
      playIcon.className = 'reel-play';
      playIcon.innerHTML = icons.play;
      button.append(image, playIcon);
      button.addEventListener('click', play);
      frame.replaceChildren(button);
      count.textContent = `${current + 1} / ${ids.length}`;
      source.href = `https://www.facebook.com/reel/${ids[current]}/`;
    }
    function move(amount) { current = wrap(current + amount); render(); }
    carousel.querySelectorAll('.prev,.reel-prev').forEach(button => button.addEventListener('click', () => move(-1)));
    carousel.querySelectorAll('.next,.reel-next').forEach(button => button.addEventListener('click', () => move(1)));
    frame.addEventListener('keydown', event => {
      if (event.target.closest('input,button')) return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        move(event.key === 'ArrowLeft' ? -1 : 1);
      } else if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        if (activeVideo && !activeVideo.paused) activeVideo.pause(); else play();
      }
    });
    let gesture = null;
    let suppressClick = false;
    stage.addEventListener('touchstart', event => {
      if (event.touches.length !== 1 || event.target.closest('[data-no-swipe]')) { gesture = null; return; }
      gesture = { x: event.touches[0].clientX, y: event.touches[0].clientY };
    }, { passive: true });
    stage.addEventListener('touchend', event => {
      if (!gesture) return;
      const dx = event.changedTouches[0].clientX - gesture.x;
      const dy = event.changedTouches[0].clientY - gesture.y;
      gesture = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        suppressClick = true;
        move(dx < 0 ? 1 : -1);
        window.setTimeout(() => { suppressClick = false; }, 400);
      }
    }, { passive: true });
    stage.addEventListener('touchcancel', () => { gesture = null; }, { passive: true });
    stage.addEventListener('click', event => {
      if (suppressClick) { event.preventDefault(); event.stopPropagation(); suppressClick = false; }
    }, true);
    players.push({ carousel, play, select(index) { current = wrap(index); render(); } });
    render();
  });
  document.querySelectorAll('[data-play-reel]').forEach(button => button.addEventListener('click', event => {
    const player = players[0];
    if (!player) return;
    event.preventDefault();
    player.select(Number(button.dataset.playReel) || 0);
    player.carousel.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'center' });
    player.play();
  }));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) document.querySelectorAll('video').forEach(video => video.pause());
  });

  const galleryItems = [...document.querySelectorAll('button[data-lightbox]')];
  if (galleryItems.length) {
    let selected = 0;
    let opener = null;
    const dialog = document.createElement('dialog');
    dialog.className = 'photo-dialog';
    dialog.setAttribute('aria-label', 'Снимки от Моменти');
    dialog.innerHTML = `<button class="lightbox-close" type="button" aria-label="Затвори снимката">${icons.close}</button><figure><img alt=""><figcaption></figcaption></figure><div class="lightbox-navigation"><button class="lightbox-prev" type="button" aria-label="Предишна снимка">${icons.left}</button><span class="lightbox-count" aria-live="polite"></span><button class="lightbox-next" type="button" aria-label="Следваща снимка">${icons.right}</button></div>`;
    document.body.append(dialog);
    function showPhoto(index) {
      selected = ((index % galleryItems.length) + galleryItems.length) % galleryItems.length;
      const button = galleryItems[selected];
      const original = button.querySelector('img');
      const image = dialog.querySelector('img');
      image.src = button.dataset.lightbox || original.currentSrc || original.src;
      image.alt = original.alt;
      dialog.querySelector('figcaption').textContent = button.closest('figure')?.querySelector('figcaption')?.textContent || original.alt;
      dialog.querySelector('.lightbox-count').textContent = `${selected + 1} / ${galleryItems.length}`;
    }
    galleryItems.forEach((button, index) => button.addEventListener('click', () => {
      opener = button;
      showPhoto(index);
      dialog.showModal();
      document.documentElement.classList.add('has-modal');
    }));
    dialog.querySelector('.lightbox-close').addEventListener('click', () => dialog.close());
    dialog.querySelector('.lightbox-prev').addEventListener('click', () => showPhoto(selected - 1));
    dialog.querySelector('.lightbox-next').addEventListener('click', () => showPhoto(selected + 1));
    dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
    dialog.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        showPhoto(selected + (event.key === 'ArrowLeft' ? -1 : 1));
      }
    });
    dialog.addEventListener('close', () => {
      document.documentElement.classList.remove('has-modal');
      opener?.focus();
    });
  }

  const form = document.querySelector('#quick-plan');
  if (form) {
    const date = form.elements.namedItem('date');
    const now = new Date();
    if (date) date.min = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const select = form.elements.namedItem('package');
    const fromLink = new URLSearchParams(location.search).get('package');
    if (select && fromLink && [...select.options].some(option => option.value === fromLink)) select.value = fromLink;
    const summary = document.querySelector('[data-planner-summary]');
    const wishChips = [...form.querySelectorAll('.wish-chip')];
    const getSelectedWishes = () => wishChips
      .filter(chip => chip.getAttribute('aria-pressed') === 'true')
      .map(chip => chip.dataset.wish)
      .filter(Boolean);

    function updateSummary() {
      if (!summary) return;
      const values = new FormData(form);
      const parts = [values.get('package') || 'Вашето парти в Моменти'];
      if (values.get('children')) parts.push(`${values.get('children')} деца`);
      if (values.get('adults')) parts.push(`${values.get('adults')} възрастни`);
      const wishes = getSelectedWishes();
      if (wishes.length) parts.push(`${wishes.length} избрани желания`);
      summary.textContent = parts.join(' · ');
    }
    wishChips.forEach(chip => chip.addEventListener('click', () => {
      const active = chip.getAttribute('aria-pressed') === 'true';
      chip.setAttribute('aria-pressed', String(!active));
      updateSummary();
    }));
    form.addEventListener('input', updateSummary);
    updateSummary();
    document.querySelectorAll('[data-package]').forEach(link => link.addEventListener('click', () => {
      if (select && [...select.options].some(option => option.value === link.dataset.package)) select.value = link.dataset.package;
      updateSummary();
    }));
    const result = document.querySelector('#quick-result');
    const output = document.querySelector('#quick-output');
    const status = document.querySelector('#quick-status');
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!result || !output || !form.reportValidity()) return;
      const data = new FormData(form);
      const fields = [['package', 'Идея за пакет'], ['occasion', 'Повод'], ['date', 'Предпочитана дата'], ['age', 'Възраст на детето'], ['children', 'Брой деца'], ['adults', 'Брой възрастни'], ['duration', 'Продължителност'], ['budget', 'Ориентировъчен бюджет'], ['notes', 'Допълнителни желания']];
      const lines = fields.filter(([key]) => String(data.get(key) || '').trim()).map(([key, label]) => {
        let value = String(data.get(key)).trim();
        if (key === 'date') value = value.split('-').reverse().join('.');
        return `${label}: ${value}`;
      });
      const interests = [...data.getAll('interests'), ...getSelectedWishes()];
      if (interests.length) lines.push(`Интересуваме се от: ${interests.join(', ')}`);
      output.value = ['Здравейте, Моменти! Планираме празник и бихме искали да обсъдим:', ...lines, '', 'Моля, споделете дали датата е свободна, какво може да включва партито и каква е крайната цена. Благодаря!'].join('\n');
      result.hidden = false;
      if (status) status.textContent = 'Съобщението е готово. Копирайте го и го изпратете във Facebook. Нищо не е изпратено автоматично.';
      result.scrollIntoView({ block: 'nearest', behavior: reducedMotion() ? 'auto' : 'smooth' });
      output.focus({ preventScroll: true });
    });
    document.querySelector('#quick-copy')?.addEventListener('click', async () => {
      if (!output || !status) return;
      try {
        await navigator.clipboard.writeText(output.value);
        status.textContent = 'Копирано. Отворете Facebook и поставете текста в съобщение до Моменти.';
      } catch {
        output.focus();
        output.select();
        output.setSelectionRange(0, output.value.length);
        status.textContent = 'Текстът е маркиран. Изберете „Копирай“, после го изпратете във Facebook.';
      }
    });
    form.addEventListener('reset', () => { if (result) result.hidden = true; window.setTimeout(updateSummary, 0); });
  }
})();
// Keep the mobile action available without covering the opening or the form.
(() => {
  const sticky = document.querySelector('.mobile-contact');
  const openingAction = document.querySelector('.hero-intro .button, .page-heading .button');
  const inquiry = document.querySelector('#quick-plan');
  if (!sticky || !openingAction || !('IntersectionObserver' in window)) return;
  let openingVisible = true;
  let inquiryVisible = false;
  sticky.hidden = true;
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.target === openingAction) openingVisible = entry.isIntersecting;
      if (entry.target === inquiry) inquiryVisible = entry.isIntersecting;
    });
    sticky.hidden = openingVisible || inquiryVisible;
  });
  observer.observe(openingAction);
  if (inquiry) observer.observe(inquiry);
})();

// Interactive Two-Worlds Tabs, All Inclusive Chips & Gallery Filters
(() => {
  // 1. Two-Worlds Explorer Tabs (Kids vs Parents)
  document.querySelectorAll('[data-worlds-tabs]').forEach(container => {
    const tabs = [...container.querySelectorAll('.world-tab')];
    const panels = [...container.querySelectorAll('[data-world-panel]')];
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.world;
        tabs.forEach(t => t.setAttribute('aria-selected', String(t === tab)));
        panels.forEach(p => { p.hidden = p.dataset.worldPanel !== target; });
      });
    });
  });

  // 3. All Inclusive Interactive Inclusion Chips & Icon Buttons
  const inclusionChips = [...document.querySelectorAll('.inclusion-chip, .all-inc-icon-btn')];
  const inclusionOutput = document.querySelector('#inclusion-detail-output');
  if (inclusionChips.length && inclusionOutput) {
    inclusionChips.forEach(chip => {
      chip.addEventListener('click', () => {
        inclusionChips.forEach(c => c.classList.toggle('is-active', c === chip));
        inclusionOutput.textContent = chip.dataset.detail || '';
      });
    });
  }

  // 4. Interactive Gallery Filter Tabs
  const filterTabs = [...document.querySelectorAll('.filter-tab')];
  const filterGrid = document.querySelector('[data-filter-grid]');
  if (filterTabs.length && filterGrid) {
    const items = [...filterGrid.querySelectorAll('figure[data-category]')];
    filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const filter = tab.dataset.filter || 'all';
        filterTabs.forEach(t => t.setAttribute('aria-selected', String(t === tab)));
        items.forEach(item => {
          const match = filter === 'all' || item.dataset.category === filter;
          item.hidden = !match;
        });
      });
    });
  }

  // 5. Infinite Circular 3-Card Ring Carousel for Packages (Малък момент · Голям момент · Момент по мярка)
  // On mobile/tablet (<= 860px), whichever of the 3 cards is in the center ALWAYS shows the end of the left neighbor
  // and the beginning of the right neighbor, looping endlessly in a circle!
  document.querySelectorAll('.package-grid').forEach(grid => {
    const origCards = [...grid.querySelectorAll(':scope > .package')];
    if (origCards.length !== 3) return;

    const createClone = (card, modIdx) => {
      const clone = card.cloneNode(true);
      clone.classList.add('is-carousel-clone');
      clone.setAttribute('aria-hidden', 'true');
      clone.dataset.modIndex = String(modIdx);
      clone.querySelectorAll('[data-package]').forEach(link => {
        link.addEventListener('click', () => {
          const form = document.querySelector('#quick-plan');
          const select = form?.elements?.namedItem('package');
          if (select && [...select.options].some(o => o.value === link.dataset.package)) {
            select.value = link.dataset.package;
            form.dispatchEvent(new Event('input', { bubbles: true }));
          }
        });
      });
      return clone;
    };

    origCards.forEach((c, idx) => { c.dataset.modIndex = String(idx); });

    // Prepend 2 sets (6 cards) and append 2 sets (6 cards) -> 5 sets of 3 = 15 cards total
    // Middle set is at indices 6, 7, 8
    const beforeFrag = document.createDocumentFragment();
    for (let s = 0; s < 2; s++) {
      origCards.forEach((c, idx) => beforeFrag.appendChild(createClone(c, idx)));
    }
    grid.prepend(beforeFrag);

    const afterFrag = document.createDocumentFragment();
    for (let s = 0; s < 2; s++) {
      origCards.forEach((c, idx) => afterFrag.appendChild(createClone(c, idx)));
    }
    grid.appendChild(afterFrag);

    const allCards = [...grid.querySelectorAll(':scope > .package')];

    // Create Circular Carousel Navigation Bar below .package-grid
    const nav = document.createElement('div');
    nav.className = 'package-carousel-nav';
    nav.setAttribute('aria-label', 'Навигация между пакетите');
    const labels = ['Малък момент', 'Голям момент', 'Момент по мярка'];
    nav.innerHTML = `
      <button type="button" class="package-carousel-arrow" data-dir="-1" aria-label="Предишен пакет">‹</button>
      <div class="package-carousel-dots">
        ${labels.map((lbl, idx) => `<button type="button" class="package-carousel-dot" data-mod="${idx}">${lbl}</button>`).join('')}
      </div>
      <button type="button" class="package-carousel-arrow" data-dir="1" aria-label="Следващ пакет">›</button>
    `;
    grid.after(nav);

    const dotBtns = [...nav.querySelectorAll('.package-carousel-dot')];
    const isMobileCarousel = () => window.matchMedia('(max-width: 860px)').matches;

    const getScrollForIndex = idx => {
      const card = allCards[idx];
      if (!card) return 0;
      return card.offsetLeft - (grid.clientWidth - card.offsetWidth) / 2;
    };

    const getSingleSetWidth = () => {
      if (!allCards[6] || !allCards[3]) return 0;
      return allCards[6].offsetLeft - allCards[3].offsetLeft;
    };

    let currentCenterIdx = 7; // Start on the middle set (index 6 = Малък, 7 = Голям, 8 = По мярка)

    const updateActiveState = centerIdx => {
      currentCenterIdx = centerIdx;
      const activeMod = ((centerIdx % 3) + 3) % 3;
      allCards.forEach((card, idx) => {
        card.classList.toggle('is-center-card', (idx % 3) === activeMod);
      });
      dotBtns.forEach((btn, idx) => {
        btn.classList.toggle('is-active', idx === activeMod);
      });
    };

    const findClosestCardIndex = () => {
      const viewportCenter = grid.scrollLeft + grid.clientWidth / 2;
      let bestIdx = 7;
      let bestDist = Infinity;
      allCards.forEach((card, idx) => {
        const cardCenter = card.offsetLeft + card.offsetWidth / 2;
        const dist = Math.abs(cardCenter - viewportCenter);
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = idx;
        }
      });
      return bestIdx;
    };

    let scrollTimer = null;
    let isAdjusting = false;

    const normalizeLoopPosition = () => {
      if (!isMobileCarousel() || isAdjusting) return;
      const setWidth = getSingleSetWidth();
      if (setWidth <= 0) return;

      // Seamless wrap during continuous scroll if entering outer sets
      const minBound = getScrollForIndex(3);
      const maxBound = getScrollForIndex(11);
      if (grid.scrollLeft < minBound) {
        isAdjusting = true;
        grid.scrollLeft += setWidth;
        isAdjusting = false;
      } else if (grid.scrollLeft > maxBound) {
        isAdjusting = true;
        grid.scrollLeft -= setWidth;
        isAdjusting = false;
      }
    };

    const snapToMiddleSet = () => {
      if (!isMobileCarousel() || isAdjusting) return;
      const closestIdx = findClosestCardIndex();
      updateActiveState(closestIdx);
      if (closestIdx < 6 || closestIdx > 8) {
        const targetIdx = 6 + (((closestIdx % 3) + 3) % 3);
        const diff = getScrollForIndex(targetIdx) - getScrollForIndex(closestIdx);
        isAdjusting = true;
        grid.scrollLeft += diff;
        currentCenterIdx = targetIdx;
        isAdjusting = false;
      }
    };

    grid.addEventListener('scroll', () => {
      if (!isMobileCarousel() || isAdjusting) return;
      normalizeLoopPosition();
      const closestIdx = findClosestCardIndex();
      updateActiveState(closestIdx);
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(snapToMiddleSet, 130);
    }, { passive: true });

    // Tapping a peeking left or right card rotates the circle to center it
    allCards.forEach((card, idx) => {
      card.addEventListener('click', e => {
        if (!isMobileCarousel()) return;
        const activeMod = ((currentCenterIdx % 3) + 3) % 3;
        if ((idx % 3) !== activeMod) {
          e.preventDefault();
          grid.scrollTo({ left: getScrollForIndex(idx), behavior: 'smooth' });
        }
      });
    });

    // Prev / Next circular arrows
    nav.querySelectorAll('.package-carousel-arrow').forEach(arrow => {
      arrow.addEventListener('click', () => {
        const dir = Number(arrow.dataset.dir) || 1;
        const nextIdx = currentCenterIdx + dir;
        grid.scrollTo({ left: getScrollForIndex(nextIdx), behavior: 'smooth' });
      });
    });

    // Pill buttons (Малък момент · Голям момент · Момент по мярка)
    dotBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetMod = Number(btn.dataset.mod) || 0;
        const currentMod = ((currentCenterIdx % 3) + 3) % 3;
        let delta = targetMod - currentMod;
        if (delta > 1) delta -= 3;
        if (delta < -1) delta += 3;
        grid.scrollTo({ left: getScrollForIndex(currentCenterIdx + delta), behavior: 'smooth' });
      });
    });

    const initCarouselPosition = () => {
      if (!isMobileCarousel()) {
        allCards.forEach(c => c.classList.add('is-center-card'));
        return;
      }
      // Start centered on index 6 (Малък момент) with Момент по мярка peeking on the left and Голям момент peeking on the right!
      const startIdx = 6;
      isAdjusting = true;
      grid.scrollLeft = getScrollForIndex(startIdx);
      updateActiveState(startIdx);
      isAdjusting = false;
    };

    requestAnimationFrame(() => {
      initCarouselPosition();
      setTimeout(initCarouselPosition, 120);
    });
    window.addEventListener('resize', () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(initCarouselPosition, 100);
    });
  });
})();

// Zero-Footprint Tethered Gift-Bow Balloons on Offer Price Cards ([data-tethered-balloons])
// - Adds 0px to section height! The 400 € Offer Card itself is wrapped with a 3D Satin Gold Bow on its top rim.
// - 3 compact, realistic 3D balloons are tied directly to that bow and float gently above the corner of the card.
// - Tap or click a balloon to pop it; dragging stretches its string.
(() => {
  const hosts = document.querySelectorAll('[data-tethered-balloons]');
  if (!hosts.length) return;

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const playPopSound = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(240, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(52, ctx.currentTime + 0.085);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.095);
      setTimeout(() => ctx.close().catch(() => {}), 180);
    } catch {}
  };

  hosts.forEach((host, stageIdx) => {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', 'tethered-balloons-svg');
    svg.setAttribute('viewBox', '0 0 1 1');
    svg.setAttribute('aria-label', 'Балони');

    const pfx = `tb_${stageIdx}_`;
    svg.innerHTML = `
      <defs>
        <radialGradient id="${pfx}gold" cx="32%" cy="26%" fx="26%" fy="20%" r="72%">
          <stop offset="0%" stop-color="#FFFDF7"/>
          <stop offset="16%" stop-color="#FCE5A8"/>
          <stop offset="44%" stop-color="#DDA23B"/>
          <stop offset="76%" stop-color="#9E6814"/>
          <stop offset="91%" stop-color="#784B08"/>
          <stop offset="100%" stop-color="#E5B869"/>
        </radialGradient>
        <radialGradient id="${pfx}pearl" cx="32%" cy="26%" fx="26%" fy="20%" r="72%">
          <stop offset="0%" stop-color="#FFFFFF"/>
          <stop offset="22%" stop-color="#FFFBF4"/>
          <stop offset="55%" stop-color="#EDE3D2"/>
          <stop offset="84%" stop-color="#C2B29B"/>
          <stop offset="93%" stop-color="#A8967E"/>
          <stop offset="100%" stop-color="#F5EDE0"/>
        </radialGradient>
        <radialGradient id="${pfx}rose" cx="32%" cy="26%" fx="26%" fy="20%" r="72%">
          <stop offset="0%" stop-color="#FFF6F0"/>
          <stop offset="18%" stop-color="#F3CBB8"/>
          <stop offset="48%" stop-color="#D18A6C"/>
          <stop offset="80%" stop-color="#945137"/>
          <stop offset="92%" stop-color="#733A24"/>
          <stop offset="100%" stop-color="#E6AF96"/>
        </radialGradient>
        <linearGradient id="${pfx}rim" x1="15%" y1="0%" x2="85%" y2="100%">
          <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.32"/>
          <stop offset="40%" stop-color="#FFFFFF" stop-opacity="0"/>
          <stop offset="78%" stop-color="#1E1712" stop-opacity="0.14"/>
          <stop offset="100%" stop-color="#FFF5E4" stop-opacity="0.38"/>
        </linearGradient>
        <linearGradient id="${pfx}spec" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.84"/>
          <stop offset="55%" stop-color="#FFFFFF" stop-opacity="0.28"/>
          <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"/>
        </linearGradient>
        <linearGradient id="${pfx}goldRibbon" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#A67118"/>
          <stop offset="35%" stop-color="#E5B655"/>
          <stop offset="55%" stop-color="#FFF0C2"/>
          <stop offset="80%" stop-color="#C88E28"/>
          <stop offset="100%" stop-color="#8F5D0E"/>
        </linearGradient>
        <filter id="${pfx}shadow" x="-35%" y="-30%" width="170%" height="180%">
          <feDropShadow dx="0" dy="8" stdDeviation="5" flood-color="#241C15" flood-opacity="0.20"/>
        </filter>
      </defs>
    `;

    const stringsLayer = document.createElementNS(SVG_NS, 'g');
    const balloonsLayer = document.createElementNS(SVG_NS, 'g');
    const bowLayer = document.createElementNS(SVG_NS, 'g');
    const fxLayer = document.createElementNS(SVG_NS, 'g');
    svg.append(stringsLayer, balloonsLayer, bowLayer, fxLayer);
    host.appendChild(svg);

    // 3D Satin Gold Bow sitting directly on the top border (0, 0) of the 400 € Offer Card
    bowLayer.innerHTML = `
      <g filter="url(#${pfx}shadow)">
        <path d="M 0 0 C -18 -16, -30 -5, -16 2 C -24 -1, -12 4, 0 0 Z" fill="url(#${pfx}goldRibbon)" stroke="#8F5D0E" stroke-width="0.6"/>
        <path d="M 0 0 C 18 -16, 30 -5, 16 2 C 24 -1, 12 4, 0 0 Z" fill="url(#${pfx}goldRibbon)" stroke="#8F5D0E" stroke-width="0.6"/>
        <path d="M -2 1 Q -9 10 -14 15 L -8 16 Q -4 10 0 2 Z" fill="url(#${pfx}goldRibbon)"/>
        <path d="M 2 1 Q 9 10 14 15 L 8 16 Q 4 10 0 2 Z" fill="url(#${pfx}goldRibbon)"/>
        <ellipse cx="0" cy="0" rx="5" ry="3.6" fill="url(#${pfx}goldRibbon)" stroke="#8F5D0E" stroke-width="0.7"/>
      </g>
    `;

    // 3 Compact Realistic Balloons rising out of the bow at (0, 0)
    const bouquetDefs = [
      { style: 'gold',  hx: -4,  hy: -78, scale: 0.56 },
      { style: 'pearl', hx: -38, hy: -58, scale: 0.50 },
      { style: 'rose',  hx: 30,  hy: -60, scale: 0.52 }
    ];

    const balloons = [];

    const spawnBurst = (bx, by, count = 16) => {
      const burstGroup = document.createElementNS(SVG_NS, 'g');
      burstGroup.setAttribute('transform', `translate(${bx.toFixed(1)}, ${by.toFixed(1)})`);
      fxLayer.appendChild(burstGroup);

      const ring = document.createElementNS(SVG_NS, 'circle');
      ring.setAttribute('r', '6');
      ring.setAttribute('fill', 'none');
      ring.setAttribute('stroke', '#D9A141');
      ring.setAttribute('stroke-width', '2');
      burstGroup.appendChild(ring);

      const colors = ['#D9A141', '#C48B2C', '#D18A6C', '#FFFDF7', '#7D9E8B', '#E6AF96'];
      const particles = Array.from({ length: count }, (_, idx) => {
        const isRect = idx % 2 === 0;
        const p = document.createElementNS(SVG_NS, isRect ? 'rect' : 'circle');
        const col = colors[idx % colors.length];
        if (isRect) {
          p.setAttribute('width', '6');
          p.setAttribute('height', '3.5');
          p.setAttribute('rx', '1');
          p.setAttribute('x', '-3');
          p.setAttribute('y', '-1.7');
        } else {
          p.setAttribute('r', String(2 + (idx % 3)));
        }
        p.setAttribute('fill', col);
        burstGroup.appendChild(p);
        const ang = (Math.PI * 2 * idx) / count + (Math.random() - 0.5) * 0.35;
        const spd = 3.2 + Math.random() * 5.0;
        return {
          el: p,
          x: Math.cos(ang) * 5,
          y: Math.sin(ang) * 5,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd - 2.0,
          rot: Math.random() * 360,
          vrot: (Math.random() - 0.5) * 18
        };
      });

      let frame = 0;
      const animateBurst = () => {
        frame++;
        const progress = frame / 34;
        ring.setAttribute('r', String(8 + progress * 44));
        ring.setAttribute('opacity', String(Math.max(0, 1 - progress * 1.8)));
        particles.forEach(pt => {
          pt.x += pt.vx;
          pt.y += pt.vy;
          pt.vy += 0.25;
          pt.vx *= 0.95;
          pt.rot += pt.vrot;
          pt.el.setAttribute('transform', `translate(${pt.x.toFixed(1)}, ${pt.y.toFixed(1)}) rotate(${pt.rot.toFixed(0)})`);
          pt.el.setAttribute('opacity', String(Math.max(0, 1 - progress)));
        });
        if (frame < 34) {
          requestAnimationFrame(animateBurst);
        } else {
          burstGroup.remove();
        }
      };
      requestAnimationFrame(animateBurst);
    };

    bouquetDefs.forEach((def, i) => {
      const styleName = def.style;
      const g = document.createElementNS(SVG_NS, 'g');
      g.setAttribute('class', 'interactive-balloon');
      g.setAttribute('role', 'button');
      g.setAttribute('tabindex', '0');
      g.setAttribute('aria-label', `Спукай балон ${i + 1}`);

      const stringShadow = document.createElementNS(SVG_NS, 'path');
      stringShadow.setAttribute('class', 'balloon-string-shadow');

      const stringPath = document.createElementNS(SVG_NS, 'path');
      stringPath.setAttribute('class', 'balloon-string');

      stringsLayer.append(stringShadow, stringPath);

      const bodyGroup = document.createElementNS(SVG_NS, 'g');
      bodyGroup.setAttribute('filter', `url(#${pfx}shadow)`);

      const balloonD = 'M 0 -48 C 28.5 -48, 41 -25.5, 41 -2 C 41 21.5, 21.5 41.5, 4.2 48.5 C 3.2 49.5, 2.5 50.5, 2.2 51.5 L -2.2 51.5 C -2.5 50.5, -3.2 49.5, -4.2 48.5 C -21.5 41.5, -41 21.5, -41 -2 C -41 -25.5, -28.5 -48, 0 -48 Z';

      const body = document.createElementNS(SVG_NS, 'path');
      body.setAttribute('d', balloonD);
      body.setAttribute('fill', `url(#${pfx}${styleName})`);

      const rimOverlay = document.createElementNS(SVG_NS, 'path');
      rimOverlay.setAttribute('d', balloonD);
      rimOverlay.setAttribute('fill', `url(#${pfx}rim)`);
      rimOverlay.setAttribute('stroke', 'rgba(255, 250, 240, 0.45)');
      rimOverlay.setAttribute('stroke-width', '0.75');

      const confettiGroup = document.createElementNS(SVG_NS, 'g');
      if (styleName === 'pearl') {
        const dots = [
          [-16, 8, 3.2, '#D9A141', 0.65],
          [14, -12, 2.8, '#C48B2C', 0.55],
          [6, 18, 3.5, '#D18A6C', 0.6],
          [-8, 26, 2.6, '#D9A141', 0.7],
          [19, 10, 3.0, '#C2956B', 0.6],
          [-2, -6, 2.2, '#D9A141', 0.45]
        ];
        dots.forEach(([cx, cy, r, col, op]) => {
          const c = document.createElementNS(SVG_NS, 'circle');
          c.setAttribute('cx', String(cx));
          c.setAttribute('cy', String(cy));
          c.setAttribute('r', String(r));
          c.setAttribute('fill', col);
          c.setAttribute('opacity', String(op));
          confettiGroup.appendChild(c);
        });
      }

      const windowShine = document.createElementNS(SVG_NS, 'path');
      windowShine.setAttribute(
        'd',
        'M -25 -15 C -27 -29, -15 -40, -3 -41 C -9 -36, -16 -26, -16 -13 C -16 -6, -24 -7, -25 -15 Z'
      );
      windowShine.setAttribute('fill', `url(#${pfx}spec)`);

      const glintDot = document.createElementNS(SVG_NS, 'ellipse');
      glintDot.setAttribute('cx', '-20');
      glintDot.setAttribute('cy', '-4');
      glintDot.setAttribute('rx', '2.8');
      glintDot.setAttribute('ry', '4.2');
      glintDot.setAttribute('transform', 'rotate(-14 -20 -4)');
      glintDot.setAttribute('fill', 'rgba(255, 255, 255, 0.62)');

      const backGlint = document.createElementNS(SVG_NS, 'path');
      backGlint.setAttribute(
        'd',
        'M 28 12 C 25 26, 14 37, 4 42 C 16 38, 29 28, 33 13 C 34 9, 29 8, 28 12 Z'
      );
      backGlint.setAttribute('fill', 'rgba(255, 252, 245, 0.28)');

      const neck = document.createElementNS(SVG_NS, 'path');
      neck.setAttribute(
        'd',
        'M -2.5 51 L 2.5 51 L 5.2 56.5 C 5.6 57.6, 4.5 58.5, 0 58.5 C -4.5 58.5, -5.6 57.6, -5.2 56.5 Z'
      );
      neck.setAttribute('fill', `url(#${pfx}${styleName})`);
      neck.setAttribute('stroke', 'rgba(60, 42, 24, 0.28)');
      neck.setAttribute('stroke-width', '0.7');

      const ribbonKnot = document.createElementNS(SVG_NS, 'path');
      ribbonKnot.setAttribute(
        'd',
        'M -6 51.5 Q 0 49.5 6 51.5 Q 9 54 4 54.5 Q 0 53 -4 54.5 Q -9 54 -6 51.5 Z'
      );
      ribbonKnot.setAttribute('fill', '#C48B2C');
      ribbonKnot.setAttribute('opacity', '0.88');

      bodyGroup.append(body, confettiGroup, rimOverlay, windowShine, glintDot, backGlint, neck, ribbonKnot);
      g.appendChild(bodyGroup);
      balloonsLayer.appendChild(g);

      const b = {
        el: g,
        bodyGroup,
        stringPath,
        stringShadow,
        scale: def.scale,
        currentScale: def.scale,
        radius: 38 * def.scale,
        homeX: def.hx,
        homeY: def.hy,
        x: def.hx,
        y: def.hy,
        vx: 0,
        vy: 0,
        angle: 0,
        stretch: 1,
        popped: false,
        phase: i * 1.45 + stageIdx * 0.9,
        dragging: false,
        touchPending: false,
        pointerId: null,
        startX: 0,
        startY: 0,
        startClientX: 0,
        startClientY: 0,
        dragOffsetX: 0,
        dragOffsetY: 0,
        lastPointerX: 0,
        lastPointerY: 0
      };

      const toLocalCoords = e => {
        const rect = svg.getBoundingClientRect();
        return {
          px: e.clientX - rect.left,
          py: e.clientY - rect.top
        };
      };

      const popBalloon = () => {
        if (b.popped) return;
        b.popped = true;
        b.dragging = false;
        b.touchPending = false;
        g.classList.remove('is-dragging');
        host.style.transform = '';
        playPopSound();
        spawnBurst(b.x, b.y, 16);

        g.style.display = 'none';
        b.stringPath.style.display = 'none';
        b.stringShadow.style.display = 'none';

        setTimeout(() => {
          b.popped = false;
          b.x = 0;
          b.y = -8;
          b.vx = def.hx * 0.08;
          b.vy = -3.6;
          b.stretch = 0.5;
          g.style.display = '';
          b.stringPath.style.display = '';
          b.stringShadow.style.display = '';
          startLoop();
        }, 3600);
      };

      b.popBalloon = popBalloon;

      g.addEventListener('keydown', e => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        popBalloon();
      });

      g.addEventListener('pointerdown', e => {
        if (b.popped) return;
        const { px, py } = toLocalCoords(e);
        b.pointerId = e.pointerId;
        b.startX = px;
        b.startY = py;
        b.startClientX = e.clientX;
        b.startClientY = e.clientY;
        b.dragOffsetX = b.x - px;
        b.dragOffsetY = b.y - py;
        b.lastPointerX = px;
        b.lastPointerY = py;

        b.dragging = true;
        b.vx = 0;
        b.vy = -1.8;
        b.stretch = 1.06;
        g.classList.add('is-dragging');
        balloonsLayer.appendChild(g);
        try { g.setPointerCapture(e.pointerId); } catch {}
        startLoop();
      });

      g.addEventListener('pointermove', e => {
        if (e.pointerId !== b.pointerId || !b.dragging) return;
        const { px, py } = toLocalCoords(e);
        b.vx = (px - b.lastPointerX) * 0.65;
        b.vy = (py - b.lastPointerY) * 0.65;
        b.x = px + b.dragOffsetX;
        b.y = py + b.dragOffsetY;
        b.lastPointerX = px;
        b.lastPointerY = py;
      });

      const endDrag = e => {
        if (e.pointerId !== undefined && e.pointerId !== b.pointerId) return;
        const wasTap = e.type === 'pointerup' && b.dragging &&
          Math.hypot(e.clientX - b.startClientX, e.clientY - b.startClientY) < 10;
        b.touchPending = false;
        if (b.dragging) {
          b.dragging = false;
          b.stretch = 0.94;
          g.classList.remove('is-dragging');
          host.style.transform = '';
        }
        b.pointerId = null;
        if (wasTap) popBalloon();
      };

      g.addEventListener('pointerup', endDrag);
      g.addEventListener('pointercancel', endDrag);

      g.addEventListener('pointerenter', e => {
        if (b.dragging || e.pointerType === 'touch' || b.popped) return;
        b.vx += (Math.random() - 0.5) * 2.5;
        b.vy -= 1.4;
        b.stretch = 1.04;
        startLoop();
      });

      balloons.push(b);
    });

    let running = false;
    let visible = true;
    let lastTime = performance.now();

    function renderFrame(now) {
      if (!visible) {
        running = false;
        return;
      }
      const dt = Math.min(2, (now - lastTime) / 16.67);
      lastTime = now;
      const t = now * 0.0017;
      const reduce = reducedMotion();

      let pullX = 0;
      let pullY = 0;

      for (let i = 0; i < balloons.length; i++) {
        const b = balloons[i];
        if (b.popped) continue;

        if (!b.dragging) {
          const floatX = reduce ? 0 : Math.sin(t + b.phase) * 4.5;
          const floatY = reduce ? 0 : Math.cos(t * 1.18 + b.phase) * 3.8;
          const targetX = b.homeX + floatX;
          const targetY = b.homeY + floatY;

          b.vx += (targetX - b.x) * 0.028 * dt;
          b.vy += (targetY - b.y) * 0.028 * dt;
          b.vx *= Math.pow(0.90, dt);
          b.vy *= Math.pow(0.90, dt);
          b.x += b.vx * dt;
          b.y += b.vy * dt;
        }

        const distAnchor = Math.hypot(b.x, b.y) || 1;
        let tension = 0;

        if (b.dragging) {
          tension = Math.max(0, (distAnchor - 95) / 145);
          b.stretch = 1 + Math.min(0.42, tension * 0.36);
          pullX += b.x * 0.025;
          pullY += b.y * 0.02;

          if (tension >= 1.0) {
            b.popBalloon();
            continue;
          }
        } else {
          b.stretch += (1 - b.stretch) * 0.14 * dt;
        }

        for (let j = i + 1; j < balloons.length; j++) {
          const o = balloons[j];
          if (o.popped) continue;
          const dx = o.x - b.x;
          const dy = o.y - b.y;
          const dist = Math.hypot(dx, dy) || 1;
          const minDist = (b.radius + o.radius) * 0.90;
          if (dist < minDist) {
            const overlap = (minDist - dist) * 0.065;
            const nx = dx / dist;
            const ny = dy / dist;
            if (!b.dragging) {
              b.vx -= nx * overlap;
              b.vy -= ny * overlap;
            }
            if (!o.dragging) {
              o.vx += nx * overlap;
              o.vy += ny * overlap;
            }
          }
        }

        const tetherAngle = Math.atan2(b.x, Math.max(20, -b.y)) * (180 / Math.PI) * (b.dragging ? 0.65 : 0.42);
        const targetAngle = Math.max(-42, Math.min(42, tetherAngle + b.vx * 1.6));
        b.angle += (targetAngle - b.angle) * 0.22;

        const jitterX = b.dragging && tension > 0.55 ? (Math.random() - 0.5) * (tension - 0.5) * 6 : 0;
        const jitterY = b.dragging && tension > 0.55 ? (Math.random() - 0.5) * (tension - 0.5) * 6 : 0;

        const s = b.currentScale;
        const sx = (s / Math.sqrt(b.stretch)).toFixed(3);
        const sy = (s * b.stretch).toFixed(3);
        b.el.setAttribute('transform', `translate(${(b.x + jitterX).toFixed(1)}, ${(b.y + jitterY).toFixed(1)})`);
        b.bodyGroup.setAttribute('transform', `rotate(${b.angle.toFixed(1)}) scale(${sx}, ${sy})`);

        const rad = (b.angle * Math.PI) / 180;
        const neckDist = 54 * s * b.stretch;
        const startX = b.x + jitterX - Math.sin(rad) * neckDist;
        const startY = b.y + jitterY + Math.cos(rad) * neckDist;
        const slack = Math.max(0, 1 - tension * 1.15);
        const curveWave = (reduce ? 0 : Math.sin(t * 2.0 + b.phase) * 4) * slack;
        const midY = startY * 0.5;
        const cp1x = startX * 0.75 + curveWave;
        const cp2x = startX * 0.25 - curveWave * 0.6;

        const ribbonD = `M ${startX.toFixed(1)} ${startY.toFixed(1)} C ${cp1x.toFixed(1)} ${midY.toFixed(1)}, ${cp2x.toFixed(1)} ${(midY + 10 * slack).toFixed(1)}, 0 0`;
        b.stringPath.setAttribute('d', ribbonD);
        b.stringShadow.setAttribute('d', ribbonD);
      }

      if (pullX !== 0 || pullY !== 0) {
        const tx = Math.max(-5, Math.min(5, pullX));
        const ty = Math.max(-5, Math.min(4, pullY));
        host.style.transform = `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px) rotate(${(tx * 0.25).toFixed(2)}deg)`;
      }

      if (!reduce || balloons.some(b => b.dragging || Math.hypot(b.vx, b.vy) > 0.05)) {
        requestAnimationFrame(renderFrame);
      } else {
        running = false;
      }
    }

    function startLoop() {
      if (!running && visible) {
        running = true;
        lastTime = performance.now();
        requestAnimationFrame(renderFrame);
      }
    }

    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          visible = entry.isIntersecting;
          if (visible) startLoop();
        });
      });
      io.observe(host);
    }

    startLoop();
  });
})();
