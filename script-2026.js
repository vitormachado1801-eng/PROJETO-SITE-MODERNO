const CATEGORIAS = {
  receita: ["Salário", "Aluguel recebido", "Pensão", "Horas extras", "13º salário", "Férias", "Vendas", "Rendimentos", "Outros"],
  despesa: ["Moradia", "Condomínio", "Luz", "Água", "Celular", "Gás", "TV/Streaming", "Internet", "Supermercado", "Transporte", "Prestação do carro", "Seguro do carro", "Combustível", "Estacionamento", "Educação", "Saúde", "Medicamentos", "Lazer", "Restaurantes/Lanches", "Viagens/Passeio", "Cuidados pessoais", "Manutenção do carro", "Manutenção da casa", "Material escolar", "Roupas", "Presentes", "Dívidas", "Investimentos", "Ajuda à família", "Diversos"]
};
const STORAGE_KEY = "vitor_controle_financeiro_v1";
let lancamentos = carregarDados();
let editandoId = null;
const $ = (id) => document.getElementById(id);
const dinheiro = (valor) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor || 0);
const dataLocal = (date = new Date()) => {
  const ajustada = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return ajustada.toISOString().slice(0, 10);
};
const mesAtual = dataLocal().slice(0, 7);

function carregarDados() {
  try {
    const dados = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(dados) ? dados : [];
  } catch (erro) {
    console.error("Não foi possível ler os dados salvos.", erro);
    return [];
  }
}
function salvarDados() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lancamentos));
    return true;
  } catch (erro) {
    mostrarToast("Não foi possível salvar. Verifique o espaço do navegador.");
    return false;
  }
}
function popularCategorias() {
  const tipo = document.querySelector('input[name="tipo"]:checked').value;
  const categoria = $("categoria");
  categoria.innerHTML = "";
  CATEGORIAS[tipo].forEach((nome) => {
    const option = document.createElement("option");
    option.value = nome;
    option.textContent = nome;
    categoria.appendChild(option);
  });
  popularFiltroCategorias();
}
function popularFiltroCategorias() {
  const select = $("categoriaFiltro");
  const atual = select.value || "todas";
  const categorias = [...new Set(lancamentos.map((item) => item.categoria))].sort((a,b) => a.localeCompare(b, "pt-BR"));
  select.innerHTML = '<option value="todas">Todas as categorias</option>';
  categorias.forEach((nome) => {
    const option = document.createElement("option");
    option.value = nome;
    option.textContent = nome;
    select.appendChild(option);
  });
  if ([...select.options].some((option) => option.value === atual)) select.value = atual;
}
function mesSelecionado() { return $("mesFiltro").value; }
function doMes() { return lancamentos.filter((item) => item.data && item.data.slice(0, 7) === mesSelecionado()); }
function somar(itens, tipo) { return itens.filter((item) => item.tipo === tipo).reduce((total, item) => total + Number(item.valor || 0), 0); }
function atualizarPainel() {
  const itens = doMes();
  const receitas = somar(itens, "receita");
  const despesas = somar(itens, "despesa");
  const saldo = receitas - despesas;
  $("saldoTotal").textContent = dinheiro(saldo);
  $("saldoTotal").style.color = saldo < 0 ? "#ffd2da" : "#ffffff";
  $("saldoLegenda").textContent = saldo < 0 ? "Atenção: despesas acima das receitas" : "Receitas menos despesas";
  $("receitasTotal").textContent = dinheiro(receitas);
  $("despesasTotal").textContent = dinheiro(despesas);
  $("qtdTotal").textContent = itens.length;
  $("legReceitas").textContent = dinheiro(receitas);
  $("legDespesas").textContent = dinheiro(despesas);
  $("legSaldo").textContent = dinheiro(saldo);
  const percentual = receitas > 0 ? Math.round(despesas / receitas * 100) : (despesas > 0 ? 100 : 0);
  $("percentualGasto").textContent = `${percentual}%`;
  $("budgetRing").style.background = `conic-gradient(${despesas > receitas ? "#df5570" : "#7957f5"} ${Math.min(percentual, 100) * 3.6}deg, #eeeaf8 0deg)`;
  renderizarGrafico(itens);
}
function renderizarGrafico(itens) {
  const totais = {};
  itens.filter((item) => item.tipo === "despesa").forEach((item) => { totais[item.categoria] = (totais[item.categoria] || 0) + Number(item.valor); });
  const entradas = Object.entries(totais).sort((a,b) => b[1] - a[1]).slice(0, 6);
  const total = entradas.reduce((s, e) => s + e[1], 0);
  const area = $("graficoCategorias");
  area.innerHTML = "";
  if (!entradas.length) { area.innerHTML = '<p class="empty-state">Ainda não há despesas neste mês.</p>'; return; }
  entradas.forEach(([nome, valor]) => {
    const linha = document.createElement("div"); linha.className = "chart-row";
    const label = document.createElement("span"); label.className = "chart-label"; label.textContent = nome;
    const trilho = document.createElement("div"); trilho.className = "chart-track";
    const barra = document.createElement("div"); barra.className = "chart-fill"; barra.style.width = `${total ? valor / Math.max(...entradas.map(e=>e[1])) * 100 : 0}%`; trilho.appendChild(barra);
    const quantia = document.createElement("strong"); quantia.className = "chart-value"; quantia.textContent = dinheiro(valor);
    linha.append(label, trilho, quantia); area.appendChild(linha);
  });
}
function filtrarLancamentos() {
  const busca = $("busca").value.trim().toLocaleLowerCase("pt-BR");
  const tipo = $("tipoFiltro").value;
  const categoria = $("categoriaFiltro").value;
  return doMes().filter((item) => {
    const correspondeBusca = `${item.descricao} ${item.observacoes || ""}`.toLocaleLowerCase("pt-BR").includes(busca);
    return correspondeBusca && (tipo === "todos" || item.tipo === tipo) && (categoria === "todas" || item.categoria === categoria);
  }).sort((a,b) => b.data.localeCompare(a.data) || b.criadoEm - a.criadoEm);
}
function renderizarTabela() {
  const itens = filtrarLancamentos();
  const corpo = $("listaLancamentos"); corpo.innerHTML = "";
  $("semLancamentos").hidden = itens.length > 0;
  itens.forEach((item) => {
    const tr = document.createElement("tr");
    const descricao = document.createElement("td");
    const nome = document.createElement("div"); nome.className = "transaction-name"; nome.textContent = item.descricao;
    descricao.appendChild(nome);
    if (item.observacoes) { const nota = document.createElement("div"); nota.className = "transaction-note"; nota.textContent = item.observacoes; descricao.appendChild(nota); }
    const cat = document.createElement("td"); const pill = document.createElement("span"); pill.className = "category-pill"; pill.textContent = item.categoria; cat.appendChild(pill);
    const data = document.createElement("td"); data.textContent = new Date(`${item.data}T12:00:00`).toLocaleDateString("pt-BR");
    const tipo = document.createElement("td"); const tipoSpan = document.createElement("span"); tipoSpan.className = `type-label ${item.tipo}`; tipoSpan.textContent = item.tipo === "receita" ? "＋ Receita" : "− Despesa"; tipo.appendChild(tipoSpan);
    const valor = document.createElement("td"); valor.className = "align-right amount"; valor.style.color = item.tipo === "receita" ? "var(--green)" : "var(--red)"; valor.textContent = `${item.tipo === "receita" ? "+" : "−"} ${dinheiro(item.valor)}`;
    const acoes = document.createElement("td"); const wrapper = document.createElement("div"); wrapper.className = "row-actions";
    const editar = document.createElement("button"); editar.className = "icon-button"; editar.textContent = "Editar"; editar.setAttribute("aria-label", `Editar ${item.descricao}`); editar.addEventListener("click", () => abrirEdicao(item.id));
    const excluir = document.createElement("button"); excluir.className = "icon-button"; excluir.textContent = "×"; excluir.setAttribute("aria-label", `Excluir ${item.descricao}`); excluir.addEventListener("click", () => excluirLancamento(item.id));
    wrapper.append(editar, excluir); acoes.appendChild(wrapper);
    tr.append(descricao, cat, data, tipo, valor, acoes); corpo.appendChild(tr);
  });
  $("contadorLancamentos").textContent = `${itens.length} ${itens.length === 1 ? "lançamento" : "lançamentos"}`;
}
function atualizarTudo() { atualizarPainel(); renderizarTabela(); popularFiltroCategorias(); }
function abrirModal() {
  editandoId = null;
  $("formLancamento").reset();
  $("tituloModal").textContent = "Adicionar lançamento";
  document.querySelector('input[name="tipo"][value="receita"]').checked = true;
  $("data").value = dataLocal();
  popularCategorias();
  $("modalLancamento").showModal();
}
function abrirEdicao(id) {
  const item = lancamentos.find((x) => x.id === id); if (!item) return;
  editandoId = id;
  $("tituloModal").textContent = "Editar lançamento";
  document.querySelector(`input[name="tipo"][value="${item.tipo}"]`).checked = true;
  popularCategorias();
  $("descricao").value = item.descricao;
  $("valor").value = item.valor;
  $("data").value = item.data;
  $("categoria").value = item.categoria;
  $("observacoes").value = item.observacoes || "";
  $("modalLancamento").showModal();
}
function excluirLancamento(id) {
  const item = lancamentos.find((x) => x.id === id);
  if (!item || !confirm(`Excluir o lançamento "${item.descricao}"?`)) return;
  lancamentos = lancamentos.filter((x) => x.id !== id);
  if (salvarDados()) { atualizarTudo(); mostrarToast("Lançamento excluído."); }
}
function mostrarToast(mensagem) {
  const toast = $("toast"); toast.textContent = mensagem; toast.classList.add("show");
  clearTimeout(mostrarToast.timer); mostrarToast.timer = setTimeout(() => toast.classList.remove("show"), 2600);
}
function exportarCSV() {
  const itens = filtrarLancamentos();
  if (!itens.length) { mostrarToast("Não há lançamentos para exportar neste filtro."); return; }
  const escapar = (valor) => `"${String(valor ?? "").replaceAll('"', '""')}"`;
  const linhas = [["Descrição","Categoria","Data","Tipo","Valor (R$)","Observações"], ...itens.map((x) => [x.descricao,x.categoria,x.data,x.tipo,Number(x.valor).toFixed(2).replace(".",","),x.observacoes || ""])];
  const csv = "\uFEFF" + linhas.map((linha) => linha.map(escapar).join(";")).join("\r\n");
  const blob = new Blob([csv], {type:"text/csv;charset=utf-8;"});
  const url = URL.createObjectURL(blob); const link = document.createElement("a");
  link.href = url; link.download = `controle-financeiro-${mesSelecionado()}.csv`; link.click(); URL.revokeObjectURL(url);
}
$("mesFiltro").value = mesAtual;
$("novoLancamento").addEventListener("click", abrirModal);
$("novoLancamentoTopo").addEventListener("click", abrirModal);
$("fecharModal").addEventListener("click", () => $("modalLancamento").close());
$("cancelarModal").addEventListener("click", () => $("modalLancamento").close());
document.querySelectorAll('input[name="tipo"]').forEach((radio) => radio.addEventListener("change", popularCategorias));
$("mesFiltro").addEventListener("change", atualizarTudo);
$("busca").addEventListener("input", renderizarTabela);
$("tipoFiltro").addEventListener("change", renderizarTabela);
$("categoriaFiltro").addEventListener("change", renderizarTabela);
$("exportarCsv").addEventListener("click", exportarCSV);
$("formLancamento").addEventListener("submit", (evento) => {
  evento.preventDefault();
  const tipo = document.querySelector('input[name="tipo"]:checked').value;
  const item = {
    id: editandoId || (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`),
    tipo,
    descricao: $("descricao").value.trim(),
    valor: Number($("valor").value),
    data: $("data").value,
    categoria: $("categoria").value,
    observacoes: $("observacoes").value.trim(),
    criadoEm: Date.now()
  };
  if (!item.descricao || !item.data || !Number.isFinite(item.valor) || item.valor <= 0) { mostrarToast("Preencha os campos corretamente."); return; }
  if (editandoId) {
    const index = lancamentos.findIndex((x) => x.id === editandoId);
    if (index !== -1) lancamentos[index] = {...lancamentos[index], ...item};
  } else lancamentos.push(item);
  if (salvarDados()) {
    $("modalLancamento").close();
    $("mesFiltro").value = item.data.slice(0,7);
    $("busca").value = ""; $("tipoFiltro").value = "todos"; $("categoriaFiltro").value = "todas";
    atualizarTudo();
    mostrarToast(editandoId ? "Lançamento atualizado!" : "Lançamento salvo!");
    editandoId = null;
  }
});
popularCategorias();
atualizarTudo();
