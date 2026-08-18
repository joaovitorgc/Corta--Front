import { useEffect } from 'react';
import styles from './MensagemFlash.module.css';

export default function MensagemFlash({
                                          mensagem,
                                          tipo,
                                          fechar
                                      }) {
    useEffect(() => {
        if (!mensagem) {
            return;
        }

        const tempo = setTimeout(() => {
            fechar();
        }, 3000);

        return () => {
            clearTimeout(tempo);
        };
    }, [mensagem, fechar]);

    if (!mensagem) {
        return null;
    }

    return (
        <div
            className={`${styles.mensagem} ${
                tipo === 'sucesso'
                    ? styles.sucesso
                    : styles.erro
            }`}
        >
            <p>{mensagem}</p>

            <button
                type="button"
                onClick={fechar}
                className={styles.fechar}
            >
                ×
            </button>
        </div>
    );
}