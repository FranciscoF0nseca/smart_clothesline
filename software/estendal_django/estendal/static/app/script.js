/* ===============================
   MODAIS – ADICIONAR DISPOSITIVO
================================ */

const CURRENT_SERIAL = window.CURRENT_SERIAL || "SCL-1234";

document.addEventListener("DOMContentLoaded", () => {
  const btnAdd = document.getElementById("btnAddDevice");
  const modal = document.getElementById("modal-add-device");

  if (btnAdd && modal) {
    btnAdd.addEventListener("click", () => {
      modal.classList.remove("hidden");
      modal.classList.add("flex");
    });
  }

  document.querySelectorAll("[data-close]").forEach(btn => {
    btn.addEventListener("click", () => {
      btn.closest(".modal-backdrop")?.classList.add("hidden");
    });
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("modal-add-device");
  const btnAdd = document.getElementById("btnAddDevice");
  const btnCancel = document.getElementById("btnCancelAddDevice");
  const btnConfirm = document.getElementById("btnConfirmAddDevice");
  const errorBox = document.getElementById("device-add-error");

  if (!modal) return;

  if (btnAdd) {
    btnAdd.addEventListener("click", () => {
      modal.classList.remove("hidden");
      modal.classList.add("flex");
      errorBox.classList.add("hidden");
    });
  }

  btnCancel.addEventListener("click", () => {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  });

  btnConfirm.addEventListener("click", async () => {
    errorBox.classList.add("hidden");

    const name = document.getElementById("deviceName").value.trim();
    const pairingCode = document.getElementById("pairingCode").value.trim();
    const serialNumber = document.getElementById("serialNumberPreview").value.trim();
    const location = document.getElementById("local").value.trim();

    if (!pairingCode || !serialNumber) {
      showError("Código de emparelhamento inválido.");
      return;
    }

    try {
      const response = await fetch("/api/pair/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCSRFToken(),
        },
        body: JSON.stringify({
          serial_number: serialNumber,
          pairing_code: pairingCode,
          name: name,
          location: location,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        showError(data.error || "Erro ao emparelhar dispositivo.");
        return;
      }

      window.location.reload();

    } catch {
      showError("Erro de comunicação com o servidor.");
    }
  });

  function showError(msg) {
    errorBox.innerText = msg;
    errorBox.classList.remove("hidden");
  }

  function getCSRFToken() {
    return document
      .querySelector('meta[name="csrf-token"]')
      ?.getAttribute("content");
  }
});


/* ===============================
   CONTROLO DO ESTENDAL
================================ */

document.addEventListener("DOMContentLoaded", () => {
  const btnOpen = document.getElementById("btn-open");
  const btnClose = document.getElementById("btn-close");
  const statusText = document.getElementById("clothesline-status-text");
  const iconWrapper = document.getElementById("clothesline-icon-wrapper");

  if (!btnOpen || !btnClose) return;

  btnOpen.addEventListener("click", () => sendControl("open"));
  btnClose.addEventListener("click", () => sendControl("close"));

    async function sendControl(action) {
      btnOpen.disabled = true;
      btnClose.disabled = true;
      statusText.innerText = "A atualizar...";

      try {
        const response = await fetch("/api/control/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCSRFToken(),
          },
          body: JSON.stringify({
            serial_number: CURRENT_SERIAL,
            action: action
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.ok) {
          throw new Error(data.error);
        }

        applyState(data.state);

      } catch (err) {
        statusText.innerText = "Erro de comunicação";
        console.error(err);
      } finally {
        btnOpen.disabled = false;
        btnClose.disabled = false;
      }
    }

  function applyState(state) {
    if (state === "extended") {
      statusText.innerText = "Aberto";
      iconWrapper.className =
        "h-20 w-20 rounded-3xl flex items-center justify-center text-white shadow-lg bg-emerald-500";
    } else if (state === "retracted") {
      statusText.innerText = "Fechado";
      iconWrapper.className =
        "h-20 w-20 rounded-3xl flex items-center justify-center text-white shadow-lg bg-slate-400";
    } else {
      statusText.innerText = "---";
    }
  }

  function getCSRFToken() {
    return document
      .querySelector('meta[name="csrf-token"]')
      ?.getAttribute("content");
  }
});


/* ===============================
   METEOROLOGIA – IPMA
================================ */

document.addEventListener("DOMContentLoaded", () => {

  const IPMA_CITIES = {
    "Lisboa": 1110600,
    "Porto": 1131200,
    "Aveiro": 1010500,
    "Coimbra": 1060300,
    "Faro": 1080500,
    "Viseu": 1182300,
    "Braga": 1030300,
    "Guarda": 1090700,
    "Funchal": 2310300,
    "Ponta Delgada": 2420300,
  };

  const windMap = {
    1: "Fraco",
    2: "Moderado",
    3: "Forte",
    4: "Muito forte",
    5: "Tempestade",
  };

  /* Widget meteorológica (cidade selecionada) */
  async function loadWeather(cityName) {
    const cityId = IPMA_CITIES[cityName];
    if (!cityId) return;

    try {
      const res = await fetch(
        `https://api.ipma.pt/open-data/forecast/meteorology/cities/daily/${cityId}.json`
      );
      const data = await res.json();
      const today = data.data[0];

      document.getElementById("weather-temp").innerText = `${today.tMax}°C`;
      document.getElementById("weather-precip").innerText = `${today.precipitaProb}%`;
      document.getElementById("weather-wind").innerText =
        windMap[today.classWindSpeed] || "—";
      document.getElementById("weather-condition").innerText =
        today.predWindDir || "—";
      document.getElementById("weather-city-label").innerText =
        `${cityName}, Portugal`;

    } catch (err) {
      console.error("Erro IPMA:", err);
    }
  }

  /* Vento fixo do estendal – SEMPRE VISEU */
  async function loadEstendalWind() {
    const VISEU_ID = 1182300;

    try {
      const res = await fetch(
        `https://api.ipma.pt/open-data/forecast/meteorology/cities/daily/${VISEU_ID}.json`
      );
      const data = await res.json();
      const today = data.data[0];

      document.getElementById("weather-wind-estendal").innerText =
        windMap[today.classWindSpeed] || "—";

    } catch (err) {
      console.error("Erro IPMA (Viseu):", err);
      document.getElementById("weather-wind-estendal").innerText = "—";
    }
  }

  const citySelect = document.getElementById("weather-city-select");

  if (citySelect) {
    loadWeather(citySelect.value);
    citySelect.addEventListener("change", () => {
      loadWeather(citySelect.value);
    });
  }

  loadEstendalWind();
  setInterval(loadEstendalWind, 10 * 60 * 1000);

  lucide.createIcons();
});


/* ===============================
   MODAL METEOROLOGIA
================================ */

const expandBtn = document.getElementById("weather-expand-btn");
const weatherModal = document.getElementById("modal-weather");

if (expandBtn && weatherModal) {
  expandBtn.addEventListener("click", () => {
    weatherModal.classList.remove("hidden");
    weatherModal.classList.add("flex");
  });
}


/* ===============================
   MODAL DISPOSITIVO
================================ */

document.addEventListener("DOMContentLoaded", () => {
  const openBtn = document.querySelector("[data-open-device-modal]");
  const modal = document.getElementById("device-modal");
  const closeBtn = modal?.querySelector("[data-close-device-modal]");

  if (!openBtn || !modal) return;

  if (window.location.pathname.startsWith("/definicoes")) return;

  const openModal = () => {
    modal.classList.remove("hidden");
    modal.classList.add("flex");
  };

  const closeModal = () => {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  };

  openBtn.addEventListener("click", openModal);
  closeBtn?.addEventListener("click", closeModal);

  modal.addEventListener("click", e => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") closeModal();
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const card = document.getElementById("dryingrack-card");
  const modal = document.getElementById("modal-deactivate");
  const cancelBtn = document.getElementById("cancel-deactivate");
  const confirmBtn = document.getElementById("confirm-deactivate");

  if (!card || !modal) {
    console.warn("Card ou modal não encontrado");
    return;
  }

  card.addEventListener("click", () => {
    modal.classList.remove("hidden");
    modal.classList.add("flex");
  });

  cancelBtn?.addEventListener("click", () => {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  });

  confirmBtn?.addEventListener("click", async () => {
    const res = await fetch("/api/dryingrack/deactivate/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCSRFToken(),
      },
      body: JSON.stringify({ id: DRYINGRACK_ID }),
    });

    const data = await res.json();

    if (data.ok) {
      window.location.reload();
    } else {
      alert(data.error || "Erro ao desativar estendal");
    }
  });
});

function getCSRFToken() {
  return document
    .querySelector('meta[name="csrf-token"]')
    ?.getAttribute("content");
}

async function refreshClotheslineState() {
  try {
    const res = await fetch(
      `/api/device/state/?serial_number=${CURRENT_SERIAL}`
    );
    const data = await res.json();

    if (!data.ok) return;

    applyState(data.clothesline_state);

    const autoToggle = document.getElementById("auto-toggle");
    if (autoToggle) {
      autoToggle.checked = data.automatic;
    }

  } catch (err) {
    console.error("Erro ao ler estado:", err);
  }
}
  function handleOpenDeviceModal() {
    // Fecha a sidebar se estiver aberta (mobile)
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebarOverlay");

    if (sidebar && overlay && !overlay.classList.contains("hidden")) {
      sidebar.classList.add("-translate-x-full");
      overlay.classList.add("hidden");
      document.body.classList.remove("overflow-hidden");
    }

    // Abre o modal do estendal
    const modal = document.getElementById("device-modal");
    if (modal) {
      modal.classList.remove("hidden");
      modal.classList.add("flex");
    }
  }

