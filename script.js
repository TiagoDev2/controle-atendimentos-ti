const formulario = document.getElementById("formAtendimento");
const lista = document.getElementById("listaAtendimentos");
const filtro = document.getElementById("filtroAtual");
const buscaTexto = document.getElementById("buscaTexto");

const qtdTotal = document.getElementById("qtdTotal");
const qtdPendente = document.getElementById("qtdPendente");
const qtdAnalise = document.getElementById("qtdAnalise");
const qtdFinalizado = document.getElementById("qtdFinalizado");

const idEdicao = document.getElementById("idEdicao");
const tituloFormulario = document.getElementById("tituloFormulario");
const botaoSalvar = document.getElementById("botaoSalvar");
const botaoCancelarEdicao = document.getElementById("botaoCancelarEdicao");

const btnExportarPdf = document.getElementById("btnExportarPdf");
const btnExportarCsv = document.getElementById("btnExportarCsv");

let atendimentos = JSON.parse(localStorage.getItem("atendimentosTIv2")) || [];

function formatarClasse(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-");
}

function textoNormalizado(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function salvar() {
  localStorage.setItem("atendimentosTIv2", JSON.stringify(atendimentos));
}

function atualizarResumo() {
  qtdTotal.textContent = atendimentos.length;
  qtdPendente.textContent = atendimentos.filter(item => item.status === "Pendente").length;
  qtdAnalise.textContent = atendimentos.filter(item => item.status === "Em análise").length;
  qtdFinalizado.textContent = atendimentos.filter(item => item.status === "Finalizado").length;
}

function limparFormulario() {
  formulario.reset();
  idEdicao.value = "";
  tituloFormulario.textContent = "Abrir novo atendimento";
  botaoSalvar.textContent = "Salvar atendimento";
  botaoCancelarEdicao.classList.add("oculto");
}

function preencherFormulario(item) {
  idEdicao.value = item.id;
  document.getElementById("nomeSolicitante").value = item.solicitante;
  document.getElementById("departamento").value = item.departamento;
  document.getElementById("tipoOcorrencia").value = item.tipo;
  document.getElementById("grauUrgencia").value = item.urgencia;
  document.getElementById("detalhesProblema").value = item.descricao;

  tituloFormulario.textContent = "Editar atendimento";
  botaoSalvar.textContent = "Salvar alterações";
  botaoCancelarEdicao.classList.remove("oculto");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function obterDadosFiltrados() {
  const criterio = filtro.value;
  const termo = textoNormalizado(buscaTexto.value.trim());

  return atendimentos.filter(item => {
    const passaFiltroStatus = criterio === "todos" || item.status === criterio;

    const textoBase = textoNormalizado(
      `${item.solicitante} ${item.departamento} ${item.tipo} ${item.descricao}`
    );

    const passaBusca = termo === "" || textoBase.includes(termo);

    return passaFiltroStatus && passaBusca;
  });
}

function desenharLista() {
  const dadosFiltrados = obterDadosFiltrados();
  lista.innerHTML = "";

  if (dadosFiltrados.length === 0) {
    lista.innerHTML = '<div class="vazio">Nenhum atendimento encontrado no momento.</div>';
    atualizarResumo();
    return;
  }

  dadosFiltrados.forEach(item => {
    const bloco = document.createElement("div");
    bloco.className = "item";

    bloco.innerHTML = `
      <div class="item-topo">
        <div>
          <h3>${item.solicitante}</h3>
          <p><strong>Departamento:</strong> ${item.departamento}</p>
          <p><strong>Tipo:</strong> ${item.tipo}</p>
        </div>

        <div class="selos">
          <span class="selo urgencia-${formatarClasse(item.urgencia)}">${item.urgencia}</span>
          <span class="selo status-${formatarClasse(item.status)}">${item.status}</span>
        </div>
      </div>

      <p><strong>Problema informado:</strong> ${item.descricao}</p>
      <p><strong>Data de abertura:</strong> ${item.data}</p>

      <div class="acoes">
        <button class="acao" onclick="mudarStatus(${item.id})">Atualizar status</button>
        <button class="acao" onclick="editarItem(${item.id})">Editar</button>
        <button class="acao" onclick="apagarItem(${item.id})">Remover</button>
      </div>
    `;

    lista.appendChild(bloco);
  });

  atualizarResumo();
}

function mudarStatus(id) {
  atendimentos = atendimentos.map(item => {
    if (item.id === id) {
      if (item.status === "Pendente") {
        item.status = "Em análise";
      } else if (item.status === "Em análise") {
        item.status = "Finalizado";
      } else {
        item.status = "Pendente";
      }
    }
    return item;
  });

  salvar();
  desenharLista();
}

function editarItem(id) {
  const item = atendimentos.find(registro => registro.id === id);
  if (item) {
    preencherFormulario(item);
  }
}

function apagarItem(id) {
  atendimentos = atendimentos.filter(item => item.id !== id);
  salvar();
  desenharLista();
}

formulario.addEventListener("submit", function(evento) {
  evento.preventDefault();

  const dados = {
    solicitante: document.getElementById("nomeSolicitante").value,
    departamento: document.getElementById("departamento").value,
    tipo: document.getElementById("tipoOcorrencia").value,
    urgencia: document.getElementById("grauUrgencia").value,
    descricao: document.getElementById("detalhesProblema").value
  };

  if (idEdicao.value) {
    atendimentos = atendimentos.map(item => {
      if (String(item.id) === String(idEdicao.value)) {
        return { ...item, ...dados };
      }
      return item;
    });
  } else {
    const novoAtendimento = {
      id: Date.now(),
      ...dados,
      status: "Pendente",
      data: new Date().toLocaleDateString("pt-BR")
    };

    atendimentos.unshift(novoAtendimento);
  }

  salvar();
  desenharLista();
  limparFormulario();
});

botaoCancelarEdicao.addEventListener("click", limparFormulario);
filtro.addEventListener("change", desenharLista);
buscaTexto.addEventListener("input", desenharLista);

btnExportarPdf.addEventListener("click", () => {
  const elemento = document.getElementById("areaRelatorio");

  const opcoes = {
    margin: 10,
    filename: "relatorio_atendimentos_ti.pdf",
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
  };

  html2pdf().set(opcoes).from(elemento).save();
});

btnExportarCsv.addEventListener("click", () => {
  const dados = obterDadosFiltrados();

  if (dados.length === 0) {
    alert("Não há atendimentos para exportar.");
    return;
  }

  const cabecalho = ["Solicitante", "Departamento", "Tipo", "Urgência", "Status", "Descrição", "Data"];
  const linhas = dados.map(item => [
    item.solicitante,
    item.departamento,
    item.tipo,
    item.urgencia,
    item.status,
    item.descricao.replace(/"/g, '""'),
    item.data
  ]);

  const csvConteudo = [cabecalho, ...linhas]
    .map(linha => linha.map(valor => `"${valor}"`).join(";"))
    .join("\n");

  const blob = new Blob([csvConteudo], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "relatorio_atendimentos_ti.csv";
  link.click();
});

desenharLista();
