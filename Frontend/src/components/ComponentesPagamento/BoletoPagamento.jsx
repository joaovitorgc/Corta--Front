import { useState } from "react";
import styles from "./ComponentesPagamento.module.css";

const hojeLocal = () => {
    const data = new Date();
    return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;
};

export default function BoletoPagamento({ boleto, pendente, onCriar, onConsultar, onBaixar, enviando }) {
    const [documento, setDocumento] = useState("");
    const [vencimento, setVencimento] = useState("");
    const existe = Boolean(boleto?.id_cobranca || pendente);
    const identificador = boleto?.id_cobranca || pendente?.id;
    return (
        <div className={styles.forma}>
            <h3>Pagamento por boleto</h3>
            {existe ? (
                <>
                    <div className={styles.avisoPendente}>
                        <strong>Boleto emitido</strong>
                        <span>Identificador: {identificador}. O pagamento será confirmado quando identificado pela Arkhé.</span>
                    </div>
                    {boleto?.codigo_pagamento && (
                        <div className={styles.copiaPix}>
                            <label htmlFor="boleto-codigo">Código do boleto</label>
                            <textarea id="boleto-codigo" rows={2} readOnly value={boleto.codigo_pagamento} />
                        </div>
                    )}
                    <div className={styles.acoes}>
                        <button type="button" className={styles.botaoPrincipal} onClick={onConsultar} disabled={enviando}>Consultar boleto</button>
                        <button type="button" className={styles.botaoSecundario} onClick={onBaixar} disabled={enviando}>Baixar PDF</button>
                    </div>
                </>
            ) : (
                <form onSubmit={(e) => { e.preventDefault(); onCriar(documento, vencimento); }}>
                    <div className={styles.campos}>
                        <label>
                            CPF ou CNPJ do pagador
                            <input
                                required
                                inputMode="numeric"
                                autoComplete="off"
                                placeholder="Somente números"
                                value={documento}
                                onChange={(e) => setDocumento(e.target.value.replace(/\D/g, "").slice(0, 14))}
                            />
                        </label>
                        <label>
                            Data de vencimento
                            <input required type="date" min={hojeLocal()} value={vencimento} onChange={(e) => setVencimento(e.target.value)} />
                        </label>
                    </div>
                    <button type="submit" className={styles.botaoPrincipal} disabled={enviando || ![11, 14].includes(documento.length) || !vencimento}>
                        {enviando ? "Emitindo boleto..." : "Gerar boleto"}
                    </button>
                </form>
            )}
        </div>
    );
}
