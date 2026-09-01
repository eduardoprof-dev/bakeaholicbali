window.BakeaholicAccountCommon = (() => {
  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function request(appMode, path, options = {}) {
    return fetch(path, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-App-Mode": appMode
      },
      ...options
    }).then(async (response) => {
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        const error = new Error(payload.error || `Request failed: ${response.status}`);
        error.status = response.status;
        throw error;
      }
      return response.json();
    });
  }

  async function logoutSession(appMode) {
    try {
      await request(appMode, "/api/session/logout", { method: "POST" });
    } catch (_error) {
      // Ignore logout failures and still clear local browser state.
    }
  }

  function loadDraft(draftKey, fallback) {
    try {
      return JSON.parse(localStorage.getItem(draftKey) || "null") || fallback;
    } catch (_error) {
      return fallback;
    }
  }

  function customerFullName(draft) {
    return [draft?.customer?.firstName, draft?.customer?.lastName].filter(Boolean).join(" ")
      || draft?.customer?.name
      || "Your account";
  }

  function accountInitials(draft) {
    return String(draft?.customer?.firstName || draft?.customer?.name || "U")
      .trim()
      .slice(0, 2)
      .toUpperCase() || "U";
  }

  function bindAccountMenu({
    draft,
    draftKey,
    modeQuery,
    accountBadge,
    accountMenu,
    accountMenuName,
    accountMenuPhone,
    accountMenuEmail,
    accountSummaryButton,
    accountOrderHistoryLink,
    accountAddressesLink,
    accountLogoutButton,
    onSummary
  }) {
    function closeMenu() {
      accountMenu.hidden = true;
    }

    function openMenu() {
      accountMenuName.textContent = customerFullName(draft);
      accountMenuPhone.textContent = draft?.customer?.phone || "";
      accountMenuEmail.textContent = draft?.customer?.email || "";
      accountOrderHistoryLink.href = `/orders.html${modeQuery}`;
      accountAddressesLink.href = `/addresses.html${modeQuery}`;
      accountMenu.hidden = false;
    }

    accountBadge.textContent = accountInitials(draft);

    accountSummaryButton?.addEventListener("click", (event) => {
      event.stopPropagation();
      closeMenu();
      onSummary?.();
    });

    accountBadge?.addEventListener("click", (event) => {
      event.stopPropagation();
      accountMenu.hidden ? openMenu() : closeMenu();
    });

    accountMenu?.addEventListener("click", (event) => {
      event.stopPropagation();
    });

    accountLogoutButton?.addEventListener("click", (event) => {
      event.stopPropagation();
      logoutSession(modeQuery === "?mode=test" ? "test" : "live").finally(() => {
        localStorage.removeItem(draftKey);
        closeMenu();
        window.location.href = `/index.html${modeQuery}`;
      });
    });

    document.addEventListener("click", (event) => {
      if (accountMenu.hidden) return;
      if (accountMenu.contains(event.target) || accountBadge?.contains(event.target)) return;
      closeMenu();
    });

    return { openMenu, closeMenu };
  }

  return {
    escapeHtml,
    request,
    logoutSession,
    loadDraft,
    customerFullName,
    accountInitials,
    bindAccountMenu
  };
})();
