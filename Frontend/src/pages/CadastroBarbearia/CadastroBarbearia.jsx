import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { IMaskInput } from 'react-imask';
import { apiFetch, mensagemDaApi } from '../../services/api';
import MensagemCard from '../../components/MensagemCard/MensagemCard';
import styles from './CadastroBarbearia.module.css';

export default function CadastroADM() {
    const [nome, setNome] = useState('');
    const [telefone, setTelefone] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');
    const [tipoUsuario, setTipoUsuario] = useState('cliente');
    const [carregando, setCarregando] = useState(false);
    const [mensagem, setMensagem] = useState(null);

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const cadastroPorAdmin = searchParams.get('origem') === 'admin';

    const obterTipoNumeric = (tipo) => {
        switch (tipo) {
            case 'adm': return 0;
            case 'barbearia': return 2;
            case 'cliente': default: return 1;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMensagem(null);

        if (senha !== confirmarSenha) {
            setMensagem({ informacao: 'As senhas não coincidem.', tipo: 'erro' });
            return;
        }

        setCarregando(true);

        try {
            const dados = await apiFetch('/cadastro', {
                method: 'POST',
                body: JSON.stringify({
                    nome,
                    telefone,
                    email: email.trim().replace(/\s/g, ''),
                    senha,
                    confirmarSenha,
                    tipo: cadastroPorAdmin ? obterTipoNumeric(tipoUsuario) : 1,
                }),
            });

            setMensagem(dados?.mensagem || { informacao: 'Cadastro realizado com sucesso!', tipo: 'sucesso' });

            setTimeout(() => {
                // Cadastro iniciado pelo painel não deve tirar o ADM da gestão.
                if (cadastroPorAdmin) {
                    navigate('/admin/usuarios', { replace: true });
                    return;
                }
                localStorage.setItem('email_verificacao', email.trim().replace(/\s/g, ''));
                navigate('/verificar-codigo');
            }, 1000);
        } catch (error) {
            console.error('ERRO NO CADASTRO:', error);
            setMensagem({ informacao: mensagemDaApi(error), tipo: 'erro' });
        } finally {
            setCarregando(false);
        }
    };

    return (
        <div className={styles.paginaCompleta}>
            <MensagemCard mensagem={mensagem} fechar={() => setMensagem(null)} />

            {/* CONTEÚDO PRINCIPAL (SPLIT 50/50) */}
            <main className={styles.containerConteudo}>
                <section className={styles.areaFormulario}>
                    <div className={styles.cartaoCadastro}>
                        <h1 className={styles.titulo}>{cadastroPorAdmin ? 'CADASTRAR CONTA' : 'CADASTRO'}</h1>

                        <form onSubmit={handleSubmit} className={styles.formulario}>
                            <div className={styles.grupoEntrada}>
                                <label htmlFor="input-nome" className={styles.rotulo}>Nome</label>
                                <IMaskInput
                                    mask={/^[A-Za-zÀ-ÿ ]*$/}
                                    type="text"
                                    id="input-nome"
                                    value={nome}
                                    onAccept={(val) => setNome(val)}
                                    className={styles.entrada}
                                    required
                                />
                            </div>

                            <div className={styles.grupoEntrada}>
                                <label htmlFor="input-telefone" className={styles.rotulo}>Telefone</label>
                                <IMaskInput
                                    mask="(00) 0000[0]-0000"
                                    type="tel"
                                    id="input-telefone"
                                    value={telefone}
                                    onAccept={(val) => setTelefone(val)}
                                    className={styles.entrada}
                                    required
                                />
                            </div>

                            <div className={styles.grupoEntrada}>
                                <label htmlFor="input-email" className={styles.rotulo}>E-mail</label>
                                <IMaskInput
                                    mask={/^[\w.+-@]*$/}
                                    type="email"
                                    id="input-email"
                                    value={email}
                                    onAccept={(val) => setEmail(val)}
                                    className={styles.entrada}
                                    required
                                />
                            </div>

                            <div className={styles.grupoEntrada}>
                                <label htmlFor="input-senha" className={styles.rotulo}>Senha</label>
                                <IMaskInput
                                    mask={/^[\s\S]*$/}
                                    type="password"
                                    id="input-senha"
                                    value={senha}
                                    onAccept={(val) => setSenha(val)}
                                    className={styles.entrada}
                                    required
                                />
                            </div>

                            <div className={styles.grupoEntrada}>
                                <label htmlFor="input-confirmar-senha" className={styles.rotulo}>Confirmar Senha</label>
                                <IMaskInput
                                    mask={/^[\s\S]*$/}
                                    type="password"
                                    id="input-confirmar-senha"
                                    value={confirmarSenha}
                                    onAccept={(val) => setConfirmarSenha(val)}
                                    className={styles.entrada}
                                    required
                                />
                            </div>

                            {cadastroPorAdmin && (
                                <div className={styles.grupoTipoUsuario}>
                                    <label className={styles.opcaoRadio}>
                                        <input
                                            type="radio"
                                            id="radio-adm"
                                            name="tipoUsuario"
                                            value="adm"
                                            checked={tipoUsuario === 'adm'}
                                            onChange={(e) => setTipoUsuario(e.target.value)}
                                        />
                                        <span>ADM</span>
                                    </label>

                                    <label className={styles.opcaoRadio}>
                                        <input
                                            type="radio"
                                            id="radio-cliente"
                                            name="tipoUsuario"
                                            value="cliente"
                                            checked={tipoUsuario === 'cliente'}
                                            onChange={(e) => setTipoUsuario(e.target.value)}
                                        />
                                        <span>Cliente</span>
                                    </label>

                                    <label className={styles.opcaoRadio}>
                                        <input
                                            type="radio"
                                            id="radio-barbearia"
                                            name="tipoUsuario"
                                            value="barbearia"
                                            checked={tipoUsuario === 'barbearia'}
                                            onChange={(e) => setTipoUsuario(e.target.value)}
                                        />
                                        <span>Barbearia</span>
                                    </label>
                                </div>
                            )}

                            {/* BOTOES */}
                            <button
                                type="submit"
                                id="btn-cadastre-se"
                                className={styles.btnCadastreSe}
                                disabled={carregando}
                            >
                                {carregando ? 'CARREGANDO...' : 'CADASTRE-SE'}
                            </button>
                        </form>

                        <span className={styles.textoOu}>OU</span>

                        <button
                            type="button"
                            id="btn-voltar"
                            className={styles.btnVoltar}
                            onClick={() => navigate(-1)}
                        >
                            VOLTAR
                        </button>
                    </div>
                </section>

                {/* LADO DIREITO COM A FOTO DA BARBEARIA */}
                <section className={styles.areaImagem}></section>
            </main>


        </div>
    );
}
