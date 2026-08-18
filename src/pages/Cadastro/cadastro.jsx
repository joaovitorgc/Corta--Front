import styles from './Cadastro.module.css';
import { useState } from 'react';
import MensagemFlash from '../../components/MensagemFlash/MensagemFlash';

export default function Cadastro() {
    const [nome, setNome] = useState('');
    const [telefone, setTelefone] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');
    const [codigo, setCodigo] = useState('');

    const [modalAtivacao, setModalAtivacao] = useState(false);
    const [carregando, setCarregando] = useState(false);
    const [verificando, setVerificando] = useState(false);

    const [mensagemFlash, setMensagemFlash] = useState('');
    const [tipoMensagem, setTipoMensagem] = useState('erro');

    const mostrarMensagem = (mensagem, tipo) => {
        setMensagemFlash(mensagem);
        setTipoMensagem(tipo);
    };

    const fecharMensagem = () => {
        setMensagemFlash('');
    };

    const tratarMensagem = (dados, mensagemPadrao = 'Ocorreu um erro.') => {
        if (dados.mensagem && typeof dados.mensagem === 'object') {
            return {
                texto: dados.mensagem.informacao || mensagemPadrao,
                tipo: dados.mensagem.tipo || 'erro'
            };
        }

        if (typeof dados.mensagem === 'string') {
            return {
                texto: dados.mensagem,
                tipo: dados.tipo || 'sucesso'
            };
        }

        if (dados.informacao) {
            return {
                texto: dados.informacao,
                tipo: dados.tipo || 'erro'
            };
        }

        if (dados.erro) {
            return {
                texto: dados.erro,
                tipo: 'erro'
            };
        }

        return {
            texto: mensagemPadrao,
            tipo: 'erro'
        };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        fecharMensagem();

        if (senha !== confirmarSenha) {
            mostrarMensagem('As senhas não coincidem.', 'erro');
            return;
        }

        setCarregando(true);

        try {
            const resposta = await fetch(
                'http://10.92.11.38:5000/cadastro',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        nome,
                        telefone,
                        email,
                        senha,
                        confirmarSenha,
                        tipo: 1
                    })
                }
            );

            const dados = await resposta.json();

            console.log('Resposta do servidor:', dados);

            if (!resposta.ok) {
                const mensagem = tratarMensagem(
                    dados,
                    'Ocorreu um erro ao realizar o cadastro.'
                );

                mostrarMensagem(
                    mensagem.texto,
                    mensagem.tipo
                );

                return;
            }

            const mensagem = tratarMensagem(
                dados,
                'Cadastro realizado com sucesso!'
            );

            mostrarMensagem(
                mensagem.texto,
                mensagem.tipo
            );

            setModalAtivacao(true);
        } catch (erro) {
            console.error('Erro:', erro);

            mostrarMensagem(
                'Não foi possível conectar ao servidor.',
                'erro'
            );
        } finally {
            setCarregando(false);
        }
    };

    const verificarCodigo = async () => {
        fecharMensagem();

        if (!codigo) {
            mostrarMensagem(
                'Digite o código de ativação.',
                'erro'
            );
            return;
        }

        if (codigo.length !== 6) {
            mostrarMensagem(
                'O código deve possuir 6 números.',
                'erro'
            );
            return;
        }

        setVerificando(true);

        try {
            console.log('==============================');
            console.log('VERIFICANDO CÓDIGO');
            console.log('E-mail:', email);
            console.log('Código:', codigo);
            console.log('==============================');

            const resposta = await fetch(
                'http://10.92.11.38:5000/verificar-codigo',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: email,
                        codigo: codigo
                    })
                }
            );

            const dados = await resposta.json();

            console.log('Status:', resposta.status);
            console.log('Resposta:', dados);

            if (!resposta.ok) {
                const mensagem = tratarMensagem(
                    dados,
                    'Não foi possível ativar a conta.'
                );

                mostrarMensagem(
                    mensagem.texto,
                    mensagem.tipo
                );

                return;
            }

            const mensagem = tratarMensagem(
                dados,
                'E-mail confirmado com sucesso!'
            );

            mostrarMensagem(
                mensagem.texto,
                mensagem.tipo
            );

            setCodigo('');

            setTimeout(() => {
                setModalAtivacao(false);
                window.location.href = '/login';
            }, 1500);

        } catch (erro) {
            console.error(
                'ERRO AO VERIFICAR CÓDIGO:',
                erro
            );

            mostrarMensagem(
                'Não foi possível conectar ao servidor.',
                'erro'
            );
        } finally {
            setVerificando(false);
        }
    };

    return (
        <main className={styles.container}>
            <MensagemFlash
                mensagem={mensagemFlash}
                tipo={tipoMensagem}
                fechar={fecharMensagem}
            />

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
                                onChange={(e) =>
                                    setNome(e.target.value)
                                }
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
                                onChange={(e) =>
                                    setTelefone(e.target.value)
                                }
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
                                onChange={(e) =>
                                    setEmail(e.target.value)
                                }
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
                                onChange={(e) =>
                                    setSenha(e.target.value)
                                }
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
                                    setConfirmarSenha(
                                        e.target.value
                                    )
                                }
                                className={styles.entrada}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className={styles.botaoCadastrar}
                            disabled={carregando}
                        >
                            {carregando
                                ? 'CADASTRANDO...'
                                : 'CADASTRAR'}
                        </button>
                    </form>

                    <div className={styles.areaLogin}>
                        <p className={styles.textoLogin}>
                            Já possui Cadastro?
                        </p>

                        <button
                            type="button"
                            className={styles.botaoLogin}
                            onClick={() =>
                                window.location.href = '/login'
                            }
                        >
                            FAÇA O LOGIN
                        </button>
                    </div>
                </div>
            </section>

            <section className={styles.areaImagem}>
                <div
                    className={styles.sobreposicaoImagem}
                />
            </section>

            {modalAtivacao && (
                <div className={styles.fundoModal}>
                    <div className={styles.modalAtivacao}>
                        <button
                            type="button"
                            className={styles.fecharModal}
                            onClick={() =>
                                setModalAtivacao(false)
                            }
                        >
                            ×
                        </button>

                        <div className={styles.iconeEmail}>
                            ✉
                        </div>

                        <h2 className={styles.tituloModal}>
                            CONFIRME SEU E-MAIL
                        </h2>

                        <p className={styles.textoModal}>
                            Enviamos um código de ativação para:
                        </p>

                        <strong className={styles.emailModal}>
                            {email}
                        </strong>

                        <p className={styles.instrucaoModal}>
                            Digite o código recebido para ativar
                            sua conta.
                        </p>

                        <input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            value={codigo}
                            placeholder="000000"
                            onChange={(e) =>
                                setCodigo(
                                    e.target.value.replace(
                                        /\D/g,
                                        ''
                                    )
                                )
                            }
                            className={styles.entradaCodigo}
                        />

                        <button
                            type="button"
                            className={styles.botaoAtivar}
                            onClick={verificarCodigo}
                            disabled={verificando}
                        >
                            {verificando
                                ? 'VERIFICANDO...'
                                : 'ATIVAR CONTA'}
                        </button>
                    </div>
                </div>
            )}
        </main>
    );
}