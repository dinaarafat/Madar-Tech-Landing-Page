(() => {
  const PREVIEW_KEY = "madar-tech-cms-preview";

  const element = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  const safeHref = (value) => {
    const href = String(value || "").trim();
    return /^(#|https?:\/\/|mailto:|tel:)/i.test(href) ? href : "#";
  };

  const imageSource = (value) => {
    const source = String(value || "").trim();
    if (/^https?:\/\//i.test(source)) return source;
    if (source.startsWith("/") && !source.startsWith("//")) return source;
    if (source.startsWith("assets/images/") && !source.includes("..")) return source;
    return "assets/images/bg1.jpg";
  };

  const setText = (selector, value) => {
    const node = document.querySelector(selector);
    if (node) node.textContent = value || "";
  };

  const makeImage = (source, alt, className) => {
    const image = element("img", className);
    image.src = imageSource(source);
    image.alt = alt || "";
    return image;
  };

  const applyNavigation = (content) => {
    const links = document.querySelectorAll("#site-navigation a");
    content.navigation.forEach((label, index) => {
      if (links[index]) links[index].textContent = label;
    });
    document.title = content.siteTitle || document.title;
    document.querySelectorAll(".navbar-logo img, .footer-logo img").forEach((image) => {
      image.src = imageSource(content.brandLogo);
    });
  };

  const buildHero = (slides, language) => {
    const section = element("section", "hero-slider");
    section.id = "home";
    section.dir = language === "ar" ? "rtl" : "ltr";
    section.setAttribute("aria-roledescription", "carousel");
    section.setAttribute("aria-label", language === "ar" ? "مدار تك" : "Madar Tech");
    const slideList = element("div", "hero-slides");
    slides.forEach((slide, index) => {
      const article = element("article", `hero-slide${index === 0 ? " is-active" : ""}`);
      article.setAttribute("role", "group");
      article.setAttribute("aria-roledescription", "slide");
      article.setAttribute("aria-label", language === "ar"
        ? `${index + 1} من ${slides.length}`
        : `${index + 1} of ${slides.length}`);
      article.setAttribute("aria-hidden", String(index !== 0));
      article.inert = index !== 0;
      const image = makeImage(slide.image, "", "hero-slide-image");
      image.setAttribute("aria-hidden", "true");
      if (index > 0) image.loading = "lazy";
      article.append(image);

      const copy = element("div", "hero-copy");
      const titleLines = String(slide.title || "").split("\n");
      const title = element(index === 0 ? "h1" : "h2", "hero-title");
      if (index === 0 && titleLines.length > 1) {
        titleLines.forEach((line) => title.append(element("span", "", line)));
      } else {
        title.textContent = titleLines.join(" ");
      }
      copy.append(title, element("p", "hero-description", slide.description));
      const buttons = element("div", "hero-buttons");
      [
        { label: slide.primaryLabel, href: slide.primaryHref, className: "btn hero-btn-primary" },
        { label: slide.secondaryLabel, href: slide.secondaryHref, className: "btn hero-btn-secondary" }
      ].forEach((item) => {
        const link = element("a", item.className, item.label);
        link.href = safeHref(item.href);
        buttons.append(link);
      });
      copy.append(buttons);
      article.append(copy);
      slideList.append(article);
    });
    section.append(slideList);

    const controls = element("div", "hero-controls");
    const previous = element("button", "hero-arrow hero-arrow-previous");
    previous.type = "button";
    previous.setAttribute("aria-label", language === "ar" ? "الشريحة السابقة" : "Previous slide");
    const previousIcon = element("i", "fa-solid fa-chevron-right");
    previousIcon.setAttribute("aria-hidden", "true");
    previous.append(previousIcon);
    const pagination = element("div", "hero-pagination");
    pagination.setAttribute("role", "group");
    pagination.setAttribute("aria-label", language === "ar" ? "اختيار الشريحة" : "Choose a slide");
    slides.forEach((slide, index) => {
      const dot = element("button", `hero-dot${index === 0 ? " is-active" : ""}`);
      dot.type = "button";
      dot.setAttribute("aria-label", language === "ar" ? `الشريحة ${index + 1}` : `Slide ${index + 1}`);
      dot.setAttribute("aria-current", String(index === 0));
      pagination.append(dot);
    });
    const next = element("button", "hero-arrow hero-arrow-next");
    next.type = "button";
    next.setAttribute("aria-label", language === "ar" ? "الشريحة التالية" : "Next slide");
    const nextIcon = element("i", "fa-solid fa-chevron-left");
    nextIcon.setAttribute("aria-hidden", "true");
    next.append(nextIcon);
    controls.append(previous, pagination, next);
    section.append(controls);
    return section;
  };

  const sectionId = (section) => {
    if (section.id === "services") return "Services";
    if (section.id === "programs") return "Programs";
    return section.id || "";
  };

  const buildAbout = (section) => {
    const node = element("section", "about");
    node.id = sectionId(section) || "about";
    node.append(element("h1", "heading", section.title));
    const row = element("div", "row");
    const intro = element("div", "about-intro");
    intro.append(element("p", "", section.description));
    const cards = element("div", "con");
    cards.id = "content1";
    [
      { className: "vision", icon: "fa-regular fa-eye", title: section.visionTitle, text: section.vision },
      { className: "con", icon: "fa-regular fa-envelope", title: section.missionTitle, text: section.mission }
    ].forEach((item, index) => {
      const card = element("div", item.className);
      if (index === 1) card.id = "message";
      const iconBox = element("div", "icon-box");
      const icon = element("i", item.icon);
      icon.setAttribute("aria-hidden", "true");
      iconBox.append(icon);
      card.append(iconBox, element("h2", "", item.title), element("p", "", item.text));
      cards.append(card);
    });
    row.append(intro, cards);
    node.append(row);
    return node;
  };

  const buildServices = (section) => {
    const node = element("section", "Services");
    node.id = sectionId(section) || "services";
    node.append(element("h1", "heading", section.title));
    const container = element("div", "container");
    const row = element("div", "row g-3");
    (section.items || []).forEach((item) => {
      const column = element("div", "col-md-6 col-lg-3");
      const card = element("div", "card");
      card.append(makeImage(item.image, item.title, "card-img-top"));
      const body = element("div", "card-body");
      body.append(element("h3", "card-title", item.title), element("hr"), element("p", "card-text", item.description));
      card.append(body);
      column.append(card);
      row.append(column);
    });
    container.append(row);
    node.append(container);
    return node;
  };

  const buildPrograms = (section) => {
    const node = element("section", "Programs");
    node.id = sectionId(section) || "programs";
    const container = element("div", "container");
    const content = element("div", "program-content");
    const row = element("div", "row lg-3");
    const heading = element("div", "section-heading");
    heading.append(element("h2", "", section.title));
    row.append(heading, element("p", "section-subtitle", section.subtitle));
    const items = element("div", "row lg-3");
    (section.items || []).forEach((item) => {
      const column = element("div", "col-md-4");
      column.append(element("h3", "", item.title), element("p", "", item.description));
      const button = element("button", "btn btn-outline-primary rounded-pill px-4 py-2", item.buttonLabel);
      button.type = "button";
      column.append(button);
      items.append(column);
    });
    row.append(items);
    content.append(row);
    container.append(content);
    node.append(container);
    return node;
  };

  const buildWhy = (section) => {
    const node = element("section", "why-madar");
    node.id = sectionId(section) || "why";
    const container = element("div", "container");
    container.append(element("h2", "", section.title));
    const row = element("div", "row g-0");
    (section.items || []).forEach((item) => {
      const column = element("div", "col-6 col-lg-2");
      const card = element("div", "why-item");
      const icon = element("i", item.icon || "fa-solid fa-star");
      icon.setAttribute("aria-hidden", "true");
      card.append(icon, element("h3", "", item.title));
      column.append(card);
      row.append(column);
    });
    container.append(row);
    node.append(container);
    return node;
  };

  const buildContact = (section, language) => {
    const node = element("section", "Contact Us");
    node.id = sectionId(section) || "contact";
    const container = element("div", "container");
    const row = element("div", "row contact-layout align-items-center");
    const imageColumn = element("div", "col-lg-6 contact-image-side");
    imageColumn.append(makeImage(section.image, language === "ar" ? "تواصل مع مدار تك" : "Contact Madar Tech", ""));
    const formColumn = element("div", "col-lg-6 contact-form-side");
    const heading = element("div", "contact-heading");
    heading.append(element("h2", "", section.title), element("h4", "", section.subtitle), element("p", "", section.description));
    const form = element("form", "contact-form");
    [
      { tag: "input", type: "text", placeholder: language === "ar" ? "الاسم" : "Name", required: true },
      { tag: "input", type: "email", placeholder: language === "ar" ? "ادخل عنوان البريد الإلكتروني" : "Email address", required: true },
      { tag: "input", type: "tel", placeholder: language === "ar" ? "ادخل رقم الهاتف" : "Phone number" },
      { tag: "textarea", placeholder: language === "ar" ? "اكتب رسالتك هنا" : "Write your message here", required: true }
    ].forEach((definition) => {
      const group = element("div", "form-group");
      const control = element(definition.tag, definition.tag === "input" ? "form-control" : "");
      if (definition.type) control.type = definition.type;
      control.placeholder = definition.placeholder;
      if (definition.required) control.required = true;
      group.append(control);
      form.append(group);
    });
    const submit = element("button", "btn contact-submit", language === "ar" ? "إرسال" : "Send");
    submit.type = "submit";
    form.append(submit);
    formColumn.append(heading, form);
    row.append(imageColumn, formColumn);
    container.append(row);
    node.append(container);
    return node;
  };

  const buildCustom = (section) => {
    const node = element("section", "about cms-custom-section");
    node.id = sectionId(section);
    node.append(element("h1", "heading", section.title));
    const row = element("div", "row");
    const intro = element("div", "about-intro");
    intro.append(element("p", "", section.description));
    row.append(intro);
    node.append(row);
    return node;
  };

  const sectionBuilders = {
    about: buildAbout,
    services: buildServices,
    programs: buildPrograms,
    why: buildWhy,
    contact: buildContact,
    custom: buildCustom
  };

  const buildFooter = (footer, logo, language) => {
    const node = element("footer", "footer");
    const container = element("div", "container");
    const content = element("div", "footer-content");
    const about = element("div", "footer-about");
    const logoBox = element("div", "footer-logo");
    logoBox.append(makeImage(logo, language === "ar" ? "شعار مدار تك" : "Madar Tech logo", ""));
    const brandLink = element("a", "logo");
    brandLink.href = "#list";
    brandLink.append(element("span", "", "مدار"), element("span", "", "تك"));
    about.append(logoBox, brandLink, element("p", "", footer.tagline));

    const links = element("div", "footer-links");
    links.append(element("h3", "", language === "ar" ? "روابط التنقل" : "Quick links"));
    (footer.links || []).forEach((item) => {
      const link = element("a");
      link.href = safeHref(item.href);
      link.title = item.label || "";
      const icon = element("i", item.icon || "fa-solid fa-link");
      icon.setAttribute("aria-hidden", "true");
      link.append(icon);
      links.append(link);
    });

    const social = element("div", "footer-social");
    social.append(element("h3", "", language === "ar" ? "تابعنا" : "Follow us"));
    const socials = element("div", "socials");
    (footer.socialLinks || []).forEach((item) => {
      const link = element("a");
      link.href = safeHref(item.href);
      link.setAttribute("aria-label", item.label || "");
      if (/^https?:\/\//i.test(link.href)) {
        link.target = "_blank";
        link.rel = "noopener noreferrer";
      }
      const icon = element("i", item.icon || "fa-solid fa-link");
      icon.setAttribute("aria-hidden", "true");
      link.append(icon);
      socials.append(link);
    });
    social.append(socials);
    content.append(about, links, social);
    const bottom = element("div", "footer-bottom");
    const copyright = element("p");
    copyright.append(document.createTextNode(`${footer.copyright || ""} `), element("span", "", footer.brand || ""));
    bottom.append(copyright);
    container.append(content, bottom);
    node.append(container);
    return node;
  };

  const applyContent = (content, appearance, language, languages) => {
    applyNavigation(content);
    const root = document.documentElement;
    root.lang = language;
    root.dir = language === "ar" ? "rtl" : "ltr";
    root.style.setProperty("--oxford-blue", appearance.primaryColor);
    root.style.setProperty("--fresh-lime", appearance.accentColor);
    root.style.setProperty("--Light-blue", appearance.backgroundColor);
    const languageSelect = document.querySelector("#site-language");
    languageSelect.replaceChildren(...languages.map((code) => {
      const option = element("option", "", code === "ar" ? "العربية" : code === "en" ? "English" : code);
      option.value = code;
      return option;
    }));
    languageSelect.value = language;
    const bookingLabel = document.querySelector(".btn-book-label");
    if (bookingLabel) bookingLabel.textContent = language === "ar" ? "احجز الآن" : "Book now";
    const menuToggle = document.querySelector(".menu-toggle");
    if (menuToggle) menuToggle.setAttribute("aria-label", language === "ar" ? "فتح القائمة" : "Open menu");

    const main = document.querySelector("main");
    const sections = (content.sections || []).map((section) => {
      if (section.type === "contact") return buildContact(section, language);
      const builder = sectionBuilders[section.type];
      return builder ? builder(section) : null;
    }).filter(Boolean);
    main.replaceChildren(buildHero(content.heroSlides, language), ...sections, buildFooter(content.footer, content.brandLogo, language));
  };

  const applySiteContent = (siteContent) => {
    const languages = ["ar", ...Object.keys(siteContent.translations || {})];
    const params = new URLSearchParams(window.location.search);
    const requestedLanguage = params.get("lang") || localStorage.getItem("madar-tech-site-language") || "ar";
    const language = languages.includes(requestedLanguage) ? requestedLanguage : "ar";
    const content = language === "ar" ? siteContent : siteContent.translations[language];
    if (!content) throw new Error(`تعذر تحميل ترجمة اللغة ${language}.`);
    applyContent(content, siteContent.appearance, language, languages);
  };

  const loadContent = async () => {
    const languageSelect = document.querySelector("#site-language");
    languageSelect.addEventListener("change", () => {
      localStorage.setItem("madar-tech-site-language", languageSelect.value);
      const url = new URL(window.location.href);
      url.searchParams.set("lang", languageSelect.value);
      window.location.assign(url);
    });
    const isPreview = new URLSearchParams(window.location.search).has("preview");
    if (isPreview) {
      try {
        const draft = localStorage.getItem(PREVIEW_KEY);
        if (draft) {
          applySiteContent(JSON.parse(draft));
          return;
        }
      } catch (error) {
        console.error("تعذر تحميل معاينة المحتوى:", error);
      }
    }

    if (window.location.protocol === "file:") return;

    try {
      const response = await fetch("/api/content", { cache: "no-store" });
      if (!response.ok) throw new Error(`تعذر تحميل محتوى الموقع (${response.status}).`);
      applySiteContent(await response.json());
    } catch (error) {
      console.error("تعذر الاتصال بمحتوى إدارة الموقع؛ سيتم عرض النسخة الافتراضية.", error);
    }
  };

  window.madarContentReady = loadContent();
})();
