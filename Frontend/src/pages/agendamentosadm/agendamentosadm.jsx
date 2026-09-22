import { useState } from "react";

import {
    FiSearch,
    FiCalendar,
    FiSliders,
    FiChevronDown,
    FiChevronLeft,
    FiChevronRight
} from "react-icons/fi";

import estilo from "./agendamentosadm.module.css";


// =====================================================
// DADOS DEMONSTRATIVOS
// =====================================================

const agendamentosIniciais = [
    {
        id: 1,
        cliente: "Seu Jorge",
        servico: "Corte de Cabelo",
        horario: "09:00 - 09:30",
        data: "05/08/2026",
        status: "Concluído"
    },
    {
        id: 2,
        cliente: "sr Orelha Direita",
        servico: "Barba + Sobrancelha",
        horario: "10:30 - 12:00",
        data: "28/07/2026",
        status: "Pendente"
    },
    {
        id: 3,
        cliente: "Diogo Oliveira",
        servico: "Corte Completo",
        horario: "14:00 - 15:00",
        data: "27/06/2026",
        status: "Cancelado"
    },
    {
        id: 4,
        cliente: "sr Orelha Esquerda",
        servico: "Cabelo e Barba",
        horario: "11:00 - 12:00",
        data: "27/06/2026",
        status: "Concluído"
    },
    {
        id: 5,
        cliente: "Prescinotti",
        servico: "Corte de Cabelo",
        horario: "08:00 - 09:00",
        data: "26/06/2026",
        status: "Concluído"
    },
    {
        id: 6,
        cliente: "Carlos Santos",
        servico: "Barba",
        horario: "15:00 - 15:30",
        data: "25/06/2026",
        status: "Pendente"
    },
    {
        id: 7,
        cliente: "Marcos Silva",
        servico: "Corte Degradê",
        horario: "16:00 - 17:00",
        data: "24/06/2026",
        status: "Concluído"
    },
    {
        id: 8,
        cliente: "João Pedro",
        servico: "Corte + Barba",
        horario: "13:00 - 14:00",
        data: "23/06/2026",
        status: "Cancelado"
    }
];


// =====================================================
// COMPONENTE: CABEÇALHO
// =====================================================

function CabecalhoAgendamentos() {

    return (
        <section className={estilo.cabecalhoPagina}>

            <h1>AGENDAMENTOS</h1>

            <p>
                Gerencie e visualize todos os atendimentos da barbearia.
            </p>

        </section>
    );
}


// =====================================================
// COMPONENTE: FILTROS
// =====================================================

function FiltrosAgendamentos({
                                 busca,
                                 setBusca,
                                 filtroStatus,
                                 setFiltroStatus,
                                 filtroData,
                                 setFiltroData
                             }) {

    const [mostrarStatus, setMostrarStatus] = useState(false);
    const [mostrarData, setMostrarData] = useState(false);

    return (
        <section className={estilo.filtros}>

            {/* BUSCA */}

            <div className={estilo.campoBusca}>

                <FiSearch />

                <input
                    type="text"
                    placeholder="Pesquisar por cliente"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                />

            </div>


            {/* FILTROS DA DIREITA */}

            <div className={estilo.filtrosDireita}>

                {/* FILTRO DE DATA */}

                <div className={estilo.filtroWrapper}>

                    <button
                        className={estilo.botaoFiltro}
                        onClick={() => {
                            setMostrarData(!mostrarData);
                            setMostrarStatus(false);
                        }}
                    >
                        <FiCalendar />

                        Filtrar por data

                        <FiChevronDown
                            className={
                                mostrarData
                                    ? estilo.iconeRotacionado
                                    : ""
                            }
                        />

                    </button>

                    {mostrarData && (

                        <div className={estilo.dropdown}>

                            <button
                                onClick={() => {
                                    setFiltroData("todas");
                                    setMostrarData(false);
                                }}
                            >
                                Todas as datas
                            </button>

                            <button
                                onClick={() => {
                                    setFiltroData("recentes");
                                    setMostrarData(false);
                                }}
                            >
                                Mais recentes
                            </button>

                            <button
                                onClick={() => {
                                    setFiltroData("antigas");
                                    setMostrarData(false);
                                }}
                            >
                                Mais antigas
                            </button>

                        </div>

                    )}

                </div>


                {/* FILTRO DE STATUS */}

                <div className={estilo.filtroWrapper}>

                    <button
                        className={estilo.botaoFiltro}
                        onClick={() => {
                            setMostrarStatus(!mostrarStatus);
                            setMostrarData(false);
                        }}
                    >
                        <FiSliders />

                        Status

                    </button>

                    {mostrarStatus && (

                        <div className={estilo.dropdown}>

                            <button
                                onClick={() => {
                                    setFiltroStatus("Todos");
                                    setMostrarStatus(false);
                                }}
                            >
                                Todos
                            </button>

                            <button
                                onClick={() => {
                                    setFiltroStatus("Concluído");
                                    setMostrarStatus(false);
                                }}
                            >
                                Concluídos
                            </button>

                            <button
                                onClick={() => {
                                    setFiltroStatus("Pendente");
                                    setMostrarStatus(false);
                                }}
                            >
                                Pendentes
                            </button>

                            <button
                                onClick={() => {
                                    setFiltroStatus("Cancelado");
                                    setMostrarStatus(false);
                                }}
                            >
                                Cancelados
                            </button>

                        </div>

                    )}

                </div>

            </div>

        </section>
    );
}


// =====================================================
// COMPONENTE: STATUS
// =====================================================

function StatusAgendamento({ status }) {

    const classeStatus = {

        "Concluído": estilo.statusConcluido,

        "Pendente": estilo.statusPendente,

        "Cancelado": estilo.statusCancelado

    };

    return (
        <span className={`${estilo.status} ${classeStatus[status]}`}>
            {status.toUpperCase()}
        </span>
    );
}


// =====================================================
// COMPONENTE: LINHA DA TABELA
// =====================================================

function LinhaAgendamento({ agendamento, indice }) {

    return (
        <tr
            style={{
                "--delay": `${indice * 0.08}s`
            }}
        >

            <td className={estilo.cliente}>
                {agendamento.cliente}
            </td>

            <td className={estilo.servico}>
                {agendamento.servico}
            </td>

            <td className={estilo.horario}>
                {agendamento.horario}
            </td>

            <td className={estilo.data}>
                {agendamento.data}
            </td>

            <td className={estilo.statusColuna}>
                <StatusAgendamento status={agendamento.status} />
            </td>

        </tr>
    );
}


// =====================================================
// COMPONENTE: TABELA
// =====================================================

function TabelaAgendamentos({ agendamentos }) {

    return (
        <div className={estilo.tabelaWrapper}>

            <table>

                <thead>

                <tr>

                    <th>CLIENTE</th>

                    <th>SERVIÇO</th>

                    <th>HORÁRIO</th>

                    <th>DATA</th>

                    <th>STATUS</th>

                </tr>

                </thead>

                <tbody>

                {agendamentos.length > 0 ? (

                    agendamentos.map((agendamento, indice) => (

                        <LinhaAgendamento
                            key={agendamento.id}
                            agendamento={agendamento}
                            indice={indice}
                        />

                    ))

                ) : (

                    <tr>

                        <td
                            colSpan="5"
                            className={estilo.semResultados}
                        >
                            Nenhum agendamento encontrado.
                        </td>

                    </tr>

                )}

                </tbody>

            </table>

        </div>
    );
}


// =====================================================
// COMPONENTE: PAGINAÇÃO
// =====================================================

function Paginacao({
                       paginaAtual,
                       setPaginaAtual,
                       totalPaginas,
                       totalResultados,
                       inicio,
                       fim
                   }) {

    return (
        <div className={estilo.rodapeTabela}>

            <p>
                Exibindo {totalResultados === 0 ? 0 : inicio + 1}-
                {Math.min(fim, totalResultados)} de{" "}
                {totalResultados} agendamentos
            </p>

            <div className={estilo.paginacao}>

                <button
                    disabled={paginaAtual === 1}
                    onClick={() =>
                        setPaginaAtual(paginaAtual - 1)
                    }
                    aria-label="Página anterior"
                >
                    <FiChevronLeft />
                </button>

                {Array.from(
                    { length: totalPaginas },
                    (_, indice) => indice + 1
                ).map((pagina) => (

                    <button
                        key={pagina}
                        className={
                            paginaAtual === pagina
                                ? estilo.paginaAtiva
                                : ""
                        }
                        onClick={() => setPaginaAtual(pagina)}
                    >
                        {pagina}
                    </button>

                ))}

                <button
                    disabled={paginaAtual === totalPaginas}
                    onClick={() =>
                        setPaginaAtual(paginaAtual + 1)
                    }
                    aria-label="Próxima página"
                >
                    <FiChevronRight />
                </button>

            </div>

        </div>
    );
}


// =====================================================
// PÁGINA PRINCIPAL
// =====================================================

function AgendamentosAdm() {

    const [busca, setBusca] = useState("");

    const [filtroStatus, setFiltroStatus] = useState("Todos");

    const [filtroData, setFiltroData] = useState("todas");

    const [paginaAtual, setPaginaAtual] = useState(1);

    const itensPorPagina = 5;


    // =================================================
    // FILTRAGEM
    // =================================================

    const agendamentosFiltrados = agendamentosIniciais
        .filter((agendamento) => {

            const correspondeBusca =
                agendamento.cliente
                    .toLowerCase()
                    .includes(busca.toLowerCase());

            const correspondeStatus =
                filtroStatus === "Todos" ||
                agendamento.status === filtroStatus;

            return correspondeBusca && correspondeStatus;

        })
        .sort((a, b) => {

            if (filtroData === "recentes") {
                return b.id - a.id;
            }

            if (filtroData === "antigas") {
                return a.id - b.id;
            }

            return a.id - b.id;

        });


    // =================================================
    // PAGINAÇÃO
    // =================================================

    const totalResultados = agendamentosFiltrados.length;

    const totalPaginas = Math.max(
        1,
        Math.ceil(totalResultados / itensPorPagina)
    );

    const paginaCorrigida = Math.min(
        paginaAtual,
        totalPaginas
    );

    const inicio = (paginaCorrigida - 1) * itensPorPagina;

    const fim = inicio + itensPorPagina;

    const agendamentosPagina =
        agendamentosFiltrados.slice(inicio, fim);


    function atualizarBusca(valor) {
        setBusca(valor);
        setPaginaAtual(1);
    }


    function atualizarStatus(valor) {
        setFiltroStatus(valor);
        setPaginaAtual(1);
    }


    function atualizarData(valor) {
        setFiltroData(valor);
        setPaginaAtual(1);
    }


    return (

        <main className={estilo.pagina}>

            <div className={estilo.conteudo}>

                <CabecalhoAgendamentos />

                <FiltrosAgendamentos
                    busca={busca}
                    setBusca={atualizarBusca}
                    filtroStatus={filtroStatus}
                    setFiltroStatus={atualizarStatus}
                    filtroData={filtroData}
                    setFiltroData={atualizarData}
                />

                <TabelaAgendamentos
                    agendamentos={agendamentosPagina}
                />

                <Paginacao
                    paginaAtual={paginaCorrigida}
                    setPaginaAtual={setPaginaAtual}
                    totalPaginas={totalPaginas}
                    totalResultados={totalResultados}
                    inicio={inicio}
                    fim={fim}
                />

            </div>

        </main>

    );
}

export default AgendamentosAdm;