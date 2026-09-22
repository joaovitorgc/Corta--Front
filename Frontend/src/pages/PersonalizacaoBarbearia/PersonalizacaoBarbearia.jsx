import { useEffect, useMemo, useState } from 'react';
import { Image as ImageIcon, Plus, Scissors, Trash2, Upload, Users, Pencil } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { API_URL, apiFetch, mensagemDaApi } from '../../services/api';
import MensagemCard from '../../components/MensagemCard/MensagemCard';
import ModalAdicionarServico from '../../components/ModalAdicionarServico/ModalAdicionarServico';
import SeletorIdentidadeVisual from '../../components/SeletorIdentidadeVisual/SeletorIdentidadeVisual';
import TabelaHorarios from '../../components/TabelaHorarios/TabelaHorarios';
import MaskedInput from '../../components/MaskedInput/MaskedInput';
import styles from './PersonalizacaoBarbearia.module.css';

const DIAS = [['segunda', 'Segunda'], ['terca', 'Terça'], ['quarta', 'Quarta'], ['quinta', 'Quinta'], ['sexta', 'Sexta'], ['sabado', 'Sábado'], ['domingo', 'Domingo']];
const criarDias = () => DIAS.map(([chave, nome]) => ({ chave, nome, fechado: true, manhaInicio: '08:00', manhaFim: '12:00', tardeInicio: '14:00', tardeFim: '18:00' }));
const novoFuncionario = () => ({ id: crypto.randomUUID(), nome: '', descricao: '', dias: [], servicos: [] });
const CORES_INICIAIS = { primaria: '#FF9C08', secundaria: '#000000', terciaria: '#FFFFFF', textoPrimario: '#000000', textoSecundario: '#FFFFFF' };
const normalizarHora = (valor) => valor ? String(valor).slice(0, 5) : '';

export default function PersonalizacaoBarbearia({ modoEdicao = false }) {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const idUsuarioAlvo = searchParams.get('usuario');
    const sufixoUsuario = idUsuarioAlvo ? `?id_usuario=${encodeURIComponent(idUsuarioAlvo)}` : '';
    const [historia, setHistoria] = useState('');
    const [localizacao, setLocalizacao] = useState('');
    const [contatos, setContatos] = useState({ telefone: '', email: '', instagram: '' });
    const [cores, setCores] = useState(CORES_INICIAIS);
    const [dias, setDias] = useState(criarDias);
    const [funcionarios, setFuncionarios] = useState([novoFuncionario()]);
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
    const diasAbertos = useMemo(() => dias.filter((dia) => !dia.fechado), [dias]);

    useEffect(() => {
        async function carregar() {
            try {
                const [dados, dadosServicos] = await Promise.all([apiFetch(`/barbearia/personalizacao${sufixoUsuario}`), apiFetch(`/barbearia/servicos${sufixoUsuario}`)]);
                setServicos(dadosServicos.servicos || []);
                if (!dados.personalizado) {
                    if (modoEdicao) navigate('/personalizacaobarbearia', { replace: true });
                    return;
                }
                const personalizacao = dados.personalizacao;
                setHistoria(personalizacao.historia || '');
                setLocalizacao(personalizacao.localizacao || '');
                setCores({
                    primaria: personalizacao.cor_primaria || CORES_INICIAIS.primaria,
                    secundaria: personalizacao.cor_secundaria || CORES_INICIAIS.secundaria,
                    terciaria: personalizacao.cor_terciaria || CORES_INICIAIS.terciaria,
                    textoPrimario: personalizacao.cor_texto_primario || CORES_INICIAIS.textoPrimario,
                    textoSecundario: personalizacao.cor_texto_secundario || CORES_INICIAIS.textoSecundario,
                });
                setContatos({ telefone: personalizacao.contato_telefone || '', email: personalizacao.contato_email || '', instagram: personalizacao.instagram || '' });
                setLogo(dados.logo || null);
                setFotos(dados.fotos || []);
                setPreviewLogo(dados.logo ? `${API_URL}${dados.logo}` : null);
                setPreviewsFotos((dados.fotos || []).map((foto) => `${API_URL}${foto.url}`));
                const diasComChave = (dados.dias_servico || []).map((dia, indice) => ({ ...dia, chave: dia.dia || DIAS[indice]?.[0] }));
                const diasDaApi = new Map(diasComChave.map((dia) => [dia.chave, dia]));
                setDias(criarDias().map((dia) => {
                    const salvo = diasDaApi.get(dia.chave);
                    return salvo ? { ...dia, fechado: false, manhaInicio: normalizarHora(salvo.entrada_manha), manhaFim: normalizarHora(salvo.saida_manha), tardeInicio: normalizarHora(salvo.entrada_tarde), tardeFim: normalizarHora(salvo.saida_tarde) } : dia;
                }));
                const equipe = (dados.funcionarios || []).map((funcionario) => ({ id: funcionario.id_funcionario, nome: funcionario.nome || '', descricao: funcionario.descricao || '', dias: (funcionario.dias || [funcionario.id_dias]).map((idDia) => diasComChave.find((dia) => dia.id_dia === idDia)?.chave).filter(Boolean), servicos: funcionario.servicos || [] }));
                setFuncionarios(equipe.length ? equipe : [novoFuncionario()]);
                if (!modoEdicao) navigate('/editarbarbearia', { replace: true });
            } catch (erro) {
                if (erro.status !== 401) setMensagem({ informacao: mensagemDaApi(erro), tipo: 'erro' });
            } finally { setCarregando(false); }
        }
        carregar();
    }, [modoEdicao, navigate, sufixoUsuario]);

    const atualizarFuncionario = (indice, campo, valor) => setFuncionarios((lista) => lista.map((funcionario, i) => i === indice ? { ...funcionario, [campo]: valor } : funcionario));
    const alternarServicoFuncionario = (indice, idServico) => setFuncionarios((lista) => lista.map((funcionario, i) => i === indice ? { ...funcionario, servicos: funcionario.servicos.includes(idServico) ? funcionario.servicos.filter((id) => id !== idServico) : [...funcionario.servicos, idServico] } : funcionario));
    const alternarDiaFuncionario = (indice, chaveDia) => setFuncionarios((lista) => lista.map((funcionario, i) => i === indice ? { ...funcionario, dias: funcionario.dias.includes(chaveDia) ? funcionario.dias.filter((dia) => dia !== chaveDia) : [...funcionario.dias, chaveDia] } : funcionario));

    async function salvarServico(servico) {
        try {
            const editando = Boolean(servicoEditando);
            const endpoint = editando
                ? `/barbearia/servicos/${servicoEditando.id_servico}${sufixoUsuario}`
                : `/barbearia/servicos${sufixoUsuario}`;

            const resposta = await apiFetch(
                endpoint,
                {
                    method: editando ? 'PUT' : 'POST',
                    body: JSON.stringify(servico)
                }
            );

            if (editando) {
                setServicos((lista) => lista.map((item) =>
                    item.id_servico === servicoEditando.id_servico
                        ? resposta.servico
                        : item
                ));
            } else {
                setServicos((lista) => [...lista, resposta.servico]);
            }

            setServicoEditando(null);
            setModalAberto(false);
            setMensagem(resposta.mensagem);
        } catch (erro) {
            setMensagem({
                informacao: mensagemDaApi(erro),
                tipo: 'erro'
            });
        }
    }

    function abrirAdicionarServico() {
        setServicoEditando(null);
        setModalAberto(true);
    }

    function abrirEditarServico(servico) {
        setServicoEditando(servico);
        setModalAberto(true);
    }

    async function removerServico(servico) {
        if (!window.confirm(`Remover o serviço “${servico.nome}”?`)) return;
        try {
            const resposta = await apiFetch(`/barbearia/servicos/${servico.id_servico}${sufixoUsuario}`, { method: 'DELETE' });
            setServicos((lista) => lista.filter((item) => item.id_servico !== servico.id_servico));
            setFuncionarios((lista) => lista.map((funcionario) => ({ ...funcionario, servicos: funcionario.servicos.filter((id) => id !== servico.id_servico) })));
            setMensagem(resposta.mensagem);
        } catch (erro) { setMensagem({ informacao: mensagemDaApi(erro), tipo: 'erro' }); }
    }

    function montarFormulario() {
        const formulario = new FormData();
        if (idUsuarioAlvo) formulario.append('id_usuario', idUsuarioAlvo);
        [['cor_primaria', cores.primaria], ['cor_secundaria', cores.secundaria], ['cor_terciaria', cores.terciaria], ['cor_texto_primario', cores.textoPrimario], ['cor_texto_secundario', cores.textoSecundario], ['historia', historia.trim()], ['localizacao', localizacao.trim()], ['contato_telefone', contatos.telefone.trim()], ['contato_email', contatos.email.trim()], ['instagram', contatos.instagram.trim()]].forEach(([campo, valor]) => formulario.append(campo, valor));
        dias.forEach((dia) => {
            if (!dia.fechado) [['entrada_manha', dia.manhaInicio], ['saida_manha', dia.manhaFim], ['entrada_tarde', dia.tardeInicio], ['saida_tarde', dia.tardeFim]].forEach(([campo, valor]) => formulario.append(`${dia.chave}_${campo}`, valor));
        });
        const equipe = funcionarios.filter((funcionario) => funcionario.nome.trim());
        formulario.append('num_funcionarios', equipe.length);
        equipe.forEach((funcionario, indice) => {
            formulario.append(`funcionarios[${indice}][nome]`, funcionario.nome.trim());
            formulario.append(`funcionarios[${indice}][descricao]`, funcionario.descricao.trim());
            formulario.append(`funcionarios[${indice}][dias]`, funcionario.dias.join(','));
            formulario.append(`funcionarios[${indice}][servicos]`, funcionario.servicos.join(','));
        });
        if (logo instanceof File) formulario.append('logo', logo);
        fotos.forEach((foto, indice) => { if (foto instanceof File) formulario.append(`foto${indice + 1}`, foto); });
        return formulario;
    }

    async function salvar(evento) {
        evento.preventDefault();
        if (!diasAbertos.length) return setMensagem({ informacao: 'Informe ao menos um dia de atendimento.', tipo: 'erro' });
        if (funcionarios.some((funcionario) => funcionario.nome.trim() && !funcionario.dias.length)) return setMensagem({ informacao: 'Vincule pelo menos um dia de serviço para cada funcionário.', tipo: 'erro' });
        setSalvando(true);
        try {
            const resposta = await apiFetch('/barbearia/personalizacao', { method: modoEdicao ? 'PUT' : 'POST', body: montarFormulario() });
            setMensagem(resposta.mensagem);
            navigate(idUsuarioAlvo ? `/estabelecimento?usuario=${idUsuarioAlvo}` : '/estabelecimento', { replace: true });
        } catch (erro) { setMensagem({ informacao: mensagemDaApi(erro), tipo: 'erro' }); } finally { setSalvando(false); }
    }

    return <main className={styles.page}>
        <MensagemCard mensagem={mensagem} fechar={() => setMensagem(null)} />
        <form className={styles.container} onSubmit={salvar}>
            <div className={`${styles.span2} ${styles.cabecalhoPagina}`}><p className={styles.eyebrow}>{modoEdicao ? 'GESTÃO DO ESTABELECIMENTO' : 'PRIMEIROS PASSOS'}</p><h1 className={styles.titulo}>{modoEdicao ? 'Editar barbearia' : 'Personalize sua barbearia'}</h1><p className={styles.subtitulo}>Organize sua vitrine, equipe, serviços, horários e identidade visual em um só lugar.</p><div /></div>
            {carregando ? <p className={styles.carregando}>Carregando dados da barbearia…</p> : <>
                <section className={`${styles.section} ${styles.span2}`}><div className={styles.sectionHead}><span className={styles.dot}><Scissors size={16} /></span>Serviços disponíveis</div><div className={styles.tags}>{servicos.map((servico) => <span className={styles.tag} key={servico.id_servico}><span>{servico.nome}</span><span className={styles.acoesServico}><button type="button" onClick={() => abrirEditarServico(servico)} aria-label={`Editar ${servico.nome}`}><Pencil size={13} /></button><button type="button" onClick={() => removerServico(servico)} aria-label={`Remover ${servico.nome}`}><Trash2 size={13} /></button></span></span>)}<button type="button" className={styles.tagAdd} onClick={abrirAdicionarServico}><Plus size={13} />Adicionar serviço</button></div></section>
                <section className={`${styles.section} ${styles.span2}`}><TabelaHorarios dias={dias} onToggleDia={(nome) => setDias((lista) => lista.map((dia) => dia.nome === nome ? { ...dia, fechado: !dia.fechado } : dia))} onChangeHorario={(nome, campo, valor) => setDias((lista) => lista.map((dia) => dia.nome === nome ? { ...dia, [campo]: valor } : dia))} /></section>
                <section className={styles.section}><div className={styles.sectionHead}><span className={styles.dot}><Users size={16} /></span>Equipe</div>
                    {funcionarios.map((funcionario, indice) => <div className={styles.funcionario} key={funcionario.id}>
                        <div className={styles.funcionarioCabecalho}><strong>Funcionário {indice + 1}</strong>{funcionarios.length > 1 && <button type="button" onClick={() => setFuncionarios((lista) => lista.filter((_, i) => i !== indice))}><Trash2 size={15} /> Remover</button>}</div>
                        <label className={styles.label}>Nome<MaskedInput className={styles.input} mask={/^[A-Za-zÀ-ÿ ]*$/} value={funcionario.nome} onAccept={(valor) => atualizarFuncionario(indice, 'nome', valor)} /></label>
                        <label className={styles.label}>Descrição / especialidade<MaskedInput className={styles.input} value={funcionario.descricao} onAccept={(valor) => atualizarFuncionario(indice, 'descricao', valor)} placeholder="Ex.: Barbeiro especialista" /></label>
                        <span className={styles.label}>Dias de serviço vinculados</span><div className={styles.checks}>{diasAbertos.map((dia) => <label key={dia.chave} className={styles.check}><input type="checkbox" checked={funcionario.dias.includes(dia.chave)} onChange={() => alternarDiaFuncionario(indice, dia.chave)} />{dia.nome}</label>)}</div>
                        <span className={styles.label}>Serviços que realiza</span><div className={styles.checks}>{servicos.length ? servicos.map((servico) => <label key={servico.id_servico} className={styles.check}><input type="checkbox" checked={funcionario.servicos.includes(servico.id_servico)} onChange={() => alternarServicoFuncionario(indice, servico.id_servico)} />{servico.nome}</label>) : <small>Cadastre serviços abaixo para vinculá-los.</small>}</div>
                    </div>)}
                    <button type="button" className={styles.secundario} onClick={() => setFuncionarios((lista) => [...lista, novoFuncionario()])}><Plus size={16} /> Adicionar funcionário</button>
                </section>
                <section className={styles.section}><div className={styles.sectionHead}><span className={styles.dot}><Scissors size={16} /></span>História da empresa</div><label className={styles.label}>Conte sua história<textarea className={styles.textarea} value={historia} onChange={(e) => setHistoria(e.target.value)} /></label><label className={styles.label}>Localização<MaskedInput className={styles.input} value={localizacao} onAccept={setLocalizacao} placeholder="Rua, número, bairro e cidade" /></label></section>
                <section className={styles.section}><div className={styles.sectionHead}><span className={styles.dot}><ImageIcon size={16} /></span>Contatos da barbearia</div><label className={styles.label}>Telefone / WhatsApp<MaskedInput className={styles.input} mask="(00) 0000[0]-0000" value={contatos.telefone} onAccept={(telefone) => setContatos({ ...contatos, telefone })} placeholder="(00) 00000-0000" /></label><label className={styles.label}>E-mail de contato<MaskedInput className={styles.input} mask={/^[\w.+-@]*$/} type="email" value={contatos.email} onAccept={(email) => setContatos({ ...contatos, email })} placeholder="contato@barbearia.com" /></label><label className={styles.label}>Instagram<MaskedInput className={styles.input} mask={/^@?[A-Za-z0-9._]*$/} value={contatos.instagram} onAccept={(instagram) => setContatos({ ...contatos, instagram })} placeholder="@sua_barbearia" /></label></section>
                <section className={`${styles.section} ${styles.sectionHead}`}><SeletorIdentidadeVisual value={cores} onChange={setCores} /></section>
                <section className={`${styles.section} ${styles.span2}`}><div className={styles.sectionHead}><span className={styles.dot}><ImageIcon size={16} /></span>Imagens da empresa</div><div className={styles.row2}><label className={styles.upload}><Upload size={18} />{logo ? 'Trocar logo' : 'Upload do logo'}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => { const arquivo = e.target.files?.[0] || null; setLogo(arquivo); setPreviewLogo(arquivo ? URL.createObjectURL(arquivo) : null); }} /></label><label className={styles.upload}><Upload size={18} />Adicionar fotos<input type="file" multiple accept="image/png,image/jpeg,image/webp" onChange={(e) => { const arquivos = Array.from(e.target.files || []).slice(0, 5); setFotos(arquivos); setPreviewsFotos(arquivos.map((arquivo) => URL.createObjectURL(arquivo))); }} /></label></div>{(previewLogo || previewsFotos.length > 0) && <div className={styles.previews}>{previewLogo && <figure className={styles.previewLogo}><img src={previewLogo} alt="Prévia do logo" /><figcaption>Logo</figcaption></figure>}{previewsFotos.map((url, indice) => <figure className={styles.previewFoto} key={url}><img src={url} alt={`Prévia da foto ${indice + 1}`} /><figcaption>Foto {indice + 1}</figcaption></figure>)}</div>}</section>
                <div className={styles.span2}><button className={styles.btnPrimario} disabled={salvando}>{salvando ? 'SALVANDO…' : modoEdicao ? 'SALVAR ALTERAÇÕES' : 'CRIAR BARBEARIA'}</button></div>
            </>}
        </form>
        <ModalAdicionarServico open={modalAberto} onClose={() => { setModalAberto(false); setServicoEditando(null); }} onAdd={salvarServico} servicoEditando={servicoEditando} />
    </main>;
}
