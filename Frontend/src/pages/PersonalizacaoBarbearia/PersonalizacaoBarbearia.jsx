
import { useEffect, useMemo, useState } from 'react';
import {
    Image as ImageIcon,
    Plus,
    Scissors,
    Trash2,
    Upload,
    Users,
    Pencil,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { API_URL, apiFetch, mensagemDaApi } from '../../services/api';
import MensagemCard from '../../components/MensagemCard/MensagemCard';
import ModalAdicionarServico from '../../components/ModalAdicionarServico/ModalAdicionarServico';
import SeletorIdentidadeVisual from '../../components/SeletorIdentidadeVisual/SeletorIdentidadeVisual';
import TabelaHorarios from '../../components/TabelaHorarios/TabelaHorarios';
import MaskedInput from '../../components/MaskedInput/MaskedInput';

import styles from './PersonalizacaoBarbearia.module.css';

const DIAS = [
    ['segunda', 'Segunda'],
    ['terca', 'Terça'],
    ['quarta', 'Quarta'],
    ['quinta', 'Quinta'],
    ['sexta', 'Sexta'],
    ['sabado', 'Sábado'],
    ['domingo', 'Domingo'],
];

const criarDias = () =>
    DIAS.map(([chave, nome]) => ({
        chave,
        nome,
        fechado: true,
        manhaInicio: '08:00',
        manhaFim: '12:00',
        tardeInicio: '14:00',
        tardeFim: '18:00',
    }));

const novoFuncionario = () => ({
    id: crypto.randomUUID(),
    nome: '',
    descricao: '',
    email: '',
    telefone: '',
    comissao_percentual: '0',
    dias: [],
    servicos: [],
});

const CORES_INICIAIS = {
    primaria: '#FF9C08',
    secundaria: '#000000',
    terciaria: '#FFFFFF',
    textoPrimario: '#000000',
    textoSecundario: '#FFFFFF',
};

const normalizarHora = (valor) =>
    valor ? String(valor).slice(0, 5) : '';

const normalizarId = (valor) =>
    valor === null || valor === undefined ? '' : String(valor);

export default function PersonalizacaoBarbearia({
                                                    modoEdicao = false,
                                                }) {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const idUsuarioAlvo = searchParams.get('usuario');

    const sufixoUsuario = idUsuarioAlvo
        ? `?id_usuario=${encodeURIComponent(idUsuarioAlvo)}`
        : '';

    const [historia, setHistoria] = useState('');
    const [localizacao, setLocalizacao] = useState('');
    const [cep, setCep] = useState('');
    const [numero, setNumero] = useState('');
    const [complemento, setComplemento] = useState('');

    const [perfilExiste, setPerfilExiste] = useState(false);

    const [contatos, setContatos] = useState({
        telefone: '',
        email: '',
        instagram: '',
    });

    const [cores, setCores] = useState(CORES_INICIAIS);
    const [dias, setDias] = useState(criarDias);
    const [funcionarios, setFuncionarios] = useState([
        novoFuncionario(),
    ]);
    const [servicos, setServicos] = useState([]);

    const [logo, setLogo] = useState(null);
    const [fotos, setFotos] = useState([]);
    const [previewLogo, setPreviewLogo] = useState(null);
    const [previewsFotos, setPreviewsFotos] = useState([]);

    const [modalAberto, setModalAberto] = useState(false);
    const [servicoEditando, setServicoEditando] = useState(null);

    const [carregando, setCarregando] = useState(true);
    const [salvando, setSalvando] = useState(false);
    const [mensagem, setMensagem] = useState(null);

    const diasAbertos = useMemo(
        () => dias.filter((dia) => !dia.fechado),
        [dias]
    );

    useEffect(() => {
        let ativo = true;

        async function carregar() {
            setCarregando(true);

            try {
                const dados = await apiFetch(
                    `/barbearia/personalizacao${sufixoUsuario}`
                );

                if (!ativo) return;

                const temPerfil = Boolean(
                    dados.personalizado || dados.personalizacao
                );

                setPerfilExiste(temPerfil);

                if (!temPerfil) {
                    setServicos([]);

                    if (modoEdicao) {
                        navigate(
                            idUsuarioAlvo
                                ? `/personalizacaobarbearia?usuario=${encodeURIComponent(idUsuarioAlvo)}`
                                : '/personalizacaobarbearia',
                            { replace: true }
                        );
                    }

                    return;
                }

                const dadosServicos = await apiFetch(
                    `/barbearia/servicos${sufixoUsuario}`
                );

                if (!ativo) return;

                const listaServicos = Array.isArray(dadosServicos)
                    ? dadosServicos
                    : dadosServicos.servicos || [];

                setServicos(listaServicos);

                const personalizacao = dados.personalizacao || {};

                setHistoria(personalizacao.historia || '');

                setLocalizacao(
                    personalizacao.localizacao ||
                    personalizacao.rua ||
                    ''
                );

                setCep(personalizacao.cep || '');
                setNumero(personalizacao.numero || '');
                setComplemento(personalizacao.complemento || '');

                setCores({
                    primaria:
                        personalizacao.cor_primaria ||
                        CORES_INICIAIS.primaria,
                    secundaria:
                        personalizacao.cor_secundaria ||
                        CORES_INICIAIS.secundaria,
                    terciaria:
                        personalizacao.cor_terciaria ||
                        CORES_INICIAIS.terciaria,
                    textoPrimario:
                        personalizacao.cor_texto_primario ||
                        CORES_INICIAIS.textoPrimario,
                    textoSecundario:
                        personalizacao.cor_texto_secundario ||
                        CORES_INICIAIS.textoSecundario,
                });

                setContatos({
                    telefone: personalizacao.contato_telefone || '',
                    email: personalizacao.contato_email || '',
                    instagram: personalizacao.instagram || '',
                });

                setLogo(dados.logo || null);
                setFotos(dados.fotos || []);

                setPreviewLogo(
                    dados.logo
                        ? `${API_URL}${dados.logo}`
                        : null
                );

                setPreviewsFotos(
                    (dados.fotos || []).map((foto) =>
                        `${API_URL}${typeof foto === 'string' ? foto : foto.url}`
                    )
                );

                const diasComChave = (dados.dias_servico || []).map(
                    (dia, indice) => ({
                        ...dia,
                        chave: dia.dia || DIAS[indice]?.[0],
                    })
                );

                const diasDaApi = new Map(
                    diasComChave.map((dia) => [dia.chave, dia])
                );

                setDias(
                    criarDias().map((dia) => {
                        const salvo = diasDaApi.get(dia.chave);

                        if (!salvo) return dia;

                        return {
                            ...dia,
                            fechado: false,
                            manhaInicio: normalizarHora(
                                salvo.entrada_manha
                            ),
                            manhaFim: normalizarHora(
                                salvo.saida_manha
                            ),
                            tardeInicio: normalizarHora(
                                salvo.entrada_tarde
                            ),
                            tardeFim: normalizarHora(
                                salvo.saida_tarde
                            ),
                        };
                    })
                );

                const equipe = (dados.funcionarios || []).map(
                    (funcionario) => {
                        const diasFuncionario = (
                            funcionario.dias ||
                            [funcionario.id_dias]
                        )
                            .map((item) => {
                                const idDia =
                                    typeof item === 'object' && item !== null
                                        ? item.id_dia
                                        : item;

                                return diasComChave.find(
                                    (dia) =>
                                        normalizarId(dia.id_dia) ===
                                        normalizarId(idDia)
                                )?.chave;
                            })
                            .filter(Boolean);

                        const servicosFuncionario = (
                            funcionario.servicos || []
                        ).map((item) =>
                            typeof item === 'object' && item !== null
                                ? item.id_servico
                                : item
                        );

                        return {
                            id: funcionario.id_funcionario,
                            nome: funcionario.nome || '',
                            descricao: funcionario.descricao || '',
                            email: funcionario.email || '',
                            telefone: funcionario.telefone || '',
                            comissao_percentual: String(
                                funcionario.comissao_percentual ?? 0
                            ),
                            dias: diasFuncionario,
                            servicos: servicosFuncionario,
                        };
                    }
                );

                setFuncionarios(
                    equipe.length ? equipe : [novoFuncionario()]
                );

                if (!modoEdicao) {
                    navigate(
                        idUsuarioAlvo
                            ? `/editarbarbearia?usuario=${encodeURIComponent(idUsuarioAlvo)}`
                            : '/editarbarbearia',
                        { replace: true }
                    );
                }
            } catch (erro) {
                if (ativo && erro.status !== 401) {
                    setMensagem({
                        informacao: mensagemDaApi(erro),
                        tipo: 'erro',
                    });
                }
            } finally {
                if (ativo) setCarregando(false);
            }
        }

        carregar();

        return () => {
            ativo = false;
        };
    }, [modoEdicao, navigate, sufixoUsuario, idUsuarioAlvo]);

    const atualizarFuncionario = (indice, campo, valor) => {
        setFuncionarios((lista) =>
            lista.map((funcionario, i) =>
                i === indice
                    ? { ...funcionario, [campo]: valor }
                    : funcionario
            )
        );
    };

    const alternarServicoFuncionario = (indice, idServico) => {
        setFuncionarios((lista) =>
            lista.map((funcionario, i) => {
                if (i !== indice) return funcionario;

                const jaSelecionado = funcionario.servicos.some(
                    (id) => normalizarId(id) === normalizarId(idServico)
                );

                return {
                    ...funcionario,
                    servicos: jaSelecionado
                        ? funcionario.servicos.filter(
                            (id) =>
                                normalizarId(id) !==
                                normalizarId(idServico)
                        )
                        : [...funcionario.servicos, idServico],
                };
            })
        );
    };

    const alternarDiaFuncionario = (indice, chaveDia) => {
        setFuncionarios((lista) =>
            lista.map((funcionario, i) => {
                if (i !== indice) return funcionario;

                return {
                    ...funcionario,
                    dias: funcionario.dias.includes(chaveDia)
                        ? funcionario.dias.filter(
                            (dia) => dia !== chaveDia
                        )
                        : [...funcionario.dias, chaveDia],
                };
            })
        );
    };

    async function salvarServico(servico) {
        if (!perfilExiste) {
            setMensagem({
                informacao:
                    'Salve primeiro o endereço e a personalização inicial. Depois, cadastre os serviços.',
                tipo: 'aviso',
            });
            return;
        }

        try {
            const editando = Boolean(servicoEditando);

            const endpoint = editando
                ? `/barbearia/servicos/${servicoEditando.id_servico}${sufixoUsuario}`
                : `/barbearia/servicos${sufixoUsuario}`;

            const resposta = await apiFetch(endpoint, {
                method: editando ? 'PUT' : 'POST',
                body: JSON.stringify(servico),
            });

            const listaAtualizada = await apiFetch(
                `/barbearia/servicos${sufixoUsuario}`
            );

            setServicos(
                Array.isArray(listaAtualizada)
                    ? listaAtualizada
                    : listaAtualizada.servicos || []
            );

            setServicoEditando(null);
            setModalAberto(false);

            setMensagem(
                resposta?.mensagem || {
                    informacao: editando
                        ? 'Serviço atualizado.'
                        : 'Serviço cadastrado.',
                    tipo: 'sucesso',
                }
            );
        } catch (erro) {
            setMensagem({
                informacao: mensagemDaApi(erro),
                tipo: 'erro',
            });
        }
    }

    function abrirAdicionarServico() {
        if (!perfilExiste) {
            setMensagem({
                informacao:
                    'Salve primeiro a personalização inicial para criar a barbearia. Depois, você poderá cadastrar serviços.',
                tipo: 'aviso',
            });
            return;
        }

        setServicoEditando(null);
        setModalAberto(true);
    }

    function abrirEditarServico(servico) {
        setServicoEditando(servico);
        setModalAberto(true);
    }

    async function removerServico(servico) {
        if (!window.confirm(`Remover o serviço “${servico.nome}”?`)) {
            return;
        }

        try {
            const resposta = await apiFetch(
                `/barbearia/servicos/${servico.id_servico}${sufixoUsuario}`,
                { method: 'DELETE' }
            );

            setServicos((lista) =>
                lista.filter(
                    (item) =>
                        normalizarId(item.id_servico) !==
                        normalizarId(servico.id_servico)
                )
            );

            setFuncionarios((lista) =>
                lista.map((funcionario) => ({
                    ...funcionario,
                    servicos: funcionario.servicos.filter(
                        (id) =>
                            normalizarId(id) !==
                            normalizarId(servico.id_servico)
                    ),
                }))
            );

            setMensagem(
                resposta.mensagem || {
                    informacao: 'Serviço removido.',
                    tipo: 'sucesso',
                }
            );
        } catch (erro) {
            setMensagem({
                informacao: mensagemDaApi(erro),
                tipo: 'erro',
            });
        }
    }

    function montarFormulario() {
        const formulario = new FormData();

        if (idUsuarioAlvo) {
            formulario.append('id_usuario', idUsuarioAlvo);
        }

        const campos = [
            ['cor_primaria', cores.primaria],
            ['cor_secundaria', cores.secundaria],
            ['cor_terciaria', cores.terciaria],
            ['cor_texto_primario', cores.textoPrimario],
            ['cor_texto_secundario', cores.textoSecundario],
            ['historia', historia.trim()],
            ['localizacao', localizacao.trim()],
            ['rua', localizacao.trim()],
            ['cep', cep.replace(/\D/g, '')],
            ['numero', numero.trim()],
            ['complemento', complemento.trim()],
            ['contato_telefone', contatos.telefone.trim()],
            ['telefone', contatos.telefone.trim()],
            ['contato_email', contatos.email.trim()],
            ['instagram', contatos.instagram.trim()],
        ];

        campos.forEach(([campo, valor]) => {
            formulario.append(campo, valor);
        });

        dias.forEach((dia) => {
            if (dia.fechado) return;

            [
                ['entrada_manha', dia.manhaInicio],
                ['saida_manha', dia.manhaFim],
                ['entrada_tarde', dia.tardeInicio],
                ['saida_tarde', dia.tardeFim],
            ].forEach(([campo, valor]) => {
                formulario.append(`${dia.chave}_${campo}`, valor);
            });
        });

        const equipe = funcionarios.filter(
            (funcionario) => funcionario.nome.trim()
        );

        formulario.append('num_funcionarios', String(equipe.length));

        equipe.forEach((funcionario, indice) => {
            /*
             * Funcionários que vieram do backend têm ID numérico.
             * Funcionários novos têm UUID e não devem ser enviados
             * como se já estivessem cadastrados.
             */
            const idExistente = funcionario.id;

            if (
                idExistente !== null &&
                idExistente !== undefined &&
                String(idExistente).trim() !== '' &&
                Number.isInteger(Number(idExistente))
            ) {
                formulario.append(
                    `funcionarios[${indice}][id_funcionario]`,
                    String(idExistente)
                );
            }

            formulario.append(
                `funcionarios[${indice}][nome]`,
                funcionario.nome.trim()
            );

            formulario.append(
                `funcionarios[${indice}][descricao]`,
                funcionario.descricao.trim()
            );

            formulario.append(
                `funcionarios[${indice}][email]`,
                funcionario.email.trim()
            );

            formulario.append(
                `funcionarios[${indice}][telefone]`,
                funcionario.telefone.replace(/\D/g, '')
            );

            formulario.append(
                `funcionarios[${indice}][comissao_percentual]`,
                funcionario.comissao_percentual || '0'
            );

            formulario.append(
                `funcionarios[${indice}][dias]`,
                funcionario.dias.join(',')
            );

            formulario.append(
                `funcionarios[${indice}][servicos]`,
                funcionario.servicos.join(',')
            );
        });

        if (typeof File !== 'undefined' && logo instanceof File) {
            formulario.append('logo', logo);
        }

        fotos.forEach((foto, indice) => {
            if (typeof File !== 'undefined' && foto instanceof File) {
                formulario.append(`foto${indice + 1}`, foto);
            }
        });

        return formulario;
    }

    async function salvar(evento) {
        evento.preventDefault();

        if (salvando) return;

        if (!diasAbertos.length) {
            setMensagem({
                informacao: 'Informe ao menos um dia de atendimento.',
                tipo: 'erro',
            });
            return;
        }

        if (
            !modoEdicao &&
            !perfilExiste &&
            cep.replace(/\D/g, '').length !== 8
        ) {
            setMensagem({
                informacao: 'Informe um CEP válido com oito dígitos.',
                tipo: 'erro',
            });
            return;
        }

        const equipePreenchida = funcionarios.filter(
            (funcionario) => funcionario.nome.trim()
        );

        if (
            equipePreenchida.some(
                (funcionario) => !funcionario.dias.length
            )
        ) {
            setMensagem({
                informacao:
                    'Vincule pelo menos um dia de serviço para cada funcionário.',
                tipo: 'erro',
            });
            return;
        }

        const equipeInvalida = equipePreenchida.some((funcionario) => {
            const email = funcionario.email.trim();
            const telefone = funcionario.telefone.replace(/\D/g, '');

            return (
                !email ||
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
                ![10, 11].includes(telefone.length)
            );
        });

        if (equipeInvalida) {
            setMensagem({
                informacao:
                    'Informe e-mail e telefone válidos para cada funcionário.',
                tipo: 'erro',
            });
            return;
        }

        setSalvando(true);

        try {
            const editando = modoEdicao || perfilExiste;

            /*
             * A rota de cadastro inicial deve existir no Flask.
             * Para edição, enviamos o id_usuario também na URL
             * quando estamos trabalhando para outro usuário.
             */
            const endpointBase = editando
                ? '/barbearia/personalizacao'
                : '/personalizacao_barbearia';

            const endpoint = idUsuarioAlvo
                ? `${endpointBase}?id_usuario=${encodeURIComponent(idUsuarioAlvo)}`
                : endpointBase;

            const resposta = await apiFetch(endpoint, {
                method: editando ? 'PUT' : 'POST',
                body: montarFormulario(),
            });

            setPerfilExiste(true);

            setMensagem(
                resposta?.mensagem || {
                    informacao: 'Personalização salva com sucesso.',
                    tipo: 'sucesso',
                }
            );

            navigate(
                idUsuarioAlvo
                    ? `/editarbarbearia?usuario=${encodeURIComponent(idUsuarioAlvo)}`
                    : '/editarbarbearia',
                { replace: true }
            );
        } catch (erro) {
            setMensagem({
                informacao: mensagemDaApi(erro),
                tipo: 'erro',
            });
        } finally {
            setSalvando(false);
        }
    }

    return (
        <main className={styles.page}>
            <MensagemCard
                mensagem={mensagem}
                fechar={() => setMensagem(null)}
            />

            <form className={styles.container} onSubmit={salvar}>
                <div
                    className={`${styles.span2} ${styles.cabecalhoPagina}`}
                >
                    <p className={styles.eyebrow}>
                        {modoEdicao
                            ? 'GESTÃO DO ESTABELECIMENTO'
                            : 'PRIMEIROS PASSOS'}
                    </p>

                    <h1 className={styles.titulo}>
                        {modoEdicao
                            ? 'Editar barbearia'
                            : 'Personalize sua barbearia'}
                    </h1>

                    <p className={styles.subtitulo}>
                        Organize sua vitrine, equipe, serviços, horários e
                        identidade visual em um só lugar.
                    </p>

                    <div />
                </div>

                {carregando ? (
                    <p className={styles.carregando}>
                        Carregando dados da barbearia…
                    </p>
                ) : (
                    <>
                        <section
                            className={`${styles.section} ${styles.span2}`}
                        >
                            <div className={styles.sectionHead}>
                                <span className={styles.dot}>
                                    <Scissors size={16} />
                                </span>
                                Serviços disponíveis
                            </div>

                            <div className={styles.tags}>
                                {servicos.map((servico) => (
                                    <span
                                        className={`${styles.tag} ${
                                            Number(servico.ativo) === 0
                                                ? styles.tagDesativada
                                                : ''
                                        }`}
                                        key={servico.id_servico}
                                    >
                                        <span>
                                            {servico.nome}
                                            {Number(servico.ativo) === 0 && ' (Desativado)'}
                                        </span>

                                        <span
                                            className={styles.acoesServico}
                                        >
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    abrirEditarServico(servico)
                                                }
                                                aria-label={`Editar ${servico.nome}`}
                                            >
                                                <Pencil size={13} />
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    removerServico(servico)
                                                }
                                                aria-label={`Remover ${servico.nome}`}
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </span>
                                    </span>
                                ))}

                                <button
                                    type="button"
                                    className={styles.tagAdd}
                                    onClick={abrirAdicionarServico}
                                    disabled={!perfilExiste}
                                >
                                    <Plus size={13} />
                                    Adicionar serviço
                                </button>
                            </div>

                            {!perfilExiste && (
                                <small>
                                    Salve a personalização inicial para
                                    liberar o cadastro de serviços.
                                </small>
                            )}
                        </section>

                        <section
                            className={`${styles.section} ${styles.span2}`}
                        >
                            <TabelaHorarios
                                dias={dias}
                                onToggleDia={(nome) =>
                                    setDias((lista) =>
                                        lista.map((dia) =>
                                            dia.nome === nome
                                                ? {
                                                    ...dia,
                                                    fechado: !dia.fechado,
                                                }
                                                : dia
                                        )
                                    )
                                }
                                onChangeHorario={(nome, campo, valor) =>
                                    setDias((lista) =>
                                        lista.map((dia) =>
                                            dia.nome === nome
                                                ? { ...dia, [campo]: valor }
                                                : dia
                                        )
                                    )
                                }
                            />
                        </section>

                        <section className={styles.section}>
                            <div className={styles.sectionHead}>
                                <span className={styles.dot}>
                                    <Users size={16} />
                                </span>
                                Equipe
                            </div>

                            {funcionarios.map((funcionario, indice) => (
                                <div
                                    className={styles.funcionario}
                                    key={funcionario.id}
                                >
                                    <div
                                        className={
                                            styles.funcionarioCabecalho
                                        }
                                    >
                                        <strong>
                                            Funcionário {indice + 1}
                                        </strong>

                                        {funcionarios.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setFuncionarios((lista) =>
                                                        lista.filter(
                                                            (_, i) =>
                                                                i !== indice
                                                        )
                                                    )
                                                }
                                            >
                                                <Trash2 size={15} />
                                                Remover
                                            </button>
                                        )}
                                    </div>

                                    <label className={styles.label}>
                                        Nome
                                        <MaskedInput
                                            className={styles.input}
                                            mask={/^[A-Za-zÀ-ÿ ]*$/}
                                            value={funcionario.nome}
                                            onAccept={(valor) =>
                                                atualizarFuncionario(
                                                    indice,
                                                    'nome',
                                                    valor
                                                )
                                            }
                                        />
                                    </label>

                                    <label className={styles.label}>
                                        Descrição / especialidade
                                        <MaskedInput
                                            className={styles.input}
                                            value={funcionario.descricao}
                                            onAccept={(valor) =>
                                                atualizarFuncionario(
                                                    indice,
                                                    'descricao',
                                                    valor
                                                )
                                            }
                                            placeholder="Ex.: Barbeiro especialista"
                                        />
                                    </label>

                                    <label className={styles.label}>
                                        E-mail do funcionário
                                        <MaskedInput
                                            className={styles.input}
                                            type="email"
                                            mask={/^[\w.+-@]*$/}
                                            value={funcionario.email}
                                            onAccept={(valor) =>
                                                atualizarFuncionario(
                                                    indice,
                                                    'email',
                                                    valor
                                                )
                                            }
                                            placeholder="profissional@email.com"
                                        />
                                    </label>

                                    <label className={styles.label}>
                                        Telefone do funcionário
                                        <MaskedInput
                                            className={styles.input}
                                            mask="(00) 0000[0]-0000"
                                            value={funcionario.telefone}
                                            onAccept={(valor) =>
                                                atualizarFuncionario(
                                                    indice,
                                                    'telefone',
                                                    valor
                                                )
                                            }
                                            placeholder="(00) 00000-0000"
                                        />
                                    </label>

                                    <label className={styles.label}>
                                        Comissão (%)
                                        <MaskedInput
                                            className={styles.input}
                                            value={
                                                funcionario.comissao_percentual
                                            }
                                            onAccept={(valor) =>
                                                atualizarFuncionario(
                                                    indice,
                                                    'comissao_percentual',
                                                    valor
                                                )
                                            }
                                        />
                                    </label>

                                    <span className={styles.label}>
                                        Dias de serviço vinculados
                                    </span>

                                    <div className={styles.checks}>
                                        {diasAbertos.map((dia) => (
                                            <label
                                                key={dia.chave}
                                                className={styles.check}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={funcionario.dias.includes(
                                                        dia.chave
                                                    )}
                                                    onChange={() =>
                                                        alternarDiaFuncionario(
                                                            indice,
                                                            dia.chave
                                                        )
                                                    }
                                                />
                                                {dia.nome}
                                            </label>
                                        ))}
                                    </div>

                                    <span className={styles.label}>
                                        Serviços que realiza
                                    </span>

                                    <div className={styles.checks}>
                                        {servicos.length ? (
                                            servicos.map((servico) => (
                                                <label
                                                    key={servico.id_servico}
                                                    className={styles.check}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={funcionario.servicos.some(
                                                            (id) =>
                                                                normalizarId(id) ===
                                                                normalizarId(
                                                                    servico.id_servico
                                                                )
                                                        )}
                                                        onChange={() =>
                                                            alternarServicoFuncionario(
                                                                indice,
                                                                servico.id_servico
                                                            )
                                                        }
                                                    />
                                                    {servico.nome}
                                                </label>
                                            ))
                                        ) : (
                                            <small>
                                                Cadastre serviços para
                                                vinculá-los à equipe.
                                            </small>
                                        )}
                                    </div>
                                </div>
                            ))}

                            <button
                                type="button"
                                className={styles.secundario}
                                onClick={() =>
                                    setFuncionarios((lista) => [
                                        ...lista,
                                        novoFuncionario(),
                                    ])
                                }
                            >
                                <Plus size={16} />
                                Adicionar funcionário
                            </button>
                        </section>

                        <section className={styles.section}>
                            <div className={styles.sectionHead}>
                                <span className={styles.dot}>
                                    <Scissors size={16} />
                                </span>
                                História e endereço
                            </div>

                            <label className={styles.label}>
                                Conte sua história
                                <textarea
                                    className={styles.textarea}
                                    value={historia}
                                    onChange={(evento) =>
                                        setHistoria(evento.target.value)
                                    }
                                />
                            </label>

                            <label className={styles.label}>
                                CEP
                                <MaskedInput
                                    className={styles.input}
                                    mask="00000-000"
                                    value={cep}
                                    onAccept={setCep}
                                    placeholder="00000-000"
                                    required={!modoEdicao && !perfilExiste}
                                />
                            </label>

                            <label className={styles.label}>
                                Rua / logradouro
                                <MaskedInput
                                    className={styles.input}
                                    value={localizacao}
                                    onAccept={setLocalizacao}
                                    placeholder="Rua ou avenida"
                                    required={!modoEdicao && !perfilExiste}
                                />
                            </label>

                            <label className={styles.label}>
                                Número
                                <MaskedInput
                                    className={styles.input}
                                    value={numero}
                                    onAccept={setNumero}
                                    placeholder="Número"
                                    required={!modoEdicao && !perfilExiste}
                                />
                            </label>

                            <label className={styles.label}>
                                Complemento
                                <MaskedInput
                                    className={styles.input}
                                    value={complemento}
                                    onAccept={setComplemento}
                                    placeholder="Apartamento, sala etc. (opcional)"
                                />
                            </label>
                        </section>

                        <section className={styles.section}>
                            <div className={styles.sectionHead}>
                                <span className={styles.dot}>
                                    <ImageIcon size={16} />
                                </span>
                                Contatos da barbearia
                            </div>

                            <label className={styles.label}>
                                Telefone / WhatsApp
                                <MaskedInput
                                    className={styles.input}
                                    mask="(00) 0000[0]-0000"
                                    value={contatos.telefone}
                                    onAccept={(telefone) =>
                                        setContatos((anterior) => ({
                                            ...anterior,
                                            telefone,
                                        }))
                                    }
                                    placeholder="(00) 00000-0000"
                                />
                            </label>

                            <label className={styles.label}>
                                E-mail de contato
                                <MaskedInput
                                    className={styles.input}
                                    mask={/^[\w.+-@]*$/}
                                    type="email"
                                    value={contatos.email}
                                    onAccept={(email) =>
                                        setContatos((anterior) => ({
                                            ...anterior,
                                            email,
                                        }))
                                    }
                                    placeholder="contato@barbearia.com"
                                />
                            </label>

                            <label className={styles.label}>
                                Instagram
                                <MaskedInput
                                    className={styles.input}
                                    mask={/^@?[A-Za-z0-9._]*$/}
                                    value={contatos.instagram}
                                    onAccept={(instagram) =>
                                        setContatos((anterior) => ({
                                            ...anterior,
                                            instagram,
                                        }))
                                    }
                                    placeholder="@sua_barbearia"
                                />
                            </label>
                        </section>

                        <section
                            className={`${styles.section} ${styles.sectionHead}`}
                        >
                            <SeletorIdentidadeVisual
                                value={cores}
                                onChange={setCores}
                            />
                        </section>

                        <section
                            className={`${styles.section} ${styles.span2}`}
                        >
                            <div className={styles.sectionHead}>
                                <span className={styles.dot}>
                                    <ImageIcon size={16} />
                                </span>
                                Imagens da empresa
                            </div>

                            <div className={styles.row2}>
                                <label className={styles.upload}>
                                    <Upload size={18} />
                                    {logo ? 'Trocar logo' : 'Upload do logo'}

                                    <input
                                        type="file"
                                        accept="image/png,image/jpeg,image/webp"
                                        onChange={(evento) => {
                                            const arquivo =
                                                evento.target.files?.[0] ||
                                                null;

                                            setLogo(arquivo);

                                            setPreviewLogo(
                                                arquivo
                                                    ? URL.createObjectURL(
                                                        arquivo
                                                    )
                                                    : null
                                            );
                                        }}
                                    />
                                </label>

                                <label className={styles.upload}>
                                    <Upload size={18} />
                                    Adicionar fotos

                                    <input
                                        type="file"
                                        multiple
                                        accept="image/png,image/jpeg,image/webp"
                                        onChange={(evento) => {
                                            const arquivos = Array.from(
                                                evento.target.files || []
                                            ).slice(0, 5);

                                            setFotos(arquivos);

                                            setPreviewsFotos(
                                                arquivos.map((arquivo) =>
                                                    URL.createObjectURL(
                                                        arquivo
                                                    )
                                                )
                                            );
                                        }}
                                    />
                                </label>
                            </div>

                            {(previewLogo || previewsFotos.length > 0) && (
                                <div className={styles.previews}>
                                    {previewLogo && (
                                        <figure
                                            className={styles.previewLogo}
                                        >
                                            <img
                                                src={previewLogo}
                                                alt="Prévia do logo"
                                            />
                                            <figcaption>Logo</figcaption>
                                        </figure>
                                    )}

                                    {previewsFotos.map((url, indice) => (
                                        <figure
                                            className={styles.previewFoto}
                                            key={url}
                                        >
                                            <img
                                                src={url}
                                                alt={`Prévia da foto ${indice + 1}`}
                                            />
                                            <figcaption>
                                                Foto {indice + 1}
                                            </figcaption>
                                        </figure>
                                    ))}
                                </div>
                            )}
                        </section>

                        <div className={styles.span2}>
                            <button
                                type="submit"
                                className={styles.btnPrimario}
                                disabled={salvando}
                            >
                                {salvando
                                    ? 'SALVANDO…'
                                    : modoEdicao
                                        ? 'SALVAR ALTERAÇÕES'
                                        : 'CRIAR BARBEARIA'}
                            </button>
                        </div>
                    </>
                )}
            </form>

            <ModalAdicionarServico
                open={modalAberto}
                onClose={() => {
                    setModalAberto(false);
                    setServicoEditando(null);
                }}
                onAdd={salvarServico}
                servicoEditando={servicoEditando}
            />
        </main>
    );
}
