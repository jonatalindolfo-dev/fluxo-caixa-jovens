// ================================
// Fluxo de Caixa - Jovens + Conectados
// Frontend compatível com GitHub Pages
// ================================

const API_URL = "https://script.google.com/macros/s/AKfycbwqL_14oW1DmPnl5Z_r3SoitfAKXqeYA0ox1irlQwpLCyOe61iCJ3vL0P0H8kBjJpkUDQ/exec";

// ELEMENTOS
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

let lancamentosCache = [];

// DATA DE HOJE
elData.value = new Date().toISOString().slice(0, 10);

// UTIL
function formatarMoeda(v) {
  return Number(v || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function periodoSelecionado() {
  return `${elAnoSelecionado.value}-${elMesSelecionado.value}`;
}

function setTextoMoeda(el, v) {
  el.textContent = formatarMoeda(v).replace("R$", "").trim();
}

function aplicarCorNegativo(el, v) {
  el.classList.remove("valor-negativo");
  if (Number(v) < 0) el.classList.add("valor-negativo");
}

// MÊS / ANO
function inicializarMesEAno() {
  const hoje = new Date();
  elMesSelecionado.value = String(hoje.getMonth() + 1).padStart(2, "0");

  const anoAtual = hoje.getFullYear();
  elAnoSelecionado.innerHTML = "";

  for (let a = anoAtual - 2; a <= anoAtual + 2; a++) {
    const o = document.createElement("option");
    o.value = a;
    o.textContent = a;
    if (a === anoAtual) o.selected = true;
    elAnoSelecionado.appendChild(o);
  }
}

// API
async function apiGetLancamentos() {
  const r = await fetch(API_URL);
  return await r.json();
}

async function apiAddLancamento(l) {
  const params = new URLSearchParams({
    action: "add",
    id: l.id,
    data: l.data,
    tipo: l.tipo,
    valor: l.valor,
    descricao: l.descricao,
  });

  const r = await fetch(`${API_URL}?${params.toString()}`);
  const txt = await r.text();

  if (!txt.includes("OK")) throw new Error("Erro ao salvar");
}

// LÓGICA
async function carregarLancamentos() {
  lancamentosCache = await apiGetLancamentos();
}

async function adicionarLancamento() {
  const valor = Number(elValor.value);
  if (!valor || valor <= 0) return alert("Valor inválido");

  const novo = {
    id: Date.now(),
    tipo: elTipo.value,
    valor,
    data: elData.value,
    descricao: elDescricao.value.trim() || "(sem descrição)",
  };

  btnAdicionar.disabled = true;
  btnAdicionar.textContent = "SALVANDO...";

  try {
    await apiAddLancamento(novo);
    elValor.value = "";
    elDescricao.value = "";
    await renderizarTudo();
  } catch {
    alert("Erro ao salvar na planilha");
  } finally {
    btnAdicionar.disabled = false;
    btnAdicionar.textContent = "ADICIONAR";
  }
}

function renderizarResumo() {
  const alvo = periodoSelecionado();
  let saldo = 0, ent = 0, sai = 0, ren = 0;

  lancamentosCache.forEach(l => {
    if (l.tipo === "entrada" || l.tipo === "rendimento") saldo += l.valor;
    if (l.tipo === "saida") saldo -= l.valor;

    if (l.data.startsWith(alvo)) {
      if (l.tipo === "entrada") ent += l.valor;
      if (l.tipo === "saida") sai += l.valor;
      if (l.tipo === "rendimento") ren += l.valor;
    }
  });

  const res = ent + ren - sai;

  setTextoMoeda(elSaldo, saldo);
  setTextoMoeda(elEntradas, ent);
  setTextoMoeda(elSaidas, sai);
  setTextoMoeda(elRendimentos, ren);
  setTextoMoeda(elResultadoMes, res);

  aplicarCorNegativo(elSaldo, saldo);
  aplicarCorNegativo(elResultadoMes, res);
}

function renderizarLista() {
  const alvo = periodoSelecionado();
  elLista.innerHTML = "";

  const lista = lancamentosCache.filter(l => l.data.startsWith(alvo));

  if (!lista.length) {
    elLista.innerHTML = "<li>Nenhum lançamento</li>";
    return;
  }

  lista.sort((a, b) => b.data.localeCompare(a.data));

  lista.forEach(l => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span>${l.data} • ${l.tipo.toUpperCase()} • ${formatarMoeda(l.valor)} • ${l.descricao}</span>
    `;
    elLista.appendChild(li);
  });
}

async function renderizarTudo() {
  await carregarLancamentos();
  renderizarResumo();
  renderizarLista();
}

// EVENTOS
btnAdicionar.addEventListener("click", adicionarLancamento);
elMesSelecionado.addEventListener("change", renderizarTudo);
elAnoSelecionado.addEventListener("change", renderizarTudo);

// START
inicializarMesEAno();
renderizarTudo();
