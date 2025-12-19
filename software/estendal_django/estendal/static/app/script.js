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

  // Abrir modal
  if (btnAdd) {
    btnAdd.addEventListener("click", () => {
      modal.classList.remove("hidden");
      modal.classList.add("flex");
      errorBox.classList.add("hidden");
    });
  }

  // Fechar modal (Cancelar)
  btnCancel.addEventListener("click", () => {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  });

  // Submeter pairing
  btnConfirm.addEventListener("click", async () => {
    errorBox.classList.add("hidden");

    const name = document.getElementById("deviceName").value.trim();
    const pairingCode = document.getElementById("pairingCode").value.trim();
    const serialNumber = document
      .getElementById("serialNumberPreview")
      .value
      .trim();


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
          location: "",
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        showError(data.error || "Erro ao emparelhar dispositivo.");
        return;
      }

      // Sucesso → recarrega dashboard
      window.location.reload();

    } catch (err) {
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
      .getAttribute("content");
  }
});
document.addEventListener("DOMContentLoaded", () => {
  const btnOpen = document.getElementById("btn-open");
  const btnClose = document.getElementById("btn-close");
  const statusText = document.getElementById("clothesline-status-text");
  const iconWrapper = document.getElementById("clothesline-icon-wrapper");

  if (!btnOpen || !btnClose) return;

  btnOpen.addEventListener("click", () => sendControl("open"));
  btnClose.addEventListener("click", () => sendControl("close"));

  async function sendControl(action) {
    // feedback imediato
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
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Erro ao controlar estendal");
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
      .getAttribute("content");
  }
});

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

  async function loadWeather(cityName) {
    const cityId = IPMA_CITIES[cityName];
    if (!cityId) return;

    try {
      const res = await fetch(
        `https://api.ipma.pt/open-data/forecast/meteorology/cities/daily/${cityId}.json`
      );
      const data = await res.json();
      const today = data.data[0];

      document.getElementById("weather-temp").innerText =
        `${today.tMax}°C`;

      document.getElementById("weather-precip").innerText =
        `${today.precipitaProb}%`;

      document.getElementById("weather-wind").innerText =
        windMap[today.classWindSpeed] || "—";

      document.getElementById("weather-wind-estendal").innerText =
        windMap[today.classWindSpeed] || "—";

      document.getElementById("weather-condition").innerText =
        today.predWindDir || "—";

      document.getElementById("weather-city-label").innerText =
        `${cityName}, Portugal`;

    } catch (err) {
      console.error("Erro IPMA:", err);
    }
  }

  const citySelect = document.getElementById("weather-city-select");

  if (citySelect) {
    loadWeather(citySelect.value);

    citySelect.addEventListener("change", () => {
      loadWeather(citySelect.value);
    });
  }

  // Inicializar ícones
  lucide.createIcons();
});

const expandBtn = document.getElementById("weather-expand-btn");
const weatherModal = document.getElementById("modal-weather");

if (expandBtn && weatherModal) {
  expandBtn.addEventListener("click", () => {
    weatherModal.classList.remove("hidden");
    weatherModal.classList.add("flex");
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const openBtn = document.querySelector("[data-open-device-modal]");
  const modal = document.getElementById("device-modal");
  const closeBtn = modal?.querySelector("[data-close-device-modal]");

  if (!openBtn || !modal) return;

  // NÃO abrir o modal na página Definições
  if (window.location.pathname.startsWith("/definicoes")) {
    return;
  }

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

  // Clicar fora fecha
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  // ESC fecha
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });
});

