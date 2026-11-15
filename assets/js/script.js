const navigation = document.querySelector(".list");
const siteHeader = document.querySelector(".site-header");
const menuToggle = navigation.querySelector(".menu-toggle");
const navigationLinks = navigation.querySelector("#site-navigation");
const desktopNavigation = window.matchMedia("(min-width: 992px)");
let highlightedLink = null;

const setMenuOpen = (isOpen) => {
  navigationLinks.classList.toggle("active", isOpen);
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "إغلاق القائمة" : "فتح القائمة");
};

const moveHighlight = (link) => {
  if (!desktopNavigation.matches) {
    return;
  }

  const navigationBounds = navigationLinks.getBoundingClientRect();
  const linkBounds = link.getBoundingClientRect();

  navigationLinks.style.setProperty("--highlight-x", `${linkBounds.left - navigationBounds.left}px`);
  navigationLinks.style.setProperty("--highlight-y", `${linkBounds.top - navigationBounds.top}px`);
  navigationLinks.style.setProperty("--highlight-width", `${linkBounds.width}px`);
  navigationLinks.style.setProperty("--highlight-height", `${linkBounds.height}px`);
  navigationLinks.classList.add("has-highlight");
  highlightedLink = link;
};

const clearHighlight = () => {
  navigationLinks.classList.remove("has-highlight");
  highlightedLink = null;
};

menuToggle.addEventListener("click", () => {
  setMenuOpen(menuToggle.getAttribute("aria-expanded") !== "true");
});

navigationLinks.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => setMenuOpen(false));
  link.addEventListener("mouseenter", () => moveHighlight(link));
  link.addEventListener("focus", () => moveHighlight(link));
});

navigationLinks.addEventListener("mouseleave", clearHighlight);

navigationLinks.addEventListener("focusout", (event) => {
  if (!navigationLinks.contains(event.relatedTarget)) {
    clearHighlight();
  }
});

document.addEventListener("click", (event) => {
  if (!navigation.contains(event.target)) {
    setMenuOpen(false);
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setMenuOpen(false);
  }
});

window.addEventListener("resize", () => {
  if (desktopNavigation.matches) {
    setMenuOpen(false);
  } else {
    clearHighlight();
  }

  if (highlightedLink) {
    moveHighlight(highlightedLink);
  }
});

window.addEventListener("scroll", () => {
  siteHeader.classList.toggle("is-scrolled", window.scrollY > 20);
}, { passive: true });

siteHeader.classList.toggle("is-scrolled", window.scrollY > 20);

if (document.querySelector(".hero-slider")) {
  const heroSlider = document.querySelector(".hero-slider");
  const heroSlides = Array.from(heroSlider.querySelectorAll(".hero-slide"));
  const heroDots = Array.from(heroSlider.querySelectorAll(".hero-dot"));
  const previousButton = heroSlider.querySelector(".hero-arrow-previous");
  const nextButton = heroSlider.querySelector(".hero-arrow-next");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let activeSlide = heroSlides.findIndex((slide) => slide.classList.contains("is-active"));
  let autoplayTimer = null;
  let transitionTimer = null;
  let isHovered = false;
  let touchStart = null;

  const synchronizeActiveSlide = () => {
    const displayedIndex = heroSlides.findIndex((slide) =>
      slide.classList.contains("is-active") || slide.classList.contains("is-entering")
    );

    if (displayedIndex >= 0) {
      activeSlide = displayedIndex;
      return activeSlide;
    }

    const selectedDot = heroDots.findIndex((dot) => dot.getAttribute("aria-current") === "true");
    activeSlide = selectedDot >= 0 ? selectedDot : 0;
    heroSlides[activeSlide].classList.add("is-active");
    updateSlideAccessibility(activeSlide);
    return activeSlide;
  };

  const updateSlideAccessibility = (activeIndex) => {
    heroSlides.forEach((slide, index) => {
      const isActive = index === activeIndex;
      slide.setAttribute("aria-hidden", String(!isActive));
      slide.inert = !isActive;
    });

    heroDots.forEach((dot, index) => {
      const isActive = index === activeIndex;
      dot.classList.toggle("is-active", isActive);
      dot.setAttribute("aria-current", String(isActive));
    });
  };

  const showSlide = (nextIndex, direction) => {
    const currentSlide = synchronizeActiveSlide();
    if (nextIndex === currentSlide || nextIndex < 0 || nextIndex >= heroSlides.length) {
      return;
    }

    const outgoingSlide = heroSlides[currentSlide];
    const incomingSlide = heroSlides[nextIndex];

    window.clearTimeout(transitionTimer);
    heroSlides.forEach((slide, index) => {
      slide.classList.remove("is-entering", "is-leaving");
      if (index !== nextIndex) {
        slide.classList.remove("is-active");
      }
      slide.style.removeProperty("--slide-offset");
      slide.style.removeProperty("--slide-exit");
    });

    outgoingSlide.style.setProperty("--slide-exit", direction === "next" ? "5%" : "-5%");
    outgoingSlide.classList.add("is-leaving");

    incomingSlide.style.setProperty("--slide-offset", direction === "next" ? "-5%" : "5%");
    incomingSlide.classList.add("is-active", "is-entering");

    activeSlide = nextIndex;
    updateSlideAccessibility(activeSlide);

    transitionTimer = window.setTimeout(() => {
      heroSlides.forEach((slide) => {
        slide.classList.remove("is-entering", "is-leaving");
        slide.style.removeProperty("--slide-offset");
        slide.style.removeProperty("--slide-exit");
      });
    }, 700);
  };

  const stopAutoplay = () => {
    window.clearInterval(autoplayTimer);
    autoplayTimer = null;
  };

  const startAutoplay = () => {
    stopAutoplay();
    if (document.hidden || isHovered || reducedMotion.matches || heroSlides.length < 2) {
      return;
    }

    autoplayTimer = window.setInterval(() => {
      showSlide((synchronizeActiveSlide() + 1) % heroSlides.length, "next");
    }, 5000);
  };

  previousButton.addEventListener("click", () => {
    showSlide((synchronizeActiveSlide() - 1 + heroSlides.length) % heroSlides.length, "previous");
  });

  nextButton.addEventListener("click", () => {
    showSlide((synchronizeActiveSlide() + 1) % heroSlides.length, "next");
  });

  heroDots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      const currentSlide = synchronizeActiveSlide();
      const forwardDistance = (index - currentSlide + heroSlides.length) % heroSlides.length;
      const direction = forwardDistance <= heroSlides.length / 2 ? "next" : "previous";
      showSlide(index, direction);
    });
  });

  heroSlider.addEventListener("pointerenter", (event) => {
    if (event.pointerType === "mouse") {
      isHovered = true;
      stopAutoplay();
    }
  });

  heroSlider.addEventListener("pointerleave", (event) => {
    if (event.pointerType === "mouse") {
      isHovered = false;
      startAutoplay();
    }
  });

  heroSlider.addEventListener("touchstart", (event) => {
    if (event.touches.length === 1) {
      touchStart = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
      };
    }
  }, { passive: true });

  heroSlider.addEventListener("touchend", (event) => {
    if (!touchStart || event.changedTouches.length !== 1) {
      touchStart = null;
      return;
    }

    const deltaX = event.changedTouches[0].clientX - touchStart.x;
    const deltaY = event.changedTouches[0].clientY - touchStart.y;
    touchStart = null;

    if (Math.abs(deltaX) < 45 || Math.abs(deltaX) <= Math.abs(deltaY)) {
      return;
    }

    if (deltaX < 0) {
      showSlide((synchronizeActiveSlide() + 1) % heroSlides.length, "next");
    } else {
      showSlide((synchronizeActiveSlide() - 1 + heroSlides.length) % heroSlides.length, "previous");
    }
  }, { passive: true });

  heroSlider.addEventListener("touchcancel", () => {
    touchStart = null;
  }, { passive: true });

  document.addEventListener("visibilitychange", startAutoplay);
  if (typeof reducedMotion.addEventListener === "function") {
    reducedMotion.addEventListener("change", startAutoplay);
  } else {
    reducedMotion.addListener(startAutoplay);
  }
  updateSlideAccessibility(activeSlide);
  startAutoplay();
}