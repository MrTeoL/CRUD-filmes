// importar a .lib
import cinema from "./lib.js";

// puxar os elementos do .index
const form = document.getElementById("form-filme");
const inputId = document.getElementById("id");
const inputTitulo = document.getElementById("titulo");
const inputDiretor = document.getElementById("diretor");
const inputAno = document.getElementById("ano");

const btnMostrarTodos = document.getElementById("btn-todos");
const btnCarregarPadrao = document.getElementById("btn-carregar");
const btnOrdenarAsc = document.getElementById("btn-ordenar-asc");
const btnOrdenarDesc = document.getElementById("btn-ordenar-desc");
const btnLimpar = document.getElementById("btn-limpar");

const inputBuscaTitulo = document.getElementById("busca-titulo");
const btnBuscaTitulo = document.getElementById("btn-buscar-titulo");
const inputBuscaDiretor = document.getElementById("busca-diretor");
const btnBuscaDiretor = document.getElementById("btn-buscar-diretor");

const lista = document.getElementById("lista-filmes");

// função para gerar estrelas
const estrelasHTML = (id, avaliacao) =>
  `<div class="avaliacao" data-id="${id}">
     ${[1,2,3,4,5].map(n =>
       `<span class="estrela ${n <= avaliacao ? "ativa" : ""}" data-value="${n}">★</span>`
     ).join("")}
   </div>`;

// render
const render = (filmes = cinema.listarFilmes()) => {
  lista.innerHTML = "";
  if (!filmes || filmes.length === 0) {
    lista.innerHTML = `<p class="vazio">Nenhum filme encontrado.</p>`;
    return;
  }

  const frag = document.createDocumentFragment();
  filmes.forEach((f) => {
    const card = document.createElement("article");
    card.className = "filme";
    card.innerHTML = `
      <div class="filme-head">
        <h3>${f.titulo}</h3>
        <span class="ano">${f.ano || ""}</span>
      </div>

      ${f.capa ? `<img src="${f.capa}" alt="${f.titulo}" onerror="this.style.display='none'">`
               : `<div class="no-capa">🎞️ Sem capa disponível</div>`}

      <p class="diretor"><b>Diretor:</b> ${f.diretor || "N/A"}</p>
      ${f.sinopse ? `<p>${f.sinopse}</p>` : ""}

      ${estrelasHTML(f.id, f.avaliacao || 0)}

      <div class="acoes">
        <button class="btn btn-sec" data-action="edit" data-id="${f.id}">✏️ Editar</button>
        <button class="btn btn-danger" data-action="remove" data-id="${f.id}">🗑️ Remover</button>
      </div>
    `;
    frag.appendChild(card);
  });
  lista.appendChild(frag);
};

// form submit (adicionar / atualizar)
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = inputId.value.trim();
  const titulo = inputTitulo.value.trim();
  const diretor = inputDiretor.value.trim();
  const ano = inputAno.value.trim();

  if (!titulo) return;

  if (!id) {
    const api = await cinema.buscarFilmeNaAPI(titulo);
    const capa = api ? api.capa : null;
    const sinopse = api ? api.sinopse : "";
    const anoFinal = ano || (api ? api.ano : "");
    cinema.adicionarFilme(titulo, diretor, anoFinal, capa, sinopse);
  } else {
    cinema.atualizarFilme(id, titulo, diretor, ano);
  }

  form.reset();
  inputId.value = "";
  render();
});

// editar/remover dentro dos cards + estrelas
lista.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action]");
  if (btn) {
    const action = btn.getAttribute("data-action");
    const id = btn.getAttribute("data-id");
    if (action === "edit") {
      const f = cinema.getFilme(id);
      if (!f) return;
      inputId.value = f.id;
      inputTitulo.value = f.titulo;
      inputDiretor.value = f.diretor;
      inputAno.value = f.ano || "";
      inputTitulo.focus();
    } else if (action === "remove") {
      if (confirm("Remover este filme?")) {
        cinema.removerFilme(id);
        render();
      }
    }
    return;
  }
  //sistema de avaliação
  const estrela = e.target.closest(".estrela");
  if (estrela) {
    const id = estrela.closest(".avaliacao").dataset.id;
    const valor = Number(estrela.dataset.value);
    cinema.avaliarFilme(id, valor);
    render();
    return;
  }
});

// menu buttons
btnMostrarTodos.addEventListener("click", () => render());
btnCarregarPadrao.addEventListener("click", async () => {
  btnCarregarPadrao.disabled = true;
  btnCarregarPadrao.textContent = "⏳ Carregando...";
  try {
    await cinema.carregarCinemaPadrao();
  } finally {
    btnCarregarPadrao.disabled = false;
    btnCarregarPadrao.textContent = "📂 Carregar padrão";
    render();
  }
});
btnOrdenarAsc.addEventListener("click", () => render(cinema.ordenarPorAno(true)));
btnOrdenarDesc.addEventListener("click", () => render(cinema.ordenarPorAno(false)));
btnLimpar.addEventListener("click", () => {
  if (confirm("Limpar tudo (isto apagará todos os filmes salvos)?")) {
    cinema.limparTudo();
    render();
  }
});

// buscas
btnBuscaTitulo.addEventListener("click", () => {
  const termo = inputBuscaTitulo.value.trim();
  render(cinema.buscarPorTitulo(termo));
});
btnBuscaDiretor.addEventListener("click", () => {
  const termo = inputBuscaDiretor.value.trim();
  render(cinema.buscarPorDiretor(termo));
});

// inicial
render();
