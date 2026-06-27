/**
 * Backend do Meu Planner — Google Apps Script
 * Vinculado à planilha: https://docs.google.com/spreadsheets/d/1Z3tQZtCOP6rLAmqIefqAbLpQwmnqRemGSx_iPbiGIms
 *
 * Responde via JSONP (callback) para contornar CORS, exatamente como o index.html espera.
 * Ações suportadas (parâmetro ?acao=):
 *   - salvarProjetos&dados=<json>   -> grava a aba "Projetos"
 *   - carregarProjetos              -> { sucesso, projetos: [...] }
 *   - salvarPDI&dados=<json>        -> grava a aba "PDI"
 *   - carregarPDI                   -> { sucesso, pdi: {...} }
 */

var SHEET_ID = "1Z3tQZtCOP6rLAmqIefqAbLpQwmnqRemGSx_iPbiGIms";
var ABA_PROJETOS = "Projetos";
var ABA_PDI = "PDI";

// Ordem das colunas na aba "Projetos"
var COLS_PROJETOS = [
  "id", "nome", "desc", "status", "prazo", "inicio", "conclusao",
  "next", "progresso", "notas", "aprendizado", "color", "arquivos"
];

function doGet(e) {
  var acao = (e && e.parameter && e.parameter.acao) || "";
  var callback = (e && e.parameter && e.parameter.callback) || "callback";
  var resposta;

  try {
    switch (acao) {
      case "salvarProjetos":
        resposta = salvarProjetos(e.parameter.dados);
        break;
      case "carregarProjetos":
        resposta = carregarProjetos();
        break;
      case "salvarPDI":
        resposta = salvarPDI(e.parameter.dados);
        break;
      case "carregarPDI":
        resposta = carregarPDI();
        break;
      default:
        resposta = { sucesso: false, erro: "acao desconhecida: " + acao };
    }
  } catch (err) {
    resposta = { sucesso: false, erro: String(err) };
  }

  return jsonp(callback, resposta);
}

/* ----------------- Helpers ----------------- */

function jsonp(callback, obj) {
  var saida = callback + "(" + JSON.stringify(obj) + ");";
  return ContentService
    .createTextOutput(saida)
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function getPlanilha() {
  return SpreadsheetApp.openById(SHEET_ID);
}

function getAba(nome) {
  var ss = getPlanilha();
  var aba = ss.getSheetByName(nome);
  if (!aba) aba = ss.insertSheet(nome);
  return aba;
}

/* ----------------- Projetos ----------------- */

function salvarProjetos(dadosJson) {
  var projetos = JSON.parse(dadosJson || "[]");
  var aba = getAba(ABA_PROJETOS);
  aba.clear();

  // cabeçalho
  aba.getRange(1, 1, 1, COLS_PROJETOS.length).setValues([COLS_PROJETOS]);

  if (projetos.length) {
    var linhas = projetos.map(function (p) {
      return COLS_PROJETOS.map(function (col) {
        var v = p[col];
        if (col === "arquivos") return JSON.stringify(v || []);
        return (v === undefined || v === null) ? "" : v;
      });
    });
    aba.getRange(2, 1, linhas.length, COLS_PROJETOS.length).setValues(linhas);
  }

  return { sucesso: true, total: projetos.length };
}

function carregarProjetos() {
  var aba = getAba(ABA_PROJETOS);
  var valores = aba.getDataRange().getValues();
  if (valores.length < 2) return { sucesso: true, projetos: [] };

  var header = valores[0];
  var projetos = [];

  for (var i = 1; i < valores.length; i++) {
    var linha = valores[i];
    if (!linha[0] && !linha[1]) continue; // pula linhas vazias
    var p = {};
    for (var c = 0; c < header.length; c++) {
      var col = header[c];
      var val = linha[c];
      if (col === "arquivos") {
        try { p[col] = JSON.parse(val || "[]"); } catch (e2) { p[col] = []; }
      } else if (col === "id" || col === "progresso" || col === "color") {
        p[col] = val === "" ? 0 : Number(val);
      } else {
        p[col] = val;
      }
    }
    projetos.push(p);
  }

  return { sucesso: true, projetos: projetos };
}

/* ----------------- PDI ----------------- */

function salvarPDI(dadosJson) {
  var pdi = JSON.parse(dadosJson || "{}");
  var aba = getAba(ABA_PDI);
  aba.clear();

  aba.getRange(1, 1, 4, 2).setValues([
    ["Campo", "Valor"],
    ["ondeEstou", pdi.ondeEstou || ""],
    ["ondeVou", pdi.ondeVou || ""],
    ["resultados", pdi.resultados || ""]
  ]);

  // Ações: cabeçalho + linhas
  var acoes = pdi.acoes || [];
  aba.getRange(6, 1, 1, 3).setValues([["acao_texto", "acao_prazo", "acao_done"]]);
  if (acoes.length) {
    var linhas = acoes.map(function (a) {
      return [a.texto || "", a.prazo || "", a.done ? "TRUE" : "FALSE"];
    });
    aba.getRange(7, 1, linhas.length, 3).setValues(linhas);
  }

  return { sucesso: true };
}

function carregarPDI() {
  var aba = getAba(ABA_PDI);
  var valores = aba.getDataRange().getValues();
  if (!valores.length) return { sucesso: true, pdi: {} };

  var pdi = { ondeEstou: "", ondeVou: "", resultados: "", acoes: [] };

  // Campos simples (linhas 2-4, índice 1-3)
  for (var i = 1; i <= 3 && i < valores.length; i++) {
    var campo = valores[i][0];
    var valor = valores[i][1];
    if (campo === "ondeEstou") pdi.ondeEstou = valor;
    if (campo === "ondeVou") pdi.ondeVou = valor;
    if (campo === "resultados") pdi.resultados = valor;
  }

  // Ações começam na linha 7 (índice 6)
  for (var j = 6; j < valores.length; j++) {
    var texto = valores[j][0];
    if (!texto) continue;
    pdi.acoes.push({
      texto: texto,
      prazo: valores[j][1] || "",
      done: String(valores[j][2]).toUpperCase() === "TRUE"
    });
  }

  return { sucesso: true, pdi: pdi };
}
