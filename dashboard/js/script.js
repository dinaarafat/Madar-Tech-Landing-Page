const PREVIEW_KEY = "madar-tech-cms-preview";
const PAGE_LABELS = {
  overview: "نظرة عامة",
  content: "محتوى الصفحة",
  hero: "عارض الصور",
  sections: "إدارة الأقسام",
  media: "الوسائط",
  appearance: "المظهر",
  settings: "الإعدادات"
};
const SECTION_LABELS = {
  about: "من نحن",
  services: "الخدمات",
  programs: "البرامج التدريبية",
  why: "لماذا مدار تك",
  contact: "تواصل معنا",
  custom: "قسم نصي"
};

let content = null;
let siteContent = null;
let currentPage = "overview";
let activeLanguage = "ar";
let isDirty = false;
let mediaFiles = [];
let toastTimer;

const view = document.querySelector("#cms-view");
const pageTitle = document.querySelector("#page-title");
const saveState = document.querySelector("#save-state");
const publishButton = document.querySelector("#publish-button");
const toast = document.querySelector("#toast");
const languageSelect = document.querySelector("#content-language");

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function field(path, label, value, options = {}) {
  const id = `field-${path.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
  const direction = activeLanguage === "ar" ? "rtl" : "ltr";
  const control = options.textarea
    ? `<textarea id="${id}" data-path="${escapeHtml(path)}" dir="${direction}"${options.rows ? ` rows="${options.rows}"` : ""}>${escapeHtml(value)}</textarea>`
    : `<input id="${id}" data-path="${escapeHtml(path)}" type="${options.type || "text"}" value="${escapeHtml(value)}" dir="${direction}"${options.placeholder ? ` placeholder="${escapeHtml(options.placeholder)}"` : ""}>`;
  return `<div class="field${options.full ? " field-full" : ""}"><label for="${id}">${escapeHtml(label)}</label>${control}${options.hint ? `<small class="field-hint">${escapeHtml(options.hint)}</small>` : ""}</div>`;
}

function colorField(path, label, value) {
  const color = /^#[0-9a-f]{6}$/i.test(value) ? value : "#03213D";
  return `<div class="field"><label>${escapeHtml(label)}</label><div class="inline-field"><input aria-label="${escapeHtml(label)}" data-path="${escapeHtml(path)}" type="color" value="${color}"><input aria-label="${escapeHtml(label)} بصيغة HEX" data-path="${escapeHtml(path)}" type="text" value="${escapeHtml(value)}" maxlength="7" pattern="#[0-9a-fA-F]{6}"></div></div>`;
}

function imageField(path, label, value) {
  const source = value ? `../${escapeHtml(value)}` : "";
  const id = `field-${path.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
  return `<div class="field field-full"><label for="${id}">${escapeHtml(label)}</label><div class="image-control"><input id="${id}" data-path="${escapeHtml(path)}" type="text" value="${escapeHtml(value)}" placeholder="assets/images/example.jpg" dir="ltr"><img class="image-preview" src="${source}" alt=""${value ? "" : " hidden"}></div><small class="field-hint">اكتب مسار صورة موجودة أو ارفع صورة من قسم الوسائط.</small></div>`;
}

function panel(title, body, description = "") {
  return `<section class="panel"><div class="panel-heading"><div><h2>${escapeHtml(title)}</h2>${description ? `<p>${escapeHtml(description)}</p>` : ""}</div></div>${body}</section>`;
}

function setDirty() {
  isDirty = true;
  saveState.textContent = "توجد تغييرات غير منشورة";
  publishButton.disabled = false;
}

function showToast(message, isError = false) {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.toggle("is-error", isError);
  toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 3200);
}

function getPathValue(path) {
  return path.split(".").reduce((value, key) => value == null ? undefined : value[key], content);
}

function setPathValue(path, value) {
  const keys = path.split(".");
  const lastKey = keys.pop();
  const root = path.startsWith("appearance.") ? siteContent : content;
  const parent = keys.reduce((target, key) => target[key], root);
  parent[lastKey] = value;
}

function languageLabel(language) {
  return ({ ar: "العربية", en: "English" })[language] || language;
}

function setContentLanguage(language) {
  activeLanguage = language;
  content = language === "ar" ? siteContent : siteContent.translations[language];
  languageSelect.value = language;
  localStorage.setItem("madar-tech-cms-language", language);
  renderPage();
}

function renderLanguageOptions() {
  const languages = ["ar", ...Object.keys(siteContent.translations)];
  languageSelect.replaceChildren(...languages.map((language) => {
    const option = document.createElement("option");
    option.value = language;
    option.textContent = languageLabel(language);
    return option;
  }));
}

function setActivePage(page) {
  currentPage = page;
  pageTitle.textContent = PAGE_LABELS[page];
  document.querySelectorAll(".nav-item").forEach((button) => {
    const active = button.dataset.page === page;
    button.classList.toggle("is-active", active);
    if (active) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  renderPage();
}

function renderOverview() {
  const services = content.sections.filter((section) => section.type === "services").reduce((total, section) => total + section.items.length, 0);
  const programs = content.sections.filter((section) => section.type === "programs").reduce((total, section) => total + section.items.length, 0);
  const stats = `<div class="stat-grid">
    <article class="stat-card"><span>أقسام الصفحة</span><strong>${content.sections.length}</strong></article>
    <article class="stat-card"><span>شرائح الواجهة</span><strong>${content.heroSlides.length}</strong></article>
    <article class="stat-card"><span>الخدمات</span><strong>${services}</strong></article>
    <article class="stat-card"><span>البرامج التدريبية</span><strong>${programs}</strong></article>
  </div>`;
  const order = `<div class="section-order">${content.sections.map((section, index) => `<div class="section-order-row"><span class="order-number">${index + 1}</span><div><strong>${escapeHtml(section.title || SECTION_LABELS[section.type])}</strong><small>${escapeHtml(SECTION_LABELS[section.type] || section.type)}</small></div><span class="status-pill">منشور</span></div>`).join("")}</div>`;
  view.innerHTML = `<p class="page-intro">إدارة محتوى الموقع الحالي ونشر التعديلات مباشرة على الصفحة الرئيسية.</p>${stats}<div class="overview-grid">${panel("ترتيب أقسام الصفحة", order, "هذا الترتيب هو ترتيب العرض على الموقع.")}${panel("حالة المحتوى", `<div class="empty-state"><strong>الموقع متصل بلوحة التحكم</strong><br><span>تُحفظ التعديلات في ملف مشترك ويقرأ الموقع النسخة المنشورة.</span></div><div class="button-row"><button class="button button-primary" type="button" data-go="content">تحرير محتوى الصفحة</button><button class="button" type="button" data-go="sections">إدارة الأقسام</button></div>`)}</div>`;
}

function renderContentPage() {
  const about = content.sections.find((section) => section.type === "about");
  const aboutIndex = content.sections.indexOf(about);
  const navigation = content.navigation.map((label, index) => field(`navigation.${index}`, `اسم الرابط ${index + 1}`, label)).join("");
  const aboutFields = about ? [
    field(`sections.${aboutIndex}.title`, "عنوان قسم من نحن", about.title, { full: true }),
    field(`sections.${aboutIndex}.description`, "نبذة عن مدار تك", about.description, { textarea: true, full: true }),
    field(`sections.${aboutIndex}.visionTitle`, "عنوان الرؤية", about.visionTitle),
    field(`sections.${aboutIndex}.vision`, "نص الرؤية", about.vision, { textarea: true }),
    field(`sections.${aboutIndex}.missionTitle`, "عنوان الرسالة", about.missionTitle),
    field(`sections.${aboutIndex}.mission`, "نص الرسالة", about.mission, { textarea: true })
  ].join("") : `<p class="empty-state">أضف قسم «من نحن» من إدارة الأقسام لتعديل محتواه.</p>`;
  view.innerHTML = `<p class="page-intro">حرّر النصوص الأساسية التي تظهر في الصفحة الرئيسية وشريط التنقل.</p>${panel("عنوان الموقع وروابط التنقل", `<div class="field-grid">${field("siteTitle", "عنوان الصفحة", content.siteTitle, { full: true })}${imageField("brandLogo", "شعار الموقع", content.brandLogo)}${navigation}</div>`)}${panel("محتوى من نحن", `<div class="field-grid">${aboutFields}</div>`)}`;
}

function renderHeroPage() {
  const slides = content.heroSlides.map((slide, index) => `<article class="editor-card">
    <div class="editor-card-heading"><strong>الشريحة ${index + 1}</strong><div class="editor-card-actions">
      <button class="button button-small" type="button" data-action="slide-up" data-index="${index}" aria-label="نقل الشريحة لأعلى" ${index === 0 ? "disabled" : ""}>↑</button>
      <button class="button button-small" type="button" data-action="slide-down" data-index="${index}" aria-label="نقل الشريحة لأسفل" ${index === content.heroSlides.length - 1 ? "disabled" : ""}>↓</button>
      <button class="button button-small button-danger" type="button" data-action="slide-delete" data-index="${index}">حذف</button>
    </div></div>
    <div class="field-grid">
      ${field(`heroSlides.${index}.title`, "العنوان", slide.title, { textarea: true, full: true })}
      ${field(`heroSlides.${index}.description`, "الوصف", slide.description, { textarea: true, full: true })}
      ${imageField(`heroSlides.${index}.image`, "صورة الخلفية", slide.image)}
      ${field(`heroSlides.${index}.primaryLabel`, "نص الزر الأول", slide.primaryLabel)}
      ${field(`heroSlides.${index}.primaryHref`, "رابط الزر الأول", slide.primaryHref)}
      ${field(`heroSlides.${index}.secondaryLabel`, "نص الزر الثاني", slide.secondaryLabel)}
      ${field(`heroSlides.${index}.secondaryHref`, "رابط الزر الثاني", slide.secondaryHref)}
    </div></article>`).join("");
  view.innerHTML = `<p class="page-intro">عدّل شرائح الواجهة الرئيسية وترتيبها. حافظ على رابط محلي مثل #contact أو استخدم رابطًا كاملًا.</p>${panel("شرائح الواجهة", `<div class="card-list">${slides || `<div class="empty-state">لا توجد شرائح.</div>`}</div><div class="button-row"><button class="button" type="button" data-action="slide-add">إضافة شريحة</button></div>`)}`;
}

function renderItemFields(sectionIndex, itemIndex, item, kind) {
  const prefix = `sections.${sectionIndex}.items.${itemIndex}`;
  if (kind === "services") {
    return `<div class="field-grid">${field(`${prefix}.title`, "اسم الخدمة", item.title)}${imageField(`${prefix}.image`, "صورة الخدمة", item.image)}${field(`${prefix}.description`, "وصف الخدمة", item.description, { textarea: true, full: true })}</div>`;
  }
  if (kind === "programs") {
    return `<div class="field-grid">${field(`${prefix}.title`, "اسم البرنامج", item.title)}${field(`${prefix}.buttonLabel`, "نص الزر", item.buttonLabel)}${field(`${prefix}.description`, "وصف البرنامج", item.description, { textarea: true, full: true })}</div>`;
  }
  return `<div class="field-grid">${field(`${prefix}.title`, "النص", item.title)}${field(`${prefix}.icon`, "أيقونة Font Awesome", item.icon)}</div>`;
}

function renderSectionEditor(section, index) {
  const baseFields = [
    field(`sections.${index}.title`, "عنوان القسم", section.title, { full: true })
  ];
  if (section.type === "about") {
    baseFields.push(field(`sections.${index}.description`, "النبذة", section.description, { textarea: true, full: true }));
    baseFields.push(field(`sections.${index}.visionTitle`, "عنوان الرؤية", section.visionTitle), field(`sections.${index}.vision`, "نص الرؤية", section.vision, { textarea: true }));
    baseFields.push(field(`sections.${index}.missionTitle`, "عنوان الرسالة", section.missionTitle), field(`sections.${index}.mission`, "نص الرسالة", section.mission, { textarea: true }));
  } else if (section.type === "contact") {
    baseFields.push(field(`sections.${index}.subtitle`, "العنوان الفرعي", section.subtitle));
    baseFields.push(field(`sections.${index}.description`, "الوصف", section.description, { textarea: true, full: true }));
    baseFields.push(imageField(`sections.${index}.image`, "صورة التواصل", section.image));
  } else if (section.type === "custom") {
    baseFields.push(field(`sections.${index}.description`, "محتوى القسم", section.description, { textarea: true, full: true }));
  } else if (section.type === "programs") {
    baseFields.push(field(`sections.${index}.subtitle`, "وصف تمهيدي", section.subtitle, { textarea: true, full: true }));
  }
  const body = `<div class="field-grid">${baseFields.join("")}</div>`;
  if (!["services", "programs", "why"].includes(section.type)) return body;
  const items = section.items.map((item, itemIndex) => `<div class="editor-card"><div class="editor-card-heading"><strong>${escapeHtml(item.title || `عنصر ${itemIndex + 1}`)}</strong><button class="button button-small button-danger" type="button" data-action="item-delete" data-section="${index}" data-index="${itemIndex}">حذف</button></div>${renderItemFields(index, itemIndex, item, section.type)}</div>`).join("");
  const addLabel = section.type === "services" ? "إضافة خدمة" : section.type === "programs" ? "إضافة برنامج" : "إضافة ميزة";
  return `${body}<div class="panel-heading" style="margin:18px 0 10px"><div><h3>العناصر</h3></div></div><div class="card-list">${items || `<div class="empty-state">لا توجد عناصر في هذا القسم.</div>`}</div><div class="item-toolbar"><button class="button button-small" type="button" data-action="item-add" data-section="${index}">${addLabel}</button></div>`;
}

function renderSectionsPage() {
  const cards = content.sections.map((section, index) => `<article class="editor-card">
    <div class="editor-card-heading"><div><strong>${escapeHtml(SECTION_LABELS[section.type] || "قسم")}</strong><div class="field-hint">النوع: ${escapeHtml(section.type)}</div></div>
      <div class="editor-card-actions">
        <button class="button button-small" type="button" data-action="section-up" data-index="${index}" aria-label="تحريك القسم لأعلى" ${index === 0 ? "disabled" : ""}>↑</button>
        <button class="button button-small" type="button" data-action="section-down" data-index="${index}" aria-label="تحريك القسم لأسفل" ${index === content.sections.length - 1 ? "disabled" : ""}>↓</button>
        <button class="button button-small button-danger" type="button" data-action="section-delete" data-index="${index}">حذف القسم</button>
      </div>
    </div>${renderSectionEditor(section, index)}</article>`).join("");
  view.innerHTML = `<p class="page-intro">أضف أقسام الصفحة ورتّبها وعدّل النصوص والخدمات والبرامج. التغييرات تظهر عند نشر المحتوى.</p>${panel("أقسام الصفحة الرئيسية", `<div class="card-list">${cards || `<div class="empty-state">لا توجد أقسام. أضف قسمًا للبدء.</div>`}</div><div class="item-toolbar"><label class="field"><span class="field-label">إضافة قسم</span><select id="new-section-type"><option value="custom">قسم نصي</option><option value="services">الخدمات</option><option value="programs">البرامج التدريبية</option></select></label><button class="button button-primary" type="button" data-action="section-add">إضافة</button></div>`)}`;
}

async function loadMedia() {
  const response = await fetch("../api/media", { cache: "no-store" });
  if (!response.ok) throw new Error("تعذر تحميل مكتبة الوسائط.");
  const result = await response.json();
  mediaFiles = result.files;
}

async function renderMediaPage() {
  view.innerHTML = `<p class="page-intro">ارفع صور الموقع لتصبح متاحة في محررات المحتوى. الصيغ المدعومة: JPG وPNG وWEBP وGIF، بحد أقصى 5 ميغابايت للصورة.</p>${panel("رفع صورة", `<div class="field"><label for="media-upload">اختر صورة من جهازك</label><input id="media-upload" class="upload-input" type="file" accept="image/jpeg,image/png,image/webp,image/gif"><small class="field-hint">سيتم حفظ الصورة داخل مكتبة صور الموقع.</small></div>`)}<section class="panel"><div class="panel-heading"><div><h2>مكتبة الوسائط</h2><p>المسارات أدناه يمكن استخدامها في حقول الصور.</p></div></div><div class="media-grid">${mediaFiles.map((file) => `<article class="media-card"><img src="../${escapeHtml(file.url)}" alt="" loading="lazy"><p>${escapeHtml(file.name)}<br><span dir="ltr">${escapeHtml(file.url)}</span></p><button class="button button-small" type="button" data-action="media-copy" data-url="${escapeHtml(file.url)}">نسخ المسار</button></article>`).join("") || `<div class="empty-state">لا توجد صور متاحة.</div>`}</div></section>`;
  const input = document.querySelector("#media-upload");
  input.addEventListener("change", uploadMedia);
}

function renderAppearancePage() {
  const appearance = siteContent.appearance;
  view.innerHTML = `<p class="page-intro">غيّر ألوان هوية الموقع. القيم الافتراضية مطابقة لتصميم مدار تك الحالي.</p>${panel("ألوان الموقع", `<div class="field-grid">${colorField("appearance.primaryColor", "اللون الأساسي — كحلي", appearance.primaryColor)}${colorField("appearance.accentColor", "اللون المميز — ليموني", appearance.accentColor)}${colorField("appearance.backgroundColor", "لون الخلفية", appearance.backgroundColor)}</div>`)}`;
}

function renderSettingsPage() {
  const footer = content.footer;
  const links = footer.links.map((item, index) => `<article class="editor-card"><div class="editor-card-heading"><strong>رابط ${index + 1}</strong><button class="button button-small button-danger" type="button" data-action="footer-link-delete" data-index="${index}">حذف</button></div><div class="field-grid">${field(`footer.links.${index}.label`, "اسم الرابط", item.label)}${field(`footer.links.${index}.href`, "الرابط", item.href)}${field(`footer.links.${index}.icon`, "الأيقونة", item.icon, { full: true })}</div></article>`).join("");
  const socialLinks = footer.socialLinks.map((item, index) => `<article class="editor-card"><div class="editor-card-heading"><strong>حساب ${index + 1}</strong><button class="button button-small button-danger" type="button" data-action="social-link-delete" data-index="${index}">حذف</button></div><div class="field-grid">${field(`footer.socialLinks.${index}.label`, "اسم الحساب", item.label)}${field(`footer.socialLinks.${index}.href`, "الرابط", item.href)}${field(`footer.socialLinks.${index}.icon`, "الأيقونة", item.icon, { full: true })}</div></article>`).join("");
  view.innerHTML = `<p class="page-intro">إدارة محتوى تذييل الموقع وروابطه.</p>${panel("محتوى التذييل", `<div class="field-grid">${field("footer.tagline", "العبارة التعريفية", footer.tagline, { textarea: true, full: true })}${field("footer.copyright", "حقوق النشر", footer.copyright)}${field("footer.brand", "اسم العلامة التجارية", footer.brand)}</div>`)}${panel("روابط التنقل", `<div class="card-list">${links}</div><div class="button-row"><button class="button" type="button" data-action="footer-link-add">إضافة رابط</button></div>`)}${panel("روابط التواصل الاجتماعي", `<div class="card-list">${socialLinks}</div><div class="button-row"><button class="button" type="button" data-action="social-link-add">إضافة حساب</button></div>`)}`;
}

function renderPage() {
  if (!content) return;
  if (currentPage === "overview") renderOverview();
  else if (currentPage === "content") renderContentPage();
  else if (currentPage === "hero") renderHeroPage();
  else if (currentPage === "sections") renderSectionsPage();
  else if (currentPage === "appearance") renderAppearancePage();
  else if (currentPage === "settings") renderSettingsPage();
  else if (currentPage === "media") renderMediaPage().catch((error) => {
    view.innerHTML = `<div class="error-state">${escapeHtml(error.message)}</div>`;
    showToast(error.message, true);
  });
}

function moveItem(items, index, offset) {
  const target = index + offset;
  if (target < 0 || target >= items.length) return;
  [items[index], items[target]] = [items[target], items[index]];
}

function blankSection(type) {
  const id = `${type}-${Date.now().toString(36)}`;
  if (type === "services") return { id, type, title: activeLanguage === "ar" ? "خدماتنا" : "Our services", items: [] };
  if (type === "programs") return { id, type, title: activeLanguage === "ar" ? "البرامج التدريبية" : "Training programs", subtitle: "", items: [] };
  return { id, type: "custom", title: activeLanguage === "ar" ? "قسم جديد" : "New section", description: "" };
}

function blankItem(type) {
  if (type === "services") return { title: activeLanguage === "ar" ? "خدمة جديدة" : "New service", description: "", image: "" };
  if (type === "programs") return { title: activeLanguage === "ar" ? "برنامج جديد" : "New program", description: "", buttonLabel: activeLanguage === "ar" ? "اعرف المزيد" : "Learn more" };
  return { title: activeLanguage === "ar" ? "ميزة جديدة" : "New feature", icon: "fa-solid fa-star" };
}

function handleAction(button) {
  const action = button.dataset.action;
  const index = Number(button.dataset.index);
  const sectionIndex = Number(button.dataset.section);

  if (action === "media-copy") {
    if (!navigator.clipboard) return showToast(`انسخ المسار يدويًا: ${button.dataset.url}`);
    navigator.clipboard.writeText(button.dataset.url)
      .then(() => showToast("تم نسخ مسار الصورة."))
      .catch((error) => showToast(`تعذر نسخ المسار: ${error.message}`, true));
    return;
  } else if (action === "slide-add") {
    content.heroSlides.push({
      title: activeLanguage === "ar" ? "عنوان شريحة جديدة" : "New slide title",
      description: "",
      image: "",
      primaryLabel: activeLanguage === "ar" ? "اكتشف المزيد" : "Discover more",
      primaryHref: "#contact",
      secondaryLabel: activeLanguage === "ar" ? "تواصل معنا" : "Contact us",
      secondaryHref: "#contact"
    });
    currentPage = "hero";
  } else if (action === "slide-delete") {
    if (content.heroSlides.length <= 1) return showToast("يجب الإبقاء على شريحة واحدة على الأقل.", true);
    if (!window.confirm("هل تريد حذف هذه الشريحة؟")) return;
    content.heroSlides.splice(index, 1);
  } else if (action === "slide-up" || action === "slide-down") {
    moveItem(content.heroSlides, index, action === "slide-up" ? -1 : 1);
  } else if (action === "section-add") {
    const type = document.querySelector("#new-section-type").value;
    content.sections.push(blankSection(type));
  } else if (action === "section-delete") {
    if (!window.confirm("هل تريد حذف هذا القسم من الصفحة الرئيسية؟")) return;
    content.sections.splice(index, 1);
  } else if (action === "section-up" || action === "section-down") {
    moveItem(content.sections, index, action === "section-up" ? -1 : 1);
  } else if (action === "item-add") {
    const section = content.sections[sectionIndex];
    section.items.push(blankItem(section.type));
  } else if (action === "item-delete") {
    const section = content.sections[sectionIndex];
    section.items.splice(index, 1);
  } else if (action === "footer-link-add") {
    content.footer.links.push({ label: activeLanguage === "ar" ? "رابط جديد" : "New link", href: "#", icon: "fa-solid fa-link" });
  } else if (action === "footer-link-delete") {
    content.footer.links.splice(index, 1);
  } else if (action === "social-link-add") {
    content.footer.socialLinks.push({ label: activeLanguage === "ar" ? "حساب جديد" : "New account", href: "#", icon: "fa-solid fa-link" });
  } else if (action === "social-link-delete") {
    content.footer.socialLinks.splice(index, 1);
  } else {
    return;
  }

  setDirty();
  renderPage();
}

function handleInput(event) {
  const control = event.target.closest("[data-path]");
  if (!control || !content) return;
  const path = control.dataset.path;
  if (control.type === "color") {
    document.querySelectorAll(`[data-path="${CSS.escape(path)}"]`).forEach((fieldControl) => {
      if (fieldControl !== control) fieldControl.value = control.value;
    });
  } else if (control.type === "text" && path.startsWith("appearance.")) {
    if (!/^#[0-9a-f]{6}$/i.test(control.value)) {
      setDirty();
      return;
    }
    document.querySelectorAll(`[data-path="${CSS.escape(path)}"]`).forEach((fieldControl) => {
      if (fieldControl.type === "color") fieldControl.value = control.value;
    });
  }
  setPathValue(path, control.value);
  const preview = control.closest(".image-control")?.querySelector(".image-preview");
  if (preview) {
    preview.src = control.value ? `../${control.value}` : "";
    preview.hidden = !control.value;
  }
  setDirty();
}

async function uploadMedia(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    showToast("حجم الصورة يتجاوز 5 ميغابايت.", true);
    event.target.value = "";
    return;
  }
  try {
    const data = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener("load", () => resolve(String(reader.result).split(",")[1]));
      reader.addEventListener("error", () => reject(new Error("تعذرت قراءة الصورة من جهازك.")));
      reader.readAsDataURL(file);
    });
    const response = await fetch("../api/media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: file.type, data })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "تعذر رفع الصورة.");
    await loadMedia();
    renderPage();
    showToast("تمت إضافة الصورة إلى مكتبة الوسائط.");
  } catch (error) {
    showToast(error.message, true);
  }
}

async function publishContent() {
  publishButton.disabled = true;
  saveState.textContent = "جارٍ نشر التغييرات...";
  const publishedSnapshot = JSON.stringify(siteContent);
  try {
    const response = await fetch("../api/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: publishedSnapshot
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "تعذر نشر المحتوى.");
    isDirty = JSON.stringify(siteContent) !== publishedSnapshot;
    if (!isDirty) localStorage.removeItem(PREVIEW_KEY);
    publishButton.disabled = !isDirty;
    saveState.textContent = isDirty ? "نُشرت النسخة السابقة؛ توجد تعديلات جديدة" : "تم نشر التغييرات";
    showToast(result.message || "تم نشر التغييرات.");
  } catch (error) {
    saveState.textContent = "تعذر النشر";
    publishButton.disabled = false;
    showToast(error.message, true);
  }
}

function previewContent() {
  try {
    localStorage.setItem(PREVIEW_KEY, JSON.stringify(siteContent));
    window.open(`../index.html?preview=1&lang=${encodeURIComponent(activeLanguage)}`, "_blank", "noopener");
  } catch (error) {
    showToast(`تعذّر حفظ مسودة المعاينة: ${error.message}`, true);
  }
}

async function initialize() {
  try {
    const response = await fetch("../api/content", { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "تعذر تحميل محتوى الموقع.");
    siteContent = result;
    renderLanguageOptions();
    const savedLanguage = localStorage.getItem("madar-tech-cms-language");
    const availableLanguage = savedLanguage === "ar" || Object.hasOwn(siteContent.translations, savedLanguage)
      ? savedLanguage
      : "ar";
    setContentLanguage(availableLanguage);
    saveState.textContent = "المحتوى متصل";
    publishButton.disabled = true;
    renderPage();
  } catch (error) {
    saveState.textContent = "تعذر الاتصال";
    view.innerHTML = `<div class="error-state">${escapeHtml(error.message)}<br><span>شغّل الخادم المحلي بالأمر: node dashboard/server.js</span></div>`;
    showToast(error.message, true);
  }
}

document.querySelector(".dashboard-nav").addEventListener("click", (event) => {
  const button = event.target.closest("[data-page]");
  if (button) setActivePage(button.dataset.page);
});

languageSelect.addEventListener("change", () => setContentLanguage(languageSelect.value));
view.addEventListener("input", handleInput);
view.addEventListener("change", handleInput);
view.addEventListener("click", (event) => {
  const actionButton = event.target.closest("[data-action]");
  const pageButton = event.target.closest("[data-go]");
  if (actionButton) handleAction(actionButton);
  else if (pageButton) setActivePage(pageButton.dataset.go);
});

publishButton.addEventListener("click", publishContent);
document.querySelector("#preview-button").addEventListener("click", previewContent);

window.addEventListener("beforeunload", (event) => {
  if (isDirty) {
    event.preventDefault();
    event.returnValue = "";
  }
});

initialize();
