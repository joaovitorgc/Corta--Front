import { FiScissors } from 'react-icons/fi';
import styles from './CardServico.module.css';

export default function CardServico({ nome, tempo, preco }) {
    return (
        <div className={styles.card}>
            <div className={styles.icone}>
                <FiScissors />
            </div>
            <div className={styles.informacoes}>
                <h3>{nome}</h3>
                <span>{tempo}</span>
            </div>
            <strong>{preco}</strong>
        </div>
    );
}