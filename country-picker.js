(function () {
  function enhance(select, phoneInput) {
    if (!select || select.dataset.enhanced === "true") return;
    select.dataset.enhanced = "true";
    select.hidden = true;

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "country-picker-trigger";
    trigger.setAttribute("aria-label", "Choose country code");

    const panel = document.createElement("section");
    panel.className = "country-picker-panel";
    panel.hidden = true;
    panel.setAttribute("aria-label", "Choose your country");
    panel.innerHTML = `
      <div class="country-picker-head">
        <strong>Choose your country</strong>
        <button type="button" class="country-picker-close" aria-label="Close country picker">×</button>
      </div>
      <input class="country-picker-search" type="search" inputmode="search" autocomplete="off" placeholder="Search country or code" aria-label="Search country or calling code">
      <div class="country-picker-list" role="listbox"></div>
    `;
    select.parentNode.insertBefore(trigger, select);
    document.body.appendChild(panel);

    const search = panel.querySelector(".country-picker-search");
    const list = panel.querySelector(".country-picker-list");
    const updateTrigger = () => {
      const option = select.selectedOptions[0] || select.options[0];
      trigger.textContent = option?.textContent || "🇮🇩 +62";
    };
    const close = () => {
      panel.hidden = true;
      search.value = "";
      phoneInput?.focus();
    };
    const render = () => {
      const query = search.value.trim().toLowerCase();
      const matches = Array.from(select.options).filter((option) => {
        const searchable = `${option.dataset.countryName || ""} ${option.textContent} +${option.value}`.toLowerCase();
        return !query || searchable.includes(query);
      });
      list.replaceChildren(...matches.map((option) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "country-picker-option";
        button.setAttribute("role", "option");
        button.setAttribute("aria-selected", String(option.selected));
        button.innerHTML = `<span>${option.dataset.flag || ""} ${option.dataset.countryName || ""}</span><strong>+${option.value}</strong>`;
        button.addEventListener("click", () => {
          Array.from(select.options).forEach((candidate) => {
            candidate.selected = candidate === option;
          });
          select.dispatchEvent(new Event("change", { bubbles: true }));
          updateTrigger();
          close();
        });
        return button;
      }));
    };

    trigger.addEventListener("click", () => {
      panel.hidden = false;
      render();
      search.focus();
    });
    panel.querySelector(".country-picker-close").addEventListener("click", close);
    search.addEventListener("input", render);
    updateTrigger();
  }

  window.BakeaholicCountryPicker = { enhance };
})();
