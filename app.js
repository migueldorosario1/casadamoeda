/* ==========================================================================
   CASA DA MOEDA: ÂNCORA PÚBLICA DE CONFIANÇA
   Application Logic: Theme Switcher, Presentation Stack & Observations
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initMobileDropdowns();
  initReadingProgress();
  initFAQAccordion();
  loadPresentationStacks();
  loadSavedObservations();
  initFullscreenModal();
  loadVideoteca();
  loadNewsChannel();
});

function initMobileDropdowns() {
  document.querySelectorAll(".dropdown-toggle").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const parent = btn.closest(".nav-dropdown");
      if (!parent) return;
      
      const isOpen = parent.classList.contains("active");
      document.querySelectorAll(".nav-dropdown").forEach(d => {
        if (d !== parent) d.classList.remove("active");
      });
      
      parent.classList.toggle("active", !isOpen);
    });
  });

  document.addEventListener("click", () => {
    document.querySelectorAll(".nav-dropdown").forEach(d => d.classList.remove("active"));
  });
}

/* --------------------------------------------------------------------------
   0. Theme Switcher (Modo Dia / Noite)
   -------------------------------------------------------------------------- */
function initTheme() {
  const savedTheme = localStorage.getItem("cmb_theme") || "dark";
  document.documentElement.setAttribute("data-theme", savedTheme);
  updateThemeButtonUI(savedTheme);
}

window.toggleTheme = function() {
  const currentTheme = document.documentElement.getAttribute("data-theme") || "dark";
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  
  document.documentElement.setAttribute("data-theme", newTheme);
  localStorage.setItem("cmb_theme", newTheme);
  updateThemeButtonUI(newTheme);
};

function updateThemeButtonUI(theme) {
  const btn = document.getElementById("theme-toggle-btn");
  if (!btn) return;
  if (theme === "light") {
    btn.innerHTML = "🌙 Noite";
  } else {
    btn.innerHTML = "☀️ Dia";
  }
}

/* --------------------------------------------------------------------------
   1. Reading Progress Bar
   -------------------------------------------------------------------------- */
function initReadingProgress() {
  const progressBar = document.getElementById("reading-progress");
  window.addEventListener("scroll", () => {
    const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = (window.scrollY / totalHeight) * 100;
    if (progressBar) {
      progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
    }
  });
}

/* --------------------------------------------------------------------------
   2. FAQ Accordion
   -------------------------------------------------------------------------- */
function initFAQAccordion() {
  const faqQuestions = document.querySelectorAll(".faq-question");
  faqQuestions.forEach(btn => {
    btn.addEventListener("click", () => {
      const item = btn.parentElement;
      const isActive = item.classList.contains("active");
      
      document.querySelectorAll(".faq-item").forEach(el => el.classList.remove("active"));
      
      if (!isActive) {
        item.classList.add("active");
      }
    });
  });
}

/* --------------------------------------------------------------------------
   3. Cascading Vertical Presentation Stack Renderer (apresentacoes.json)
   -------------------------------------------------------------------------- */
async function loadPresentationStacks() {
  try {
    const response = await fetch("apresentacoes.json");
    if (!response.ok) return;
    const data = await response.json();

    Object.keys(data).forEach(parteId => {
      const container = document.getElementById(`stack-${parteId}`);
      if (!container) return;

      const presentations = data[parteId];
      if (!presentations || presentations.length === 0) return;

      let html = `
        <div class="stack-header">
          <h3 class="stack-title">
            <span>📑 Apresentação Oficial em Slides</span>
          </h3>
          <span style="font-size: 0.85rem; color: var(--accent-gold); font-weight: 600; font-family: var(--font-mono);">
            44 Slides (Versão Completa)
          </span>
        </div>
        <div class="stack-cards-vertical">
      `;

      presentations.forEach((pres, presIdx) => {
        const isOfficial = pres.isOfficial;
        const cardClass = isOfficial ? "presentation-card official-card" : "presentation-card";
        const officialBadge = isOfficial ? `<span class="badge-official">🔒 VERSÃO OFICIAL</span>` : "";

        html += `
          <div class="${cardClass}" id="pres-card-${parteId}-${presIdx}">
            <div class="presentation-card-header">
              <div class="card-title-group">
                <span class="badge-version">${pres.versionTag}</span>
                ${officialBadge}
                <span class="card-presentation-name">${pres.name}</span>
              </div>
              <div class="card-actions">
                ${pres.pdfLink ? `<a href="${pres.pdfLink}" target="_blank" class="btn-icon">📄 PDF</a>` : ''}
                ${pres.pptxLink ? `<a href="${pres.pptxLink}" target="_blank" class="btn-icon">📊 PPTX</a>` : ''}
              </div>
            </div>

            <!-- Slide Viewer Box -->
            <div class="slide-viewer-box">
              <div class="slide-display-area">
                <img id="img-${parteId}-${presIdx}" src="${pres.slidesFolder}/slide_01.png" alt="Slide 1" class="slide-img" />
                <div class="slide-nav-overlay">
                  <button class="slide-btn-prev" onclick="changeSlide('${parteId}', ${presIdx}, -1, ${pres.slidesCount})">‹</button>
                  <button class="slide-btn-next" onclick="changeSlide('${parteId}', ${presIdx}, 1, ${pres.slidesCount})">›</button>
                </div>
              </div>
              
              <div class="slide-controls-bar">
                <div class="slide-counter">
                  Slide <span id="count-${parteId}-${presIdx}">01</span> / ${String(pres.slidesCount).padStart(2, '0')}
                </div>
                
                <div class="slide-thumbnails-scroller">
                  ${generateThumbnails(parteId, presIdx, pres.slidesFolder, pres.slidesCount)}
                </div>
                
                <button class="btn-icon" onclick="openFullscreenModal('${pres.slidesFolder}', '${parteId}', ${presIdx}, ${pres.slidesCount})">
                  🔍 Ampliar
                </button>
              </div>
            </div>
          </div>
        `;
      });

      html += `</div>`;
      container.innerHTML = html;
    });

  } catch (err) {
    console.warn("No apresentacoes.json loaded or failed parsing:", err);
  }
}

function generateThumbnails(parteId, presIdx, folder, count) {
  let thumbs = "";
  const maxThumbs = Math.min(count, 12);
  for (let i = 1; i <= maxThumbs; i++) {
    const slideNum = String(i).padStart(2, '0');
    const activeClass = i === 1 ? "active" : "";
    thumbs += `<img src="${folder}/slide_${slideNum}.png" class="slide-thumb ${activeClass}" id="thumb-${parteId}-${presIdx}-${i}" onclick="setSlide('${parteId}', ${presIdx}, ${i}, ${count}, '${folder}')" />`;
  }
  return thumbs;
}

const slideState = {};

window.changeSlide = function(parteId, presIdx, direction, totalCount) {
  const key = `${parteId}-${presIdx}`;
  if (!slideState[key]) slideState[key] = 1;
  
  let current = slideState[key] + direction;
  if (current < 1) current = totalCount;
  if (current > totalCount) current = 1;
  
  slideState[key] = current;
  updateSlideUI(parteId, presIdx, current, totalCount);
};

window.setSlide = function(parteId, presIdx, slideNum, totalCount, folder) {
  const key = `${parteId}-${presIdx}`;
  slideState[key] = slideNum;
  updateSlideUI(parteId, presIdx, slideNum, totalCount);
};

function updateSlideUI(parteId, presIdx, slideNum, totalCount) {
  const card = document.getElementById(`pres-card-${parteId}-${presIdx}`);
  if (!card) return;

  const folderMeta = card.querySelector(".slide-display-area img").src;
  const folder = folderMeta.substring(0, folderMeta.lastIndexOf('/'));
  
  const padded = String(slideNum).padStart(2, '0');
  const imgEl = document.getElementById(`img-${parteId}-${presIdx}`);
  const countEl = document.getElementById(`count-${parteId}-${presIdx}`);

  if (imgEl) imgEl.src = `${folder}/slide_${padded}.png`;
  if (countEl) countEl.textContent = padded;

  card.querySelectorAll(".slide-thumb").forEach((th, idx) => {
    th.classList.toggle("active", (idx + 1) === slideNum);
  });
}

/* --------------------------------------------------------------------------
   4. Observations & Comments (Removed per user request)
   -------------------------------------------------------------------------- */
function loadSavedObservations() {}
window.toggleObsInput = function() {};
window.saveObservation = function() {};
window.toggleAudioRecording = function() {};
window.filterForumComments = function() {};

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/* --------------------------------------------------------------------------
   5. Fullscreen Slide Modal
   -------------------------------------------------------------------------- */
function initFullscreenModal() {
  const modal = document.getElementById("slide-modal");
  const closeBtn = document.getElementById("modal-close");
  
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      modal.classList.remove("active");
    });
  }

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.remove("active");
      }
    });
  }
}

let currentModalState = {
  parteId: null,
  presIdx: null,
  slideNum: 1,
  totalCount: 1,
  folder: ''
};

window.openFullscreenModal = function(folder, parteId, presIdx, totalCount) {
  const key = `${parteId}-${presIdx}`;
  const currentSlide = slideState[key] || 1;
  
  currentModalState = {
    parteId: parteId,
    presIdx: presIdx,
    slideNum: currentSlide,
    totalCount: totalCount || 44,
    folder: folder
  };

  updateFullscreenModalUI();
  
  const modal = document.getElementById("slide-modal");
  if (modal) modal.classList.add("active");
};

window.changeFullscreenSlide = function(direction) {
  if (!currentModalState.folder) return;
  
  let next = currentModalState.slideNum + direction;
  if (next < 1) next = currentModalState.totalCount;
  if (next > currentModalState.totalCount) next = 1;
  
  currentModalState.slideNum = next;
  
  const key = `${currentModalState.parteId}-${currentModalState.presIdx}`;
  slideState[key] = next;

  updateFullscreenModalUI();
  updateSlideUI(currentModalState.parteId, currentModalState.presIdx, next, currentModalState.totalCount);
};

function updateFullscreenModalUI() {
  const modalImg = document.getElementById("modal-img");
  const counterEl = document.getElementById("modal-slide-counter");
  
  if (modalImg && currentModalState.folder) {
    const padded = String(currentModalState.slideNum).padStart(2, '0');
    modalImg.src = `${currentModalState.folder}/slide_${padded}.png`;
  }
  
  if (counterEl) {
    const paddedNum = String(currentModalState.slideNum).padStart(2, '0');
    const paddedTotal = String(currentModalState.totalCount).padStart(2, '0');
    counterEl.textContent = `Slide ${paddedNum} / ${paddedTotal}`;
  }
}

window.closeFullscreenModal = function() {
  const modal = document.getElementById("slide-modal");
  if (modal) modal.classList.remove("active");
};

document.addEventListener("keydown", (e) => {
  const slideModal = document.getElementById("slide-modal");
  if (slideModal && slideModal.classList.contains("active")) {
    if (e.key === "ArrowLeft") {
      changeFullscreenSlide(-1);
    } else if (e.key === "ArrowRight" || e.key === " ") {
      changeFullscreenSlide(1);
    } else if (e.key === "Escape") {
      closeFullscreenModal();
    }
  }
});

/* --------------------------------------------------------------------------
   5.5. Videoteca & Player Modal (videos.json)
   -------------------------------------------------------------------------- */
let allVideosData = [];

async function loadVideoteca() {
  const container = document.getElementById("video-grid-container");
  if (!container) return;

  try {
    const response = await fetch("videos.json");
    if (!response.ok) return;
    allVideosData = await response.json();
    renderVideoCards(allVideosData);
  } catch (err) {
    console.warn("Failed loading videos.json:", err);
  }
}

function renderVideoCards(items) {
  const container = document.getElementById("video-grid-container");
  if (!container) return;

  if (!items || items.length === 0) {
    container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-subtle); padding: 40px;">Nenhum vídeo encontrado para esta categoria.</div>`;
    return;
  }

  let html = "";
  items.forEach(item => {
    html += `
      <article class="news-card video-card">
        <div class="video-thumb-wrapper" onclick="openVideoModal(${item.id})">
          <img src="${item.thumbnail}" alt="${escapeHtml(item.title)}" class="news-card-img" loading="lazy" />
          <div class="play-overlay">
            <span class="play-icon-btn">▶</span>
          </div>
          <span class="video-duration-tag">${item.duration}</span>
        </div>
        <div>
          <div class="news-card-header">
            <span class="news-badge badge-video">${item.badge}</span>
            <span class="news-date">${item.date}</span>
          </div>
          <h3 class="news-card-title">
            <a href="javascript:void(0)" onclick="openVideoModal(${item.id})" style="color: inherit; text-decoration: none;" onmouseover="this.style.color='var(--primary-emerald)'" onmouseout="this.style.color='inherit'">
              ${item.title}
            </a>
          </h3>
          <p class="news-card-body">${item.excerpt}</p>
        </div>
        <div class="news-card-footer">
          <span style="font-weight: 500; color: var(--text-subtle);">${item.source}</span>
          <button onclick="openVideoModal(${item.id})" class="news-link" style="background: none; border: none; cursor: pointer; padding: 0; font-size: 0.85rem; font-family: inherit;">
            ▶ Assistir vídeo
          </button>
        </div>
      </article>
    `;
  });

  container.innerHTML = html;
}

window.filterVideos = function(category) {
  document.querySelectorAll(".video-tab-btn").forEach(btn => {
    btn.classList.toggle("active", btn.getAttribute("data-vcat") === category);
  });

  if (category === "all") {
    renderVideoCards(allVideosData);
  } else {
    const filtered = allVideosData.filter(item => item.category === category);
    renderVideoCards(filtered);
  }
};

window.openVideoModal = function(videoId) {
  const video = allVideosData.find(v => v.id === videoId);
  if (!video) return;

  const modal = document.getElementById("video-modal");
  const box = document.getElementById("video-player-box");
  const titleEl = document.getElementById("video-modal-title");
  const descEl = document.getElementById("video-modal-desc");

  if (!modal || !box) return;

  if (video.type === "youtube") {
    box.innerHTML = `<iframe src="${video.url}" title="${escapeHtml(video.title)}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="width:100%; height:100%; border:none; border-radius: 8px 8px 0 0;"></iframe>`;
  } else {
    box.innerHTML = `<video src="${video.url}" controls autoplay style="width:100%; height:100%; object-fit:contain; background:#000; border-radius: 8px 8px 0 0;"></video>`;
  }

  if (titleEl) titleEl.textContent = video.title;
  if (descEl) descEl.textContent = video.excerpt;

  modal.classList.add("active");
};

window.closeVideoModal = function() {
  const modal = document.getElementById("video-modal");
  const box = document.getElementById("video-player-box");
  if (box) box.innerHTML = "";
  if (modal) modal.classList.remove("active");
};

/* --------------------------------------------------------------------------
   6. Canal de Notícias & Atualizações
   -------------------------------------------------------------------------- */
let allNewsData = [];

async function loadNewsChannel() {
  const container = document.getElementById("news-grid-container");
  if (!container) return;

  try {
    const response = await fetch("noticias.json");
    if (!response.ok) return;
    allNewsData = await response.json();
    renderNewsCards(allNewsData);
  } catch (err) {
    console.warn("Failed loading noticias.json:", err);
  }
}

function renderNewsCards(items) {
  const container = document.getElementById("news-grid-container");
  if (!container) return;

  if (!items || items.length === 0) {
    container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-subtle); padding: 40px;">Nenhuma notícia encontrada para esta categoria.</div>`;
    return;
  }

  let html = "";
  items.forEach(item => {
    let badgeClass = "news-badge";
    if (item.category === "eu") badgeClass += " badge-eu";
    if (item.category === "global") badgeClass += " badge-global";

    const linkUrl = item.url || "#";
    const imgHtml = item.image ? `
      <div class="news-card-img-wrapper">
        <a href="${linkUrl}" target="_blank" rel="noopener noreferrer">
          <img src="${item.image}" alt="${escapeHtml(item.title)}" class="news-card-img" loading="lazy" />
        </a>
      </div>
    ` : '';

    html += `
      <article class="news-card">
        ${imgHtml}
        <div>
          <div class="news-card-header">
            <span class="${badgeClass}">${item.badge}</span>
            <span class="news-date">${item.date}</span>
          </div>
          <h3 class="news-card-title">
            <a href="${linkUrl}" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: none;" onmouseover="this.style.color='var(--primary-emerald)'" onmouseout="this.style.color='inherit'">
              ${item.title}
            </a>
          </h3>
          <p class="news-card-body">${item.excerpt}</p>
        </div>
        <div class="news-card-footer">
          <span style="font-weight: 500; color: var(--text-subtle);">${item.impact}</span>
          <a href="${linkUrl}" target="_blank" rel="noopener noreferrer" class="news-link">
            Ler na ${item.source} ↗
          </a>
        </div>
      </article>
    `;
  });

  container.innerHTML = html;
}

window.filterNews = function(category) {
  document.querySelectorAll(".news-tab-btn").forEach(btn => {
    btn.classList.toggle("active", btn.getAttribute("data-cat") === category);
  });

  if (category === "all") {
    renderNewsCards(allNewsData);
  } else {
    const filtered = allNewsData.filter(item => item.category === category);
    renderNewsCards(filtered);
  }
};

