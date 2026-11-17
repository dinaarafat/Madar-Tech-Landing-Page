(() => {
  const PREVIEW_KEY = "madar-tech-cms-preview";
  const UI_TRANSLATIONS = {
    ar: {
      chooseLanguage: "اختر لغة الموقع",
      switchToDark: "التبديل إلى الوضع الداكن",
      switchToLight: "التبديل إلى الوضع الفاتح",
      bookNow: "احجز الآن",
      openMenu: "فتح القائمة",
      closeMenu: "إغلاق القائمة",
      heroKicker: "مساحة للتعلّم، والمهارة، والفرص",
      slideOf: (index, total) => `${index} من ${total}`,
      slideLabel: (index) => `الشريحة ${index}`,
      previousSlide: "الشريحة السابقة",
      nextSlide: "الشريحة التالية",
      chooseSlide: "اختيار الشريحة",
      contactName: "الاسم",
      contactEmail: "ادخل عنوان البريد الإلكتروني",
      contactPhone: "ادخل رقم الهاتف",
      contactMessage: "اكتب رسالتك هنا",
      send: "إرسال",
      contactAlt: "تواصل مع مدار تك",
      logoAlt: "شعار مدار تك",
      brandName: "مدار تك",
      brandParts: ["مدار", "تك"],
      languageNames: { ar: "العربية", en: "الإنجليزية" },
      quickLinks: "روابط التنقل",
      followUs: "تابعنا",
      skipToContent: "انتقل إلى المحتوى"
    },
    en: {
      chooseLanguage: "Choose site language",
      switchToDark: "Switch to dark mode",
      switchToLight: "Switch to light mode",
      bookNow: "Book now",
      openMenu: "Open menu",
      closeMenu: "Close menu",
      heroKicker: "A space to learn, build skills, and find opportunity",
      slideOf: (index, total) => `${index} of ${total}`,
      slideLabel: (index) => `Slide ${index}`,
      previousSlide: "Previous slide",
      nextSlide: "Next slide",
      chooseSlide: "Choose a slide",
      contactName: "Name",
      contactEmail: "Email address",
      contactPhone: "Phone number",
      contactMessage: "Write your message here",
      send: "Send",
      contactAlt: "Contact Madar Tech",
      logoAlt: "Madar Tech logo",
      brandName: "Madar Tech",
      brandParts: ["Madar", "Tech"],
      languageNames: { ar: "Arabic", en: "English" },
      quickLinks: "Quick links",
      followUs: "Follow us",
      skipToContent: "Skip to content"
    }
  };
  window.madarUITranslations = UI_TRANSLATIONS;

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

  const makeImage = (source, alt, className) => {
    const image = element("img", className);
    image.src = imageSource(source);
    image.alt = alt || "";
    return image;
  };

  const applyNavigation = (content, language) => {
    const ui = UI_TRANSLATIONS[language] || UI_TRANSLATIONS.en;
    const links = document.querySelectorAll("#site-navigation a");
    content.navigation.forEach((label, index) => {
      if (links[index]) links[index].textContent = label;
    });
    document.title = content.siteTitle || document.title;
    document.querySelectorAll(".footer-logo img").forEach((image) => {
      image.src = imageSource(content.brandLogo);
    });
    const navbarLogo = document.querySelector(".navbar-logo img");
    if (navbarLogo) navbarLogo.alt = ui.logoAlt;
    const brandWordmark = document.querySelector(".brand-wordmark");
    if (brandWordmark) brandWordmark.textContent = ui.brandName;
  };

  const buildHero = (slides, language) => {
    const ui = UI_TRANSLATIONS[language] || UI_TRANSLATIONS.en;
    const section = element("section", "hero-slider");
    section.id = "home";
    section.dir = language === "ar" ? "rtl" : "ltr";
    section.setAttribute("aria-roledescription", "carousel");
    section.setAttribute("aria-label", ui.brandName);
    const slideList = element("div", "hero-slides");
    slides.forEach((slide, index) => {
      const article = element("article", `hero-slide${index === 0 ? " is-active" : ""}`);
      article.setAttribute("role", "group");
      article.setAttribute("aria-roledescription", "slide");
      article.setAttribute("aria-label", ui.slideOf(index + 1, slides.length));
      article.setAttribute("aria-hidden", String(index !== 0));
      article.inert = index !== 0;
      const image = makeImage(slide.image, "", "hero-slide-image");
      image.setAttribute("aria-hidden", "true");
      if (index > 0) image.loading = "lazy";
      article.append(image);

      const copy = element("div", "hero-copy");
      if (index === 0) copy.append(element("p", "hero-kicker", ui.heroKicker));
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
    previous.setAttribute("aria-label", ui.previousSlide);
    const previousIcon = element("i", `fa-solid fa-chevron-${language === "ar" ? "right" : "left"}`);
    previousIcon.setAttribute("aria-hidden", "true");
    previous.append(previousIcon);
    const pagination = element("div", "hero-pagination");
    pagination.setAttribute("role", "group");
    pagination.setAttribute("aria-label", ui.chooseSlide);
    slides.forEach((slide, index) => {
      const dot = element("button", `hero-dot${index === 0 ? " is-active" : ""}`);
      dot.type = "button";
      dot.setAttribute("aria-label", ui.slideLabel(index + 1));
      dot.setAttribute("aria-current", String(index === 0));
      pagination.append(dot);
    });
    const next = element("button", "hero-arrow hero-arrow-next");
    next.type = "button";
    next.setAttribute("aria-label", ui.nextSlide);
    const nextIcon = element("i", `fa-solid fa-chevron-${language === "ar" ? "left" : "right"}`);
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
    node.append(element("h2", "heading", section.title));
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
    node.append(element("h2", "heading", section.title));
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
    const ui = UI_TRANSLATIONS[language] || UI_TRANSLATIONS.en;
    const node = element("section", "Contact Us");
    node.id = sectionId(section) || "contact";
    const container = element("div", "container");
    const row = element("div", "row contact-layout align-items-center");
    const imageColumn = element("div", "col-lg-6 contact-image-side");
    imageColumn.append(makeImage(section.image, ui.contactAlt, ""));
    const formColumn = element("div", "col-lg-6 contact-form-side");
    const heading = element("div", "contact-heading");
    heading.append(element("h2", "", section.title), element("h4", "", section.subtitle), element("p", "", section.description));
    const form = element("form", "contact-form");
    [
      { tag: "input", type: "text", placeholder: ui.contactName, required: true },
      { tag: "input", type: "email", placeholder: ui.contactEmail, required: true },
      { tag: "input", type: "tel", placeholder: ui.contactPhone },
      { tag: "textarea", placeholder: ui.contactMessage, required: true }
    ].forEach((definition) => {
      const group = element("div", "form-group");
      const control = element(definition.tag, definition.tag === "input" ? "form-control" : "");
      if (definition.type) control.type = definition.type;
      control.placeholder = definition.placeholder;
      control.setAttribute("aria-label", definition.placeholder);
      if (definition.required) control.required = true;
      group.append(control);
      form.append(group);
    });
    const submit = element("button", "btn contact-submit", ui.send);
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
    node.append(element("h2", "heading", section.title));
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
    const ui = UI_TRANSLATIONS[language] || UI_TRANSLATIONS.en;
    const node = element("footer", "footer");
    const container = element("div", "container");
    const content = element("div", "footer-content");
    const about = element("div", "footer-about");
    const logoBox = element("div", "footer-logo");
    logoBox.append(makeImage(logo, ui.logoAlt, ""));
    const brandLink = element("a", "logo");
    brandLink.href = "#list";
    ui.brandParts.forEach((part) => brandLink.append(element("span", "", part)));
    about.append(logoBox, brandLink, element("p", "", footer.tagline));

    const links = element("div", "footer-links");
    links.append(element("h3", "", ui.quickLinks));
    (footer.links || []).forEach((item) => {
      const link = element("a");
      link.href = safeHref(item.href);
      link.title = item.label || "";
      link.setAttribute("aria-label", item.label || "");
      const icon = element("i", item.icon || "fa-solid fa-link");
      icon.setAttribute("aria-hidden", "true");
      link.append(icon);
      links.append(link);
    });

    const social = element("div", "footer-social");
    social.append(element("h3", "", ui.followUs));
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
    const ui = UI_TRANSLATIONS[language] || UI_TRANSLATIONS.en;
    applyNavigation(content, language);
    const root = document.documentElement;
    root.lang = language;
    root.dir = language === "ar" ? "rtl" : "ltr";
    const description = document.querySelector('meta[name="description"]');
    if (description && content.heroSlides[0]) {
      description.content = content.heroSlides[0].description;
    }
    root.style.setProperty("--oxford-blue", appearance.primaryColor);
    root.style.setProperty("--fresh-lime", appearance.accentColor);
    root.style.setProperty("--Light-blue", appearance.backgroundColor);
    const languageToggle = document.querySelector("#site-language");
    languageToggle.setAttribute("aria-label", ui.chooseLanguage);
    const languageMenu = document.querySelector("#language-options");
    languageMenu.replaceChildren(...languages.map((code) => {
      const option = element("button", "language-option", ui.languageNames[code] || code);
      option.type = "button";
      option.dataset.language = code;
      option.setAttribute("aria-current", String(code === language));
      return option;
    }));
    const bookingLabel = document.querySelector(".btn-book-label");
    if (bookingLabel) bookingLabel.textContent = ui.bookNow;
    const menuToggle = document.querySelector(".menu-toggle");
    if (menuToggle) {
      menuToggle.setAttribute("aria-label", menuToggle.getAttribute("aria-expanded") === "true" ? ui.closeMenu : ui.openMenu);
    }
    const themeToggle = document.querySelector("#theme-toggle");
    if (themeToggle) {
      const isDark = document.documentElement.dataset.theme === "dark";
      themeToggle.setAttribute("aria-label", isDark ? ui.switchToLight : ui.switchToDark);
    }
    const skipLink = document.querySelector(".skip-link");
    if (skipLink) skipLink.textContent = ui.skipToContent;

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
    const languagePicker = document.querySelector("#language-picker");
    const languageToggle = document.querySelector("#site-language");
    const languageMenu = document.querySelector("#language-options");
    const closeLanguageMenu = (restoreFocus = false) => {
      languageMenu.hidden = true;
      languageToggle.setAttribute("aria-expanded", "false");
      if (restoreFocus) languageToggle.focus();
    };

    languageToggle.addEventListener("click", () => {
      const shouldOpen = languageMenu.hidden;
      languageMenu.hidden = !shouldOpen;
      languageToggle.setAttribute("aria-expanded", String(shouldOpen));
      if (shouldOpen) languageMenu.querySelector("button")?.focus();
    });

    languageMenu.addEventListener("click", (event) => {
      const option = event.target.closest("[data-language]");
      if (!option) return;
      localStorage.setItem("madar-tech-site-language", option.dataset.language);
      const url = new URL(window.location.href);
      url.searchParams.set("lang", option.dataset.language);
      window.location.assign(url);
    });

    document.addEventListener("click", (event) => {
      if (!languagePicker.contains(event.target)) closeLanguageMenu();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !languageMenu.hidden) closeLanguageMenu(true);
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
