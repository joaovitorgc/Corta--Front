import styles from './Login.module.css';
import {useState} from "react";
import {Link} from "react-router-dom";
import MensagemFlash from "../../components/MensagemFlash/MensagemFlash.jsx";

export default function Login() {

    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');

    const [mensagemFlash, setMensagemFlash] = useState('');
    const [tipoMensagem, setTipoMensagem] = useState('');

    const fecharMensagem = () => {
        setMensagemFlash('');
        setTipoMensagem('');
    };


    const handleSubmit = async (e) => {
        e.preventDefault();

        try {

            console.log("Tentando conectar com a API...");

            const resposta = await fetch('http://10.92.11.38:5000/login', {
                method: 'POST',

                headers: {
                    'Content-Type': 'application/json'
                },

                credentials: 'include',

                body: JSON.stringify({
                    email: email,
                    senha: senha
                })
            });

            console.log("Resposta recebida:", resposta.status);

            const dados = await resposta.json();

            console.log("Dados recebidos:", dados);


            if (!resposta.ok) {

                setMensagemFlash(
                    dados?.mensagem?.informacao ||
                    'Email ou senha incorretos.'
                );

                setTipoMensagem(
                    dados?.mensagem?.tipo ||
                    'erro'
                );

                return;
            }


            setMensagemFlash(
                dados?.mensagem?.informacao ||
                'Login realizado com sucesso!'
            );

            setTipoMensagem(
                dados?.mensagem?.tipo ||
                'sucesso'
            );


            console.log("Usuário:", dados.usuario);


        } catch (erro) {

            console.error("ERRO COMPLETO:", erro);

            setMensagemFlash(
                `Erro ao conectar com o servidor: ${erro.message}`
            );

            setTipoMensagem('erro');
        }
    };


    return (
        <div className={styles.container}>

            <div className={styles.imageSection}>
            </div>


            <MensagemFlash

                mensagem={mensagemFlash}

                tipo={tipoMensagem}

                fechar={fecharMensagem}

            />


            <div className={styles.formSection}>

                <div className={styles.loginCard}>

                    <h1 className={styles.title}>
                        REALIZE O LOGIN
                    </h1>


                    <form
                        onSubmit={handleSubmit}
                        className={styles.form}
                    >

                        <div className={styles.inputGroup}>

                            <label
                                htmlFor="email"
                                className={styles.label}
                            >
                                Email
                            </label>

                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) =>
                                    setEmail(e.target.value)
                                }
                                className={styles.input}
                                required
                            />

                        </div>


                        <div className={styles.inputGroup}>

                            <label
                                htmlFor="senha"
                                className={styles.label}
                            >
                                Senha
                            </label>

                            <input
                                type="password"
                                id="senha"
                                value={senha}
                                onChange={(e) =>
                                    setSenha(e.target.value)
                                }
                                className={styles.input}
                                required
                            />

                        </div>


                        <div className={styles.forgotPasswordWrapper}>

                            <Link
                                to="/redefinirsenha"
                                className={styles.forgotPasswordLink}
                            >
                                Esqueci minha Senha? Redefinir
                            </Link>

                        </div>


                        <button
                            type="submit"
                            className={styles.btnEntrar}
                        >
                            ENTRAR
                        </button>

                    </form>


                    <div className={styles.signupContainer}>

                        <p className={styles.signupText}>
                            Ainda não possui Cadastro?
                        </p>

                        <Link
                            to="/cadastro"
                            className={styles.btnCadastreSe}
                        >
                            CADASTRE-SE
                        </Link>

                    </div>

                </div>

            </div>

        </div>
    );
}