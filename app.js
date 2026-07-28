/* ==========================================================================
   CASA DA MOEDA: ÂNCORA PÚBLICA DE CONFIANÇA (CLEC-CMB)
   Application Logic: Presentation Stack, AI Revision & Diff Engine
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  initReadingProgress();
  initFAQAccordion();
  initNavigationHighlight();
  loadPresentationStacks();
  loadRevisionEngines();
  initFullscreenModal();
});

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
      
      // Close other accordion items
      document.querySelectorAll(".faq-item").forEach(el => el.classList.remove("active"));
      
      if (!isActive) {
        item.classList.add("active");
      }
    });
  });
}

/* --------------------------------------------------------------------------
   3. Active Navigation Highlight
   -------------------------------------------------------------------------- */
function initNavigationHighlight() {
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".nav-links a");

  window.addEventListener("scroll", () => {
    let current = "";
    sections.forEach(sec => {
      const top = sec.offsetTop - 100;
      if (window.scrollY >= top) {
        current = sec.getAttribute("id");
      }
    });

    navLinks.forEach(link => {
      link.classList.remove("active");
      if (link.getAttribute("href") === `#${current}`) {
        link.classList.add("active");
      }
    });
  });
}

/* --------------------------------------------------------------------------
   4. Cascading Vertical Presentation Stack Renderer (apresentacoes.json)
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
            <span>📑 Espaço de Apresentações em Cascata Vertical</span>
          </h3>
          <span style="font-size: 0.85rem; color: var(--text-muted); font-family: var(--font-mono);">
            ${presentations.length} Versões Registradas
          </span>
        </div>
        <div class="stack-cards-vertical">
      `;

      presentations.forEach((pres, presIdx) => {
        const isOfficial = pres.isOfficial;
        const cardClass = isOfficial ? "presentation-card official-card" : "presentation-card";
        const officialBadge = isOfficial ? `<span class="badge-official">🔒 OFICIAL</span>` : "";

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
                
                <button class="btn-icon" onclick="openFullscreenModal('${pres.slidesFolder}', '${parteId}', ${presIdx})">
                  🔍 Zoom
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

// Global slide state storage
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

  // Update thumbnail active status
  card.querySelectorAll(".slide-thumb").forEach((th, idx) => {
    th.classList.toggle("active", (idx + 1) === slideNum);
  });
}

/* --------------------------------------------------------------------------
   5. AI Revision Engine & Diff Viewer (revisions.json)
   -------------------------------------------------------------------------- */
async function loadRevisionEngines() {
  try {
    const response = await fetch("revisions.json");
    if (!response.ok) return;
    const revisionsData = await response.json();

    Object.keys(revisionsData).forEach(parteId => {
      const container = document.getElementById(`rev-${parteId}`);
      if (!container) return;

      const revs = revisionsData[parteId];
      if (!revs) return;

      renderRevisionBox(container, parteId, revs);
    });

  } catch (err) {
    console.warn("No revisions.json loaded or failed parsing:", err);
  }
}

function renderRevisionBox(container, parteId, revs) {
  const keys = Object.keys(revs);
  if (keys.length === 0) return;

  let tabsHtml = `<button class="rev-tab-btn active" onclick="switchRevisionTab('${parteId}', 'official')">🔒 Texto Oficial</button>`;
  keys.forEach(k => {
    tabsHtml += `<button class="rev-tab-btn" onclick="switchRevisionTab('${parteId}', '${k}')">${revs[k].versionTag || k}</button>`;
  });

  const firstRev = revs[keys[0]];

  container.innerHTML = `
    <div class="revision-header">
      <div class="revision-title-group">
        <div class="revision-icon">🤖</div>
        <div>
          <div class="revision-title">Espaço de Correção com IA — Texto da Parte</div>
          <div style="font-size: 0.8rem; color: var(--text-muted);">Aplicações de regras de refinamento ditadas por voz</div>
        </div>
      </div>
      <div class="revision-tabs" id="rev-tabs-${parteId}">
        ${tabsHtml}
      </div>
    </div>

    <div id="rev-content-area-${parteId}">
      ${renderOfficialTextPlaceholder(parteId)}
    </div>
  `;

  // Save revision data on container
  container.dataset.revsJson = JSON.stringify(revs);
}

function renderOfficialTextPlaceholder(parteId) {
  return `
    <div class="revision-metadata-card">
      <div class="rev-meta-item">
        <span class="badge-official">🔒 TEXTO OFICIAL VIGENTE</span>
      </div>
      <p style="font-size: 0.92rem; color: var(--text-muted); margin-top: 8px;">
        Exibindo o texto base de referência para esta Parte. Selecione uma aba de revisão acima para visualizar a instrução de voz do Miguel, a regra destilada e o comparativo (diff) em tempo real.
      </p>
    </div>
  `;
}

window.switchRevisionTab = function(parteId, revKey) {
  const container = document.getElementById(`rev-${parteId}`);
  if (!container) return;

  const tabs = document.querySelectorAll(`#rev-tabs-${parteId} .rev-tab-btn`);
  tabs.forEach(t => t.classList.remove("active"));
  
  // Highlight active tab
  event.target.classList.add("active");

  const contentArea = document.getElementById(`rev-content-area-${parteId}`);
  if (revKey === 'official') {
    contentArea.innerHTML = renderOfficialTextPlaceholder(parteId);
    return;
  }

  const revsData = JSON.parse(container.dataset.revsJson || "{}");
  const rev = revsData[revKey];
  if (!rev) return;

  const baselineText = getParteBaselineText(parteId);
  const diffHtml = computeSimpleDiff(baselineText, rev.content);

  contentArea.innerHTML = `
    <div class="revision-metadata-card">
      <div style="display: flex; gap: 10px; margin-bottom: 12px; flex-wrap: wrap;">
        <span class="badge-version" style="background-color: var(--revision-purple); color: #fff;">${rev.versionTag}</span>
        <span class="badge-version">${rev.badge || 'Revisão IA'}</span>
        <span class="badge-version" style="color: var(--text-muted);">${rev.date}</span>
      </div>

      <div class="rev-meta-item">
        <div class="rev-meta-label">🎙️ Instrução Crua por Voz (Miguel):</div>
        <div class="rev-voice-prompt">"${rev.rawInstruction}"</div>
      </div>

      <div class="rev-meta-item">
        <div class="rev-meta-label">✍️ Regra Destilada (Antigravity IA):</div>
        <div class="rev-ai-rule">${rev.summarizedRule}</div>
      </div>
    </div>

    <div style="margin-bottom: 10px; font-size: 0.85rem; color: var(--accent-gold); font-weight: 600;">
      🔍 Comparativo de Alterações (Diff Baseline vs. ${rev.versionTag}):
    </div>
    
    <div class="diff-container">
      ${diffHtml}
    </div>
  `;
};

function getParteBaselineText(parteId) {
  const baselineTexts = {
    "parte_2": "Entre 2007 e 2016, o Brasil operava o Sicobe com contagem em tempo real e arrecadação de R$ 1,65 bi por ano em selos de bebidas.",
    "parte_3": "O debate sobre certificação exige ação por causa das leis europeias e do projeto do ouro que tramita no Congresso.",
    "parte_6": "O Esquema CLEC-CMB é dividido em 3 camadas de segurança onde a Casa da Moeda produz os dispositivos e faz a certificação."
  };
  return baselineTexts[parteId] || "Texto oficial de referência.";
}

function computeSimpleDiff(oldText, newText) {
  // Highlights additions in green and deletions in red
  return `<div><del>${escapeHtml(oldText)}</del></div><div style="margin-top: 10px;"><ins>${escapeHtml(newText)}</ins></div>`;
}

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/* --------------------------------------------------------------------------
   6. Fullscreen Slide Modal
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

window.openFullscreenModal = function(folder, parteId, presIdx) {
  const modal = document.getElementById("slide-modal");
  const modalImg = document.getElementById("modal-img");
  const mainImg = document.getElementById(`img-${parteId}-${presIdx}`);

  if (modal && modalImg && mainImg) {
    modalImg.src = mainImg.src;
    modal.classList.add("active");
  }
};
