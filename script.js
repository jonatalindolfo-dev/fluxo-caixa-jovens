const API_URL = "https://script.google.com/macros/s/AKfycbwqL_14oW1DmPnl5Z_r3SoitfAKXqeYA0ox1irlQwpLCyOe61iCJ3vL0P0H8kBjJpkUDQ/exec";

const SENHA_ACESSO = "Esqueciasenha123*";

let lancamentos = [];

document.addEventListener("DOMContentLoaded", () => {
  const loginTela = document.getElementById("loginTela");
  const app = document.getElementById("appConteudo");
  const senhaInput = document.getElementById("senhaInput");
  const erroSenha = document.getElementById("erroSenha");
  const toggleSenha = document.getElementById("toggleSenha");

  const btnLogin = document.getElementById("btnLogin");
  const btnLogout = document.getElementById("btnLogout");

  const elSaldo = document.getElementById("saldo");
  const elEntradas = document.getElementById("entradas");
  const elSaidas = document.getElementById("saidas");
  const elRendimentos = document.getElementById("rendimentos");
  const elResultadoMes = document.getElementById("resultadoMes");

  const elLista = document.getElementById("lista");

  const elTipo = document.getElementById("tipo");
  const elValor = document.getElementById("valor");
  const elData = document.getElementById("data");
  const elDescricao = document.getElementById("descricao");

  const btnAdicionar = document.getElementById("btnAdicionar");

  const elMesSelecionado = document.getElementById("mesSelecionado");
  const elAnoSelecionado = document.getElementById("anoSelecionado");

  elData.value = new Date().toISOString().slice(0, 10);

  // ================================
  // UTIL
  // ================================
  function formatar(v) {
    return Number(v || 0)
      .toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
      .replace("R$", "")
      .trim();
  }

  function periodo() {
    return `${elAnoSelecionado.value}-${elMesSelecionado.value}`;
  }

  function formatarData(data) {
    if (!data) return "";
    const d = new Date(data);
    if (Number.isNaN(d.getTime())) return data;
    return d.toLocaleDateString("pt-BR");
  }

  function liberarAcesso() {
    loginTela.style.display = "none";
    app.style.display = "block";

    setTimeout(() => {
      app.classList.add("ativo");
    }, 50);
  }

  // ================================
  // LOGIN
  // ================================
  btnLogin.onclick = () => {
    if (senhaInput.value === SENHA_ACESSO) {
      localStorage.setItem("acesso_fluxo", "ok");
      liberarAcesso();
      init();
    } else {
      erroSenha.style.display = "block";
    }
  };

  senhaInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      btnLogin.click();
    }
  });

  senhaInput.addEventListener("input", () => {
    erroSenha.style.display = "none";
  });

  if (toggleSenha) {
    toggleSenha.onclick = () => {
      if (senhaInput.type === "password") {
        senhaInput.type = "text";
        toggleSenha.textContent = "🙈";
      } else {
        senhaInput.type = "password";
        toggleSenha.textContent = "👁";
      }
    };
  }

  btnLogout.onclick = () => {
    localStorage.removeItem("acesso_fluxo");
    location.reload();
  };

  if (localStorage.getItem("acesso_fluxo") === "ok") {
    liberarAcesso();
    init();
  }

  // ================================
  // FORMATAÇÃO DO VALOR EM R$
  // ================================
  elValor.addEventListener("input", () => {
    let v = elValor.value.replace(/\D/g, "");

    if (!v) {
      elValor.value = "";
      return;
    }

    v = (Number(v) / 100).toFixed(2) + "";
    v = v.replace(".", ",");
    v = v.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

    elValor.value = v;
  });

  // ================================
  // API
  // ================================
  async function carregar() {
    const r = await fetch(API_URL);
    lancamentos = await r.json();
  }

  async function salvar(l) {
    const p = new URLSearchParams({ action: "add", ...l });
    await fetch(`${API_URL}?${p.toString()}`);
  }

  async function excluir(id) {
    const p = new URLSearchParams({ action: "delete", id });
    await fetch(`${API_URL}?${p.toString()}`);
  }

  // ================================
  // RENDER
  // ================================
  function render() {
    let saldo = 0,
      ent = 0,
      sai = 0,
      ren = 0;

    const alvo = periodo();

    elLista.innerHTML = "";

    lancamentos.forEach((l) => {
      const valorNumerico = Number(l.valor) || 0;

      if (l.tipo === "saida") saldo -= valorNumerico;
      else saldo += valorNumerico;

      if (String(l.data).startsWith(alvo)) {
        if (l.tipo === "entrada") ent += valorNumerico;
        if (l.tipo === "saida") sai += valorNumerico;
        if (l.tipo === "rendimento") ren += valorNumerico;

        const li = document.createElement("li");

        li.innerHTML = `
          <span>${formatarData(l.data)} • ${String(l.tipo).toUpperCase()} • ${formatar(valorNumerico)} • ${l.descricao}</span>
          <button class="btn-excluir" data-id="${l.id}">Excluir</button>
        `;

        elLista.appendChild(li);
      }
    });

    elSaldo.textContent = formatar(saldo);
    elEntradas.textContent = formatar(ent);
    elSaidas.textContent = formatar(sai);
    elRendimentos.textContent = formatar(ren);
    elResultadoMes.textContent = formatar(ent + ren - sai);
  }

  // ================================
  // AÇÕES
  // ================================
  btnAdicionar.onclick = async () => {
    const valorConvertido = Number(
      elValor.value.replace(/\./g, "").replace(",", ".")
    );

    const l = {
      id: Date.now(),
      tipo: elTipo.value,
      valor: valorConvertido,
      data: elData.value,
      descricao: elDescricao.value || "(sem descrição)",
    };

    if (!l.valor || l.valor <= 0) {
      alert("Digite um valor válido.");
      return;
    }

    if (!l.data) {
      alert("Selecione uma data.");
      return;
    }

    btnAdicionar.disabled = true;
    btnAdicionar.textContent = "Salvando...";

    try {
      await salvar(l);
      lancamentos.push(l);

      elValor.value = "";
      elDescricao.value = "";

      render();
    } finally {
      btnAdicionar.disabled = false;
      btnAdicionar.textContent = "Adicionar";
    }
  };

  elLista.onclick = async (e) => {
    if (e.target.classList.contains("btn-excluir")) {
      const id = e.target.dataset.id;

      if (confirm("Excluir lançamento?")) {
        await excluir(id);

        lancamentos = lancamentos.filter((l) => String(l.id) !== String(id));

        render();
      }
    }
  };

  // ================================
  // INIT
  // ================================
  async function init() {
    const d = new Date();

    elMesSelecionado.value = String(d.getMonth() + 1).padStart(2, "0");

    elAnoSelecionado.innerHTML = `<option>${d.getFullYear()}</option>`;

    await carregar();
    render();
  }

  elMesSelecionado.onchange = async () => {
    await carregar();
    render();
  };

  elAnoSelecionado.onchange = async () => {
    await carregar();
    render();
  };
});
