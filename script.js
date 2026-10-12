const menuToggle = document.querySelector("#menuToggle");
const mobileNav = document.querySelector("#mobileNav");
const toast = document.querySelector("#toast");
const billingButtons = document.querySelectorAll(".billing-option");
const prices = document.querySelectorAll(".price strong");
const billingNotes = document.querySelectorAll(".billing-note");

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => toast.classList.remove("show"), 3000);
}

// Abre e fecha o menu em telas pequenas.
menuToggle.addEventListener("click", () => {
  const isOpen = mobileNav.classList.toggle("open");
  menuToggle.classList.toggle("open", isOpen);
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Fechar menu" : "Abrir menu");
});

// Fecha o menu depois que a pessoa escolhe uma seção.
mobileNav.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", () => {
    mobileNav.classList.remove("open");
    menuToggle.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Abrir menu");
  });
});

// Troca os valores demonstrativos entre cobrança mensal e anual.
billingButtons.forEach(button => {
  button.addEventListener("click", () => {
    const annual = button.dataset.period === "anual";

    billingButtons.forEach(option => {
      const selected = option === button;
      option.classList.toggle("selected", selected);
      option.setAttribute("aria-pressed", String(selected));
    });

    prices.forEach(price => {
      price.textContent = annual ? price.dataset.yearly : price.dataset.monthly;
    });

    billingNotes.forEach(note => {
      note.textContent = annual
        ? "Valor mensal equivalente no plano anual"
        : "Cobrado mensalmente";
    });
  });
});

// Os botões de plano exibem uma mensagem de demonstração.
document.querySelectorAll(".choose-plan").forEach(button => {
  button.addEventListener("click", () => {
    const plan = button.dataset.plan;
    showToast(`Você selecionou o plano ${plan}. Personalize aqui o próximo passo!`);
  });
});

// O formulário demonstra validação, mas não envia dados para um servidor.
document.querySelector("#contactForm").addEventListener("submit", event => {
  event.preventDefault();
  const email = document.querySelector("#email");
  if (!email.checkValidity()) {
    email.reportValidity();
    return;
  }
  document.querySelector("#formMessage").textContent =
    "Formulário demonstrativo: conecte um serviço de envio para receber mensagens.";
  showToast("Tudo certo! O formulário ainda precisa de um serviço de envio.");
});

document.querySelector("#year").textContent = new Date().getFullYear();
