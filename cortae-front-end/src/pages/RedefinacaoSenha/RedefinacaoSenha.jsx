import styles from './RedefinicaoSenha.module.css';
import { useState } from 'react';

export default function RedefinicaoSenha() {
    const [email, setEmail] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('Código solicitado para:', email);
    };

    const voltar = () => {
        window.history.back();
    };

    return (
        <main className={styles.container}>

            <button
                type="button"
                className={styles.botaoVoltar}
                onClick={voltar}
            >
                VOLTAR
            </button>

            {/* Área central */}
            <section className={styles.areaRedefinicao}>

                <div className={styles.conteudo}>

                    <h1 className={styles.titulo}>
                        REDEFINIÇÃO DE SENHA
                    </h1>

                    <form
                        onSubmit={handleSubmit}
                        className={styles.formulario}
                    >

                        <div className={styles.grupoEntrada}>

                            <label
                                htmlFor="email"
                                className={styles.rotulo}
                            >
                                Email de recuperação
                            </label>

                            <input
                                type="email"
                                id="email"
                                placeholder="example@gmail.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={styles.entrada}
                                required
                            />

                        </div>

                        <button
                            type="submit"
                            className={styles.botaoEnviar}
                        >
                            ENVIAR CÓDIGO
                        </button>

                    </form>

                </div>

            </section>

        </main>
    );
}