import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import styles from "./Agendamento.module.css";
import MensagemCard from "../../components/MensagemCard/MensagemCard.jsx";
import { API_URL } from "../../services/api";

/* ============================================================
   CONFIGURAÇÃO — ajuste aqui se o seu projeto for diferente
   ============================================================ */

// Chave do localStorage onde o login guarda o token (se usar Bearer).
// Se a sessão for por cookie, pode ignorar: o fetch já envia cookies.
const CHAVE_TOKEN = "token";

// Nome do campo que ids_servicos_da_requisicao() (funcoes.py) lê.
const CHAVE_SERVICOS = "ids_servicos";

// Campo que confirmar_resumo() (funcoes.py) lê em /criar_agendamento:
// o hash HMAC devolvido em resumo.confirmacao_resumo por /resumo_agendamento.
const CHAVE_RESUMO = "confirmacao_resumo";

const DIAS_AGENDAVEIS = 30; // quantos dias à frente o cliente pode escolher
const DIAS_VISIVEIS = 7; // quantos cards de dia aparecem de uma vez

// Para onde enviar o cliente quando o backend responder 401 (sem sessão).
const ROTA_LOGIN = "/login";

// Rota da página de visagismo (confira se é a mesma registrada no seu router).
const ROTA_VISAGISMO = "/visagismo";

// Serviços de pintura exigem a cor do cabelo no agendamento.
const SERVICO_PINTURA = /pintur|color/i;
const eServicoPintura = (servico) =>
    SERVICO_PINTURA.test(`${servico?.nome ?? ""} ${servico?.tipo ?? ""}`);

const valorCor = (cor) =>
    typeof cor === "string" ? cor : cor?.hex || cor?.cor || cor?.nome || "";
const nomeCor = (cor) =>
    typeof cor === "string" ? cor : cor?.nome || cor?.cor || cor?.hex || "";

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

    const textoQuery = query.toString();
    const url = `${API_URL}${caminho}${textoQuery ? `?${textoQuery}` : ""}`;

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
   /agendamento?usuario=7  (como o Estabelecimento.jsx envia: id do
   usuário dono; a barbearia é resolvida em /listar_barbearias_disponiveis)
   /agendamento?barbearia=3&servicos=1,4&funcionario=2  (pré-seleção)
   ============================================================ */

function useParametrosAgendamento() {
    const { state } = useLocation();
    const [busca] = useSearchParams();
    const origem = state ?? {};

    const idBarbearia =
        Number(origem.idBarbearia ?? busca.get("barbearia")) || null;

    const idUsuario =
        Number(origem.idUsuario ?? busca.get("usuario")) || null;

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
        idUsuario,
        idFuncionario,
        idsServicos,
        idCorte: origem.idCorte ?? busca.get("corte") ?? null,
        idVisagismo: origem.idVisagismo ?? busca.get("visagismo") ?? null,
        corCabelo: origem.corCabelo ?? busca.get("cor") ?? null,
        // "horario" quando o cliente volta do visagismo
        etapa: origem.etapa ?? null,
    };
}

/* ============================================================
   COMPONENTE
   ============================================================ */

function Agendamento({ aoAgendar }) {
    const navigate = useNavigate();
    const { pathname, search } = useLocation();

    const {
        idBarbearia: idBarbeariaParam,
        idUsuario,
        idFuncionario: idFuncionarioInicial,
        idsServicos: idsServicosIniciais,
        idCorte: idCorteInicial,
        idVisagismo: idVisagismoInicial,
        corCabelo: corCabeloInicial,
        etapa: etapaInicial,
    } = useParametrosAgendamento();

    // Etapas: "servicos" -> (visagismo ou pular) -> "horario"
    const [etapa, setEtapa] = useState(
        etapaInicial === "horario" && idsServicosIniciais.length > 0
            ? "horario"
            : "servicos"
    );

    // Resultado do visagismo (vem do state quando o cliente retorna dele)
    const [idCorte, setIdCorte] = useState(idCorteInicial);
    const [idVisagismo, setIdVisagismo] = useState(idVisagismoInicial);
    const [corCabelo, setCorCabelo] = useState(corCabeloInicial);
    const [coresCabelo, setCoresCabelo] = useState([]);

    // Barbearia: vem pronta (state/URL) ou é resolvida a partir do dono (?usuario=)
    const [idBarbearia, setIdBarbearia] = useState(idBarbeariaParam);
    const [resolvendoBarbearia, setResolvendoBarbearia] = useState(
        !idBarbeariaParam && Boolean(idUsuario)
    );
    const [falhaBarbearia, setFalhaBarbearia] = useState(null);

    // Catálogo da barbearia e escolhas do cliente
    const [catalogoServicos, setCatalogoServicos] = useState([]);
    const [profissionais, setProfissionais] = useState([]);
    const [catalogoCarregado, setCatalogoCarregado] = useState(false);
    const [idsServicos, setIdsServicos] = useState(idsServicosIniciais);
    const [idFuncionario, setIdFuncionario] = useState(idFuncionarioInicial);

    const chaveServicos = [...idsServicos].sort((a, b) => a - b).join(",");
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

    const irParaLogin = useCallback(() => navigate(ROTA_LOGIN), [navigate]);

    // Mudar os serviços invalida o visagismo já feito (o catálogo de cortes depende deles)
    const limparVisagismo = () => {
        setIdVisagismo(null);
        setIdCorte(null);
        setCorCabelo(null);
    };

    const alternarServico = (id) => {
        limparVisagismo();
        setIdsServicos((atuais) =>
            atuais.includes(id)
                ? atuais.filter((outro) => outro !== id)
                : [...atuais, id]
        );
    };

    const temPintura = catalogoServicos.some(
        (servico) =>
            idsServicos.includes(Number(servico.id_servico)) &&
            eServicoPintura(servico)
    );

    const irParaVisagismo = () => {
        if (!parametrosValidos) return;

        navigate(ROTA_VISAGISMO, {
            state: {
                idBarbearia,
                idUsuario,
                idsServicos,
                idFuncionario,
                permitirColoracao: temPintura,
                retorno: `${pathname}${search}`,
            },
        });
    };

    const pularVisagismo = () => {
        if (!parametrosValidos) return;

        limparVisagismo();
        setEtapa("horario");
    };

    const voltarParaServicos = () => setEtapa("servicos");

    /* ---------- GET /listar_barbearias_disponiveis (?usuario= -> barbearia) ---------- */

    useEffect(() => {
        if (idBarbeariaParam) {
            setIdBarbearia(idBarbeariaParam);
            setResolvendoBarbearia(false);
            return;
        }

        if (!idUsuario) {
            setResolvendoBarbearia(false);
            return;
        }

        const controle = new AbortController();

        setResolvendoBarbearia(true);
        setFalhaBarbearia(null);

        (async () => {
            try {
                const { ok, dados } = await requisitar(
                    "/listar_barbearias_disponiveis",
                    { signal: controle.signal }
                );

                if (!ok) {
                    setFalhaBarbearia(
                        paraMensagem(
                            dados,
                            false,
                            "Não foi possível carregar a barbearia."
                        )
                    );
                    return;
                }

                const encontrada = (Array.isArray(dados) ? dados : []).find(
                    (item) => Number(item.id_usuario) === Number(idUsuario)
                );

                if (!encontrada?.id_barbearia) {
                    setFalhaBarbearia({
                        tipo: "erro",
                        informacao: "Barbearia não encontrada ou indisponível.",
                    });
                    return;
                }

                setIdBarbearia(Number(encontrada.id_barbearia));
            } catch (erro) {
                if (erro.name === "AbortError") return;

                setFalhaBarbearia({ tipo: "erro", informacao: ERRO_REDE });
            } finally {
                if (!controle.signal.aborted) setResolvendoBarbearia(false);
            }
        })();

        return () => controle.abort();
    }, [idBarbeariaParam, idUsuario]);

    /* ---------- barbearia ausente / não encontrada ---------- */

    useEffect(() => {
        if (resolvendoBarbearia || idBarbearia) return;

        mostrarMensagem(
            falhaBarbearia ?? {
                tipo: "erro",
                informacao: "Escolha a barbearia antes de selecionar o horário.",
            },
            () => navigate(-1)
        );
    }, [
        resolvendoBarbearia,
        idBarbearia,
        falhaBarbearia,
        mostrarMensagem,
        navigate,
    ]);

    /* ---------- GET /barbearia/servicos + /listar_funcionarios_barbearia ---------- */

    useEffect(() => {
        if (!idBarbearia) return;

        const controle = new AbortController();

        setCatalogoCarregado(false);

        (async () => {
            try {
                const [respServicos, respEquipe] = await Promise.all([
                    requisitar("/barbearia/servicos", {
                        params: { id_barbearia: idBarbearia },
                        signal: controle.signal,
                    }),
                    requisitar(`/listar_funcionarios_barbearia/${idBarbearia}`, {
                        signal: controle.signal,
                    }),
                ]);

                if (!respServicos.ok) {
                    mostrarMensagem(
                        paraMensagem(
                            respServicos.dados,
                            false,
                            "Não foi possível carregar os serviços."
                        )
                    );
                    return;
                }

                // O backend devolve também os serviços desativados (ativo: false)
                const servicos = (
                    Array.isArray(respServicos.dados) ? respServicos.dados : []
                ).filter((servico) => servico.ativo !== false);

                const equipe =
                    respEquipe.ok && Array.isArray(respEquipe.dados)
                        ? respEquipe.dados
                        : [];

                setCatalogoServicos(servicos);
                setProfissionais(equipe);

                // Descarta pré-seleções (state/URL) que não existem mais na loja
                const idsValidos = new Set(
                    servicos.map((servico) => Number(servico.id_servico))
                );
                setIdsServicos((atuais) =>
                    atuais.filter((id) => idsValidos.has(id))
                );
                setIdFuncionario((atual) =>
                    equipe.some((p) => Number(p.id_funcionario) === atual)
                        ? atual
                        : null
                );
            } catch (erro) {
                if (erro.name === "AbortError") return;

                mostrarMensagem({ tipo: "erro", informacao: ERRO_REDE });
            } finally {
                if (!controle.signal.aborted) setCatalogoCarregado(true);
            }
        })();

        return () => controle.abort();
    }, [idBarbearia, mostrarMensagem]);

    /* ---------- GET /cores_cabelo_visagismo (só para serviços de pintura) ---------- */

    useEffect(() => {
        if (etapa !== "horario" || !temPintura || coresCabelo.length > 0) return;

        const controle = new AbortController();

        (async () => {
            try {
                const { ok, dados } = await requisitar("/cores_cabelo_visagismo", {
                    signal: controle.signal,
                });

                if (ok && Array.isArray(dados?.opcoes)) {
                    setCoresCabelo(dados.opcoes);
                }
            } catch (erro) {
                if (erro.name === "AbortError") return;
            }
        })();

        return () => controle.abort();
    }, [etapa, temPintura, coresCabelo.length]);

    /* ---------- GET /listar_horarios_agendamento ---------- */

    const dataISO = diaAtual.iso;

    // Só busca horários quando o cliente já está na etapa de horário
    const buscarHorarios = parametrosValidos && etapa === "horario";

    useEffect(() => {
        if (!buscarHorarios) {
            setHorarios([]);
            setDetalhes(null);
            setHorarioSelecionado(null);
            setCarregando(false);
            return;
        }

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
        buscarHorarios,
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

        if (temPintura && !corCabelo) {
            mostrarMensagem({
                tipo: "erro",
                informacao: "Escolha a cor do cabelo para o serviço de pintura.",
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
            cor_cabelo: temPintura ? corCabelo : null,
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
                    ),
                    // 401 = sem sessão: leva o cliente ao login
                    resumo.status === 401 ? irParaLogin : null
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
                    [CHAVE_RESUMO]: resumo.dados?.resumo?.confirmacao_resumo,
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
                    // 401 = sessão expirada: leva o cliente ao login
                    criado.status === 409
                        ? recarregarHorarios
                        : criado.status === 401
                            ? irParaLogin
                            : null
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
                <h1>
                    {etapa === "servicos"
                        ? "Escolha seus serviços"
                        : tituloPeriodo(diasVisiveis)}
                </h1>
            </section>


            {/* SERVIÇOS E PROFISSIONAL */}
            {idBarbearia && etapa === "servicos" && (
                <section className={styles.escolhas}>

                    <h2>Serviços</h2>

                    {!catalogoCarregado ? (
                        <p className={styles.estadoHorarios}>
                            Carregando serviços...
                        </p>
                    ) : catalogoServicos.length === 0 ? (
                        <p className={styles.estadoHorarios}>
                            Nenhum serviço disponível nesta barbearia.
                        </p>
                    ) : (
                        <div className={styles.listaServicos}>

                            {catalogoServicos.map((servico) => {
                                const id = Number(servico.id_servico);
                                const marcado = idsServicos.includes(id);
                                const preco = formatarValor(servico.preco);

                                return (
                                    <button
                                        key={id}
                                        type="button"
                                        aria-pressed={marcado}
                                        className={cx(
                                            styles.servicoOpcao,
                                            marcado && styles.servicoAtivo
                                        )}
                                        onClick={() => alternarServico(id)}
                                    >
                                        <span className={styles.servicoNome}>
                                            {servico.nome}
                                        </span>

                                        <span className={styles.servicoInfo}>
                                            {servico.duracao
                                                ? `${servico.duracao} min`
                                                : null}
                                            {servico.duracao && preco
                                                ? " · "
                                                : null}
                                            {preco}
                                        </span>
                                    </button>
                                );
                            })}

                        </div>
                    )}

                    {profissionais.length > 0 && (
                        <label className={styles.seletorProfissional}>
                            <span>Profissional</span>

                            <select
                                value={idFuncionario ?? ""}
                                onChange={(e) =>
                                    setIdFuncionario(
                                        Number(e.target.value) || null
                                    )
                                }
                            >
                                <option value="">Qualquer profissional</option>

                                {profissionais.map((p) => (
                                    <option
                                        key={p.id_funcionario}
                                        value={p.id_funcionario}
                                    >
                                        {p.nome}
                                    </option>
                                ))}
                            </select>
                        </label>
                    )}

                    {/* VISAGISMO COM IA OU PULAR */}
                    {catalogoCarregado && catalogoServicos.length > 0 && (
                        <div
                            style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "12px",
                                marginTop: "8px",
                            }}
                        >
                            <button
                                type="button"
                                className={styles.btnConfirmar}
                                style={{ margin: 0 }}
                                disabled={!parametrosValidos}
                                onClick={irParaVisagismo}
                            >
                                FAZER VISAGISMO COM IA
                            </button>

                            <button
                                type="button"
                                className={styles.btnConfirmar}
                                style={{
                                    margin: 0,
                                    background: "transparent",
                                    color: "inherit",
                                    border: "1px solid rgba(128, 128, 128, 0.5)",
                                }}
                                disabled={!parametrosValidos}
                                onClick={pularVisagismo}
                            >
                                PULAR E ESCOLHER HORÁRIO
                            </button>
                        </div>
                    )}

                    {!parametrosValidos && catalogoCarregado && (
                        <p className={styles.estadoHorarios}>
                            Selecione ao menos um serviço para continuar.
                        </p>
                    )}

                </section>
            )}


            {etapa === "horario" && (
                <>

                    {/* RESUMO DA ESCOLHA */}
                    <section
                        className={styles.escolhas}
                        style={{ maxWidth: "730px", margin: "0 auto 24px" }}
                    >
                        <p className={styles.servicoInfo}>
                            {catalogoServicos
                                .filter((s) => idsServicos.includes(Number(s.id_servico)))
                                .map((s) => s.nome)
                                .join(", ")}
                            {idVisagismo ? " · visagismo aplicado" : ""}
                        </p>

                        {temPintura && (
                            <label className={styles.seletorProfissional}>
                                <span>Cor do cabelo</span>

                                <select
                                    value={corCabelo ?? ""}
                                    onChange={(e) => setCorCabelo(e.target.value || null)}
                                >
                                    <option value="">Selecione a cor</option>

                                    {coresCabelo.map((cor, i) => (
                                        <option key={`${valorCor(cor)}-${i}`} value={valorCor(cor)}>
                                            {nomeCor(cor)}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        )}

                        <button
                            type="button"
                            className={styles.servicoOpcao}
                            style={{ width: "fit-content" }}
                            onClick={voltarParaServicos}
                        >
                            ‹ Alterar serviços
                        </button>
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


                        {!parametrosValidos ? (
                            <p className={styles.estadoHorarios}>
                                Selecione ao menos um serviço para ver os horários.
                            </p>
                        ) : carregando ? (
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
                            disabled={enviando || carregando || !parametrosValidos}
                        >
                            {enviando ? "AGENDANDO..." : "CONFIRMAR SELEÇÃO"}
                        </button>

                    </section>

                </>
            )}


            {/* MENSAGEM FLASH */}
            <MensagemCard mensagem={mensagem} fechar={fecharMensagem} />

        </main>
    );
}

export default Agendamento;