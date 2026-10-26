import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    FiMapPin,
    FiClock,
    FiPhone,
    FiMail,
    FiInstagram,
    FiCalendar,
    FiUser
} from 'react-icons/fi';
import CardServico from '../../components/CardServico/CardServico';
import styles from './Estabelecimento.module.css';
import CarrosselImagens from "../../components/CarrosselImagens/CarrosselImagens.jsx";
import { API_URL, apiFetch, mensagemDaApi } from '../../services/api';

export default function Estabelecimento() {
    const [searchParams] = useSearchParams();
    const idUsuarioAlvo = searchParams.get('usuario');
    const sufixoUsuario = idUsuarioAlvo ? `?id_usuario=${encodeURIComponent(idUsuarioAlvo)}` : '';
    const [categoria, setCategoria] = useState('Serviços');
    const [dados, setDados] = useState(null);
    const [servicos, setServicos] = useState([]);
    const [erro, setErro] = useState('');
    const [profissionalSelecionado, setProfissionalSelecionado] = useState(null);


    useEffect(() => {
        let ativo = true;

        async function carregar() {
            try {
                setErro('');

                const [personalizacao, respostaServicos] = await Promise.all([
                    apiFetch(`/barbearia/personalizacao${sufixoUsuario}`),
                    apiFetch(`/barbearia/servicos${sufixoUsuario}`)
                ]);

                if (!ativo) return;

                setDados(personalizacao);

                const listaServicos = Array.isArray(respostaServicos)
                    ? respostaServicos
                    : Array.isArray(respostaServicos?.servicos)
                        ? respostaServicos.servicos
                        : Array.isArray(respostaServicos?.dados)
                            ? respostaServicos.dados
                            : Array.isArray(respostaServicos?.data)
                                ? respostaServicos.data
                                : [];

                setServicos(
                    listaServicos.filter(
                        (servico) => Number(servico.ativo) !== 0
                    )
                );

                console.log('Resposta dos serviços:', respostaServicos);
                console.log('Lista de serviços:', listaServicos);
            } catch (error) {
                if (ativo) {
                    console.error('Erro ao carregar serviços:', error);
                    setErro(mensagemDaApi(error));
                }
            }
        }
        carregar();
        return () => {
            ativo = false;
        };
    }, [sufixoUsuario]);


    if (erro) return <main className={styles.container}><p>{erro}</p></main>;
    if (!dados) return <main className={styles.container}><p>Carregando estabelecimento…</p></main>;
    if (!dados.personalizado) return <main className={styles.container}><p>Esta barbearia ainda não foi personalizada.</p></main>;

    const personalizacao = dados.personalizacao;
    const profissionais = dados.funcionarios || [];
    const imagensBarbearia = (dados.fotos || []).map((foto) => `${API_URL}${foto.url}`);
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
    const nomeBarbearia = dados.nome_barbearia || usuario.nome || 'Sua Barbearia';
    const formatarPreco = (preco) => Number(preco || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const formatarDuracao = (duracao) => `${duracao} MIN`;
    const servicosDoProfissional = profissionalSelecionado
        ? servicos.filter((servico) =>
            profissionalSelecionado.servicos?.includes(servico.id_servico)
        )
        : [];
    const diasDoProfissional = profissionalSelecionado
        ? (dados.dias_servico || []).filter((dia) =>
            profissionalSelecionado.dias?.includes(dia.id_dia)
        )
        : [];
    const telefoneWhatsApp = String(personalizacao.contato_telefone || '').replace(/\D/g, '');
    const instagram = String(personalizacao.instagram || '').replace(/^@/, '');

    return (
        <main className={styles.container} style={{
            '--cor-destaque': personalizacao.cor_primaria || '#FF9C08',
            '--cor-fundo': personalizacao.cor_terciaria || '#FFFFFF',
            '--cor-fundo-b': personalizacao.cor_secundaria || '#000000',
            '--cor-texto': personalizacao.cor_texto_primario || '#000000',
            '--cor-texto-2': personalizacao.cor_texto_secundario || '#FFFFFF',
        }}>
            <section className={styles.conteudo}>
                <div className={styles.apresentacao}>
                    <div className={styles.informacoes}>
                        <span className={styles.selo}>
                            PREMIUM EXPERIENCE
                        </span>

                        <h1>{nomeBarbearia}</h1>

                        <p>
                            {personalizacao.historia || 'Conheça nossa barbearia e nossos serviços.'}
                        </p>

                        <button
                            id="btn-agendar-topo"
                            className={styles.botaoAgendar}
                        >
                            Agendar Agora
                        </button>
                    </div>

                    <div className={styles.imagemContainer}>
                        {imagensBarbearia.length ? <CarrosselImagens imagens={imagensBarbearia} /> : <div />}
                    </div>
                </div>

                <div className={styles.areaPrincipal}>
                    <section className={styles.servicos}>
                        <div className={styles.tituloSecao}>
                            <span></span>
                            <h2>Nossos Serviços</h2>
                        </div>

                        <div className={styles.abas}>
                            <button
                                id="btn-aba-servicos"
                                className={
                                    categoria === 'Serviços'
                                        ? styles.abaAtiva
                                        : ''
                                }
                                onClick={() => setCategoria('Serviços')}
                            >
                                Serviços
                            </button>

                            <button
                                id="btn-aba-profissionais"
                                className={
                                    categoria === 'Profissionais'
                                        ? styles.abaAtiva
                                        : ''
                                }
                                onClick={() =>
                                    setCategoria('Profissionais')
                                }
                            >
                                Profissionais
                            </button>
                        </div>


                        {categoria === 'Serviços' && (
                            <div className={styles.listaServicos}>
                                {servicos.length > 0 ? (
                                    servicos.map((servico, indice) => (
                                        <CardServico
                                            key={servico.id_servico ?? indice}
                                            nome={
                                                servico.nome ??
                                                servico.nome_servico ??
                                                servico.titulo ??
                                                'Serviço'
                                            }
                                            tempo={`${Number(
                                                servico.duracao ??
                                                servico.duracao_minutos ??
                                                servico.tempo ??
                                                0
                                            )} MIN`}
                                            preco={Number(
                                                servico.preco ??
                                                servico.valor ??
                                                servico.preco_servico ??
                                                0
                                            ).toLocaleString('pt-BR', {
                                                style: 'currency',
                                                currency: 'BRL'
                                            })}
                                        />
                                    ))
                                ) : (
                                    <p className={styles.mensagemVazia}>
                                        Nenhum serviço cadastrado.
                                    </p>
                                )}
                            </div>
                        )}


                        {categoria === 'Profissionais' && (
                            <div className={styles.listaProfissionais}>
                                {profissionais.map((profissional) => (
                                    <button
                                        type="button"
                                        className={styles.profissional}
                                        key={profissional.id_funcionario}
                                        onClick={() => setProfissionalSelecionado(profissional)}
                                    >
                                        <div className={styles.iconeProfissional}>
                                            <FiUser />
                                        </div>

                                        <div>
                                            <h3>{profissional.nome}</h3>
                                            <span>
                                                {profissional.descricao || 'Barbeiro'}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </section>

                    <aside className={styles.lateral}>
                        <div className={styles.cardInformacoes}>
                            <div className={styles.bloco}>
                                <div className={styles.tituloCard}>
                                    <FiMapPin />
                                    <span>LOCALIZAÇÃO</span>
                                </div>

                                <p>
                                    {personalizacao.localizacao || 'Localização não informada'}
                                </p>
                            </div>

                            <div className={styles.bloco}>
                                <div className={styles.tituloCard}>
                                    <FiClock />
                                    <span>
                                        HORÁRIO DE ATENDIMENTO
                                    </span>
                                </div>

                                <div className={styles.horarios}>{(dados.dias_servico || []).map((dia) => <p key={dia.id_dia}><span>{dia.dia}</span><strong>{String(dia.entrada_manha).slice(0, 5)} - {String(dia.saida_manha).slice(0, 5)} | {String(dia.entrada_tarde).slice(0, 5)} - {String(dia.saida_tarde).slice(0, 5)}</strong></p>)}</div>
                            </div>

                            <div className={styles.bloco}>
                                <div className={styles.tituloCard}>
                                    <FiPhone />
                                    <span>CONTATO</span>
                                </div>

                                {telefoneWhatsApp ? <a className={styles.telefone} href={`https://wa.me/55${telefoneWhatsApp}`} target="_blank" rel="noreferrer"><FiPhone /><span>{personalizacao.contato_telefone}</span></a> : <div className={styles.telefone}><FiPhone /><span>Telefone não informado</span></div>}
                                {personalizacao.contato_email && <a className={styles.telefone} href={`mailto:${personalizacao.contato_email}`}><FiMail /><span>{personalizacao.contato_email}</span></a>}
                                {instagram && <a className={styles.telefone} href={`https://instagram.com/${instagram}`} target="_blank" rel="noreferrer"><FiInstagram /><span>{personalizacao.instagram}</span></a>}
                            </div>
                        </div>

                        <button
                            id="btn-agendar-lateral"
                            className={styles.botaoAgendarGrande}
                        >
                            <FiCalendar />
                            AGENDAR AGORA
                        </button>
                    </aside>
                </div>
            </section>

            {profissionalSelecionado && (
                <div
                    className={styles.modalFundo}
                    onClick={() => setProfissionalSelecionado(null)}
                >
                    <div
                        className={styles.modal}
                        onClick={(event) => event.stopPropagation()}
                    >
                        <button
                            type="button"
                            className={styles.fecharModal}
                            onClick={() => setProfissionalSelecionado(null)}
                        >
                            ×
                        </button>

                        <div className={styles.modalIcone}>
                            <FiUser />
                        </div>

                        <h2>{profissionalSelecionado.nome}</h2>
                        <p className={styles.modalDescricao}>
                            {profissionalSelecionado.descricao || 'Profissional da barbearia'}
                        </p>

                        <div className={styles.modalBloco}>
                            <h3>Serviços</h3>
                            {servicosDoProfissional.length ? (
                                <div className={styles.modalLista}>
                                    {servicosDoProfissional.map((servico) => (
                                        <div className={styles.modalItem} key={servico.id_servico}>
                                            <span>{servico.nome}</span>
                                            <strong>{formatarPreco(servico.preco)}</strong>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p>Nenhum serviço informado.</p>
                            )}
                        </div>

                        <div className={styles.modalBloco}>
                            <h3>Atendimento</h3>
                            {diasDoProfissional.length ? (
                                <div className={styles.modalLista}>
                                    {diasDoProfissional.map((dia) => (
                                        <div className={styles.modalItem} key={dia.id_dia}>
                                            <span>{dia.dia}</span>
                                            <strong>
                                                {dia.entrada_manha && dia.saida_manha
                                                    ? `${String(dia.entrada_manha).slice(0, 5)} - ${String(dia.saida_manha).slice(0, 5)}`
                                                    : 'Horário não informado'}
                                                {dia.entrada_tarde && dia.saida_tarde
                                                    ? ` | ${String(dia.entrada_tarde).slice(0, 5)} - ${String(dia.saida_tarde).slice(0, 5)}`
                                                    : ''}
                                            </strong>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p>Nenhum horário informado.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
