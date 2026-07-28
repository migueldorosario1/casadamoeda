/* ==========================================================================
   CASA DA MOEDA: ÂNCORA PÚBLICA DE CONFIANÇA
   Application Logic: Presentation Stack, Simple Observations & Speech Input
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  initReadingProgress();
  initFAQAccordion();
  loadPresentationStacks();
  loadSavedObservations();
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
            <span>📑 Apresentações em Slides</span>
          </h3>
          <span style="font-size: 0.85rem; color: var(--text-muted); font-family: var(--font-mono);">
            ${presentations.length} Decks Disponíveis
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
                
                <button class="btn-icon" onclick="openFullscreenModal('${pres.slidesFolder}', '${parteId}', ${presIdx})">
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
   4. Simple & Amicable Observations Engine (Audio / Text)
   -------------------------------------------------------------------------- */
window.toggleObsInput = function(parteId) {
  const area = document.getElementById(`obs-input-${parteId}`);
  if (area) {
    area.classList.toggle("active");
  }
};

window.saveObservation = function(parteId) {
  const txtArea = document.getElementById(`obs-text-${parteId}`);
  if (!txtArea || !txtArea.value.trim()) return;

  const text = txtArea.value.trim();
  const obsObj = {
    id: Date.now(),
    text: text,
    date: new Date().toLocaleDateString("pt-BR") + " " + new Date().toLocaleTimeString("pt-BR", {hour: '2-digit', minute:'2-digit'})
  };

  const key = `cmb_obs_${parteId}`;
  const existing = JSON.parse(localStorage.getItem(key) || "[]");
  existing.unshift(obsObj);
  localStorage.setItem(key, JSON.stringify(existing));

  txtArea.value = "";
  renderObservations(parteId);
};

function loadSavedObservations() {
  ["parte_2", "parte_3", "parte_6"].forEach(parteId => {
    renderObservations(parteId);
  });
}

function renderObservations(parteId) {
  const listEl = document.getElementById(`obs-list-${parteId}`);
  if (!listEl) return;

  const key = `cmb_obs_${parteId}`;
  const observations = JSON.parse(localStorage.getItem(key) || "[]");

  if (observations.length === 0) {
    listEl.innerHTML = `<div style="font-size: 0.85rem; color: var(--text-subtle); font-style: italic;">Nenhuma observação enviada ainda para este capítulo.</div>`;
    return;
  }

  let html = "";
  observations.forEach(obs => {
    html += `
      <div class="obs-item">
        <div class="obs-item-meta">
          <span>📅 ${obs.date}</span>
          <span style="color: var(--primary-emerald);">• Observação Gravada</span>
        </div>
        <div>"${escapeHtml(obs.text)}"</div>
      </div>
    `;
  });
  listEl.innerHTML = html;
}

// Audio Recording via Web Speech Recognition (Browser Dictation)
let recognitionInstance = null;

window.toggleAudioRecording = function(parteId) {
  const btn = document.getElementById(`btn-mic-${parteId}`);
  const txtArea = document.getElementById(`obs-text-${parteId}`);

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert("Ditado por voz não suportado neste navegador. Por favor digite sua observação na caixa de texto.");
    return;
  }

  if (btn.classList.contains("recording")) {
    if (recognitionInstance) recognitionInstance.stop();
    btn.classList.remove("recording");
    btn.textContent = "🎙️ Ditar Áudio";
    return;
  }

  recognitionInstance = new SpeechRecognition();
  recognitionInstance.lang = "pt-BR";
  recognitionInstance.continuous = true;
  recognitionInstance.interimResults = true;

  btn.classList.add("recording");
  btn.textContent = "🔴 Gravando... (Clique p/ Parar)";

  recognitionInstance.onresult = (event) => {
    let transcript = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }
    txtArea.value = transcript;
  };

  recognitionInstance.onerror = (event) => {
    console.error("Speech Recognition Error:", event.error);
    btn.classList.remove("recording");
    btn.textContent = "🎙️ Ditar Áudio";
  };

  recognitionInstance.onend = () => {
    btn.classList.remove("recording");
    btn.textContent = "🎙️ Ditar Áudio";
  };

  recognitionInstance.start();
};

function escapeHtml(str) {
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

window.openFullscreenModal = function(folder, parteId, presIdx) {
  const modal = document.getElementById("slide-modal");
  const modalImg = document.getElementById("modal-img");
  const mainImg = document.getElementById(`img-${parteId}-${presIdx}`);

  if (modal && modalImg && mainImg) {
    modalImg.src = mainImg.src;
    modal.classList.add("active");
  }
};
