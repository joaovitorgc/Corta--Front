import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./Pagamento.module.css";
import MetodosPagamento from "../../components/ComponentesPagamento/MetodosPagamento";
import PixPagamento from "../../components/ComponentesPagamento/PixPagamento";
import BoletoPagamento from "../../components/ComponentesPagamento/BoletoPagamento";
import CartaoPagamento from "../../components/ComponentesPagamento/CartaoPagamento";
import {
    baixarBoleto,
    consultarBoleto,
    consultarPagamento,
    consultarPix,
    criarBoleto,
    criarPix,
    escolherPresencial,
    idCobrancaDaDescricao,
    pagarCartao,
} from "../../services/pagamentoApi.js";
import ResumoAgendamento from "../../components/ComponentesPagamento/ResumoAgendamento.jsx";

function pendenciaOnline(cobrancas) {
    for (const item of cobrancas || []) {
        if (item.tipo === "pix_pendente") {
            const id = idCobrancaDaDescricao(item.descricao, "pix");
            if (id) return { metodo: "pix", id };
        }
        if (item.tipo === "boleto_pendente") {
            const id = idCobrancaDaDescricao(item.descricao, "boleto");
            if (id) return { metodo: "boleto", id };
        }
    }
    return null;
}

export default function Pagamento() {
    const { idAgendamento } = useParams();
    const navigate = useNavigate();
    const id = /^[1-9]\d*$/.test(idAgendamento || "") && Number.isSafeInteger(Number(idAgendamento))
        ? Number(idAgendamento) : null;

    const [dados, setDados] = useState(null);
    const [metodo, setMetodo] = useState("presencial");
    const [pix, setPix] = useState(null);
    const [boleto, setBoleto] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [acao, setAcao] = useState("");
    const [erro, setErro] = useState("");
    const [aviso, setAviso] = useState("");
    const [operacaoIncerta, setOperacaoIncerta] = useState(false);
    const envioEmAndamento = useRef(false);

    const login = useCallback(() => {
        navigate("/login", { state: { retorno: `/pagamento/${id}` } });
    }, [id, navigate]);

    const tratarFalha = useCallback((falha, mensagemExtra = "") => {
        if (falha?.status === 401) {
            login();
            return;
        }
        setErro(`${falha?.message || "Não foi possível realizar a operação."}${mensagemExtra}`);
    }, [login]);

    const carregar = useCallback(async (signal) => {
        if (!id) {
            setErro("Identificador do agendamento inválido.");
            setCarregando(false);
            return null;
        }
        setCarregando(true);
        try {
            const resultado = await consultarPagamento(id, signal);
            if (signal?.aborted) return null;
            setDados(resultado);
            const pendencia = pendenciaOnline(resultado.cobrancas);
            if (pendencia) setMetodo(pendencia.metodo);
            return resultado;
        } catch (falha) {
            if (falha?.name !== "AbortError" && !signal?.aborted) tratarFalha(falha);
            return null;
        } finally {
            if (!signal?.aborted) setCarregando(false);
        }
    }, [id, tratarFalha]);

    useEffect(() => {
        // Ao navegar para outro ID, não manter os dados da reserva anterior na tela.
        setDados(null);
        setPix(null);
        setBoleto(null);
        setMetodo("presencial");
        setErro("");
        setAviso("");
        setOperacaoIncerta(false);
        const controller = new AbortController();
        carregar(controller.signal);
        return () => controller.abort();
    }, [carregar]);

    const executarAcao = async (nome, operacao, { incertoSeFalhar = false } = {}) => {
        if (envioEmAndamento.current) return null;
        envioEmAndamento.current = true;
        setAcao(nome);
        setErro("");
        setAviso("");
        try {
            return await operacao();
        } catch (falha) {
            // Em cartão, timeout/erro 5xx/estado incerto NÃO é uma recusa comprovada.
            if (incertoSeFalhar && (falha?.estado === "incerto" || falha?.status === 0 || falha?.status >= 500)) {
                setOperacaoIncerta(true);
                tratarFalha(falha, " Não tente cobrar novamente sem conferir a situação com a barbearia.");
            } else {
                tratarFalha(falha);
            }
            return null;
        } finally {
            envioEmAndamento.current = false;
            setAcao("");
        }
    };

    const pagamentos = dados?.cobrancas || [];
    const online = pendenciaOnline(pagamentos);
    const presencialPendente = dados?.pagamento_status === "na_hora_pendente" || dados?.na_hora_pendente === true;
    const pago = dados?.pagamento_status === "pago" || dados?.quitado === true;
    const confirmado = dados?.reserva_efetivada === true;
    const cartaoIncerto = ["incerto", "processando"].includes(dados?.cartao_estado) || (dados?.cartao_estado === "aprovado" && !pago) || operacaoIncerta;
    const cobrancaEmAndamento = Boolean(online) || pagamentos.some((item) => [
        "pix_pendente", "boleto_pendente", "cartao_pendente", "na_hora_pendente",
    ].includes(item.tipo));
    const podeIniciar = Boolean(dados) && !pago && !presencialPendente && !cartaoIncerto && !cobrancaEmAndamento &&
        dados?.status === "aguardando_pagamento";
    const operando = Boolean(acao) || carregando;

    const pendenciaPix = online?.metodo === "pix" ? online : null;
    const pendenciaBoleto = online?.metodo === "boleto" ? online : null;
    const pixAtual = pix?.id_cobranca && (!pendenciaPix || String(pix.id_cobranca) === pendenciaPix.id) ? pix : null;
    const boletoAtual = boleto?.id_cobranca && (!pendenciaBoleto || String(boleto.id_cobranca) === pendenciaBoleto.id) ? boleto : null;

    const confirmarPresencial = () => executarAcao("presencial", async () => {
        await escolherPresencial(id);
        const atualizado = await carregar();
        if (atualizado?.pagamento_status === "na_hora_pendente" && atualizado?.reserva_efetivada) {
            setAviso("Agendamento confirmado! O pagamento permanece pendente na barbearia.");
        } else if (atualizado) {
            setAviso("Opção registrada. Confira a situação da reserva exibida pelo servidor.");
        }
    });

    const gerarPix = () => executarAcao("criarPix", async () => {
        const criado = await criarPix(id);
        setPix(criado);
        setMetodo("pix");
        setAviso("Pix gerado. Use o código para pagar e depois consulte a situação.");
        await carregar();
    });

    const verificarPix = () => executarAcao("consultarPix", async () => {
        const idCobranca = pixAtual?.id_cobranca || pendenciaPix?.id;
        if (!idCobranca) return;
        const resposta = await consultarPix(idCobranca);
        setPix((atual) => ({ ...atual, ...resposta }));
        const atualizado = await carregar();
        if (resposta.pago && atualizado?.pagamento_status === "pago") {
            setAviso("Pagamento Pix confirmado pelo servidor.");
        } else if (resposta.pago) {
            setAviso("O recebimento foi informado pela Arkhé. Confira a situação da reserva.");
        } else setAviso("A cobrança Pix ainda não foi confirmada.");
    });

    const emitirBoleto = (documento, vencimento) => executarAcao("criarBoleto", async () => {
        const criado = await criarBoleto(id, documento, vencimento);
        setBoleto(criado);
        setMetodo("boleto");
        setAviso("Boleto emitido. Você pode baixar o PDF para realizar o pagamento.");
        await carregar();
    });

    const verificarBoleto = () => executarAcao("consultarBoleto", async () => {
        const idCobranca = boletoAtual?.id_cobranca || pendenciaBoleto?.id;
        if (!idCobranca) return;
        const resultado = await consultarBoleto(idCobranca);
        const atualizado = await carregar();
        if (resultado.pago && atualizado?.pagamento_status === "pago") {
            setAviso("Pagamento do boleto confirmado pelo servidor.");
        } else if (resultado.pago) {
            setAviso("O boleto foi pago, mas a confirmação da reserva precisa ser verificada.");
        } else setAviso("O boleto continua aguardando pagamento.");
    });

    const baixarPdf = () => executarAcao("pdf", async () => {
        const idCobranca = boletoAtual?.id_cobranca || pendenciaBoleto?.id;
        if (idCobranca) await baixarBoleto(idCobranca);
    });

    const pagarComCartao = (cartao) => executarAcao("cartao", async () => {
        // Nunca repetir automaticamente uma venda, mesmo em erro de rede.
        await pagarCartao(id, cartao);
        const atualizado = await carregar();
        if (atualizado?.pagamento_status === "pago") setAviso("Pagamento aprovado e registrado pelo backend.");
        else setAviso("A operação foi recebida. Confira a situação antes de tentar outra cobrança.");
    }, { incertoSeFalhar: true });

    const copiarPix = async (codigo) => {
        try {
            await navigator.clipboard.writeText(codigo);
            setAviso("Código Pix copiado.");
        } catch {
            setErro("Não foi possível copiar automaticamente. Selecione o código e copie manualmente.");
        }
    };

    function atualizar() {
        setErro("");
        setAviso("");
        carregar();
    }

    const metodoTravado = online?.metodo || null;
    return (
        <main className={styles.pagina}>
            <div className={styles.container}>
                <div className={styles.trilha}>CORTAÊ <span>/</span> AGENDAMENTO <span>/</span> PAGAMENTO</div>
                <header className={styles.cabecalho}>
                    <span className={styles.eyebrow}>FINALIZAR AGENDAMENTO</span>
                    <h1>{confirmado ? "Seu horário está reservado" : "Escolha como deseja pagar"}</h1>
                    <p>{confirmado
                        ? "Confira a situação da reserva e do pagamento registrada pelo servidor."
                        : "Depois de escolher uma forma de pagamento, confirmaremos a reserva conforme a disponibilidade."}</p>
                </header>

                {erro && <div role="alert" className={styles.alerta}>{erro}</div>}
                {aviso && <div role="status" className={styles.info}>{aviso}</div>}
                {carregando && !dados ? (
                    <div className={styles.carregamento}>Consultando seu agendamento...</div>
                ) : dados ? (
                    <div className={styles.grade}>
                        <div>
                            {presencialPendente && confirmado ? (
                                <section className={styles.finalizado} aria-live="polite">
                                    <div className={styles.seloConfirmacao} aria-hidden="true">✓</div>
                                    <h2>Agendamento confirmado</h2>
                                    <p>Você escolheu pagar na barbearia. Seu horário está reservado e <strong>o pagamento permanece pendente</strong>.</p>
                                    <div className={styles.avisoPendente}>
                                        <strong>Pagamento pendente</strong>
                                        <span>A barbearia registrará o recebimento quando você pagar.</span>
                                    </div>
                                </section>
                            ) : pago ? (
                                <section className={styles.finalizado} aria-live="polite">
                                    <div className={styles.seloConfirmacao} aria-hidden="true">✓</div>
                                    <h2>Pagamento identificado</h2>
                                    <p>{confirmado ? "Seu pagamento foi confirmado e o horário está reservado."
                                        : "O recebimento foi identificado, mas a confirmação do horário precisa ser verificada pela barbearia."}</p>
                                </section>
                            ) : cartaoIncerto ? (
                                <section className={styles.finalizado}>
                                    <h2>Pagamento em verificação</h2>
                                    <p>O resultado da tentativa de cartão está incerto ou em processamento. Não faça outra cobrança antes de conferir o registro com a barbearia.</p>
                                </section>
                            ) : metodoTravado ? (
                                <section className={styles.metodos}>
                                    <h2>Cobrança {metodoTravado === "pix" ? "Pix" : "por boleto"} já emitida</h2>
                                    <p>Há uma cobrança pendente para este agendamento. Consulte-a antes de iniciar outro pagamento.</p>
                                    {metodoTravado === "pix" ? (
                                        <PixPagamento pix={pixAtual} pendente={pendenciaPix} onConsultar={verificarPix} onCopiar={copiarPix} enviando={operando} />
                                    ) : (
                                        <BoletoPagamento boleto={boletoAtual} pendente={pendenciaBoleto} onConsultar={verificarBoleto} onBaixar={baixarPdf} enviando={operando} />
                                    )}
                                </section>
                            ) : cobrancaEmAndamento || !podeIniciar ? (
                                <section className={styles.finalizado}>
                                    <h2>Confira a situação do agendamento</h2>
                                    <p>Existe uma cobrança em aberto ou esta reserva não aceita novos pagamentos nesta etapa. Atualize a situação ou consulte a barbearia.</p>
                                </section>
                            ) : (
                                <MetodosPagamento metodo={metodo} onChange={setMetodo} disabled={operando}>
                                    {metodo === "presencial" && (
                                        <div className={styles.forma}>
                                            <h3>Pagar na barbearia</h3>
                                            <p>Confirme seu horário agora e pague pessoalmente durante o atendimento. Nenhuma cobrança será registrada como quitada nesta escolha.</p>
                                            <ul className={styles.beneficios}>
                                                <li>Agendamento sujeito à disponibilidade do horário</li>
                                                <li>O pagamento ficará marcado como pendente</li>
                                            </ul>
                                            <button type="button" className={styles.botaoPrincipal} onClick={confirmarPresencial} disabled={operando}>
                                                {acao === "presencial" ? "Confirmando..." : "Confirmar e pagar na barbearia"}
                                            </button>
                                        </div>
                                    )}
                                    {metodo === "pix" && <PixPagamento pix={pixAtual} pendente={pendenciaPix} onCriar={gerarPix} onConsultar={verificarPix} onCopiar={copiarPix} enviando={operando} />}
                                    {metodo === "boleto" && <BoletoPagamento boleto={boletoAtual} pendente={pendenciaBoleto} onCriar={emitirBoleto} onConsultar={verificarBoleto} onBaixar={baixarPdf} enviando={operando} />}
                                    {metodo === "cartao" && <CartaoPagamento onPagar={pagarComCartao} enviando={operando} />}
                                </MetodosPagamento>
                            )}
                            <button type="button" className={styles.botaoSecundario} onClick={atualizar} disabled={operando}>
                                {carregando ? "Atualizando..." : "Atualizar situação"}
                            </button>
                        </div>
                        <ResumoAgendamento agendamento={dados} />
                    </div>
                ) : (
                    <button type="button" className={styles.botaoSecundario} onClick={atualizar} disabled={carregando}>Tentar novamente</button>
                )}
            </div>
        </main>
    );
}
