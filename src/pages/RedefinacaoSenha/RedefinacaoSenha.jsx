import styles from './RedefinicaoSenha.module.css';
import { useRef, useState } from 'react';

export default function RedefinicaoSenha() {

    const [etapa, setEtapa] = useState(1);

    const [email, setEmail] = useState('');
    const [codigo, setCodigo] = useState(Array(6).fill(''));
    const [novaSenha, setNovaSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');

    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState('');
    const [sucesso, setSucesso] = useState('');

    const inputs = useRef([]);

    // ==========================================
    // URL DA API
    // ==========================================

    const API_URL = 'http://10.92.11.38:5000';

    // ==========================================
    // LIMPAR MENSAGENS
    // ==========================================

    const limparMensagens = () => {
        setErro('');
        setSucesso('');
    };

    // ==========================================
    // TRATAR RESPOSTA DA API
    // ==========================================

    const tratarResposta = async (resposta) => {

        let dados;

        try {
            dados = await resposta.json();
        } catch {
            throw new Error(
                'Resposta inválida do servidor.'
            );
        }

        if (!resposta.ok) {

            const mensagem =
                dados?.mensagem?.informacao ||
                dados?.erro ||
                'Ocorreu um erro. Tente novamente.';

            throw new Error(mensagem);
        }

        return dados;
    };

    // ==========================================
    // CÓDIGO - DIGITAÇÃO
    // ==========================================

    const handleChangeCode = (valor, index) => {

        if (!/^\d?$/.test(valor)) {
            return;
        }

        const novoCodigo = [...codigo];

        novoCodigo[index] = valor;

        setCodigo(novoCodigo);

        limparMensagens();

        if (valor && index < 5) {
            inputs.current[index + 1]?.focus();
        }
    };

    // ==========================================
    // BACKSPACE
    // ==========================================

    const handleKeyDown = (e, index) => {

        if (
            e.key === 'Backspace' &&
            !codigo[index] &&
            index > 0
        ) {

            inputs.current[index - 1]?.focus();
        }
    };

    // ==========================================
    // COLAR CÓDIGO
    // ==========================================

    const handlePaste = (e) => {

        e.preventDefault();

        const texto = e.clipboardData
            .getData('text')
            .replace(/\D/g, '')
            .slice(0, 6);

        if (!texto) {
            return;
        }

        const novoCodigo = Array(6).fill('');

        texto.split('').forEach((numero, index) => {
            novoCodigo[index] = numero;
        });

        setCodigo(novoCodigo);

        limparMensagens();

        const proximo = Math.min(texto.length, 5);

        inputs.current[proximo]?.focus();
    };

    // ==========================================
    // ETAPA 1
    // ENVIAR CÓDIGO
    // ==========================================

    const enviarCodigo = async (e) => {

        e.preventDefault();

        limparMensagens();

        if (!email.trim()) {

            setErro(
                'Digite seu e-mail.'
            );

            return;
        }

        try {

            setCarregando(true);

            const resposta = await fetch(
                `${API_URL}/recuperar-senha`,
                {
                    method: 'POST',

                    headers: {
                        'Content-Type': 'application/json'
                    },

                    body: JSON.stringify({
                        etapa: 1,
                        email: email.trim()
                    })
                }
            );

            const dados = await tratarResposta(
                resposta
            );

            setSucesso(
                dados?.mensagem?.informacao ||
                'Código enviado para seu e-mail.'
            );

            setEtapa(2);

            setTimeout(() => {
                inputs.current[0]?.focus();
            }, 100);

        } catch (erro) {

            console.error(
                'Erro ao enviar código:',
                erro
            );

            setErro(
                erro.message ||
                'Não foi possível enviar o código.'
            );

        } finally {

            setCarregando(false);
        }
    };

    // ==========================================
    // ETAPA 2
    // CONFIRMAR CÓDIGO
    // ==========================================

    const confirmarCodigo = async (e) => {

        e.preventDefault();

        limparMensagens();

        const codigoCompleto = codigo.join('');

        if (codigoCompleto.length !== 6) {

            setErro(
                'Digite o código completo de 6 dígitos.'
            );

            return;
        }

        try {

            setCarregando(true);

            const resposta = await fetch(
                `${API_URL}/recuperar-senha`,
                {
                    method: 'POST',

                    headers: {
                        'Content-Type': 'application/json'
                    },

                    body: JSON.stringify({
                        etapa: 2,
                        email: email.trim(),
                        codigo: codigoCompleto
                    })
                }
            );

            const dados = await tratarResposta(
                resposta
            );

            setSucesso(
                dados?.mensagem ||
                'Código confirmado com sucesso.'
            );

            setEtapa(3);

        } catch (erro) {

            console.error(
                'Erro ao confirmar código:',
                erro
            );

            setErro(
                erro.message ||
                'Código inválido.'
            );

        } finally {

            setCarregando(false);
        }
    };

    // ==========================================
    // ETAPA 3
    // REDEFINIR SENHA
    // ==========================================

    const redefinirSenha = async (e) => {

        e.preventDefault();

        limparMensagens();

        if (novaSenha.length < 6) {

            setErro(
                'A senha deve possuir pelo menos 6 caracteres.'
            );

            return;
        }

        if (novaSenha !== confirmarSenha) {

            setErro(
                'As senhas não coincidem.'
            );

            return;
        }

        const codigoCompleto = codigo.join('');

        try {

            setCarregando(true);

            const resposta = await fetch(
                `${API_URL}/recuperar-senha`,
                {
                    method: 'POST',

                    headers: {
                        'Content-Type': 'application/json'
                    },

                    body: JSON.stringify({
                        etapa: 3,
                        email: email.trim(),
                        codigo: codigoCompleto,
                        senha: novaSenha,
                        confirmarSenha: confirmarSenha
                    })
                }
            );

            const dados = await tratarResposta(
                resposta
            );

            setSucesso(
                dados?.mensagem ||
                'Senha alterada com sucesso!'
            );

            setNovaSenha('');
            setConfirmarSenha('');

        } catch (erro) {

            console.error(
                'Erro ao redefinir senha:',
                erro
            );

            setErro(
                erro.message ||
                'Não foi possível redefinir a senha.'
            );

        } finally {

            setCarregando(false);
        }
    };

    // ==========================================
    // VOLTAR
    // ==========================================

    const voltar = () => {

        limparMensagens();

        if (carregando) {
            return;
        }

        if (etapa === 1) {

            window.history.back();

        } else {

            setEtapa(etapa - 1);

            if (etapa === 2) {

                setCodigo(
                    Array(6).fill('')
                );
            }
        }
    };

    // ==========================================
    // RENDER
    // ==========================================

    return (
        <main className={styles.container}>

            <button
                type="button"
                className={styles.botaoVoltar}
                onClick={voltar}
                disabled={carregando}
            >
                VOLTAR
            </button>

            <section className={styles.areaRedefinicao}>

                <div className={styles.conteudo}>

                    {/* =====================================
                        INDICADOR DAS ETAPAS
                    ===================================== */}

                    <div className={styles.etapas}>

                        <div
                            className={`${styles.etapa} ${
                                etapa >= 1
                                    ? styles.etapaAtiva
                                    : ''
                            }`}
                        >
                            <span>1</span>
                            <p>E-mail</p>
                        </div>

                        <div className={styles.linha}></div>

                        <div
                            className={`${styles.etapa} ${
                                etapa >= 2
                                    ? styles.etapaAtiva
                                    : ''
                            }`}
                        >
                            <span>2</span>
                            <p>Código</p>
                        </div>

                        <div className={styles.linha}></div>

                        <div
                            className={`${styles.etapa} ${
                                etapa >= 3
                                    ? styles.etapaAtiva
                                    : ''
                            }`}
                        >
                            <span>3</span>
                            <p>Senha</p>
                        </div>

                    </div>

                    {/* =====================================
                        MENSAGENS
                    ===================================== */}

                    {erro && (
                        <div className={styles.mensagemErro}>
                            {erro}
                        </div>
                    )}

                    {sucesso && (
                        <div className={styles.mensagemSucesso}>
                            {sucesso}
                        </div>
                    )}

                    {/* =====================================
                        ETAPA 1
                    ===================================== */}

                    {etapa === 1 && (
                        <>

                            <h1 className={styles.titulo}>
                                REDEFINIÇÃO DE SENHA
                            </h1>

                            <p className={styles.subtitulo}>
                                Informe seu e-mail para receber
                                o código de recuperação.
                            </p>

                            <form
                                onSubmit={enviarCodigo}
                                className={styles.formulario}
                            >

                                <div
                                    className={
                                        styles.grupoEntrada
                                    }
                                >

                                    <label
                                        htmlFor="email"
                                        className={
                                            styles.rotulo
                                        }
                                    >
                                        Email de recuperação
                                    </label>

                                    <input
                                        type="email"
                                        id="email"
                                        placeholder="example@gmail.com"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(
                                                e.target.value
                                            );
                                            limparMensagens();
                                        }}
                                        className={
                                            styles.entrada
                                        }
                                        disabled={carregando}
                                        required
                                    />

                                </div>

                                <button
                                    type="submit"
                                    className={
                                        styles.botaoEnviar
                                    }
                                    disabled={carregando}
                                >

                                    {carregando
                                        ? 'ENVIANDO...'
                                        : 'ENVIAR CÓDIGO'
                                    }

                                </button>

                            </form>

                        </>
                    )}

                    {/* =====================================
                        ETAPA 2
                    ===================================== */}

                    {etapa === 2 && (
                        <>

                            <h1 className={styles.titulo}>
                                CONFIRMAR CÓDIGO
                            </h1>

                            <p className={styles.subtitulo}>
                                Digite o código de 6 dígitos
                                enviado para:
                                <br />

                                <strong>
                                    {email}
                                </strong>
                            </p>

                            <form
                                onSubmit={confirmarCodigo}
                                className={styles.formulario}
                            >

                                <div
                                    className={
                                        styles.otpContainer
                                    }
                                >

                                    {codigo.map(
                                        (digito, index) => (

                                            <input
                                                key={index}

                                                ref={(elemento) =>
                                                    inputs.current[index] =
                                                        elemento
                                                }

                                                type="text"

                                                inputMode="numeric"

                                                autoComplete={
                                                    index === 0
                                                        ? 'one-time-code'
                                                        : 'off'
                                                }

                                                maxLength={1}

                                                value={digito}

                                                onChange={(e) =>
                                                    handleChangeCode(
                                                        e.target.value,
                                                        index
                                                    )
                                                }

                                                onKeyDown={(e) =>
                                                    handleKeyDown(
                                                        e,
                                                        index
                                                    )
                                                }

                                                onPaste={
                                                    handlePaste
                                                }

                                                className={
                                                    styles.entradaCodigo
                                                }

                                                disabled={
                                                    carregando
                                                }

                                                aria-label={
                                                    `Dígito ${
                                                        index + 1
                                                    } do código`
                                                }
                                            />

                                        )
                                    )}

                                </div>

                                <button
                                    type="submit"
                                    className={
                                        styles.botaoEnviar
                                    }
                                    disabled={
                                        carregando ||
                                        codigo.join('').length !== 6
                                    }
                                >

                                    {carregando
                                        ? 'VERIFICANDO...'
                                        : 'CONFIRMAR CÓDIGO'
                                    }

                                </button>

                            </form>

                        </>
                    )}

                    {/* =====================================
                        ETAPA 3
                    ===================================== */}

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

                                <div
                                    className={
                                        styles.grupoEntrada
                                    }
                                >

                                    <label
                                        htmlFor="novaSenha"
                                        className={
                                            styles.rotulo
                                        }
                                    >
                                        Nova senha
                                    </label>

                                    <input
                                        type="password"
                                        id="novaSenha"
                                        placeholder="Digite sua nova senha"
                                        value={novaSenha}
                                        onChange={(e) => {
                                            setNovaSenha(
                                                e.target.value
                                            );
                                            limparMensagens();
                                        }}
                                        className={
                                            styles.entrada
                                        }
                                        minLength={6}
                                        disabled={carregando}
                                        required
                                    />

                                </div>

                                <div
                                    className={
                                        styles.grupoEntrada
                                    }
                                >

                                    <label
                                        htmlFor="confirmarSenha"
                                        className={
                                            styles.rotulo
                                        }
                                    >
                                        Confirmar nova senha
                                    </label>

                                    <input
                                        type="password"
                                        id="confirmarSenha"
                                        placeholder="Digite a senha novamente"
                                        value={
                                            confirmarSenha
                                        }
                                        onChange={(e) => {
                                            setConfirmarSenha(
                                                e.target.value
                                            );
                                            limparMensagens();
                                        }}
                                        className={
                                            styles.entrada
                                        }
                                        minLength={6}
                                        disabled={carregando}
                                        required
                                    />

                                </div>

                                <button
                                    type="submit"
                                    className={
                                        styles.botaoEnviar
                                    }
                                    disabled={carregando}
                                >

                                    {carregando
                                        ? 'ALTERANDO...'
                                        : 'REDEFINIR SENHA'
                                    }

                                </button>

                            </form>

                        </>
                    )}

                </div>

            </section>

        </main>
    );
}