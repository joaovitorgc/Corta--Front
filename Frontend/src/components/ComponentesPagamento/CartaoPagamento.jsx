import { useState } from "react";
import styles from "./ComponentesPagamento.module.css";

export default function CartaoPagamento({ onPagar, enviando }) {
    const [numero, setNumero] = useState("");
    const [validade, setValidade] = useState("");
    const [cvv, setCvv] = useState("");
    const [tipo, setTipo] = useState("DEBITO");
    const [parcelas, setParcelas] = useState(1);

    function enviar(evento) {
        evento.preventDefault();
        if (numero.length !== 16 || cvv.length !== 3 || !/^\d{2}\/\d{2}(?:\d{2})?$/.test(validade)) return;
        // CVV não é persistido, nem guardado em storage; não registrar os dados no console.
        onPagar({ numero_cartao: numero, validade, cvv, tipo, parcelas });
        setCvv("");
    }

    return (
        <div className={styles.forma}>
            <h3>Pagamento com cartão</h3>
            <p>O pagamento é enviado ao backend Cortaê, que realiza a operação pela Arkhé. Não feche a página durante a operação.</p>
            <form onSubmit={enviar} autoComplete="on">
                <div className={styles.campos}>
                    <label className={styles.campoLargo}>
                        Número do cartão
                        <input type="text" required inputMode="numeric" autoComplete="cc-number" placeholder="16 dígitos" value={numero}
                            onChange={(e) => setNumero(e.target.value.replace(/\D/g, "").slice(0, 16))} />
                    </label>
                    <label>
                        Validade (MM/AA)
                        <input required autoComplete="cc-exp" inputMode="numeric" placeholder="MM/AA" value={validade}
                            onChange={(e) => {
                                const soDigitos = e.target.value.replace(/\D/g, "").slice(0, 6);
                                setValidade(soDigitos.length > 2 ? `${soDigitos.slice(0, 2)}/${soDigitos.slice(2)}` : soDigitos);
                            }} />
                    </label>
                    <label>
                        CVV
                        <input type="password" required inputMode="numeric" autoComplete="off" placeholder="3 dígitos" value={cvv}
                            onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 3))} />
                    </label>
                    <label>
                        Modalidade
                        <select value={tipo} onChange={(e) => { setTipo(e.target.value); setParcelas(1); }}>
                            <option value="DEBITO">Débito</option>
                            <option value="CREDITO">Crédito</option>
                        </select>
                    </label>
                    {tipo === "CREDITO" && (
                        <label>
                            Parcelas
                            <select value={parcelas} onChange={(e) => setParcelas(Number(e.target.value))}>
                                {Array.from({ length: 15 }, (_, indice) => indice + 1).map((quantidade) => <option key={quantidade} value={quantidade}>{quantidade}x</option>)}
                            </select>
                        </label>
                    )}
                </div>
                <p className={styles.dica}>Não salvamos seu cartão nesta tela. Para pagamentos reais, use HTTPS e verifique a conformidade PCI DSS da integração.</p>
                <button type="submit" className={styles.botaoPrincipal} disabled={enviando || numero.length !== 16 || cvv.length !== 3 || !/^\d{2}\/\d{2}(?:\d{2})?$/.test(validade)}>
                    {enviando ? "Processando pagamento..." : "Pagar com cartão"}
                </button>
            </form>
        </div>
    );
}
