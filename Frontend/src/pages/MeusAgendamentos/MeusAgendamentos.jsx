import { useState } from 'react';

import {
    FiCalendar,
    FiClock,
    FiX,
    FiInfo
} from 'react-icons/fi';


import estilo from './MeusAgendamento.module.css';


// =====================================================
// DADOS DOS AGENDAMENTOS
// =====================================================

const agendamentosIniciais = [
    {
        id: 1,
        barbearia: 'Barbearia do Zé',
        servico: 'Corte de Cabelo + Barba',
        data: '15 de Outubro, 2026',
        horario: '14:30',
        valor: 65,
        status: 'Pendente',
        imagem: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80'
    },
    {
        id: 2,
        barbearia: 'Barbearia do Zé',
        servico: 'Acabamento',
        data: '15 de Outubro, 2026',
        horario: '14:30',
        valor: 25,
        status: 'Pendente',
        imagem: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80'
    }
];


// =====================================================
// DADOS DO HISTÓRICO
// =====================================================

const historicoInicial = [
    {
        id: 3,
        barbearia: 'Barbearia do Zé',
        servico: 'Corte Masculino',
        data: '10 de Setembro, 2026',
        horario: '15:00',
        valor: 40,
        status: 'Concluído',
        imagem: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80'
    },
    {
        id: 4,
        barbearia: 'Barbearia Central',
        servico: 'Barba',
        data: '05 de Setembro, 2026',
        horario: '10:30',
        valor: 30,
        status: 'Cancelado',
        imagem: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80'
    }
];


// =====================================================
// COMPONENTE: ABAS
// =====================================================

function AbasAgendamento({ abaAtiva, alterarAba }) {

    return (
        <div className={estilo.abas}>

            <button
                className={abaAtiva === 'proximos' ? estilo.abaAtiva : ''}
                onClick={() => alterarAba('proximos')}
            >
                Próximos
            </button>

            <button
                className={abaAtiva === 'historico' ? estilo.abaAtiva : ''}
                onClick={() => alterarAba('historico')}
            >
                Histórico
            </button>

        </div>
    );
}


// =====================================================
// COMPONENTE: CARD DE AGENDAMENTO
// =====================================================

function CardAgendamento({
                             agendamento,
                             cancelarAgendamento,
                             abrirDetalhes
                         }) {

    const [imagemCarregada, setImagemCarregada] = useState(false);

    const statusConcluido = agendamento.status === 'Concluído';
    const statusCancelado = agendamento.status === 'Cancelado';

    return (
        <article className={estilo.cardAgendamento}>

            {/* IMAGEM DA BARBEARIA */}

            <div className={estilo.imagemContainer}>

                {!imagemCarregada && (
                    <div className={estilo.placeholderImagem}></div>
                )}

                <img
                    src={agendamento.imagem}
                    alt={`Interior da ${agendamento.barbearia}`}
                    className={imagemCarregada ? estilo.imagemVisivel : ''}
                    onLoad={() => setImagemCarregada(true)}
                />

            </div>


            {/* INFORMAÇÕES */}

            <div className={estilo.informacoes}>

                <h2>{agendamento.barbearia}</h2>

                <p className={estilo.servico}>
                    {agendamento.servico}
                </p>

                <div className={estilo.detalhesData}>

                    <span>
                        <FiCalendar />
                        {agendamento.data}
                    </span>

                    <span>
                        <FiClock />
                        {agendamento.horario}
                    </span>

                </div>

            </div>


            {/* VALOR E AÇÕES */}

            <div className={estilo.acoesAgendamento}>

                <div className={estilo.valorStatus}>

                    <strong>
                        R$ {agendamento.valor.toFixed(2).replace('.', ',')}
                    </strong>

                    <span
                        className={`
                            ${estilo.status}
                            ${statusConcluido ? estilo.concluido : ''}
                            ${statusCancelado ? estilo.cancelado : ''}
                        `}
                    >
                        {agendamento.status}
                    </span>

                </div>

                <div className={estilo.botoesCard}>

                    <button
                        className={estilo.botaoDetalhes}
                        onClick={() => abrirDetalhes(agendamento)}
                    >
                        Ver Detalhes
                    </button>

                    {!statusConcluido && !statusCancelado && (

                        <button
                            className={estilo.botaoCancelar}
                            onClick={() => cancelarAgendamento(agendamento.id)}
                        >
                            Cancelar
                        </button>

                    )}

                </div>

            </div>

        </article>
    );
}


// =====================================================
// COMPONENTE: MODAL DE DETALHES
// =====================================================

function ModalDetalhes({ agendamento, fechar }) {

    if (!agendamento) return null;

    return (
        <div
            className={estilo.overlay}
            onClick={fechar}
        >

            <div
                className={estilo.modal}
                onClick={(e) => e.stopPropagation()}
            >

                <button
                    className={estilo.fecharModal}
                    onClick={fechar}
                    aria-label="Fechar detalhes"
                >
                    <FiX />
                </button>

                <FiInfo className={estilo.iconeModal} />

                <h2>Detalhes do Agendamento</h2>

                <div className={estilo.linhaModal}>
                    <span>Barbearia</span>
                    <strong>{agendamento.barbearia}</strong>
                </div>

                <div className={estilo.linhaModal}>
                    <span>Serviço</span>
                    <strong>{agendamento.servico}</strong>
                </div>

                <div className={estilo.linhaModal}>
                    <span>Data</span>
                    <strong>{agendamento.data}</strong>
                </div>

                <div className={estilo.linhaModal}>
                    <span>Horário</span>
                    <strong>{agendamento.horario}</strong>
                </div>

                <div className={estilo.linhaModal}>
                    <span>Valor</span>
                    <strong>
                        R$ {agendamento.valor.toFixed(2).replace('.', ',')}
                    </strong>
                </div>

                <button
                    className={estilo.botaoFechar}
                    onClick={fechar}
                >
                    Fechar
                </button>

            </div>

        </div>
    );
}


// =====================================================
// PÁGINA PRINCIPAL
// =====================================================

function MeusAgendamentos() {

    const [abaAtiva, setAbaAtiva] = useState('proximos');

    const [agendamentos, setAgendamentos] = useState(
        agendamentosIniciais
    );

    const [historico, setHistorico] = useState(
        historicoInicial
    );

    const [agendamentoSelecionado, setAgendamentoSelecionado] =
        useState(null);


    // =================================================
    // CANCELAR AGENDAMENTO
    // =================================================

    function cancelarAgendamento(id) {

        const confirmar = window.confirm(
            'Deseja realmente cancelar este agendamento?'
        );

        if (!confirmar) return;

        const agendamentoCancelado = agendamentos.find(
            (item) => item.id === id
        );

        if (!agendamentoCancelado) return;

        const atualizado = {
            ...agendamentoCancelado,
            status: 'Cancelado'
        };

        setAgendamentos((lista) =>
            lista.filter((item) => item.id !== id)
        );

        setHistorico((lista) => [
            atualizado,
            ...lista
        ]);
    }


    // =================================================
    // ABRIR DETALHES
    // =================================================

    function abrirDetalhes(agendamento) {

        setAgendamentoSelecionado(agendamento);

    }


    // =================================================
    // LISTA ATUAL
    // =================================================

    const listaAtual =
        abaAtiva === 'proximos'
            ? agendamentos
            : historico;


    return (

        <div className={estilo.pagina}>



            <main className={estilo.conteudo}>

                {/* TÍTULO */}

                <h1 className={estilo.titulo}>
                    Meus Agendamentos
                </h1>


                {/* ABAS */}

                <AbasAgendamento
                    abaAtiva={abaAtiva}
                    alterarAba={setAbaAtiva}
                />


                {/* CARDS */}

                <section className={estilo.listaAgendamentos}>

                    {listaAtual.length > 0 ? (

                        listaAtual.map((agendamento) => (

                            <CardAgendamento
                                key={agendamento.id}
                                agendamento={agendamento}
                                cancelarAgendamento={cancelarAgendamento}
                                abrirDetalhes={abrirDetalhes}
                            />

                        ))

                    ) : (

                        <div className={estilo.semAgendamentos}>

                            <FiCalendar />

                            <h2>
                                Nenhum agendamento encontrado
                            </h2>

                            <p>
                                Seus agendamentos aparecerão aqui.
                            </p>

                        </div>

                    )}

                </section>

            </main>




            {/* MODAL */}

            <ModalDetalhes
                agendamento={agendamentoSelecionado}
                fechar={() => setAgendamentoSelecionado(null)}
            />

        </div>

    );
}

export default MeusAgendamentos;