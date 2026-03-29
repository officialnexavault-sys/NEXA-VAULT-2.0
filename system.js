document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  // =========================
  // HELPERS
  // =========================
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const escapeHTML = (str = "") =>
    String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");

  const lockScroll = (locked) => {
    const value = locked ? "hidden" : "";
    document.documentElement.style.overflow = value;
    document.body.style.overflow = value;
  };

  const storageKey = "nv_search_history";

  // =========================
  // STATE
  // =========================
  const state = {
    bannerIndex: 0,
    bannerTimer: null,
    bannerPaused: false,
    activeGame: null,
    activeFilter: "all",
    searchHistory: [],
    indicatorX: 0,
    indicatorW: 74,
    productsByGame: {
      "free-fire": [
        { name: "100 Diamonds", category: "Top-Ups", price: "₹80", original: "₹99", rating: "4.9", reviews: "2.1k", discount: "-18%", image: "assets/default.png" },
        { name: "520 Diamonds", category: "Top-Ups", price: "₹385", original: "₹449", rating: "4.8", reviews: "1.4k", discount: "-14%", image: "assets/default.png" }
      ],
      bgmi: [
        { name: "60 UC", category: "Top-Ups", price: "₹75", original: "₹89", rating: "4.9", reviews: "3.0k", discount: "-16%", image: "assets/default.png" },
        { name: "300 UC", category: "Top-Ups", price: "₹355", original: "₹399", rating: "4.8", reviews: "1.2k", discount: "-11%", image: "assets/default.png" }
      ],
      "call-of-duty": [
        { name: "200 CP", category: "Top-Ups", price: "₹179", original: "₹209", rating: "4.8", reviews: "860", discount: "-14%", image: "assets/default.png" }
      ],
      valorant: [
        { name: "475 VP", category: "Vouchers", price: "₹449", original: "₹499", rating: "4.9", reviews: "910", discount: "-10%", image: "assets/default.png" }
      ],
      "mobile-legends": [
        { name: "86 Diamonds", category: "Top-Ups", price: "₹79", original: "₹99", rating: "4.9", reviews: "1.7k", discount: "-20%", image: "assets/default.png" }
      ],
      "clash-of-clans": [
        { name: "Gems Pack", category: "Top-Ups", price: "₹120", original: "₹149", rating: "4.8", reviews: "640", discount: "-19%", image: "assets/default.png" }
      ],
      roblox: [
        { name: "400 Robux", category: "Subscriptions", price: "₹399", original: "₹449", rating: "4.7", reviews: "780", discount: "-11%", image: "assets/default.png" }
      ],
      fortnite: [
        { name: "1000 V-Bucks", category: "Vouchers", price: "₹799", original: "₹899", rating: "4.8", reviews: "520", discount: "-11%", image: "assets/default.png" }
      ],
      steam: [
        { name: "₹500 Wallet", category: "Vouchers", price: "₹479", original: "₹499", rating: "4.9", reviews: "430", discount: "-4%", image: "assets/default.png" }
      ],
      "genshin-impact": [
        { name: "980 Crystals", category: "Top-Ups", price: "₹899", original: "₹999", rating: "4.8", reviews: "390", discount: "-10%", image: "assets/default.png" }
      ]
    }
  };

  // =========================
  // ELEMENTS
  // =========================
  const header = $(".header");
  const menuTrigger = $("#menuTrigger");
  const menuOverlay = $("#menuOverlay");
  const menuBackdrop = $("#menuBackdrop");
  const menuDrawer = $("#menuDrawer");
  const menuClose = $("#menuClose");

  const searchTrigger = $("#searchTrigger");
  const searchOverlay = $("#searchOverlay");
  const searchClose = $("#searchClose");
  const searchInput = $("#searchInput");
  const searchInputClear = $("#searchInputClear");
  const recentSearchList = $("#recentSearchList");
  const clearAllRecent = $("#clearAllRecent");
  const searchResults = $("#searchResults");
  const searchResultsList = $("#searchResultsList");

  const bannerTrack = $("#bannerTrack");
  const bannerViewport = $("#bannerViewport");
  const bannerProgress = $("#bannerProgress");
  const bannerLines = $$(".banner-stage__progress-line");

  const gameRail = $("#gameGalaxyRail");
  const gameItems = $$(".game-galaxy__item");
  const indicator = $("#nexaIndicator");

  const productGrid = $("#productGrid");
  const productFilters = $$(".product-store__filter");

  const bottomNavItems = $$(".bottom-nav__item");

  const searchBar = $(".search-container");
  const mainContent = $("#mainContent");
  const gameGalaxySection = $(".game-galaxy");

  // =========================
  // INITIAL HARDENING
  // =========================
  if (header) {
    header.style.background = "rgba(10,10,10,.965)";
    header.style.backdropFilter = "blur(22px)";
    header.style.webkitBackdropFilter = "blur(22px)";
  }

  if (gameGalaxySection) {
    gameGalaxySection.style.position = "relative";
    gameGalaxySection.style.paddingBottom = "18px";
  }

  if (indicator) {
    indicator.style.position = "absolute";
    indicator.style.left = "0";
    indicator.style.bottom = "4px";
    indicator.style.zIndex = "2";
  }

  // =========================
  // SEARCH HISTORY
  // =========================
  const loadHistory = () => {
    try {
      state.searchHistory = JSON.parse(localStorage.getItem(storageKey) || "[]");
      if (!Array.isArray(state.searchHistory)) state.searchHistory = [];
    } catch {
      state.searchHistory = [];
    }
  };

  const saveHistory = () => {
    localStorage.setItem(storageKey, JSON.stringify(state.searchHistory.slice(0, 10)));
  };

  const addHistory = (query) => {
    const q = query.trim();
    if (!q) return;
    state.searchHistory = [q, ...state.searchHistory.filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, 10);
    saveHistory();
    renderHistory();
  };

  const removeHistoryItem = (query) => {
    state.searchHistory = state.searchHistory.filter((x) => x !== query);
    saveHistory();
    renderHistory();
  };

  const clearHistory = () => {
    state.searchHistory = [];
    saveHistory();
    renderHistory();
  };

  const renderHistory = () => {
    if (!recentSearchList) return;

    if (!state.searchHistory.length) {
      recentSearchList.innerHTML = `
        <li class="search-fs__recent-item" style="justify-content:center; color:rgba(255,255,255,.45);">
          No recent searches yet
        </li>
      `;
      return;
    }

    recentSearchList.innerHTML = state.searchHistory
      .map(
        (q) => `
        <li class="search-fs__recent-item" data-query="${escapeHTML(q)}">
          <span class="search-fs__recent-icon" aria-hidden="true"></span>
          <span class="search-fs__recent-text">${escapeHTML(q)}</span>
          <button class="search-fs__recent-remove" type="button" aria-label="Remove this search" data-remove="${escapeHTML(q)}">
            <span class="search-fs__recent-remove-icon" aria-hidden="true"></span>
          </button>
        </li>
      `
      )
      .join("");
  };

  // =========================
  // SEARCH RESULTS
  // =========================
  const allSearchableItems = () => {
    const gameNames = gameItems.map((el) => ({
      type: "game",
      title: el.querySelector(".game-galaxy__label")?.textContent?.trim() || "",
      game: el.dataset.game || ""
    }));

    const productItems = [];
    Object.entries(state.productsByGame).forEach(([game, items]) => {
      items.forEach((item) => {
        productItems.push({
          type: "product",
          title: item.name,
          category: item.category,
          game
        });
      });
    });

    return [...gameNames, ...productItems];
  };

  const renderSearchResults = (query) => {
    if (!searchResults || !searchResultsList) return;

    const q = query.trim().toLowerCase();
    if (!q) {
      searchResults.setAttribute("hidden", "");
      searchResultsList.innerHTML = "";
      return;
    }

    const matches = allSearchableItems().filter((item) => {
      const title = (item.title || "").toLowerCase();
      const category = (item.category || "").toLowerCase();
      const game = (item.game || "").toLowerCase();
      return title.includes(q) || category.includes(q) || game.includes(q);
    });

    searchResults.removeAttribute("hidden");

    if (!matches.length) {
      searchResultsList.innerHTML = `
        <li class="search-fs__result-item" style="justify-content:center; color:rgba(255,255,255,.5);">
          No results found
        </li>
      `;
      return;
    }

    searchResultsList.innerHTML = matches.slice(0, 10).map((item) => `
      <li class="search-fs__result-item" data-search-pick="${escapeHTML(item.title)}">
        <span class="search-fs__recent-icon" aria-hidden="true"></span>
        <span class="search-fs__result-text">${escapeHTML(item.title)}</span>
        <span class="search-fs__link-arrow" aria-hidden="true"></span>
      </li>
    `).join("");
  };

  // =========================
  // MENU
  // =========================
  const openMenu = () => {
    if (!menuOverlay) return;
    menuOverlay.hidden = false;
    requestAnimationFrame(() => menuOverlay.classList.add("active"));
    lockScroll(true);
    menuTrigger?.setAttribute("aria-expanded", "true");
  };

  const closeMenu = () => {
    if (!menuOverlay) return;
    menuOverlay.classList.remove("active");
    menuTrigger?.setAttribute("aria-expanded", "false");
    window.setTimeout(() => {
      menuOverlay.hidden = true;
    }, 240);
    lockScroll(false);
  };

  menuTrigger?.addEventListener("click", openMenu);
  menuClose?.addEventListener("click", closeMenu);
  menuBackdrop?.addEventListener("click", closeMenu);
  menuOverlay?.addEventListener("click", (e) => {
    if (e.target === menuOverlay) closeMenu();
  });

  // Swipe left on drawer to close
  let menuTouchStartX = 0;
  let menuTouchCurrentX = 0;
  menuDrawer?.addEventListener(
    "touchstart",
    (e) => {
      menuTouchStartX = e.touches[0].clientX;
      menuTouchCurrentX = menuTouchStartX;
    },
    { passive: true }
  );

  menuDrawer?.addEventListener(
    "touchmove",
    (e) => {
      menuTouchCurrentX = e.touches[0].clientX;
      const delta = menuTouchStartX - menuTouchCurrentX;
      if (delta > 70) closeMenu();
    },
    { passive: true }
  );

  // =========================
  // SEARCH
  // =========================
  const openSearch = () => {
    if (!searchOverlay) return;
    searchOverlay.hidden = false;
    requestAnimationFrame(() => searchOverlay.classList.add("active"));
    lockScroll(true);
    searchTrigger?.setAttribute("aria-expanded", "true");
    window.setTimeout(() => searchInput?.focus(), 140);
    renderSearchResults(searchInput?.value || "");
  };

  const closeSearch = () => {
    if (!searchOverlay) return;
    searchOverlay.classList.remove("active");
    searchTrigger?.setAttribute("aria-expanded", "false");
    window.setTimeout(() => {
      searchOverlay.hidden = true;
    }, 240);
    lockScroll(false);
  };

  searchTrigger?.addEventListener("click", openSearch);
  searchClose?.addEventListener("click", closeSearch);
  searchOverlay?.addEventListener("click", (e) => {
    if (e.target === searchOverlay) closeSearch();
  });

  searchInput?.addEventListener("input", () => {
    searchInputClear.hidden = !searchInput.value.trim();
    renderSearchResults(searchInput.value);
  });

  searchInputClear?.addEventListener("click", () => {
    if (!searchInput) return;
    searchInput.value = "";
    searchInputClear.hidden = true;
    renderSearchResults("");
    searchInput.focus();
  });

  searchInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const value = searchInput.value.trim();
      if (!value) return;
      addHistory(value);
      renderSearchResults(value);
    }
    if (e.key === "Escape") closeSearch();
  });

  clearAllRecent?.addEventListener("click", clearHistory);

  recentSearchList?.addEventListener("click", (e) => {
    const removeBtn = e.target.closest("[data-remove]");
    const item = e.target.closest("[data-query]");
    if (removeBtn) {
      removeHistoryItem(removeBtn.dataset.remove || "");
      return;
    }
    if (item) {
      const query = item.dataset.query || "";
      if (!query) return;
      if (searchInput) {
        searchInput.value = query;
        searchInputClear.hidden = false;
      }
      addHistory(query);
      renderSearchResults(query);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });

  searchResultsList?.addEventListener("click", (e) => {
    const row = e.target.closest("[data-search-pick]");
    if (!row) return;
    const query = row.dataset.searchPick || "";
    if (!query) return;
    if (searchInput) {
      searchInput.value = query;
      searchInputClear.hidden = false;
    }
    addHistory(query);
    renderSearchResults(query);
  });

  $(".search-fs__tags")?.addEventListener("click", (e) => {
    const tag = e.target.closest(".search-fs__tag");
    if (!tag) return;
    e.preventDefault();
    const query = tag.dataset.query || tag.textContent || "";
    if (searchInput) {
      searchInput.value = query;
      searchInputClear.hidden = false;
    }
    addHistory(query);
    renderSearchResults(query);
  });

  // =========================
  // BANNER SYSTEM
  // =========================
  const updateBannerUI = (index, animateScroll = true) => {
    const total = bannerLines.length || 1;
    const clamped = ((index % total) + total) % total;
    state.bannerIndex = clamped;

    if (!bannerTrack) return;
    const width = bannerTrack.clientWidth || bannerViewport?.clientWidth || 1;
    if (animateScroll) {
      bannerTrack.scrollTo({ left: width * clamped, behavior: "smooth" });
    } else {
      bannerTrack.scrollLeft = width * clamped;
    }

    bannerLines.forEach((line, i) => {
      const active = i === clamped;
      line.classList.toggle("banner-stage__progress-line--active", active);
      line.setAttribute("aria-selected", active ? "true" : "false");
    });
  };

  const startBannerAuto = () => {
    stopBannerAuto();
    if (state.bannerPaused) return;
    state.bannerTimer = window.setInterval(() => {
      if (state.bannerPaused) return;
      updateBannerUI(state.bannerIndex + 1, true);
    }, 4000);
  };

  const stopBannerAuto = () => {
    if (state.bannerTimer) {
      clearInterval(state.bannerTimer);
      state.bannerTimer = null;
    }
  };

  const pauseBanner = () => {
    state.bannerPaused = true;
    stopBannerAuto();
  };

  const resumeBanner = () => {
    state.bannerPaused = false;
    startBannerAuto();
  };

  let bannerScrollRaf = null;
  const syncBannerFromScroll = () => {
    if (!bannerTrack) return;
    const width = bannerTrack.clientWidth || 1;
    const idx = Math.round(bannerTrack.scrollLeft / width);
    if (idx !== state.bannerIndex) {
      state.bannerIndex = idx;
      bannerLines.forEach((line, i) => {
        const active = i === idx;
        line.classList.toggle("banner-stage__progress-line--active", active);
        line.setAttribute("aria-selected", active ? "true" : "false");
      });
    }
  };

  bannerTrack?.addEventListener(
    "scroll",
    () => {
      if (bannerScrollRaf) cancelAnimationFrame(bannerScrollRaf);
      bannerScrollRaf = requestAnimationFrame(syncBannerFromScroll);
    },
    { passive: true }
  );

  bannerViewport?.addEventListener(
    "touchstart",
    pauseBanner,
    { passive: true }
  );

  bannerViewport?.addEventListener(
    "touchend",
    () => setTimeout(resumeBanner, 120),
    { passive: true }
  );

  bannerViewport?.addEventListener(
    "touchcancel",
    () => setTimeout(resumeBanner, 120),
    { passive: true }
  );

  bannerLines.forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.target || 0);
      updateBannerUI(idx, true);
      resumeBanner();
    });
  });

  // =========================
  // GAME RAIL + INDICATOR
  // =========================
  const positionIndicator = (el, smooth = true) => {
    if (!el || !gameRail || !indicator || !gameGalaxySection) return;

    const parentRect = gameGalaxySection.getBoundingClientRect();
    const rect = el.getBoundingClientRect();

    const targetX = rect.left - parentRect.left + gameRail.scrollLeft;
    const targetW = rect.width;

    indicator.style.width = `${targetW}px`;
    indicator.style.transform = `translateX(${targetX}px)`;

    if (!smooth) {
      indicator.style.transition = "none";
      requestAnimationFrame(() => {
        indicator.style.transition = "";
      });
    }

    state.indicatorX = targetX;
    state.indicatorW = targetW;
  };

  const setActiveGame = (el) => {
    if (!el) return;
    gameItems.forEach((item) => item.classList.remove("active"));
    el.classList.add("active");
    state.activeGame = el.dataset.game || null;
    positionIndicator(el, true);
    renderProducts(state.activeGame, state.activeFilter);
  };

  gameItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      setActiveGame(item);
      item.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    });
  });

  let railScrollRaf = null;
  gameRail?.addEventListener(
    "scroll",
    () => {
      if (railScrollRaf) cancelAnimationFrame(railScrollRaf);
      railScrollRaf = requestAnimationFrame(() => {
        const active = $(".game-galaxy__item.active") || gameItems[0];
        if (active) positionIndicator(active, false);
      });
    },
    { passive: true }
  );

  // =========================
  // PRODUCT STORE
  // =========================
  const getProductsForGame = (game) => {
    const base = state.productsByGame[game] || [];
    const external = window.PRODUCTS || window.NEXA_PRODUCTS || null;

    let list = base;

    if (Array.isArray(external) && external.length) {
      const matched = external.filter((p) => (p.game || p.id || "") === game);
      if (matched.length) list = matched;
    }

    return list;
  };

  const renderProducts = (game, filter = "all") => {
    if (!productGrid) return;

    const items = getProductsForGame(game).filter((item) => {
      if (filter === "all") return true;
      return (item.category || "").toLowerCase() === filter.replaceAll("-", " ").toLowerCase();
    });

    if (!items.length) {
      productGrid.innerHTML = `
        <article class="product-card" style="grid-column:1/-1; min-height:180px; place-content:center; text-align:center;">
          <div class="product-card__body" style="justify-items:center;">
            <h3 class="product-card__name">No items available</h3>
            <p class="product-card__category">
              This game will load products once data is added.
            </p>
          </div>
        </article>
      `;
      return;
    }

    productGrid.innerHTML = items.map((item) => {
      const safeName = escapeHTML(item.name || "Product");
      const safeCat = escapeHTML(item.category || "Category");
      const safePrice = escapeHTML(item.price || "₹0");
      const safeOriginal = escapeHTML(item.original || "");
      const safeDiscount = escapeHTML(item.discount || "");
      const safeRating = escapeHTML(item.rating || "4.8");
      const safeReviews = escapeHTML(item.reviews || "0");
      const img = escapeHTML(item.image || "assets/default.png");

      return `
        <article class="product-card" data-product-name="${safeName}">
          <div class="product-card__media">
            <img class="product-card__img" src="${img}" alt="${safeName}" width="160" height="160" loading="lazy" onerror="this.src='assets/default.png'">
            ${safeDiscount ? `<span class="product-card__discount">${safeDiscount}</span>` : ""}
          </div>
          <div class="product-card__body">
            <h3 class="product-card__name">${safeName}</h3>
            <p class="product-card__category">${safeCat}</p>
            <div class="product-card__pricing">
              <span class="product-card__price">${safePrice}</span>
              ${safeOriginal ? `<span class="product-card__price-original">${safeOriginal}</span>` : ""}
            </div>
            <div class="product-card__rating">
              <span class="product-card__stars">★ ${safeRating}</span>
              <span class="product-card__reviews">${safeReviews} reviews</span>
            </div>
          </div>
        </article>
      `;
    }).join("");
  };

  productFilters.forEach((btn) => {
    btn.addEventListener("click", () => {
      productFilters.forEach((b) => b.classList.remove("product-store__filter--active"));
      btn.classList.add("product-store__filter--active");
      state.activeFilter = btn.dataset.filter || "all";
      renderProducts(state.activeGame || gameItems[0]?.dataset.game || "free-fire", state.activeFilter);
    });
  });

  // =========================
  // BOTTOM NAV
  // =========================
  bottomNavItems.forEach((item) => {
    item.addEventListener("click", () => {
      bottomNavItems.forEach((i) => i.classList.remove("bottom-nav__item--active"));
      item.classList.add("bottom-nav__item--active");
    });
  });

  // =========================
  // RIPPLE + HAPTICS
  // =========================
  const rippleTargets =
    "button, a, .game-galaxy__item, .banner-stage__progress-line, .product-store__filter, .search-fs__tag, .search-fs__recent-remove, .search-fs__recent-item, .search-fs__result-item, .bottom-nav__item, .menu-nav__link, .menu-logout__btn";

  document.addEventListener("click", (e) => {
    const target = e.target.closest(rippleTargets);
    if (!target) return;

    if (navigator.vibrate) navigator.vibrate(15);

    const rect = target.getBoundingClientRect();
    const ripple = document.createElement("span");
    ripple.className = "ripple-effect";
    ripple.style.left = `${rect.left + rect.width / 2 - 50}px`;
    ripple.style.top = `${rect.top + rect.height / 2 - 50}px`;
    document.body.appendChild(ripple);
    window.setTimeout(() => ripple.remove(), 520);
  });

  // =========================
  // SCROLL BEHAVIOR
  // =========================
  let lastScrollY = window.scrollY;
  let scrollRaf = null;

  const handleScrollUI = () => {
    const y = window.scrollY;
    const goingDown = y > lastScrollY;

    // Header stays solid; subtle refinement only
    if (header) {
      header.style.background = "rgba(10,10,10,.965)";
      header.style.borderBottomColor = y > 8 ? "rgba(255,255,255,.08)" : "rgba(255,255,255,.06)";
    }

    // Optional search bar behavior if a search container exists in this HTML variant
    if (searchBar) {
      searchBar.style.opacity = goingDown && y > 80 ? "0" : "1";
      searchBar.style.transform = goingDown && y > 80 ? "translateY(-8px)" : "translateY(0)";
      searchBar.style.pointerEvents = goingDown && y > 80 ? "none" : "auto";
    }

    if (gameGalaxySection) {
      gameGalaxySection.style.opacity = y > 160 ? "0.96" : "1";
    }

    lastScrollY = y;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (scrollRaf) cancelAnimationFrame(scrollRaf);
      scrollRaf = requestAnimationFrame(handleScrollUI);
    },
    { passive: true }
  );

  // =========================
  // GLOBAL KEYS / OVERLAY CLOSE
  // =========================
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (searchOverlay && !searchOverlay.hidden) closeSearch();
      if (menuOverlay && !menuOverlay.hidden) closeMenu();
    }
  });

  // =========================
  // INITIAL BOOT
  // =========================
  loadHistory();
  renderHistory();

  // default state
  const firstGame = gameItems[0];
  if (firstGame) {
    firstGame.classList.add("active");
    state.activeGame = firstGame.dataset.game || "free-fire";
    renderProducts(state.activeGame, state.activeFilter);
    requestAnimationFrame(() => positionIndicator(firstGame, false));
  }

  if (bannerLines.length) {
    updateBannerUI(0, false);
    startBannerAuto();
  }

  // keep indicator synced on resize
  window.addEventListener("resize", () => {
    const active = $(".game-galaxy__item.active") || gameItems[0];
    if (active) positionIndicator(active, false);
    const width = bannerTrack?.clientWidth || 1;
    if (bannerTrack) bannerTrack.scrollLeft = width * state.bannerIndex;
  });
});
