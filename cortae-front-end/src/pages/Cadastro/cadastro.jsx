import styles from './Cadastro.module.css';
import { useState } from 'react';

export default function Cadastro() {
    const [nome, setNome] = useState('');
    const [telefone, setTelefone] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();

        if (senha !== confirmarSenha) {
            alert('As senhas não coincidem.');
            return;
        }

        console.log({
            nome,
            telefone,
            email,
            senha,
            confirmarSenha
        });
    };

    return (
        <main className={styles.container}>

            <section className={styles.areaFormulario}>

                <div className={styles.cartaoCadastro}>

                    <h1 className={styles.titulo}>
                        FAÇA SEU CADASTRO
                    </h1>

                    <form
                        onSubmit={handleSubmit}
                        className={styles.formulario}
                    >

                        <div className={styles.grupoEntrada}>
                            <label
                                htmlFor="nome"
                                className={styles.rotulo}
                            >
                                Nome
                            </label>

                            <input
                                type="text"
                                id="nome"
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                                className={styles.entrada}
                                required
                            />
                        </div>

                        <div className={styles.grupoEntrada}>
                            <label
                                htmlFor="telefone"
                                className={styles.rotulo}
                            >
                                Telefone
                            </label>

                            <input
                                type="tel"
                                id="telefone"
                                value={telefone}
                                onChange={(e) => setTelefone(e.target.value)}
                                className={styles.entrada}
                                required
                            />
                        </div>

                        <div className={styles.grupoEntrada}>
                            <label
                                htmlFor="email"
                                className={styles.rotulo}
                            >
                                E-mail
                            </label>

                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={styles.entrada}
                                required
                            />
                        </div>

                        <div className={styles.grupoEntrada}>
                            <label
                                htmlFor="senha"
                                className={styles.rotulo}
                            >
                                Senha
                            </label>

                            <input
                                type="password"
                                id="senha"
                                value={senha}
                                onChange={(e) => setSenha(e.target.value)}
                                className={styles.entrada}
                                required
                            />
                        </div>

                        <div className={styles.grupoEntrada}>
                            <label
                                htmlFor="confirmarSenha"
                                className={styles.rotulo}
                            >
                                Confirmar Senha
                            </label>

                            <input
                                type="password"
                                id="confirmarSenha"
                                value={confirmarSenha}
                                onChange={(e) =>
                                    setConfirmarSenha(e.target.value)
                                }
                                className={styles.entrada}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className={styles.botaoCadastrar}
                        >
                            CADASTRAR
                        </button>

                    </form>

                    <div className={styles.areaLogin}>

                        <p className={styles.textoLogin}>
                            Já possui Cadastro?
                        </p>

                        <button
                            type="button"
                            className={styles.botaoLogin}
                            onClick={() => {
                                window.location.href = '/login';
                            }}
                        >
                            FAÇA O LOGIN
                        </button>

                    </div>

                </div>

            </section>

            <section className={styles.areaImagem}>
                <div className={styles.sobreposicaoImagem}></div>
            </section>

        </main>
    );
}