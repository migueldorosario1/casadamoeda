/* ==========================================================================
   CASA DA MOEDA: ÂNCORA PÚBLICA DE CONFIANÇA
   Application Logic: Theme Switcher, Presentation Stack & Observations
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initReadingProgress();
  initFAQAccordion();
  loadPresentationStacks();
  loadSavedObservations();
  initFullscreenModal();
  loadVideoteca();
  loadNewsChannel();
});

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
   4. Fórum Central & Dictation Engine (Audio 5-min max & Text Observations)
   -------------------------------------------------------------------------- */
const CHAPTER_TITLES = {
  parte_2: "Parte 2 · Diagnóstico",
  parte_3: "Parte 3 · Por Que Agora",
  parte_6: "Parte 6 · Roteiro de Implantação",
  forum_geral: "Fórum Geral / Visão Global"
};

const SEED_FORUM_COMMENTS = [
  {
    id: 1785260001,
    author: "Dr. Edson R. (Consultor Tecnológico)",
    chapterId: "parte_2",
    chapterTitle: "Parte 2 · Diagnóstico",
    text: "A reinstituição da contagem física e selagem eletrônica com IA é fundamental para cobrir a lacuna deixada desde 2016. É crucial garantir que os leitores espectrais funcionem em tempo real nas linhas de produção.",
    type: "audio",
    date: "29/07/2026 08:30"
  },
  {
    id: 1785260002,
    author: "Eng. Mariana Souza (Infraestrutura Logística)",
    chapterId: "parte_6",
    chapterTitle: "Parte 6 · Roteiro de Implantação",
    text: "Sugerimos que o projeto piloto do Passaporte Digital de Produto comece pelos portos de Santos e Viracopos, integrando as declarações alfandegárias diretamente no blockchain da Casa da Moeda.",
    type: "texto",
    date: "29/07/2026 09:12"
  },
  {
    id: 1785260003,
    author: "Colaborador do Projeto",
    chapterId: "parte_3",
    chapterTitle: "Parte 3 · Por Que Agora",
    text: "A obrigatoriedade de rastreamento de insumos e ouro aprovada pelo Congresso exige urgência na padronização da tecnologia. O Brasil precisa garantir soberania plena sobre esses registros.",
    type: "audio",
    date: "29/07/2026 10:05"
  }
];

let allForumComments = [];

function loadSavedObservations() {
  const stored = localStorage.getItem("cmb_all_forum_comments");
  if (!stored) {
    allForumComments = SEED_FORUM_COMMENTS;
    localStorage.setItem("cmb_all_forum_comments", JSON.stringify(allForumComments));
  } else {
    try {
      allForumComments = JSON.parse(stored);
    } catch (e) {
      allForumComments = SEED_FORUM_COMMENTS;
    }
  }

  ["parte_2", "parte_3", "parte_6"].forEach(parteId => {
    renderObservations(parteId);
  });

  renderForumFeed(allForumComments);
}

window.toggleObsInput = function(parteId) {
  const area = document.getElementById(`obs-input-${parteId}`);
  if (area) {
    area.classList.toggle("active");
  }
};

window.saveObservation = function(parteId) {
  const targetId = (parteId === "forum_geral") ? 
    (document.getElementById("obs-chapter-forum_geral") ? document.getElementById("obs-chapter-forum_geral").value : "forum_geral") 
    : parteId;

  const txtArea = document.getElementById(`obs-text-${parteId}`);
  const authorInput = document.getElementById(`obs-author-${parteId}`);
  if (!txtArea || !txtArea.value.trim()) {
    alert("Por favor digite ou dite uma mensagem antes de enviar.");
    return;
  }

  const authorName = (authorInput && authorInput.value.trim()) ? authorInput.value.trim() : "Colaborador do Projeto";
  const text = txtArea.value.trim();
  const wasAudio = usedAudioDictationFlags[parteId] || false;

  const newObs = {
    id: Date.now(),
    author: authorName,
    chapterId: targetId,
    chapterTitle: CHAPTER_TITLES[targetId] || "Fórum Geral",
    text: text,
    type: wasAudio ? "audio" : "texto",
    date: new Date().toLocaleDateString("pt-BR") + " " + new Date().toLocaleTimeString("pt-BR", {hour: '2-digit', minute:'2-digit'})
  };

  if (isRecording) {
    stopAudioRecording();
  }

  allForumComments.unshift(newObs);
  localStorage.setItem("cmb_all_forum_comments", JSON.stringify(allForumComments));

  txtArea.value = "";
  if (authorInput) authorInput.value = "";
  usedAudioDictationFlags[parteId] = false;

  ["parte_2", "parte_3", "parte_6"].forEach(pid => {
    renderObservations(pid);
  });
  renderForumFeed(allForumComments);

  alert(`Sua observação foi salva com sucesso e enviada ao Fórum público!`);
};

function renderObservations(parteId) {
  const listEl = document.getElementById(`obs-list-${parteId}`);
  if (!listEl) return;

  const filtered = allForumComments.filter(item => item.chapterId === parteId);

  if (filtered.length === 0) {
    listEl.innerHTML = `<div style="font-size: 0.85rem; color: var(--text-subtle); font-style: italic;">Nenhuma observação enviada ainda para este capítulo.</div>`;
    return;
  }

  let html = "";
  filtered.forEach(obs => {
    const badgeType = obs.type === "audio" ? "🎙️ Áudio Ditado (até 5 min)" : "📝 Comentário Escrito";
    html += `
      <div class="obs-item">
        <div class="obs-item-meta">
          <span style="font-weight: 700; color: var(--text-title);">${escapeHtml(obs.author)}</span>
          <span style="color: var(--text-subtle);">📅 ${obs.date}</span>
          <span style="color: var(--primary-emerald); font-weight: 600;">${badgeType}</span>
        </div>
        <div style="margin-top: 6px; line-height: 1.5; color: var(--text-muted);">"${escapeHtml(obs.text)}"</div>
      </div>
    `;
  });
  listEl.innerHTML = html;
}

function renderForumFeed(items) {
  const feedEl = document.getElementById("forum-comments-feed");
  if (!feedEl) return;

  if (!items || items.length === 0) {
    feedEl.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-subtle); padding: 40px;">Nenhuma contribuição encontrada nesta categoria.</div>`;
    return;
  }

  let html = "";
  items.forEach(obs => {
    const badgeType = obs.type === "audio" ? "🎙️ Áudio Ditado (até 5 min)" : "📝 Escrito";
    html += `
      <article class="forum-card">
        <div>
          <div class="forum-card-header">
            <span class="forum-author-name">👤 ${escapeHtml(obs.author)}</span>
            <span class="forum-badge-chapter">${escapeHtml(obs.chapterTitle)}</span>
          </div>
          <p class="forum-card-body">"${escapeHtml(obs.text)}"</p>
        </div>
        <div class="forum-card-footer">
          <span>📅 ${obs.date}</span>
          <span style="color: var(--primary-emerald); font-weight: 600;">${badgeType}</span>
        </div>
      </article>
    `;
  });
  feedEl.innerHTML = html;
}

window.filterForumComments = function(category) {
  document.querySelectorAll(".forum-tab-btn").forEach(btn => {
    btn.classList.toggle("active", btn.getAttribute("data-fcat") === category);
  });

  if (category === "all") {
    renderForumFeed(allForumComments);
  } else {
    const filtered = allForumComments.filter(item => item.chapterId === category);
    renderForumFeed(filtered);
  }
};

/* --------------------------------------------------------------------------
   Speech Recognition Dictation Engine (Supports 5-min continuous audio dictation with pauses)
   -------------------------------------------------------------------------- */
let recognitionInstance = null;
let dictationTimer = null;
let isRecording = false;
let currentRecordingParte = null;
let recordingStartTime = 0;
let accumulatedTranscript = "";
let initialText = "";
let usedAudioDictationFlags = {};

window.toggleAudioRecording = function(parteId) {
  const btn = document.getElementById(`btn-mic-${parteId}`);
  const txtArea = document.getElementById(`obs-text-${parteId}`);

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert("Ditado por voz não é suportado neste navegador. Por favor digite sua observação na caixa de texto.");
    return;
  }

  if (isRecording) {
    stopAudioRecording();
    return;
  }

  isRecording = true;
  currentRecordingParte = parteId;
  usedAudioDictationFlags[parteId] = true;
  initialText = txtArea.value ? txtArea.value.trim() + " " : "";
  accumulatedTranscript = "";
  recordingStartTime = Date.now();

  startSpeechRecognitionEngine(parteId);
};

function startSpeechRecognitionEngine(parteId) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition || !isRecording) return;

  recognitionInstance = new SpeechRecognition();
  recognitionInstance.lang = "pt-BR";
  recognitionInstance.continuous = true;
  recognitionInstance.interimResults = true;

  const btn = document.getElementById(`btn-mic-${parteId}`);
  const timerTag = document.getElementById(`timer-tag-${parteId}`);

  if (btn) {
    btn.classList.add("recording");
    btn.textContent = "🔴 Finalizar ditado";
  }

  if (!dictationTimer) {
    dictationTimer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
      const remaining = 300 - elapsed;
      if (remaining <= 0) {
        stopAudioRecording();
        alert("O tempo máximo de ditado por voz (5 minutos) foi atingido. Sua gravação foi concluída.");
        return;
      }
      const mins = String(Math.floor(elapsed / 60)).padStart(2, "0");
      const secs = String(elapsed % 60).padStart(2, "0");
      if (timerTag) {
        timerTag.style.display = "inline-block";
        timerTag.textContent = `🔴 Ditando: ${mins}:${secs} / 05:00`;
      }
    }, 1000);
  }

  recognitionInstance.onresult = (event) => {
    let interimTranscript = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const res = event.results[i];
      if (res.isFinal) {
        accumulatedTranscript += res[0].transcript + " ";
      } else {
        interimTranscript += res[0].transcript;
      }
    }
    const txtArea = document.getElementById(`obs-text-${parteId}`);
    if (txtArea) {
      txtArea.value = (initialText + accumulatedTranscript + interimTranscript).trim();
    }
  };

  recognitionInstance.onerror = (event) => {
    console.warn("Speech recognition event error:", event.error);
  };

  recognitionInstance.onend = () => {
    const elapsed = (Date.now() - recordingStartTime) / 1000;
    if (isRecording && elapsed < 300) {
      try {
        recognitionInstance.start();
      } catch (err) {
        console.warn("Auto-restart notice:", err);
      }
    } else {
      stopAudioRecording();
    }
  };

  try {
    recognitionInstance.start();
  } catch (e) {
    console.error("Speech recognition start exception:", e);
  }
}

function stopAudioRecording() {
  isRecording = false;
  if (dictationTimer) {
    clearInterval(dictationTimer);
    dictationTimer = null;
  }
  if (recognitionInstance) {
    try { recognitionInstance.stop(); } catch (e) {}
    recognitionInstance = null;
  }
  if (currentRecordingParte) {
    const btn = document.getElementById(`btn-mic-${currentRecordingParte}`);
    const timerTag = document.getElementById(`timer-tag-${currentRecordingParte}`);
    if (btn) {
      btn.classList.remove("recording");
      btn.textContent = "🎙️ Ditar áudio (até 5 min)";
    }
    if (timerTag) {
      timerTag.style.display = "none";
    }
    currentRecordingParte = null;
  }
}

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

