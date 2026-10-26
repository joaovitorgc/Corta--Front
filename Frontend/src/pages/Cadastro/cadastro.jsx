import styles from './Cadastro.module.css';

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IMaskInput } from 'react-imask';

import {
    apiFetch,
    mensagemDaApi
} from '../../services/api';

import MensagemCard from '../../components/MensagemCard/MensagemCard';

export default function Cadastro() {
    const [nome, setNome] = useState('');
    const [telefone, setTelefone] = useState('');
    const [email, setEmail] = useState('');
    const [genero, setGenero] = useState('');
    const [senha, setSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');

    const [carregando, setCarregando] = useState(false);
    const [mensagem, setMensagem] = useState(null);

    const [termosObrigatorios, setTermosObrigatorios] = useState(false);
    const [termosAceitos, setTermosAceitos] = useState(false);
    const [termosVersao, setTermosVersao] = useState(null);
    const [carregandoTermos, setCarregandoTermos] = useState(true);
    const [erroTermos, setErroTermos] = useState(false);

    const navigate = useNavigate();
    const temporizador = useRef(null);

    // Carrega o estado e a versão dos termos antes de permitir o cadastro.
    // Backend: GET /termos_publicos -> { aceite_habilitado, versao, ... }
    useEffect(() => {
        let ativo = true;

        async function carregarTermos() {
            try {
                const dados = await apiFetch('/termos_publicos', {
                    method: 'GET'
                });

                if (!ativo) return;

                // O Python decide por "truthy" (pode vir true, 1, "true"...).
                const habilitado = dados?.aceite_habilitado;
                setTermosObrigatorios(
                    Boolean(habilitado) &&
                    habilitado !== 'false' &&
                    habilitado !== '0'
                );
                setTermosVersao(dados?.versao ?? null);
                setErroTermos(false);
            } catch (error) {
                if (!ativo) return;

                console.error('Erro ao carregar os termos:', error);
                setErroTermos(true);
            } finally {
                if (ativo) {
                    setCarregandoTermos(false);
                }
            }
        }

        carregarTermos();

        return () => {
            ativo = false;
            clearTimeout(temporizador.current);
        };
    }, []);

    const erro = (informacao) =>
        setMensagem({ informacao, tipo: 'erro' });

    // Backend: POST /cadastro
    const handleSubmit = async (e) => {
        e.preventDefault();
        setMensagem(null);

        if (carregandoTermos) {
            return erro('Aguarde enquanto carregamos os termos de uso.');
        }

        if (erroTermos) {
            return erro('Não foi possível carregar os termos. Atualize a página e tente novamente.');
        }

        if (termosObrigatorios && termosVersao == null) {
            return erro('Não foi possível identificar a versão dos termos. Tente novamente.');
        }

        if (termosObrigatorios && !termosAceitos) {
            return erro('Você precisa aceitar os termos de uso para continuar.');
        }

        // O backend exige 10 ou 11 dígitos (DDD + número).
        const telefoneDigitos = telefone.replace(/\D/g, '');

        if (telefoneDigitos.length !== 10 && telefoneDigitos.length !== 11) {
            return erro('Informe um telefone com DDD válido.');
        }

        if (senha !== confirmarSenha) {
            return erro('As senhas não coincidem.');
        }

        const emailLimpo = email.trim().replace(/\s/g, '').toLowerCase();

        const payload = {
            nome: nome.trim(),
            telefone: telefoneDigitos,
            email: emailLimpo,
            senha,
            confirmarSenha,
            tipo: 1
        };

        // Backend aceita 'masculino', 'feminino' ou 'outro'. "Prefiro não
        // dizer" (valor vazio) simplesmente não envia o campo.
        if (genero) {
            payload.genero = genero;
        }

        // O backend compara termos_versao com a versão atual e exige
        // termos_aceitos === true (booleano).
        if (termosObrigatorios) {
            payload.termos_aceitos = termosAceitos === true;
            payload.termos_versao = termosVersao;
        }

        setCarregando(true);

        try {
            const dados = await apiFetch('/cadastro', {
                method: 'POST',
                // O Flask usa request.get_json(silent=True): sem este header
                // o corpo é ignorado e o backend recebe um JSON vazio.
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            localStorage.setItem('email_verificacao', emailLimpo);

            setMensagem(
                dados?.mensagem || {
                    informacao: 'Cadastro realizado com sucesso!',
                    tipo: 'sucesso'
                }
            );

            temporizador.current = setTimeout(() => {
                navigate('/verificar-codigo');
            }, 1000);
        } catch (error) {
            console.error('ERRO NO CADASTRO:', error);

            const dadosErro = error?.dados;

            // 428: o servidor informou que a versão dos termos mudou ou que
            // o aceite está pendente.
            if (
                error?.status === 428 ||
                dadosErro?.codigo === 'termos_aceite_pendente'
            ) {
                setTermosObrigatorios(true);

                if (dadosErro?.termos_versao != null) {
                    setTermosVersao(dadosErro.termos_versao);
                }

                setTermosAceitos(false);

                return erro('Leia e aceite os termos de uso para continuar com o cadastro.');
            }

            erro(mensagemDaApi(error));
        } finally {
            setCarregando(false);
        }
    };

    return (
        <main className={styles.container}>
            <MensagemCard
                mensagem={mensagem}
                fechar={() => setMensagem(null)}
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
                            <label htmlFor="nome" className={styles.rotulo}>
                                Nome
                            </label>

                            <IMaskInput
                                mask={/^[A-Za-zÀ-ÿ ]*$/}
                                type="text"
                                id="nome"
                                value={nome}
                                onAccept={(value) => setNome(value)}
                                className={styles.entrada}
                                maxLength={100}
                                required
                            />
                        </div>

                        <div className={styles.grupoEntrada}>
                            <label htmlFor="telefone" className={styles.rotulo}>
                                Telefone
                            </label>

                            <IMaskInput
                                mask="(00) 0000[0]-0000"
                                type="tel"
                                id="telefone"
                                value={telefone}
                                onAccept={(value) => setTelefone(value)}
                                className={styles.entrada}
                                required
                            />
                        </div>

                        <div className={styles.grupoEntrada}>
                            <label htmlFor="email" className={styles.rotulo}>
                                E-mail
                            </label>

                            <IMaskInput
                                mask={/^[\w.+@-]*$/}
                                type="email"
                                id="email"
                                value={email}
                                onAccept={(value) => setEmail(value)}
                                className={styles.entrada}
                                maxLength={150}
                                required
                            />
                        </div>

                        <div className={styles.grupoEntrada}>
                            <label htmlFor="genero" className={styles.rotulo}>
                                Gênero
                            </label>

                            <select
                                id="genero"
                                value={genero}
                                onChange={(e) => setGenero(e.target.value)}
                                className={styles.entrada}
                            >
                                <option value="">Prefiro não dizer</option>
                                <option value="masculino">Masculino</option>
                                <option value="feminino">Feminino</option>
                            </select>
                        </div>

                        {/* Senhas em input comum: máscara não faz sentido aqui
                            e pode interferir no valor digitado. */}
                        <div className={styles.grupoEntrada}>
                            <label htmlFor="senha" className={styles.rotulo}>
                                Senha
                            </label>

                            <input
                                type="password"
                                id="senha"
                                value={senha}
                                onChange={(e) => setSenha(e.target.value)}
                                className={styles.entrada}
                                autoComplete="new-password"
                                required
                            />
                        </div>

                        <div className={styles.grupoEntrada}>
                            <label htmlFor="confirmarSenha" className={styles.rotulo}>
                                Confirmar Senha
                            </label>

                            <input
                                type="password"
                                id="confirmarSenha"
                                value={confirmarSenha}
                                onChange={(e) => setConfirmarSenha(e.target.value)}
                                className={styles.entrada}
                                autoComplete="new-password"
                                required
                            />
                        </div>

                        {termosObrigatorios && (
                            <div className={styles.grupoEntrada}>
                                <label className={styles.rotulo}>
                                    <input
                                        type="checkbox"
                                        checked={termosAceitos}
                                        onChange={(e) => setTermosAceitos(e.target.checked)}
                                        required
                                    />
                                    {' '}Li e aceito os termos de uso
                                </label>
                            </div>
                        )}

                        {carregandoTermos && (
                            <p>Carregando termos de uso...</p>
                        )}

                        {erroTermos && (
                            <p>
                                Não foi possível carregar os termos de uso.
                                Atualize a página para tentar novamente.
                            </p>
                        )}

                        <button
                            type="submit"
                            id="cadastrar"
                            name="cadastrar"
                            className={styles.botaoCadastrar}
                            disabled={carregando || carregandoTermos || erroTermos}
                        >
                            {carregando ? 'CADASTRANDO...' : 'CADASTRAR'}
                        </button>
                    </form>

                    <div className={styles.areaLogin}>
                        <p className={styles.textoLogin}>
                            Já possui Cadastro?
                        </p>

                        <button
                            type="button"
                            id="login"
                            className={styles.botaoLogin}
                            onClick={() => navigate('/login')}
                        >
                            FAÇA O LOGIN
                        </button>
                    </div>
                </div>
            </section>

            <section className={styles.areaImagem}>
                <div className={styles.sobreposicaoImagem} />
            </section>
        </main>
    );
}