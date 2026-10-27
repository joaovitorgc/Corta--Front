import { useEffect, useState } from 'react';
import { LuSearch, LuMapPin, LuClock } from 'react-icons/lu';
import { IMaskInput } from 'react-imask';
import { useNavigate } from 'react-router-dom';
import styles from './BarbeariasDisponiveis.module.css';
import { apiFetch, API_URL } from '../../services/api';

// Normaliza o item vindo da API para o formato usado pela tela.
function normalizarBarbearia(item) {
    const imagem = item.imagem || item.logo || null;

    return {
        id: item.id ?? item.id_barbearia,
        id_usuario: item.id_usuario,
        nome: item.nome || '',
        endereco: item.endereco || '',
        horario: item.horario || '',
        dias: item.dias || '',
        imagem,
        personalizada: Boolean(item.personalizada ?? imagem),
    };
}

function abreviarDias(dias) {
    if (!dias) return '';

    const abreviacoes = {
        segunda: 'SEG',
        terça: 'TER',
        terca: 'TER',
        quarta: 'QUA',
        quinta: 'QUI',
        sexta: 'SEX',
        sábado: 'SAB',
        sabado: 'SAB',
        domingo: 'DOM'
    };

    return dias
        .split(/[,;]+/)
        .map((dia) => {
            const nome = dia.trim().toLowerCase();
            return abreviacoes[nome] || dia.trim().toUpperCase();
        })
        .join(', ');
}

// Evita "//" quando API_URL termina com barra e o caminho começa com barra.
function montarUrlImagem(caminho) {
    if (!caminho) return null;
    if (/^https?:\/\//i.test(caminho)) return caminho;
    return `${API_URL.replace(/\/$/, '')}/${caminho.replace(/^\//, '')}`;
}

export default function Barbearias() {
    const navigate = useNavigate();
    const [busca, setBusca] = useState('');
    const [barbearias, setBarbearias] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');

    useEffect(() => {
        async function carregarBarbearias() {
            try {
                setCarregando(true);
                setErro('');

                const dados = await apiFetch('/listar_barbearias_disponiveis');
                const lista = Array.isArray(dados) ? dados : [];
                setBarbearias(lista.map(normalizarBarbearia));
            } catch (error) {
                console.error('Erro ao carregar barbearias:', error);
                setErro('Não foi possível carregar as barbearias disponíveis.');
                setBarbearias([]);
            } finally {
                setCarregando(false);
            }
        }

        carregarBarbearias();
    }, []);

    const termo = busca.trim().toLowerCase();
    const barbeariasFiltradas = barbearias.filter((barbearia) =>
        barbearia.nome.toLowerCase().includes(termo)
    );

    return (
        <div className={styles.container}>
            <main className={styles.main}>
                <div className={styles.headerBusca}>
                    <div className={styles.titulos}>
                        <h1 className={styles.titulo}>
                            Barbearias <span className={styles.destaque}>Disponíveis</span>
                        </h1>
                        <p className={styles.subtitulo}>
                            Encontre os melhores profissionais para o seu próximo estilo.
                        </p>
                    </div>

                    <div className={styles.caixaBusca}>
                        <LuSearch className={styles.iconeBusca} size={18} />
                        <IMaskInput
                            mask={/^[\s\S]*$/}
                            type="text"
                            placeholder="Ex: nome da barbearia"
                            value={busca}
                            onAccept={(value) => setBusca(value)}
                            className={styles.inputBusca}
                        />
                    </div>
                </div>

                {carregando && <p>Carregando barbearias...</p>}

                {!carregando && erro && <p>{erro}</p>}

                {!carregando && !erro && barbeariasFiltradas.length === 0 && (
                    <p>Nenhuma barbearia encontrada.</p>
                )}

                {!carregando && !erro && barbeariasFiltradas.length > 0 && (
                    <div className={styles.grid}>
                        {barbeariasFiltradas.map((barbearia) => {
                            const urlImagem = montarUrlImagem(barbearia.imagem);

                            return (
                                <article
                                    key={barbearia.id}
                                    className={styles.card}
                                    style={
                                        urlImagem
                                            ? { backgroundImage: `url("${urlImagem}")` }
                                            : undefined
                                    }
                                >
                                    <div className={styles.cardOverlay}>
                                        {barbearia.dias && (
                                            <span className={styles.badgeDias}>
                                                {abreviarDias(barbearia.dias)}
                                            </span>
                                        )}

                                        <div className={styles.cardConteudo}>
                                            <h3 className={styles.cardNome}>{barbearia.nome}</h3>

                                            <div className={styles.infoLinha}>
                                                <LuMapPin className={styles.infoIcone} size={14} />
                                                <span>{barbearia.endereco || 'Endereço não informado'}</span>
                                            </div>

                                            <button
                                                type="button"
                                                className={styles.btnAgendar}
                                                disabled={!barbearia.personalizada}
                                                onClick={() =>
                                                    navigate(`/estabelecimento?usuario=${barbearia.id_usuario}`)
                                                }
                                            >
                                                {barbearia.personalizada
                                                    ? 'Ver estabelecimento'
                                                    : 'Em configuração'}
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}