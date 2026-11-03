import { useCallback, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiFetch, mensagemDaApi, API_URL } from '../../services/api';
import EtapaImagem from './EtapaImagem/EtapaImagem';
import EtapaResultado from './EtapaResultado/EtapaResultado';
import styles from './Visagismo.module.css';

function lerIdsServicos(valor) {
    if (Array.isArray(valor)) return valor.map(Number).filter(Number.isInteger);
    if (valor === null || valor === undefined || valor === '') return [];
    if (typeof valor === 'number') return Number.isInteger(valor) ? [valor] : [];
    const texto = String(valor).trim();
    try {
        const json = JSON.parse(texto);
        if (Array.isArray(json)) return json.map(Number).filter(Number.isInteger);
        if (typeof json === 'number') return Number.isInteger(json) ? [json] : [];
    } catch {}
    return texto.split(',').map(item => Number(item.trim())).filter(Number.isInteger);
}

function obterConfiguracao(props, estado = {}) {
    const parametros = new URLSearchParams(window.location.search);
    const idBarbearia = Number(
        props.id_barbearia ?? props.idBarbearia ?? estado.idBarbearia ??
        parametros.get('id_barbearia') ?? parametros.get('idBarbearia') ?? 0
    );
    let idsRecebidos = props.ids_servicos ?? props.idsServicos ?? estado.idsServicos;
    if (idsRecebidos === undefined || idsRecebidos === null || idsRecebidos === '') {
        const repetidos = parametros.getAll('id_servico');
        idsRecebidos = repetidos.length
            ? repetidos
            : (parametros.get('ids_servicos') ?? parametros.get('id_servicos') ?? parametros.get('id_servico'));
    }
    return {
        idBarbearia,
        idsServicos: [...new Set(lerIdsServicos(idsRecebidos).filter(id => id > 0))]
    };
}

const ROTA_AGENDAMENTO_PADRAO = '/agendamento';

function Visagismo(props) {
    const navigate = useNavigate();
    const { state } = useLocation();
    const estado = state ?? {};
    const configuracao = useMemo(() => obterConfiguracao(props, estado), [props.id_barbearia, props.idBarbearia, props.ids_servicos, props.idsServicos, state]);
    const [etapa, setEtapa] = useState(1);
    const [imagem, setImagem] = useState(null);
    const [arquivo, setArquivo] = useState(null);
    const [analise, setAnalise] = useState(null);
    const [idVisagismo, setIdVisagismo] = useState(null);
    const [corteSelecionado, setCorteSelecionado] = useState(null);
    const [cores, setCores] = useState([]);
    const [corSelecionada, setCorSelecionada] = useState('');
    const [resultadoUrl, setResultadoUrl] = useState('');
    const [carregando, setCarregando] = useState(false);
    const [mensagem, setMensagem] = useState('');
    const [tipoMensagem, setTipoMensagem] = useState('erro');

    const urlImagem = useCallback((url) => {
        if (!url) return '';
        if (/^(https?:|data:|blob:)/i.test(url)) return url;
        return `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
    }, []);

    const voltarTopo = () => window.scrollTo({ top: 0, behavior: 'smooth' });

    const voltarEtapa = () => {
        setEtapa(1);
        setResultadoUrl('');
        setMensagem('');
        voltarTopo();
    };

    // Volta ao fluxo de agendamento, levando junto o que foi escolhido aqui.
    const irParaAgendamento = (extra = {}) => {
        navigate(estado.retorno || ROTA_AGENDAMENTO_PADRAO, {
            state: {
                idBarbearia: configuracao.idBarbearia,
                idUsuario: estado.idUsuario,
                idsServicos: configuracao.idsServicos,
                idFuncionario: estado.idFuncionario,
                ...extra
            }
        });
    };

    // Cancela o visagismo e volta para a escolha de serviços
    const sairDoVisagismo = () => irParaAgendamento({ etapa: 'servicos' });

    // Pula o visagismo e segue direto para os horários
    const pularVisagismo = () => irParaAgendamento({ etapa: 'horario' });

    // Usa o resultado do visagismo e segue para os horários
    const continuarAgendamento = () => irParaAgendamento({
        etapa: 'horario',
        idVisagismo,
        idCorte: corteSelecionado?.id_corte ? Number(corteSelecionado.id_corte) : null,
        corCabelo: corSelecionada || null
    });

    const montarFormulario = () => {
        if (!configuracao.idBarbearia || !configuracao.idsServicos.length) {
            throw new Error('Não foi possível identificar a barbearia e os serviços. Abra o visagismo informando id_barbearia e ids_servicos.');
        }
        if (!arquivo) throw new Error('Selecione uma foto antes de continuar.');
        const dados = new FormData();
        dados.append('imagem', arquivo);
        dados.append('id_barbearia', String(configuracao.idBarbearia));
        dados.append('ids_servicos', JSON.stringify(configuracao.idsServicos));
        return dados;
    };

    const carregarCores = async () => {
        try {
            const resposta = await apiFetch('/cores_cabelo_visagismo');
            setCores(Array.isArray(resposta.opcoes) ? resposta.opcoes : []);
        } catch (erro) {
            setMensagem(mensagemDaApi(erro));
            setTipoMensagem('erro');
        }
    };

    const avancarEtapa = async () => {
        if (carregando) return;
        setCarregando(true);
        setMensagem('');
        setResultadoUrl('');
        try {
            const formulario = montarFormulario();
            let resposta;
            try {
                resposta = await apiFetch('/analisar_visagismo', {
                    method: 'POST',
                    body: formulario
                });
            } catch (erroAnalise) {
                const texto = mensagemDaApi(erroAnalise).toLowerCase();
                if (!texto.includes('somente pintar') && !texto.includes('escolha a cor') && !texto.includes('salve a foto')) {
                    throw erroAnalise;
                }
                const formularioFoto = montarFormulario();
                resposta = await apiFetch('/salvar_foto_visagismo', {
                    method: 'POST',
                    body: formularioFoto
                });
                setAnalise({
                    modo: 'cor',
                    apenas_cor: true,
                    categoria: 'cabelo',
                    recomendacoes: []
                });
                setCorteSelecionado(null);
                setIdVisagismo(resposta.id_visagismo);
                await carregarCores();
                setEtapa(2);
                voltarTopo();
                return;
            }

            if (!resposta.id_visagismo) throw new Error('O servidor não retornou o identificador da sessão de visagismo.');
            const recomendacoes = Array.isArray(resposta.recomendacoes) ? resposta.recomendacoes : [];
            setAnalise(resposta);
            setIdVisagismo(resposta.id_visagismo);
            setCorteSelecionado(recomendacoes[0] || null);
            setCorSelecionada('');
            setResultadoUrl('');
            await carregarCores();
            setEtapa(2);
            voltarTopo();
        } catch (erro) {
            setMensagem(mensagemDaApi(erro));
            setTipoMensagem('erro');
        } finally {
            setCarregando(false);
        }
    };

    const confirmarSelecao = async () => {
        if (!idVisagismo || carregando) return;
        if (!corteSelecionado && !corSelecionada) {
            setMensagem('Selecione o corte recomendado ou uma cor para continuar.');
            setTipoMensagem('erro');
            return;
        }
        setCarregando(true);
        setMensagem('');
        try {
            const corpo = {};
            if (corteSelecionado?.id_corte) corpo.id_corte = Number(corteSelecionado.id_corte);
            if (corSelecionada) corpo.cor = corSelecionada;
            const resposta = await apiFetch(`/simular_visagismo/${idVisagismo}`, {
                method: 'POST',
                body: JSON.stringify(corpo)
            });
            if (!resposta.imagem_url) throw new Error('A simulação foi concluída, mas o servidor não retornou a imagem.');
            setResultadoUrl(urlImagem(resposta.imagem_url));
            setMensagem(resposta.aviso || resposta.mensagem?.informacao || 'Simulação gerada com sucesso.');
            setTipoMensagem(resposta.aviso ? 'erro' : 'sucesso');
        } catch (erro) {
            setMensagem(mensagemDaApi(erro));
            setTipoMensagem('erro');
        } finally {
            setCarregando(false);
        }
    };

    return (
        <div className={styles.pagina}>
            <main className={styles.conteudo}>
                <div className={styles.indicadorEtapas}>
                    <span className={etapa === 1 ? styles.ativa : ''}></span>
                    <span className={etapa === 2 ? styles.ativa : ''}></span>
                </div>

                {mensagem && (
                    <div role="alert" style={{
                        margin: '16px auto',
                        padding: '12px 16px',
                        maxWidth: '900px',
                        borderRadius: '8px',
                        background: tipoMensagem === 'sucesso' ? '#DCFCE7' : '#FEE2E2',
                        color: tipoMensagem === 'sucesso' ? '#15803D' : '#B91C1C'
                    }}>
                        {mensagem}
                    </div>
                )}

                {etapa === 1 && (
                    <EtapaImagem
                        imagem={imagem}
                        setImagem={setImagem}
                        setArquivo={setArquivo}
                        avancarEtapa={avancarEtapa}
                        carregando={carregando}
                        voltarEtapa={sairDoVisagismo}
                        pularEtapa={pularVisagismo}
                    />
                )}

                {etapa === 2 && (
                    <EtapaResultado
                        imagem={imagem}
                        analise={analise}
                        corteSelecionado={corteSelecionado}
                        selecionarCorte={setCorteSelecionado}
                        voltarEtapa={voltarEtapa}
                        confirmarSelecao={confirmarSelecao}
                        cores={cores}
                        corSelecionada={corSelecionada}
                        selecionarCor={setCorSelecionada}
                        resultadoUrl={resultadoUrl}
                        urlImagem={urlImagem}
                        carregando={carregando}
                        permitirColoracao={props.permitirColoracao === true || estado.permitirColoracao === true}
                        continuarAgendamento={continuarAgendamento}
                    />
                )}
            </main>
        </div>
    );
}

export default Visagismo;