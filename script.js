const CHAVE_STORAGE="fluxoJovemLancamentos";

const elSaldo=document.getElementById("saldo");
const elEntradas=document.getElementById("entradas");
const elSaidas=document.getElementById("saidas");
const elRendimentos=document.getElementById("rendimentos");
const elResultadoMes=document.getElementById("resultadoMes");
const elLista=document.getElementById("lista");

const elTipo=document.getElementById("tipo");
const elValor=document.getElementById("valor");
const elData=document.getElementById("data");
const elDescricao=document.getElementById("descricao");
const btnAdicionar=document.getElementById("btnAdicionar");

const elMes=document.getElementById("mesSelecionado");
const elAno=document.getElementById("anoSelecionado");

document.getElementById("btnExportarCSV").onclick=exportarCSV;
document.getElementById("btnExportarPDF").onclick=()=>window.print();

elData.value=new Date().toISOString().slice(0,10);

function formatar(v){return v.toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}
function ler(){return JSON.parse(localStorage.getItem(CHAVE_STORAGE)||"[]")}
function salvar(l){localStorage.setItem(CHAVE_STORAGE,JSON.stringify(l))}
function periodo(){return `${elAno.value}-${elMes.value}`}

(function(){
  const h=new Date();
  elMes.value=String(h.getMonth()+1).padStart(2,"0");
  for(let a=h.getFullYear()-2;a<=h.getFullYear()+2;a++){
    const o=document.createElement("option");
    o.value=a;o.textContent=a;
    if(a===h.getFullYear())o.selected=true;
    elAno.appendChild(o);
  }
})();

btnAdicionar.onclick=()=>{
  const v=Number(elValor.value);
  if(v<=0)return alert("Valor inválido");
  const l=ler();
  l.push({id:Date.now(),tipo:elTipo.value,valor:v,data:elData.value,descricao:elDescricao.value||"(sem descrição)"});
  salvar(l);
  elValor.value="";elDescricao.value="";
  render();
};

function render(){
  let saldo=0,ent=0,sai=0,ren=0;
  const p=periodo();
  ler().forEach(l=>{
    saldo+=l.tipo==="saida"?-l.valor:l.valor;
    if(l.data.startsWith(p)){
      if(l.tipo==="entrada")ent+=l.valor;
      if(l.tipo==="saida")sai+=l.valor;
      if(l.tipo==="rendimento")ren+=l.valor;
    }
  });
  const res=ent+ren-sai;
  elSaldo.classList.toggle("texto-negativo",saldo<0);
  elResultadoMes.classList.toggle("texto-negativo",res<0);

  elSaldo.textContent=formatar(saldo).replace("R$","").trim();
  elEntradas.textContent=formatar(ent).replace("R$","").trim();
  elSaidas.textContent=formatar(sai).replace("R$","").trim();
  elRendimentos.textContent=formatar(ren).replace("R$","").trim();
  elResultadoMes.textContent=formatar(res).replace("R$","").trim();

  elLista.innerHTML="";
  ler().filter(l=>l.data.startsWith(p)).sort((a,b)=>b.data.localeCompare(a.data))
    .forEach(l=>{
      const li=document.createElement("li");
      li.innerHTML=`${l.data} • ${l.tipo.toUpperCase()} • ${formatar(l.valor)} • ${l.descricao}
      <button onclick="excluir(${l.id})">Excluir</button>`;
      elLista.appendChild(li);
    });
}

function excluir(id){
  salvar(ler().filter(l=>l.id!==id));
  render();
}

function exportarCSV(){
  const p=periodo();
  const dados=ler().filter(l=>l.data.startsWith(p));
  if(!dados.length)return alert("Nenhum lançamento");
  let csv="Data;Tipo;Valor;Descrição\n";
  dados.forEach(l=>csv+=`${l.data};${l.tipo};${l.valor};${l.descricao}\n`);
  const blob=new Blob([csv],{type:"text/csv"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download=`fluxo-caixa-${p}.csv`;
  a.click();
}

elMes.onchange=render;
elAno.onchange=render;
render();