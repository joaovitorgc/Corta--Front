import styles from "./ComponentesPagamento.module.css";

export default function PixPagamento({ pix, pendente, onCriar, onConsultar, enviando, onCopiar }) {
    const existe = Boolean(pix?.id_cobranca || pendente);
    const codigo = pix?.codigo_pagamento || pix?.codigo_pix || pix?.pix_copia_cola || "";
    return (
        <div className={styles.forma}>
            <h3>Pagamento via Pix</h3>
            <p>Depois de pagar no seu aplicativo bancário, consulte a situação aqui. A confirmação vem da Arkhé, não do navegador.</p>
            {existe ? (
                <>
                    <div className={styles.avisoPendente}>
                        <strong>Cobrança Pix em aberto</strong>
                        <span>Identificador: {pix?.id_cobranca || pendente?.id}</span>
                    </div>
                    {codigo ? (
                        <div className={styles.copiaPix}>
                            <label htmlFor="pix-codigo">Pix copia e cola</label>
                            <textarea id="pix-codigo" readOnly value={codigo} rows={3} />
                            <button className={styles.botaoSecundario} onClick={() => onCopiar(codigo)} type="button">Copiar código</button>
                        </div>
                    ) : <p className={styles.dica}>Consulte a cobrança para recuperar o código Pix.</p>}
                    <button type="button" className={styles.botaoPrincipal} onClick={onConsultar} disabled={enviando}>
                        {enviando ? "Consultando..." : "Verificar pagamento Pix"}
                    </button>
                </>
            ) : (
                <button type="button" className={styles.botaoPrincipal} onClick={onCriar} disabled={enviando}>
                    {enviando ? "Gerando cobrança..." : "Gerar código Pix"}
                </button>
            )}
        </div>
    );
}
