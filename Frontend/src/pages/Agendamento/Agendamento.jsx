import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import styles from "./Agendamento.module.css";
import MensagemCard from "../../components/MensagemCard/MensagemCard.jsx";

/* ============================================================
   CONFIGURAÇÃO — ajuste aqui se o seu projeto for diferente
   ============================================================ */

// URL base do Flask. Em Vite: defina VITE_API_URL no .env
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

// Chave do localStorage onde o login guarda o token (se usar Bearer).
// Se a sessão for por cookie, pode ignorar: o fetch já envia cookies.
const CHAVE_TOKEN = "token";

// Nome do campo que ids_servicos_da_requisicao() (funcoes.py) lê.
const CHAVE_SERVICOS = "ids_servicos";

// Nome do campo que confirmar_resumo() (funcoes.py) lê em /criar_agendamento.
const CHAVE_RESUMO = "resumo";

const DIAS_AGENDAVEIS = 30; // quantos dias à frente o cliente pode escolher
const DIAS_VISIVEIS = 7; // quantos cards de dia aparecem de uma vez

const ERRO_REDE =
    "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.";

/* ============================================================
   UTILITÁRIOS
   ============================================================ */

const SEMANA_CURTA = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"];
const SEMANA_LONGA = [
    "Domingo",
    "Segunda",
    "Terça",
    "Quarta",
    "Quinta",
    "Sexta",
    "Sábado",
];
const MES_CURTO = [
    "JAN", "FEV", "MAR", "ABR", "MAI", "JUN",
    "JUL", "AGO", "SET", "OUT", "NOV", "DEZ",
];
const MES_LONGO = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const cx = (...classes) => classes.filter(Boolean).join(" ");

const dois = (n) => String(n).padStart(2, "0");

// Data local em YYYY-MM-DD (toISOString() deslocaria o dia por causa do fuso)
const paraISO = (data) =>
    `${data.getFullYear()}-${dois(data.getMonth() + 1)}-${dois(data.getDate())}`;

const formatarValor = (valor) =>
    Number.isFinite(Number(valor))
        ? Number(valor).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
        })
        : null;

function gerarDias() {
    const hoje = new Date();

    return Array.from({ length: DIAS_AGENDAVEIS }, (_, i) => {
        const data = new Date(
            hoje.getFullYear(),
            hoje.getMonth(),
            hoje.getDate() + i
        );

        return {
            iso: paraISO(data),
            semana: SEMANA_CURTA[data.getDay()],
            semanaLonga: SEMANA_LONGA[data.getDay()],
            numero: dois(data.getDate()),
            mes: MES_CURTO[data.getMonth()],
            mesIndice: data.getMonth(),
            ano: data.getFullYear(),
        };
    });
}

function tituloPeriodo(diasVisiveis) {
    const primeiro = diasVisiveis[0];
    const ultimo = diasVisiveis[diasVisiveis.length - 1];

    if (!primeiro) return "";

    if (primeiro.mesIndice === ultimo.mesIndice && primeiro.ano === ultimo.ano) {
        return `${MES_LONGO[primeiro.mesIndice]} ${primeiro.ano}`;
    }

    if (primeiro.ano === ultimo.ano) {
        return `${MES_LONGO[primeiro.mesIndice]}/${MES_LONGO[ultimo.mesIndice]} ${primeiro.ano}`;
    }

    return `${MES_LONGO[primeiro.mesIndice]} ${primeiro.ano}/${MES_LONGO[ultimo.mesIndice]} ${ultimo.ano}`;
}

/* ============================================================
   API
   ============================================================ */

async function requisitar(caminho, { metodo = "GET", corpo, params, signal } = {}) {
    const query = new URLSearchParams();

    Object.entries(params ?? {}).forEach(([chave, valor]) => {
        if (valor !== null && valor !== undefined && valor !== "") {
            query.append(chave, valor);
        }
    });

    const url = `${API_URL}${caminho}${query.size ? `?${query}` : ""}`;

    const headers = { Accept: "application/json" };
    if (corpo) headers["Content-Type"] = "application/json";

    const token = localStorage.getItem(CHAVE_TOKEN);
    if (token) headers.Authorization = `Bearer ${token}`;

    const resposta = await fetch(url, {
        method: metodo,
        headers,
        body: corpo ? JSON.stringify(corpo) : undefined,
        credentials: "include",
        signal,
    });

    // Erros 500 podem não vir em JSON; não deixe isso quebrar o fluxo.
    const dados = await resposta.json().catch(() => null);

    return { ok: resposta.ok, status: resposta.status, dados };
}

// O backend sempre responde { mensagem: { informacao, tipo } }.
// Converte isso (ou um fallback) no formato que o MensagemCard espera.
function paraMensagem(dados, ok, padrao) {
    const m = dados?.mensagem;

    if (m && typeof m === "object" && m.informacao) {
        return { tipo: m.tipo, informacao: m.informacao };
    }

    if (typeof m === "string" && m) {
        return { tipo: ok ? "sucesso" : "erro", informacao: m };
    }

    return { tipo: ok ? "sucesso" : "erro", informacao: padrao };
}

/* ============================================================
   PARÂMETROS DA PÁGINA (barbearia, serviços, profissional...)
   Vêm da tela anterior via navigate(..., { state }) ou pela URL:
   /agendamento?barbearia=3&servicos=1,4&funcionario=2
   ============================================================ */

function useParametrosAgendamento() {
    const { state } = useLocation();
    const [busca] = useSearchParams();
    const origem = state ?? {};

    const idBarbearia =
        Number(origem.idBarbearia ?? busca.get("barbearia")) || null;

    const idFuncionario =
        Number(origem.idFuncionario ?? busca.get("funcionario")) || null;

    const brutoServicos = origem.idsServicos ?? busca.get("servicos") ?? [];
    const idsServicos = (
        Array.isArray(brutoServicos)
            ? brutoServicos
            : String(brutoServicos).split(",")
    )
        .map(Number)
        .filter((id) => Number.isInteger(id) && id > 0);

    return {
        idBarbearia,
        idFuncionario,
        idsServicos,
        idCorte: origem.idCorte ?? busca.get("corte") ?? null,
        idVisagismo: origem.idVisagismo ?? busca.get("visagismo") ?? null,
        corCabelo: origem.corCabelo ?? busca.get("cor") ?? null,
    };
}

/* ============================================================
   COMPONENTE
   ============================================================ */

function Agendamento({ aoAgendar }) {
    const navigate = useNavigate();

    const {
        idBarbearia,
        idFuncionario,
        idsServicos,
        idCorte,
        idVisagismo,
        corCabelo,
    } = useParametrosAgendamento();

    const chaveServicos = idsServicos.join(",");
    const parametrosValidos = Boolean(idBarbearia) && idsServicos.length > 0;

    const dias = useMemo(gerarDias, []);

    const [diaSelecionado, setDiaSelecionado] = useState(0);
    const [inicioJanela, setInicioJanela] = useState(0);

    const [horarios, setHorarios] = useState([]);
    const [detalhes, setDetalhes] = useState(null);
    const [horarioSelecionado, setHorarioSelecionado] = useState(null);

    const [carregando, setCarregando] = useState(false);
    const [enviando, setEnviando] = useState(false);
    const [recarregar, setRecarregar] = useState(0);

    // Mensagem flash + ação opcional executada quando o cliente fecha o card
    const [mensagem, setMensagem] = useState(null);
    const acaoAoFechar = useRef(null);

    const diaAtual = dias[diaSelecionado];
    const diasVisiveis = dias.slice(inicioJanela, inicioJanela + DIAS_VISIVEIS);

    /* ---------- mensagens ---------- */

    const mostrarMensagem = useCallback((nova, depois = null) => {
        acaoAoFechar.current = depois;
        setMensagem(nova);
    }, []);

    const fecharMensagem = () => {
        const acao = acaoAoFechar.current;
        acaoAoFechar.current = null;
        setMensagem(null);
        acao?.();
    };

    const recarregarHorarios = useCallback(
        () => setRecarregar((n) => n + 1),
        []
    );

    /* ---------- barbearia/serviços ausentes ---------- */

    useEffect(() => {
        if (parametrosValidos) return;

        mostrarMensagem(
            {
                tipo: "erro",
                informacao:
                    "Escolha a barbearia e os serviços antes de selecionar o horário.",
            },
            () => navigate(-1)
        );
    }, [parametrosValidos, mostrarMensagem, navigate]);

    /* ---------- GET /listar_horarios_agendamento ---------- */

    const dataISO = diaAtual.iso;

    useEffect(() => {
        if (!parametrosValidos) return;

        const controle = new AbortController();

        setCarregando(true);
        setHorarioSelecionado(null);

        (async () => {
            try {
                const { ok, dados } = await requisitar(
                    "/listar_horarios_agendamento",
                    {
                        params: {
                            id_barbearia: idBarbearia,
                            [CHAVE_SERVICOS]: chaveServicos,
                            id_funcionario: idFuncionario,
                            data: dataISO,
                        },
                        signal: controle.signal,
                    }
                );

                if (!ok) {
                    setHorarios([]);
                    setDetalhes(null);
                    mostrarMensagem(
                        paraMensagem(
                            dados,
                            false,
                            "Não foi possível carregar os horários."
                        )
                    );
                    return;
                }

                setHorarios(Array.isArray(dados?.horarios) ? dados.horarios : []);
                setDetalhes({
                    duracao: dados?.duracao_minutos,
                    valor: dados?.valor_total,
                });
            } catch (erro) {
                if (erro.name === "AbortError") return;

                setHorarios([]);
                setDetalhes(null);
                mostrarMensagem({ tipo: "erro", informacao: ERRO_REDE });
            } finally {
                if (!controle.signal.aborted) setCarregando(false);
            }
        })();

        // Trocar de dia rápido cancela a requisição anterior
        return () => controle.abort();
    }, [
        parametrosValidos,
        idBarbearia,
        chaveServicos,
        idFuncionario,
        dataISO,
        recarregar,
        mostrarMensagem,
    ]);

    /* ---------- navegação entre dias ---------- */

    const selecionarDia = (index) => {
        if (index < 0 || index >= dias.length) return;

        setDiaSelecionado(index);

        // Mantém o dia escolhido sempre dentro da janela visível
        setInicioJanela((inicio) => {
            if (index < inicio) return index;
            if (index >= inicio + DIAS_VISIVEIS) return index - DIAS_VISIVEIS + 1;
            return inicio;
        });
    };

    const voltarDia = () => selecionarDia(diaSelecionado - 1);
    const avancarDia = () => selecionarDia(diaSelecionado + 1);

    const selecionarHorario = (horario) => {
        if (!horario.disponivel) return;

        setHorarioSelecionado(horario.horario);
    };

    /* ---------- POST /resumo_agendamento + POST /criar_agendamento ---------- */

    const confirmarAgendamento = async () => {
        if (enviando || carregando) return;

        if (!parametrosValidos) {
            mostrarMensagem({
                tipo: "erro",
                informacao:
                    "Escolha a barbearia e os serviços antes de selecionar o horário.",
            });
            return;
        }

        if (!horarioSelecionado) {
            mostrarMensagem({
                tipo: "erro",
                informacao: "Selecione um horário para continuar.",
            });
            return;
        }

        setEnviando(true);

        const base = {
            id_barbearia: idBarbearia,
            [CHAVE_SERVICOS]: idsServicos,
            id_funcionario: idFuncionario,
            id_corte: idCorte,
            id_visagismo: idVisagismo,
            cor_cabelo: corCabelo,
        };

        try {
            // 1) O backend exige o resumo (valores/taxas) antes de criar
            const resumo = await requisitar("/resumo_agendamento", {
                metodo: "POST",
                corpo: base,
            });

            if (!resumo.ok) {
                mostrarMensagem(
                    paraMensagem(
                        resumo.dados,
                        false,
                        "Não foi possível conferir os valores do agendamento."
                    )
                );
                return;
            }

            // 2) Cria o agendamento enviando a confirmação do resumo
            const criado = await requisitar("/criar_agendamento", {
                metodo: "POST",
                corpo: {
                    ...base,
                    data: dataISO,
                    horario: horarioSelecionado,
                    [CHAVE_RESUMO]: resumo.dados?.resumo,
                },
            });

            if (!criado.ok) {
                mostrarMensagem(
                    paraMensagem(
                        criado.dados,
                        false,
                        "Não foi possível concluir o agendamento."
                    ),
                    // 409 = horário tomado por outra pessoa: atualiza a grade
                    criado.status === 409 ? recarregarHorarios : null
                );
                return;
            }

            const retorno = paraMensagem(
                criado.dados,
                true,
                "Agendamento realizado!"
            );

            mostrarMensagem(
                {
                    ...retorno,
                    informacao:
                        `${retorno.informacao} ` +
                        `${diaAtual.semanaLonga}, ${diaAtual.numero} ${diaAtual.mes} ` +
                        `às ${horarioSelecionado}.`,
                },
                () => {
                    recarregarHorarios();
                    aoAgendar?.(criado.dados?.agendamento);
                }
            );
        } catch {
            mostrarMensagem({ tipo: "erro", informacao: ERRO_REDE });
        } finally {
            setEnviando(false);
        }
    };

    /* ---------- render ---------- */

    const valorFormatado = formatarValor(detalhes?.valor);

    return (
        <main className={styles.agendamentoPage}>

            {/* TÍTULO */}
            <section className={styles.agendamentoHeader}>
                <h1>{tituloPeriodo(diasVisiveis)}</h1>
            </section>


            {/* DIAS */}
            <section className={styles.seletorDias}>

                <button
                    className={styles.navegacaoDia}
                    onClick={voltarDia}
                    disabled={diaSelecionado === 0}
                    aria-label="Dia anterior"
                >
                    ‹
                </button>


                <div className={styles.diasContainer}>

                    {diasVisiveis.map((dia, i) => {
                        const index = inicioJanela + i;

                        return (
                            <button
                                key={dia.iso}
                                className={cx(
                                    styles.diaCard,
                                    diaSelecionado === index && styles.diaAtivo
                                )}
                                onClick={() => selecionarDia(index)}
                            >
                                <span className={styles.diaSemana}>
                                    {dia.semana}
                                </span>

                                <strong className={styles.diaNumero}>
                                    {dia.numero}
                                </strong>

                                <span className={styles.diaMes}>
                                    {dia.mes}
                                </span>
                            </button>
                        );
                    })}

                </div>


                <button
                    className={styles.navegacaoDia}
                    onClick={avancarDia}
                    disabled={diaSelecionado === dias.length - 1}
                    aria-label="Próximo dia"
                >
                    ›
                </button>

            </section>


            {/* HORÁRIOS */}
            <section className={styles.horariosSection}>

                <h2>
                    Horários Disponíveis para{" "}
                    <strong>
                        {diaAtual.semanaLonga}, {diaAtual.numero} {diaAtual.mes}
                    </strong>
                </h2>

                {!carregando && detalhes && (
                    <p className={styles.resumoAgendamento}>
                        {detalhes.duracao ? `${detalhes.duracao} min` : null}
                        {detalhes.duracao && valorFormatado ? " · " : null}
                        {valorFormatado}
                    </p>
                )}


                {carregando ? (
                    <p className={styles.estadoHorarios}>
                        Carregando horários...
                    </p>
                ) : horarios.length === 0 ? (
                    <p className={styles.estadoHorarios}>
                        Nenhum horário neste dia. Escolha outra data.
                    </p>
                ) : (
                    <div className={styles.horariosGrid}>

                        {horarios.map((item) => {

                            const ocupado = !item.disponivel;

                            const selecionado =
                                horarioSelecionado === item.horario;

                            return (
                                <button
                                    key={item.horario}
                                    disabled={ocupado}
                                    onClick={() => selecionarHorario(item)}
                                    className={cx(
                                        styles.horarioCard,
                                        ocupado && styles.horarioOcupado,
                                        selecionado && styles.horarioSelecionado
                                    )}
                                >

                                    <span className={styles.horarioTexto}>
                                        {item.horario}
                                    </span>


                                    {ocupado ? (
                                        <span
                                            className={cx(
                                                styles.horarioStatus,
                                                styles.ocupado
                                            )}
                                        >
                                            <span className={styles.xOcupado}>
                                                ×
                                            </span>

                                            Ocupado
                                        </span>
                                    ) : (
                                        <span className={styles.horarioStatus}>
                                            Disponível
                                        </span>
                                    )}


                                    {selecionado && (
                                        <span className={styles.checkHorario}>
                                            ✓
                                        </span>
                                    )}

                                </button>
                            );
                        })}

                    </div>
                )}


                {/* CONFIRMAR */}
                <button
                    className={styles.btnConfirmar}
                    onClick={confirmarAgendamento}
                    disabled={enviando || carregando}
                >
                    {enviando ? "AGENDANDO..." : "CONFIRMAR SELEÇÃO"}
                </button>

            </section>


            {/* MENSAGEM FLASH */}
            <MensagemCard mensagem={mensagem} fechar={fecharMensagem} />

        </main>
    );
}

export default Agendamento;