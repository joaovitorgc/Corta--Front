import styles from './RedefinicaoSenha.module.css';
import { useRef, useState } from 'react';

export default function RedefinicaoSenha() {
    const [etapa, setEtapa] = useState(1);

    const [email, setEmail] = useState('');
    const [codigo, setCodigo] = useState(Array(6).fill(''));
    const [novaSenha, setNovaSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');

    const inputs = useRef([]);

    const handleChangeCode = (valor, index) => {
        if (!/^\d?$/.test(valor)) return;

        const novoCodigo = [...codigo];
        novoCodigo[index] = valor;

        setCodigo(novoCodigo);

        if (valor && index < 5) {
            inputs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (
            e.key === 'Backspace' &&
            !codigo[index] &&
            index > 0
        ) {
            inputs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        const texto = e.clipboardData
            .getData('text')
            .replace(/\D/g, '')
            .slice(0, 6);

        if (!texto) return;

        const novoCodigo = Array(6).fill('');

        texto.split('').forEach((numero, index) => {
            novoCodigo[index] = numero;
        });

        setCodigo(novoCodigo);

        const proximo = Math.min(texto.length, 5);

        inputs.current[proximo]?.focus();

        e.preventDefault();
    };

    // =========================
    // ETAPA 1
    // =========================

    const enviarCodigo = (e) => {
        e.preventDefault();

        // API será adicionada aqui depois
        console.log('Solicitando código para:', email);

        // Temporariamente passa para a etapa 2
        setEtapa(2);
    };

    // =========================
    // ETAPA 2
    // =========================

    const confirmarCodigo = (e) => {
        e.preventDefault();

        const codigoCompleto = codigo.join('');

        if (codigoCompleto.length !== 6) {
            return;
        }

        // API será adicionada aqui depois
        console.log('Código informado:', codigoCompleto);

        setEtapa(3);
    };

    // =========================
    // ETAPA 3
    // =========================

    const redefinirSenha = (e) => {
        e.preventDefault();

        if (novaSenha.length < 6) {
            return;
        }

        if (novaSenha !== confirmarSenha) {
            alert('As senhas não coincidem.');
            return;
        }

        // API será adicionada aqui depois
        console.log({
            email,
            codigo: codigo.join(''),
            novaSenha
        });

        alert('Senha redefinida com sucesso!');
    };

    // =========================
    // VOLTAR
    // =========================

    const voltar = () => {
        if (etapa === 1) {
            window.history.back();
        } else {
            setEtapa(etapa - 1);
        }
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

            <section className={styles.areaRedefinicao}>

                <div className={styles.conteudo}>

                    {/* INDICADOR DAS ETAPAS */}

                    <div className={styles.etapas}>

                        <div
                            className={`${styles.etapa} ${
                                etapa >= 1 ? styles.etapaAtiva : ''
                            }`}
                        >
                            <span>1</span>
                            <p>E-mail</p>
                        </div>

                        <div className={styles.linha}></div>

                        <div
                            className={`${styles.etapa} ${
                                etapa >= 2 ? styles.etapaAtiva : ''
                            }`}
                        >
                            <span>2</span>
                            <p>Código</p>
                        </div>

                        <div className={styles.linha}></div>

                        <div
                            className={`${styles.etapa} ${
                                etapa >= 3 ? styles.etapaAtiva : ''
                            }`}
                        >
                            <span>3</span>
                            <p>Senha</p>
                        </div>

                    </div>

                    {/* =========================
                        ETAPA 1
                    ========================= */}

                    {etapa === 1 && (
                        <>
                            <h1 className={styles.titulo}>
                                REDEFINIÇÃO DE SENHA
                            </h1>

                            <p className={styles.subtitulo}>
                                Informe seu e-mail para receber o código de recuperação.
                            </p>

                            <form
                                onSubmit={enviarCodigo}
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
                                        onChange={(e) =>
                                            setEmail(e.target.value)
                                        }
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
                        </>
                    )}

                    {/* =========================
                        ETAPA 2
                    ========================= */}

                    {etapa === 2 && (
                        <>
                            <h1 className={styles.titulo}>
                                CONFIRMAR CÓDIGO
                            </h1>

                            <p className={styles.subtitulo}>
                                Digite o código de 6 dígitos enviado para:
                                <br />
                                <strong>{email}</strong>
                            </p>

                            <form
                                onSubmit={confirmarCodigo}
                                className={styles.formulario}
                            >

                                <div className={styles.otpContainer}>

                                    {codigo.map((digito, index) => (
                                        <input
                                            key={index}
                                            ref={(elemento) =>
                                                inputs.current[index] = elemento
                                            }
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digito}
                                            onChange={(e) =>
                                                handleChangeCode(
                                                    e.target.value,
                                                    index
                                                )
                                            }
                                            onKeyDown={(e) =>
                                                handleKeyDown(e, index)
                                            }
                                            onPaste={handlePaste}
                                            className={styles.entradaCodigo}
                                        />
                                    ))}

                                </div>

                                <button
                                    type="submit"
                                    className={styles.botaoEnviar}
                                    disabled={codigo.join('').length !== 6}
                                >
                                    CONFIRMAR CÓDIGO
                                </button>

                            </form>
                        </>
                    )}

                    {/* =========================
                        ETAPA 3
                    ========================= */}

                    {etapa === 3 && (
                        <>
                            <h1 className={styles.titulo}>
                                NOVA SENHA
                            </h1>

                            <p className={styles.subtitulo}>
                                Digite sua nova senha abaixo.
                            </p>

                            <form
                                onSubmit={redefinirSenha}
                                className={styles.formulario}
                            >

                                <div className={styles.grupoEntrada}>

                                    <label
                                        htmlFor="novaSenha"
                                        className={styles.rotulo}
                                    >
                                        Nova senha
                                    </label>

                                    <input
                                        type="password"
                                        id="novaSenha"
                                        placeholder="Mínimo 6 caracteres"
                                        value={novaSenha}
                                        onChange={(e) =>
                                            setNovaSenha(e.target.value)
                                        }
                                        className={styles.entrada}
                                        minLength={6}
                                        required
                                    />

                                </div>

                                <div className={styles.grupoEntrada}>

                                    <label
                                        htmlFor="confirmarSenha"
                                        className={styles.rotulo}
                                    >
                                        Confirmar nova senha
                                    </label>

                                    <input
                                        type="password"
                                        id="confirmarSenha"
                                        placeholder="Digite a senha novamente"
                                        value={confirmarSenha}
                                        onChange={(e) =>
                                            setConfirmarSenha(e.target.value)
                                        }
                                        className={styles.entrada}
                                        minLength={6}
                                        required
                                    />

                                </div>

                                <button
                                    type="submit"
                                    className={styles.botaoEnviar}
                                >
                                    REDEFINIR SENHA
                                </button>

                            </form>
                        </>
                    )}

                </div>

            </section>

        </main>
    );
}