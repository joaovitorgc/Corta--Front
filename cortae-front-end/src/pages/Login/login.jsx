import styles from './Login.module.css';
import {useState} from "react";

export default function Login() {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
    };

    return (
        <div className={styles.container}>
            <div className={styles.imageSection}>
            </div>

            <div className={styles.formSection}>
                <div className={styles.loginCard}>
                    <h1 className={styles.title}>REALIZE O LOGIN</h1>

                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.inputGroup}>
                            <label htmlFor="email" className={styles.label}>Email</label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={styles.input}
                                required
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label htmlFor="senha" className={styles.label}>Senha</label>
                            <input
                                type="password"
                                id="senha"
                                value={senha}
                                onChange={(e) => setSenha(e.target.value)}
                                className={styles.input}
                                required
                            />
                        </div>

                        <div className={styles.forgotPasswordWrapper}>
                            <a href="#redefinir" className={styles.forgotPasswordLink}>
                                Esqueci minha Senha? Redefinir
                            </a>
                        </div>

                        <button type="submit" className={styles.btnEntrar}>
                            ENTRAR
                        </button>
                    </form>

                    <div className={styles.signupContainer}>
                        <p className={styles.signupText}>Ainda não possui Cadastro?</p>
                        <button type="button" className={styles.btnCadastreSe}>
                            CADASTRE-SE
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}