import { API_URL } from "./api";

// Rotas reais identificadas no barbearia.py, sem endpoints novos ou callbacks fictícios.
export const pagamentoRotas = {
    agendamentos: "/listar_agendamentos",
    cobrancas: (id) => `/cobrancas_do_agendamento/${id}`,
    presencial: "/confirmar_pagamento_na_hora",
    criarPix: "/criar_cobranca_pix",
    consultarPix: (id) => `/consultar_cobranca_pix/${encodeURIComponent(id)}`,
    criarBoleto: "/criar_cobranca_boleto",
    consultarBoleto: (id) => `/consultar_cobranca_boleto/${encodeURIComponent(id)}`,
    pdfBoleto: (id) => `/financeiro_boleto_pdf/${encodeURIComponent(id)}`,
    cartao: "/criar_cobranca_cartao",
};

const CHAVE_TOKEN = "token";

export class ErroPagamento extends Error {
    constructor(mensagem, status = 0, estado = null) {
        super(mensagem);
        this.name = "ErroPagamento";
        this.status = status;
        this.estado = estado;
    }
}

function headersAutenticados(json = false) {
    const headers = { Accept: json ? "application/json" : "application/json, application/pdf" };
    const token = localStorage.getItem(CHAVE_TOKEN);
    if (token) headers.Authorization = `Bearer ${token}`;
    if (json) headers["Content-Type"] = "application/json";
    return headers;
}

async function executar(caminho, { method = "GET", body, signal } = {}) {
    let resposta;
    try {
        resposta = await fetch(`${API_URL}${caminho}`, {
            method,
            headers: headersAutenticados(body !== undefined),
            credentials: "include",
            body: body === undefined ? undefined : JSON.stringify(body),
            signal,
        });
    } catch (erro) {
        if (erro.name === "AbortError") throw erro;
        throw new ErroPagamento("Não foi possível contatar o servidor. Consulte a situação antes de repetir uma cobrança.");
    }

    const dados = await resposta.json().catch(() => null);
    if (!resposta.ok) {
        const mensagem = dados?.mensagem?.informacao ||
            (typeof dados?.mensagem === "string" ? dados.mensagem : null) ||
            dados?.erro || `A solicitação falhou (HTTP ${resposta.status}).`;
        throw new ErroPagamento(mensagem, resposta.status, dados?.estado ?? null);
    }
    return dados;
}

export function idCobrancaDaDescricao(descricao, metodo) {
    if (typeof descricao !== "string") return null;
    const prefixo = metodo === "pix" ? "ARKHE:" : metodo === "boleto" ? "ARKHE_BOLETO:" : null;
    if (!prefixo || !descricao.startsWith(prefixo)) return null;
    const trecho = descricao.slice(prefixo.length);
    const match = /^(\d+)\s+ag#\d+(?:\s|$)/.exec(trecho);
    return match ? match[1] : null;
}

function montarAgendamento(id, agendamento, financeiro) {
    if (!financeiro || !Array.isArray(financeiro.cobrancas)) {
        throw new ErroPagamento("O servidor não retornou os dados financeiros do agendamento.", 502);
    }
    const confirmado = financeiro.reserva_efetivada === true;
    return {
        ...(agendamento || {}),
        id_agendamento: Number(id),
        valor_total: financeiro.valor_total ?? agendamento?.valor_total ?? null,
        status: agendamento?.status ?? (confirmado ? "agendado" : "aguardando_pagamento"),
        pagamento_status: financeiro.pagamento_status ?? agendamento?.pagamento_status ?? null,
        reserva_efetivada: financeiro.reserva_efetivada ?? agendamento?.reserva_efetivada ?? false,
        ...financeiro,
    };
}

// Consulta sempre o Firebird: a navegação/state não serve como comprovação de pagamento.
export async function consultarPagamento(id, signal) {
    const [financeiro, agendamentos] = await Promise.all([
        executar(pagamentoRotas.cobrancas(id), { signal }),
        executar(pagamentoRotas.agendamentos, { signal }),
    ]);
    const lista = agendamentos?.agendamentos;
    if (!Array.isArray(lista)) {
        throw new ErroPagamento("A lista de agendamentos retornou um formato inválido.", 502);
    }
    const encontrado = lista.find((item) => Number(item.id_agendamento) === Number(id));
    if (!encontrado) {
        throw new ErroPagamento("Este agendamento não aparece na sua conta.", 404);
    }
    return montarAgendamento(id, encontrado, financeiro);
}

export const escolherPresencial = (id) =>
    executar(pagamentoRotas.presencial, { method: "POST", body: { id_agendamento: Number(id) } });

export const criarPix = (id) =>
    executar(pagamentoRotas.criarPix, { method: "POST", body: { id_agendamento: Number(id) } });

export const consultarPix = (idCobranca) => executar(pagamentoRotas.consultarPix(idCobranca));

export const criarBoleto = (id, documento, vencimento) =>
    executar(pagamentoRotas.criarBoleto, {
        method: "POST",
        body: {
            id_agendamento: Number(id),
            documento_pagador: documento.replace(/\D/g, ""),
            data_vencimento: vencimento,
        },
    });

export const consultarBoleto = (idCobranca) =>
    executar(pagamentoRotas.consultarBoleto(idCobranca));

export const pagarCartao = (id, cartao) =>
    executar(pagamentoRotas.cartao, {
        method: "POST",
        body: {
            id_agendamento: Number(id),
            numero_cartao: cartao.numero_cartao.replace(/\D/g, ""),
            validade: cartao.validade,
            cvv: cartao.cvv,
            tipo: cartao.tipo,
            parcelas: Number(cartao.parcelas),
            salvar_cartao: false,
            prioridade: false,
        },
    });

// O PDF é protegido por sessão; fetch preserva cookie e Authorization (se houver).
export async function baixarBoleto(idCobranca) {
    let resposta;
    try {
        resposta = await fetch(`${API_URL}${pagamentoRotas.pdfBoleto(idCobranca)}`, {
            headers: headersAutenticados(),
            credentials: "include",
        });
    } catch {
        throw new ErroPagamento("Não foi possível buscar o PDF do boleto.");
    }
    if (!resposta.ok) {
        const dados = await resposta.json().catch(() => null);
        throw new ErroPagamento(dados?.mensagem?.informacao || "Não foi possível obter o boleto.", resposta.status);
    }
    const tipo = resposta.headers.get("Content-Type")?.toLowerCase() || "";
    if (!tipo.includes("application/pdf")) {
        throw new ErroPagamento("O servidor não retornou um PDF válido.", 502);
    }
    const arquivo = await resposta.blob();
    if (!arquivo.size) throw new ErroPagamento("O arquivo do boleto está vazio.", 502);
    const url = URL.createObjectURL(arquivo);
    const link = document.createElement("a");
    link.href = url;
    link.download = `boleto-cortae-${idCobranca}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
