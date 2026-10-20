// Endereço base da API
const API = "https://rickandmortyapi.com/api";

// Evita que um texto vindo da API seja interpretado como HTML
function limpar(texto) {
  const div = document.createElement("div");
  div.textContent = texto ?? "";
  return div.innerHTML;
}

// ---------- API DE LOGS (Unoesc) ----------
const LOG_API = "https://www.piway.com.br/unoesc/api";
const MATRICULA = "467353";

// Monta um trecho de URL seguro (a API recebe tudo na rota, então "/" e "?" quebrariam o endereço)
function paraRota(valor) {
  return encodeURIComponent(String(valor).replace(/[\/\\?#]/g, " ").trim());
}

// INSERIR log: chamada a cada consulta feita na API do Rick and Morty
// api = nome da API, metodo = rota usada, resultado = alguma informação recebida
async function registrarLog(api, metodo, resultado) {
  try {
    const url = LOG_API + "/inserir/log/" + paraRota(MATRICULA) + "/" +
      paraRota(api) + "/" + paraRota(metodo) + "/" + paraRota(resultado);
    await fetch(url);
    // Se a aba de logs estiver aberta, atualiza a lista na hora
    if (document.getElementById("abaLogs").classList.contains("active")) carregarLogs();
  } catch (erro) {
    console.warn("Não foi possível registrar o log:", erro);
  }
}

// LISTAR logs do aluno
const listaLogs = document.getElementById("listaLogs");
const cabecalhoLogs = document.getElementById("cabecalhoLogs");
const msgLogs = document.getElementById("msgLogs");

// Descobre qual campo do log é o identificador (id, idlog, etc.)
function campoId(objeto) {
  if ("id" in objeto) return "id";
  return Object.keys(objeto).find(function (k) { return /^id/i.test(k); });
}

// Matrícula que está sendo exibida na tabela (começa na minha)
let matriculaAtual = MATRICULA;

async function carregarLogs(matricula = matriculaAtual) {
  matriculaAtual = matricula;
  msgLogs.textContent = "Carregando...";
  try {
    const resposta = await fetch(LOG_API + "/logs/" + paraRota(matricula));
    if (!resposta.ok) throw new Error("Erro HTTP " + resposta.status);
    const texto = await resposta.text();

    let logs;
    try { logs = JSON.parse(texto); } catch (e) { logs = texto; }

    // Quando a matrícula é inválida a API devolve uma mensagem de erro em vez do array
    if (!Array.isArray(logs)) {
      cabecalhoLogs.innerHTML = "";
      listaLogs.innerHTML = "";
      msgLogs.textContent = typeof logs === "string" ? logs : JSON.stringify(logs);
      return;
    }
    if (logs.length === 0) {
      cabecalhoLogs.innerHTML = "";
      listaLogs.innerHTML = "";
      msgLogs.textContent = "Nenhum log registrado ainda.";
      return;
    }

    mostrarLogs(logs, matricula === MATRICULA);
    msgLogs.textContent = logs.length + " logs da matrícula " + matricula;
  } catch (erro) {
    msgLogs.textContent = "Não foi possível carregar os logs: " + erro.message;
  }
}

// EXIBIÇÃO COM REPETIÇÃO: uma linha para cada log (as colunas vêm dos campos que a API devolve)
// ehMeu = true só quando a matrícula pesquisada é a minha (só nesse caso mostra o botão de excluir)
function mostrarLogs(logs, ehMeu) {
  const colunas = Object.keys(logs[0]);
  const chaveId = campoId(logs[0]);

  cabecalhoLogs.innerHTML = "<tr>" +
    colunas.map(function (c) { return "<th>" + limpar(c) + "</th>"; }).join("") +
    (ehMeu ? "<th>Ação</th>" : "") + "</tr>";

  listaLogs.innerHTML = "";
  logs.forEach(function (log) {
    const celulas = colunas.map(function (c) { return "<td>" + limpar(log[c]) + "</td>"; }).join("");
    const botao = chaveId && ehMeu
      ? `<button type="button" class="btn btn-outline-danger btn-sm btn-excluir-log" data-id="${limpar(log[chaveId])}">Excluir</button>`
      : "";
    listaLogs.innerHTML += "<tr>" + celulas + (ehMeu ? "<td>" + botao + "</td>" : "") + "</tr>";
  });
}

// EXCLUIR um log pelo id
async function excluirLog(id) {
  msgLogs.textContent = "Excluindo...";
  try {
    const resposta = await fetch(LOG_API + "/excluir/log/" + paraRota(id) + "/aluno/" + paraRota(MATRICULA));
    if (!resposta.ok) throw new Error("Erro HTTP " + resposta.status);
    await carregarLogs(MATRICULA);
  } catch (erro) {
    msgLogs.textContent = "Não foi possível excluir o log: " + erro.message;
  }
}

listaLogs.addEventListener("click", function (evento) {
  const botao = evento.target.closest(".btn-excluir-log");
  if (botao) excluirLog(botao.dataset.id);
});

// PESQUISA por matrícula
const campoMatricula = document.getElementById("campoMatricula");
campoMatricula.value = MATRICULA;

document.getElementById("formLogs").addEventListener("submit", function (e) {
  e.preventDefault();
  const matricula = campoMatricula.value.trim();
  if (!/^\d+$/.test(matricula)) {
    msgLogs.textContent = "Digite uma matrícula válida (somente números).";
    return;
  }
  carregarLogs(matricula);
});

document.getElementById("btnMeusLogs").addEventListener("click", function () {
  campoMatricula.value = MATRICULA;
  carregarLogs(MATRICULA);
});

// NOVO: função única que faz TODAS as consultas à API.
// recurso = "character", "episode" ou "location"
// filtros = objeto, ex.: { name: "rick", status: "alive" } (campos vazios são ignorados)
async function buscar(recurso, filtros = {}) {
  const params = new URLSearchParams();
  for (const campo in filtros) {
    if (filtros[campo]) params.append(campo, filtros[campo]);
  }
  const texto = params.toString();
  const url = API + "/" + recurso + (texto ? "?" + texto : "");

  const resposta = await fetch(url);

  // Quando a busca não acha nada, a API responde 404 (não é um erro de verdade)
  if (resposta.status === 404) return null;
  if (!resposta.ok) throw new Error("Erro HTTP " + resposta.status);

  const dados = await resposta.json();
  // Registra na API de logs: qual rota foi usada e quantos resultados vieram
  registrarLog("Rick and Morty", "/" + recurso, dados.info.count + " resultados");
  return dados;
}

// ---------- MÉTODO 1: /character ----------
const listaPersonagens = document.getElementById("listaPersonagens");
const msgPersonagens = document.getElementById("msgPersonagens");

async function carregarPersonagens(nome = "", status = "") {
  msgPersonagens.textContent = "Carregando...";
  try {
    const dados = await buscar("character", { name: nome, status: status });
    if (!dados) {
      listaPersonagens.innerHTML = "";
      msgPersonagens.textContent = "Nenhum personagem encontrado com esses filtros.";
      return;
    }
    mostrarPersonagens(dados.results);
    msgPersonagens.textContent = dados.info.count + " personagens encontrados";
  } catch (erro) {
    msgPersonagens.textContent = "Não foi possível carregar os dados: " + erro.message;
  }
}

// EXIBIÇÃO COM REPETIÇÃO: um card para cada personagem
function mostrarPersonagens(personagens) {
  listaPersonagens.innerHTML = "";
  personagens.forEach(function (p) {
    listaPersonagens.innerHTML += `
      <div class="col-12 col-md-6 col-lg-3">
        <div class="card h-100">
          <img src="${p.image}" class="card-img-top" alt="Foto de ${limpar(p.name)}">
          <div class="card-body">
            <h5 class="card-title">${limpar(p.name)}</h5>
            <p class="card-text">
              ${limpar(p.species)} · ${limpar(p.status)}<br>
              Origem: ${limpar(p.origin && p.origin.name)}
            </p>
            <button type="button" class="btn btn-outline-primary btn-sm btn-detalhe" data-id="${p.id}">
              Ver detalhes
            </button>
          </div>
        </div>
      </div>`;
  });
}

// EXIBIÇÃO SEM REPETIÇÃO: /character/{id}, os dados de UM personagem no modal
const corpoDetalhe = document.getElementById("corpoDetalhe");
const tituloDetalhe = document.getElementById("tituloDetalhe");

async function abrirDetalhe(id) {
  tituloDetalhe.textContent = "Carregando...";
  corpoDetalhe.innerHTML = "";
  bootstrap.Modal.getOrCreateInstance(document.getElementById("modalDetalhe")).show();

  try {
    const resposta = await fetch(API + "/character/" + id);
    if (!resposta.ok) throw new Error("Erro HTTP " + resposta.status);
    const p = await resposta.json();
    registrarLog("Rick and Morty", "/character/" + id, p.name);

    tituloDetalhe.textContent = p.name;
    corpoDetalhe.innerHTML = `
      <img src="${p.image}" class="img-fluid rounded mb-3" alt="Foto de ${limpar(p.name)}">
      <ul class="list-unstyled mb-0">
        <li><strong>Status:</strong> ${limpar(p.status)}</li>
        <li><strong>Espécie:</strong> ${limpar(p.species)}</li>
        <li><strong>Tipo:</strong> ${limpar(p.type) || "não informado"}</li>
        <li><strong>Gênero:</strong> ${limpar(p.gender)}</li>
        <li><strong>Origem:</strong> ${limpar(p.origin && p.origin.name)}</li>
        <li><strong>Última localização:</strong> ${limpar(p.location && p.location.name)}</li>
        <li><strong>Aparece em:</strong> ${p.episode ? p.episode.length : 0} episódio(s)</li>
      </ul>`;
  } catch (erro) {
    tituloDetalhe.textContent = "Erro";
    corpoDetalhe.textContent = "Não foi possível carregar o personagem: " + erro.message;
  }
}

listaPersonagens.addEventListener("click", function (evento) {
  const botao = evento.target.closest(".btn-detalhe");
  if (botao) abrirDetalhe(botao.dataset.id);
});

// ---------- MÉTODO 2: /episode ----------
const listaEpisodios = document.getElementById("listaEpisodios");
const msgEpisodios = document.getElementById("msgEpisodios");

async function carregarEpisodios(nome = "", codigo = "") {
  msgEpisodios.textContent = "Carregando...";
  try {
    // O filtro "episode" aceita temporada (S01) ou episódio exato (S01E01)
    const dados = await buscar("episode", { name: nome, episode: codigo });
    if (!dados) {
      listaEpisodios.innerHTML = "";
      msgEpisodios.textContent = "Nenhum episódio encontrado com esses filtros.";
      return;
    }
    listaEpisodios.innerHTML = "";
    dados.results.forEach(function (ep) {
      listaEpisodios.innerHTML += `
        <tr>
          <td>${limpar(ep.episode)}</td>
          <td>${limpar(ep.name)}</td>
          <td>${limpar(ep.air_date)}</td>
          <td>${ep.characters ? ep.characters.length : 0}</td>
        </tr>`;
    });
    msgEpisodios.textContent = dados.info.count + " episódios encontrados";
  } catch (erro) {
    msgEpisodios.textContent = "Não foi possível carregar os dados: " + erro.message;
  }
}

// ---------- MÉTODO 3: /location ----------
const listaLocais = document.getElementById("listaLocais");
const msgLocais = document.getElementById("msgLocais");

async function carregarLocais(nome = "", tipo = "") {
  msgLocais.textContent = "Carregando...";
  try {
    const dados = await buscar("location", { name: nome, type: tipo });
    if (!dados) {
      listaLocais.innerHTML = "";
      msgLocais.textContent = "Nenhum local encontrado com esses filtros.";
      return;
    }
    listaLocais.innerHTML = "";
    dados.results.forEach(function (l) {
      listaLocais.innerHTML += `
        <div class="col-12 col-md-6 col-lg-4">
          <div class="card h-100">
            <div class="card-body">
              <h5 class="card-title">${limpar(l.name)}</h5>
              <p class="card-text mb-0">
                <strong>Tipo:</strong> ${limpar(l.type) || "não informado"}<br>
                <strong>Dimensão:</strong> ${limpar(l.dimension) || "não informada"}<br>
                <strong>Moradores:</strong> ${l.residents ? l.residents.length : 0}
              </p>
            </div>
          </div>
        </div>`;
    });
    msgLocais.textContent = dados.info.count + " locais encontrados";
  } catch (erro) {
    msgLocais.textContent = "Não foi possível carregar os dados: " + erro.message;
  }
}

// ---------- Formulários ----------
document.getElementById("formPersonagem").addEventListener("submit", function (e) {
  e.preventDefault();
  carregarPersonagens(
    document.getElementById("campoNome").value.trim(),
    document.getElementById("campoStatus").value
  );
});

document.getElementById("formEpisodio").addEventListener("submit", function (e) {
  e.preventDefault();
  carregarEpisodios(
    document.getElementById("campoEpNome").value.trim(),
    document.getElementById("campoEpCodigo").value.trim()
  );
});

document.getElementById("formLocal").addEventListener("submit", function (e) {
  e.preventDefault();
  carregarLocais(
    document.getElementById("campoLocNome").value.trim(),
    document.getElementById("campoLocTipo").value.trim()
  );
});

// Ao abrir a aba "Logs", busca a lista atualizada
document.querySelector('[data-bs-target="#abaLogs"]').addEventListener("shown.bs.tab", function () { carregarLogs(); });

// Ao abrir a página: as três listas gerais, sem filtro
carregarPersonagens();
carregarEpisodios();
carregarLocais();
