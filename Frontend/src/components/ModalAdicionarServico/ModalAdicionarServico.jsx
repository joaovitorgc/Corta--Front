import { useEffect, useState } from "react";
import { X, Plus, Scissors, Pencil } from "lucide-react";
import styles from "./ModalAdicionarServico.module.css";

const DURACOES = [
    { label: "15 min", value: 15 },
    { label: "30 min", value: 30 },
    { label: "45 min", value: 45 },
    { label: "1 h", value: 60 },
    { label: "1 h 30", value: 90 },
    { label: "2 h", value: 120 },
];

export default function ModalAdicionarServico({
    open,
    onClose,
    onAdd,
    servicoEditando = null
}) {
    const [nome, setNome] = useState("");
    const [preco, setPreco] = useState("");
    const [duracao, setDuracao] = useState(30);
    const [descricao, setDescricao] = useState("");

    const editando = servicoEditando !== null && servicoEditando !== undefined;

    useEffect(() => {
        if (!open) return;

        if (editando) {
            const nomeServico =
                servicoEditando.nome ??
                servicoEditando.nome_servico ??
                "";

            const precoServico =
                servicoEditando.preco ??
                servicoEditando.preco_servico ??
                "";

            const duracaoServico =
                servicoEditando.duracao ??
                servicoEditando.duracao_servico ??
                30;

            const descricaoServico =
                servicoEditando.descricao ??
                servicoEditando.descricao_breve ??
                servicoEditando.descricaoBreve ??
                "";

            setNome(String(nomeServico));
            setPreco(
                precoServico === ""
                    ? ""
                    : String(precoServico).replace(".", ",")
            );
            setDuracao(Number.parseInt(duracaoServico, 10) || 30);
            setDescricao(String(descricaoServico));
        } else {
            setNome("");
            setPreco("");
            setDuracao(30);
            setDescricao("");
        }
    }, [open, servicoEditando, editando]);

    if (!open) return null;

    const valorNumerico = Number(
        String(preco).replace(/\./g, "").replace(",", ".")
    );

    const podeSalvar =
        nome.trim().length > 0 &&
        preco !== "" &&
        Number.isFinite(valorNumerico) &&
        valorNumerico >= 0;

    const handleSalvar = async () => {
        if (!podeSalvar) return;

        await onAdd({
            nome: nome.trim(),
            preco,
            duracao: Number(duracao),
            descricao: descricao.trim()
        });
    };

    return (
        <div
            role="dialog"
            aria-modal="true"
            className={styles.overlay}
            onClick={onClose}
        >
            <form
                className={styles.modal}
                onClick={(e) => e.stopPropagation()}
                onSubmit={(e) => {
                    e.preventDefault();
                    handleSalvar();
                }}
            >
                <button
                    type="button"
                    className={styles.fechar}
                    onClick={onClose}
                    aria-label="Fechar"
                >
                    <X size={20} />
                </button>

                <h2 className={styles.titulo}>
                    {editando ? "Editar Serviço" : "Adicionar Serviço"}
                </h2>

                <div className={styles.regua} />

                <label className={styles.label} htmlFor="nome-servico">
                    Nome do Serviço
                </label>

                <input
                    id="nome-servico"
                    className={`${styles.input} ${styles.campoNome}`}
                    placeholder="Ex: Corte Degradê"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                />

                <div className={styles.linhaDupla}>
                    <div>
                        <label className={styles.label} htmlFor="preco-servico">
                            Preço (R$)
                        </label>

                        <input
                            id="preco-servico"
                            className={styles.input}
                            placeholder="00,00"
                            inputMode="decimal"
                            value={preco}
                            onChange={(e) =>
                                setPreco(
                                    e.target.value.replace(/[^0-9,.]/g, "")
                                )
                            }
                            required
                        />
                    </div>

                    <div>
                        <label className={styles.label} htmlFor="duracao-servico">
                            Duração
                        </label>

                        <select
                            id="duracao-servico"
                            className={styles.select}
                            value={duracao}
                            onChange={(e) => setDuracao(e.target.value)}
                        >
                            {DURACOES.map((d) => (
                                <option key={d.value} value={d.value}>
                                    {d.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <label className={styles.label} htmlFor="descricao-servico">
                    Descrição Breve
                </label>

                <textarea
                    id="descricao-servico"
                    className={styles.textarea}
                    placeholder="Descreva os detalhes do serviço..."
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    style={{ marginBottom: 14 }}
                />

                <div className={styles.dica}>
                    <Scissors size={16} color="var(--cor-destaque)" />
                    Personalize os detalhes para seus clientes.
                </div>

                <button
                    type="submit"
                    className={styles.botaoPrimario}
                    disabled={""}
                >
                    {editando ? <Pencil size={16} /> : <Plus size={16} />}
                    {editando ? "SALVAR ALTERAÇÕES" : "ADICIONAR"}
                </button>

                <button
                    type="button"
                    className={styles.botaoCancelar}
                    onClick={onClose}
                >
                    CANCELAR
                </button>
            </form>
        </div>
    );
}
