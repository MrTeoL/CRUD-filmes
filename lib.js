//Chave do localStorage e links da API
const STORAGE_KEY = "filmes";
const TMDB_API_KEY = "3cfc45fe7990982c44020241308e3f59";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

//gera um id para cada item (não sei se é puramente funcional)
const gerarId = () =>
  (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now() + Math.floor(Math.random()*1000));

//====================
//    PERSISTÊNCIA
//====================

//Carega a lista do LocalStorage
const getFilmes = () => {
  const data = localStorage.getItem(STORAGE_KEY)
  return data ? JSON.parse(data) : []
}

//Salva a lista no localStorage
const salvarFilmes = (filmes) =>
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filmes));

//Remove todos os itens do LocalStorage
const limparTudo = () => { 
  localStorage.removeItem(STORAGE_KEY)
  console.log("LocalStorage limpo") };


//====================
//       CRUD
//====================

const adicionarFilme = (titulo, diretor = "", ano = "", capa = null, sinopse = "") => {
  const filmes = getFilmes();
  const novo = {
    id: gerarId(),
    titulo: String(titulo).trim(),
    diretor: String(diretor).trim(),
    ano: ano === "" ? "" : (Number(ano) || ano),
    capa: capa || null,
    sinopse: sinopse || "",
    avaliacao: 0 
  };
  salvarFilmes([...filmes, novo]);
  return novo;
};

const atualizarFilme = (id, titulo, diretor, ano, capa = null, sinopse = null) => {
  const filmes = getFilmes().map(f =>
    f.id === id
      ? {
          ...f,
          titulo: String(titulo).trim(),
          diretor: String(diretor).trim(),
          ano: ano === "" ? f.ano : (Number(ano) || ano),
          capa: capa !== null ? capa : f.capa,
          sinopse: sinopse !== null ? sinopse : f.sinopse,
          avaliacao: f.avaliacao
        }
      : f
  );
  salvarFilmes(filmes);
  return filmes;
};

const removerFilme = (id) => {
  const filmes = getFilmes().filter(f => f.id !== id);
  salvarFilmes(filmes);
  return filmes;
};

const getFilme = (id) => getFilmes().find(f => f.id === id);
const listarFilmes = () => getFilmes();

// normaliza a entrada para busca (todas as letras minúsculas, sem acento)
const normaliza = (s = "") => String(s).toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");


const buscarPorTitulo = (termo = "") => {
  const q = normaliza(termo);
  if (!q) return listarFilmes();
  return getFilmes().filter(f => normaliza(f.titulo).includes(q));
};

const buscarPorDiretor = (termo = "") => {
  const q = normaliza(termo);
  if (!q) return listarFilmes();
  return getFilmes().filter(f => normaliza(f.diretor).includes(q));
};

const ordenarPorAno = (ascendente = true) =>
  [...getFilmes()].sort((a, b) => {
    const aa = Number(a.ano) || 0;
    const bb = Number(b.ano) || 0;
    return ascendente ? aa - bb : bb - aa;
  });

//============================================================================
// busca de filme na API (retorna objeto {titulo, ano, capa, sinopse} ou null)
//============================================================================

const buscarFilmeNaAPI = async (titulo) => {
  if (!TMDB_API_KEY || TMDB_API_KEY === "b3ce186277e97417faa9529f0f69872a") {
    console.warn("TMDB API key não configurada em cinema.js");
    return null;
  }
  try {
    const url = `${TMDB_BASE_URL}/search/movie?api_key=${encodeURIComponent(TMDB_API_KEY)}&language=pt-BR&query=${encodeURIComponent(titulo)}&include_adult=false`;
    const res = await fetch(url);
    if (!res.ok) {
      console.error("TMDB fetch falhou:", res.status, res.statusText);
      return null;
    }
    const data = await res.json();
    if (!data.results || data.results.length === 0) return null;

    const filme = data.results[0];
    return {
      titulo: filme.title || titulo,
      ano: filme.release_date ? (filme.release_date.split("-")[0]) : "",
      capa: filme.poster_path ? `${IMAGE_BASE}${filme.poster_path}` : null,
      sinopse: filme.overview || ""
    };
  } catch (err) {
    console.error("Erro ao consultar TMDB:", err);
    return null;
  }
};

//=====carregar cinema padrão=====
const carregarCinemaPadrao = async () => {
  const exemplos = [
    { titulo: "O Poderoso Chefão", diretor: "Francis Ford Coppola" },
    { titulo: "Interestelar", diretor: "Christopher Nolan" },
    { titulo: "Cidade de Deus", diretor: "Fernando Meirelles" }
  ];

  const promises = exemplos.map(async (e) => {
    const api = await buscarFilmeNaAPI(e.titulo).catch(() => null);
    if (api) {
      return {
        id: gerarId(),
        titulo: api.titulo,
        diretor: e.diretor || "",
        ano: api.ano || "",
        capa: api.capa,
        sinopse: api.sinopse || "",
        avaliacao: 0
      };
    } else {
      return {
        id: gerarId(),
        titulo: e.titulo,
        diretor: e.diretor || "",
        ano: "",
        capa: null,
        sinopse: "",
        avaliacao: 0
      };
    }
  });

  const filmes = await Promise.all(promises);
  salvarFilmes(filmes);
  return filmes;
};

//===== avaliação =====
const avaliarFilme = (id, estrelas) => {
  const filmes = getFilmes().map(f =>
    f.id === id ? { ...f, avaliacao: Math.max(0, Math.min(5, estrelas)) } : f
  );
  salvarFilmes(filmes);
  return filmes;
};

export default {
  adicionarFilme,
  atualizarFilme,
  removerFilme,
  getFilme,
  listarFilmes,
  limparTudo,
  buscarPorTitulo,
  buscarPorDiretor,
  ordenarPorAno,
  buscarFilmeNaAPI,
  carregarCinemaPadrao,
  avaliarFilme
};
