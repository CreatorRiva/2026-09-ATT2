
const API = "https://rickandmortyapi.com/api";

function limpar(texto) {
  const div = document.createElement("div");
  div.textContent = texto ?? "";
  return div.innerHTML;
}

async function buscar(recurso, filtros = {}) {
  const params = new URLSearchParams();
  for (const campo in filtros) {
    if (filtros[campo]) params.append(campo, filtros[campo]);
  }
  const texto = params.toString();
  const url = API + "/" + recurso + (texto ? "?" + texto : "");

  const resposta = await fetch(url);

  if (resposta.status === 404) return null;
  if (!resposta.ok) throw new Error("Erro HTTP " + resposta.status);

  return await resposta.json();
}

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

const listaEpisodios = document.getElementById("listaEpisodios");
const msgEpisodios = document.getElementById("msgEpisodios");

async function carregarEpisodios(nome = "", codigo = "") {
  msgEpisodios.textContent = "Carregando...";
  try {
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

carregarPersonagens();
carregarEpisodios();
carregarLocais();
