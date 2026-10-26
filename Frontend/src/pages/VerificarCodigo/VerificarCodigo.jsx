import { useEffect, useRef, useState } from 'react';
import { IMaskInput } from 'react-imask';
import { useNavigate } from 'react-router-dom';
import styles from './VerificarCodigo.module.css';
import { apiFetch, mensagemDaApi } from '../../services/api';
import MensagemCard from '../../components/MensagemCard/MensagemCard';

export default function VerificarCodigo() {
    // O e-mail é definido antes da primeira renderização; não é necessário
    // disparar outro ciclo de renderização apenas para ler o armazenamento local.
    const [email] = useState(() => localStorage.getItem('email_verificacao') || '');
    const [codigo, setCodigo] = useState('');
    const [mensagem, setMensagem] = useState(null);
    const [carregando, setCarregando] = useState(false);
    const navigate = useNavigate();
    const temporizador = useRef(null);

    useEffect(() => () => clearTimeout(temporizador.current), []);

    const erro = (informacao) =>
        setMensagem({ informacao, tipo: 'erro' });

    const verificar = async (e) => {
        e.preventDefault();
        setMensagem(null);

        if (!email) {
            erro('E-mail não encontrado. Refaça o cadastro.');
            return;
        }

        if (codigo.length !== 6) {
            erro('Digite o código de 6 dígitos.');
            return;
        }

        setCarregando(true);

        try {
            // Backend: POST /verificar_codigo (com underline) -> { email, codigo }
            const dados = await apiFetch('/verificar_codigo', {
                method: 'POST',
                // O Flask usa request.get_json(silent=True): sem este header
                // o corpo é ignorado.
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, codigo }),
            });

            // O backend responde 202 (e não confirma o e-mail) quando o código
            // estava correto, mas expirou: ele envia um código novo por e-mail.
            if (dados?.codigo_expira_em) {
                setCodigo('');
                setMensagem(
                    dados?.mensagem || {
                        informacao: 'O código expirou. Enviamos outro código para seu e-mail.',
                        tipo: 'sucesso'
                    }
                );
                return;
            }

            setMensagem(
                dados?.mensagem || {
                    informacao: 'E-mail confirmado com sucesso!',
                    tipo: 'sucesso'
                }
            );

            localStorage.removeItem('email_verificacao');

            temporizador.current = setTimeout(() => navigate('/login'), 1500);
        } catch (error) {
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

            <section className={styles.card}>
                <h1>CONFIRME SEU E-MAIL</h1>

                <p>
                    Digite o código de 6 dígitos enviado para:
                    <br />
                    <strong>{email || 'seu e-mail'}</strong>
                </p>

                <form onSubmit={verificar}>
                    <IMaskInput
                        mask="000000"
                        type="text"
                        inputMode="numeric"
                        id="input-codigo"
                        value={codigo}
                        onAccept={(value) => setCodigo(value)}
                        className={styles.codigo}
                        placeholder="000000"
                        required
                    />

                    <button
                        id="btn-confirmar-email"
                        type="submit"
                        disabled={carregando}
                    >
                        {carregando ? 'VERIFICANDO...' : 'CONFIRMAR E-MAIL'}
                    </button>
                </form>
            </section>
        </main>
    );
}