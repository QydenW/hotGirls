const techs = window.TECHNICIANS || [];

const grid = document.getElementById("techGrid");
const summary = document.getElementById("summary");
const detail = document.getElementById("detail");
const viewer = document.getElementById("viewer");
const gallery = document.getElementById("gallery");
const viewerBody = document.getElementById("viewerBody");
const viewerTitle = document.getElementById("viewerTitle");
const detailNumber = document.getElementById("detailNumber");
const detailNote = document.getElementById("detailNote");
const detailInfo = document.getElementById("detailInfo");
const sortField = document.getElementById("sortField");
const sortDirection = document.getElementById("sortDirection");
const sortDirectionText = document.getElementById("sortDirectionText");

let activeMedia = [];
let activeMediaIndex = 0;
let currentSortField = "default";
let currentSortDirection = "desc";

summary.textContent = "共 " + techs.length + " 位";

function makeEl(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined && text !== null && text !== "") el.textContent = text;
  return el;
}

function scoresOf(tech) {
  return tech.info?.scores || {};
}

function sortableValue(tech, field) {
  const rawValue = scoresOf(tech)[field];
  if (rawValue === undefined || rawValue === null || String(rawValue).trim() === "") return null;

  if (field === "cup") {
    const normalized = String(rawValue).trim().toUpperCase();
    const match = normalized.match(/[A-Z]+/);
    if (!match) return null;
    return [...match[0]].reduce((value, letter) => value * 26 + letter.charCodeAt(0) - 64, 0);
  }

  const numericValue = Number.parseFloat(String(rawValue).replace(/[^\d.-]/g, ""));
  return Number.isNaN(numericValue) ? null : numericValue;
}

function sortedTechs() {
  if (currentSortField === "default") return [...techs];

  return techs
    .map((tech, originalIndex) => ({ tech, originalIndex, value: sortableValue(tech, currentSortField) }))
    .sort((a, b) => {
      if (a.value === null && b.value === null) return a.originalIndex - b.originalIndex;
      if (a.value === null) return 1;
      if (b.value === null) return -1;
      if (a.value === b.value) return a.originalIndex - b.originalIndex;
      return currentSortDirection === "asc" ? a.value - b.value : b.value - a.value;
    })
    .map(({ tech }) => tech);
}

function singingOf(scores) {
  return scores.singing || scores.voice || scores.vocal || scores.song || "";
}

function figureOf(scores) {
  return scores.figure || scores.body || scores.shape || "";
}

function cupOf(scores) {
  return scores.cup || scores.bust || "";
}

function scaleOf(scores) {
  return scores.scale || scores.serviceScale || "";
}

function infoItems(tech) {
  const scores = scoresOf(tech);
  return [
    ["年龄", scores.age || "-"],
    ["颜值", scores.appearance || "-"],
    ["歌声", singingOf(scores) || "-"],
    ["身材", figureOf(scores) || "-"],
    ["罩杯", cupOf(scores) || "-"],
    ["尺度", scaleOf(scores) || "-"]
  ];
}

function renderViewerMedia() {
  const media = activeMedia[activeMediaIndex];
  if (!media) return;
  viewerTitle.textContent = media.title || "查看";
  viewerBody.innerHTML = "";

  const stage = makeEl("div", "viewer-stage");
  const prev = makeEl("button", "viewer-nav viewer-prev", "‹");
  const next = makeEl("button", "viewer-nav viewer-next", "›");
  const content = makeEl("div", "viewer-content");
  prev.type = "button";
  next.type = "button";
  prev.setAttribute("aria-label", "上一个");
  next.setAttribute("aria-label", "下一个");

  if (media.type === "video") {
    const video = document.createElement("video");
    video.src = media.src;
    video.controls = true;
    video.autoplay = true;
    video.playsInline = true;
    content.appendChild(video);
  } else {
    const img = document.createElement("img");
    img.src = media.src;
    img.alt = media.title || "照片";
    content.appendChild(img);
  }

  prev.disabled = activeMedia.length <= 1;
  next.disabled = activeMedia.length <= 1;
  prev.addEventListener("click", () => switchViewer(-1));
  next.addEventListener("click", () => switchViewer(1));
  stage.append(prev, content, next);
  viewerBody.appendChild(stage);
}

function openViewer(mediaList, index) {
  activeMedia = mediaList || [];
  activeMediaIndex = index || 0;
  renderViewerMedia();
  viewer.showModal();
}

function switchViewer(delta) {
  if (activeMedia.length <= 1) return;
  activeMediaIndex = (activeMediaIndex + delta + activeMedia.length) % activeMedia.length;
  renderViewerMedia();
}

function renderDetailNote(tech) {
  detailInfo.innerHTML = "";
  const comment = tech.info?.comment || "";
  if (!comment) return;
  const box = makeEl("section", "comment-box");
  box.appendChild(makeEl("div", "comment-title", "备注"));
  box.appendChild(makeEl("div", "comment-text", comment));
  detailInfo.appendChild(box);
}

function openDetail(tech) {
  detailNumber.textContent = tech.number;
  detailNote.textContent = "共 " + tech.media.length + " 个资源";
  gallery.innerHTML = "";
  renderDetailNote(tech);

  tech.media.forEach((media, index) => {
    const item = makeEl("button", "media");
    item.type = "button";
    if (media.type === "video") {
      const video = document.createElement("video");
      video.src = media.src;
      video.muted = true;
      video.playsInline = true;
      video.preload = "metadata";
      item.appendChild(video);
    } else {
      const img = document.createElement("img");
      img.src = media.src;
      img.alt = media.title || "照片";
      item.appendChild(img);
    }
    item.appendChild(makeEl("div", "media-caption", media.title || "资源"));
    item.addEventListener("click", () => openViewer(tech.media, index));
    gallery.appendChild(item);
  });
  detail.showModal();
}

function renderCards() {
  grid.innerHTML = "";

  sortedTechs().forEach((tech, techIndex) => {
    const card = makeEl("button", "card");
    card.type = "button";
    card.addEventListener("click", () => openDetail(tech));

    const avatar = makeEl("div", "avatar");
    const img = document.createElement("img");
    img.src = tech.avatar;
    img.alt = "技师 " + tech.number + " 头像";
    img.loading = techIndex < 6 ? "eager" : "lazy";
    img.fetchPriority = techIndex < 6 ? "high" : "auto";
    img.decoding = "async";
    avatar.appendChild(img);

    const head = makeEl("div", "card-head");
    head.appendChild(makeEl("div", "number", tech.number));
    if (tech.category) head.appendChild(makeEl("div", "tag", tech.category));
    avatar.appendChild(head);

    const info = makeEl("div", "card-info");
    const facts = makeEl("div", "facts");
    infoItems(tech).forEach(([label, value]) => {
      const item = makeEl("div", "fact");
      item.appendChild(makeEl("span", "fact-label", label));
      item.appendChild(makeEl("strong", "fact-value", value));
      facts.appendChild(item);
    });
    if (facts.children.length) {
      info.appendChild(facts);
    } else {
      info.appendChild(makeEl("div", "meta", "资料待补"));
    }

    card.append(avatar, info);
    grid.appendChild(card);
  });
}

function updateSortDirection() {
  const isDefault = currentSortField === "default";
  const isAscending = currentSortDirection === "asc";
  sortDirection.disabled = isDefault;
  sortDirectionText.textContent = isAscending ? "从低到高" : "从高到低";
  sortDirection.querySelector(".sort-arrow").textContent = isAscending ? "↑" : "↓";
  sortDirection.setAttribute(
    "aria-label",
    isAscending ? "当前为从低到高，点击切换为从高到低" : "当前为从高到低，点击切换为从低到高"
  );
}

sortField.addEventListener("change", () => {
  currentSortField = sortField.value;
  updateSortDirection();
  renderCards();
});

sortDirection.addEventListener("click", () => {
  currentSortDirection = currentSortDirection === "asc" ? "desc" : "asc";
  updateSortDirection();
  renderCards();
});

renderCards();

document.getElementById("closeDetail").addEventListener("click", () => detail.close());
document.getElementById("closeViewer").addEventListener("click", () => {
  viewer.close();
  viewerBody.innerHTML = "";
  activeMedia = [];
  activeMediaIndex = 0;
});

detail.addEventListener("click", (event) => {
  if (event.target === detail) detail.close();
});

viewer.addEventListener("click", (event) => {
  if (event.target !== viewer) return;
  viewer.close();
  viewerBody.innerHTML = "";
  activeMedia = [];
  activeMediaIndex = 0;
});

document.addEventListener("keydown", (event) => {
  if (!viewer.open) return;
  if (event.key === "ArrowLeft") switchViewer(-1);
  if (event.key === "ArrowRight") switchViewer(1);
});
