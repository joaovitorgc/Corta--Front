import styles from "./ComponentesPagamento.module.css";

const OPCOES = [
    { id: "presencial", titulo: "Na barbearia", descricao: "Pague durante o atendimento." },
    { id: "pix", titulo: "Pix", descricao: "Gere um código Pix." },
    { id: "cartao", titulo: "Cartão", descricao: "Débito ou crédito." },
    { id: "boleto", titulo: "Boleto", descricao: "Gere um boleto bancário." },
];

export default function MetodosPagamento({ metodo, onChange, disabled, children }) {
    return (
        <section className={styles.metodos} aria-label="Escolha de pagamento">
            <div className={styles.secCabecalho}>
                <span className={styles.eyebrow}>ESCOLHA COMO PAGAR</span>
                <h2>Forma de pagamento</h2>
                <p>Seu horário só é reservado após a quitação ou a escolha de pagar na barbearia.</p>
            </div>
            <div className={styles.opcoes} role="group" aria-label="Métodos disponíveis">
                {OPCOES.map((opcao) => (
                    <button
                        key={opcao.id}
                        type="button"
                        aria-pressed={metodo === opcao.id}
                        className={`${styles.opcao} ${metodo === opcao.id ? styles.opcaoSelecionada : ""}`}
                        onClick={() => onChange(opcao.id)}
                        disabled={disabled}
                    >
                        <strong>{opcao.titulo}</strong>
                        <small>{opcao.descricao}</small>
                    </button>
                ))}
            </div>
            <div className={styles.conteudoMetodo}>{children}</div>
        </section>
    );
}
