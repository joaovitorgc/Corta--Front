import styles from "./ComponentesPagamento.module.css";

const dinheiro = (valor) =>
    valor !== null && valor !== undefined && Number.isFinite(Number(valor))
        ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(valor))
        : "Valor indisponível";

function dataHora(inicio) {
    if (!inicio) return "Data não informada";
    // Horários locais do banco: não aplicar conversão UTC no navegador.
    const match = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/.exec(String(inicio));
    return match ? `${match[3]}/${match[2]}/${match[1]} às ${match[4]}:${match[5]}` : String(inicio);
}

export default function ResumoAgendamento({ agendamento }) {
    const pago = agendamento.quitado === true || agendamento.pagamento_status === "pago";
    const presencial = agendamento.na_hora_pendente === true || agendamento.pagamento_status === "na_hora_pendente";
    const confirmado = agendamento.reserva_efetivada === true;
    const possuiSaldo = agendamento.saldo !== null && agendamento.saldo !== undefined;
    return (
        <aside className={styles.resumo} aria-label="Resumo do agendamento">
            <div className={styles.resumoCabecalho}>
                <span className={styles.eyebrow}>SEU AGENDAMENTO</span>
                <span className={styles.codigo}>#{agendamento.id_agendamento}</span>
            </div>
            <h2>Resumo da reserva</h2>
            <div className={styles.detalhe}>
                <span>Data e horário</span>
                <strong>{dataHora(agendamento.inicio_em)}</strong>
            </div>
            {agendamento.id_barbearia && (
                <div className={styles.detalhe}>
                    <span>Barbearia</span>
                    <strong>#{agendamento.id_barbearia}</strong>
                </div>
            )}
            <div className={styles.detalhe}>
                <span>Situação da reserva</span>
                <strong>{confirmado ? "Horário reservado" :
                    agendamento.status === "aguardando_pagamento" ? "Aguardando pagamento ou escolha presencial" :
                    agendamento.status || "Não informado"}</strong>
            </div>
            <div className={styles.divisor} />
            <div className={styles.total}>
                <span>Total a pagar</span>
                <strong>{dinheiro(agendamento.valor_total)}</strong>
            </div>
            {possuiSaldo && (
                <>
                    <div className={styles.detalhe} style={{ marginTop: 20 }}>
                        <span>Valor recebido</span>
                        <strong>{dinheiro(agendamento.valor_recebido)}</strong>
                    </div>
                    <div className={styles.detalhe}>
                        <span>Saldo pendente</span>
                        <strong>{dinheiro(agendamento.saldo)}</strong>
                    </div>
                </>
            )}
            <div className={styles.status} data-tipo={pago ? "pago" : "pendente"}>
                <span className={styles.statusPonto} aria-hidden="true" />
                {pago ? "Pagamento confirmado" :
                    presencial ? "Pagamento pendente na barbearia" :
                    "Pagamento pendente"}
            </div>
        </aside>
    );
}
