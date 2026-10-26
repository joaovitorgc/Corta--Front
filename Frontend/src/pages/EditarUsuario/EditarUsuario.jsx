import { useEffect, useState } from 'react';

import {
    FiEdit2,
    FiTrash2,
    FiImage
} from 'react-icons/fi';

import { IMaskInput } from 'react-imask';
import { useNavigate, useParams } from 'react-router-dom';

import styles from './EditarUsuario.module.css';

import {
    apiFetch,
    mensagemDaApi
} from '../../services/api';

import MensagemCard from '../../components/MensagemCard/MensagemCard';

const API_URL = 'http://localhost:5000';

export default function EditarUsuario() {

    const navigate = useNavigate();
    const { id: idDaRota } = useParams();

    // ==================================================
    // USUÁRIO
    // ==================================================

    const [idUsuario, setIdUsuario] = useState(null);

    const [nome, setNome] = useState('');
    const [telefone, setTelefone] = useState('');
    const [email, setEmail] = useState('');

    // ==================================================
    // SENHA
    // ==================================================

    const [senha, setSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');

    // ==================================================
    // FOTO
    // ==================================================

    const [arquivoImagem, setArquivoImagem] = useState(null);
    const [imagem, setImagem] = useState(null);

    // ==================================================
    // CONTROLE
    // ==================================================

    const [carregando, setCarregando] = useState(false);
    const [verificandoLogin, setVerificandoLogin] = useState(true);

    // ==================================================
    // MENSAGEM
    // ==================================================

    const [mensagem, setMensagem] = useState(null);

    // ==================================================
    // URL DA FOTO
    // ==================================================

    const obterUrlFoto = (
        foto,
        atualizarCache = false
    ) => {

        if (!foto) {
            return null;
        }

        if (foto.startsWith('blob:')) {
            return foto;
        }

        let url;

        if (
            foto.startsWith('http://') ||
            foto.startsWith('https://')
        ) {

            url = foto;

        } else if (
            foto.startsWith('/')
        ) {

            url = `${API_URL}${foto}`;

        } else {

            url =
                `${API_URL}/uploads/perfil/${foto}`;
        }

        if (atualizarCache) {

            url +=
                `${url.includes('?') ? '&' : '?'}t=${Date.now()}`;
        }

        return url;
    };

    // ==================================================
    // CARREGAR USUÁRIO
    // ==================================================

    useEffect(() => {

        let ativo = true;

        const carregarUsuario = async () => {

            try {

                // ==================================================
                // PEGAR USUÁRIO DO LOCALSTORAGE
                // ==================================================

                const usuarioSalvo =
                    localStorage.getItem('usuario');

                if (!usuarioSalvo) {

                    console.warn(
                        'Nenhum usuário encontrado no localStorage.'
                    );

                    navigate('/login', {
                        replace: true
                    });

                    return;
                }

                // ==================================================
                // CONVERTER JSON
                // ==================================================

                let usuario;

                try {

                    usuario =
                        JSON.parse(usuarioSalvo);

                } catch (erro) {

                    console.error(
                        'ERRO AO LER USUÁRIO:',
                        erro
                    );

                    localStorage.removeItem(
                        'usuario'
                    );

                    navigate('/login', {
                        replace: true
                    });

                    return;
                }

                // ==================================================
                // PEGAR ID
                // ==================================================

                const id = idDaRota
                    ? Number(idDaRota)
                    : (usuario.id_usuario ?? usuario.id ?? null);

                if (!id) {

                    console.error(
                        'Usuário sem ID:',
                        usuario
                    );

                    localStorage.removeItem(
                        'usuario'
                    );

                    navigate('/login', {
                        replace: true
                    });

                    return;
                }

                if (!ativo) {
                    return;
                }

                setIdUsuario(id);

                // ==================================================
                // PREENCHER DADOS TEMPORÁRIOS
                // ==================================================

                setNome(
                    usuario.nome || ''
                );

                setEmail(
                    usuario.email || ''
                );

                setTelefone(
                    String(
                        usuario.telefone || ''
                    ).replace(/\D/g, '')
                );

                // ==================================================
                // FOTO
                // ==================================================

                if (
                    usuario.foto_perfil
                ) {

                    setImagem(
                        obterUrlFoto(
                            usuario.foto_perfil,
                            true
                        )
                    );

                } else {

                    setImagem(null);
                }

                // ==================================================
                // BUSCAR DADOS ATUALIZADOS
                // ==================================================

                console.log(
                    'BUSCANDO PERFIL:',
                    `/dados_perfil/${id}`
                );

                const dados =
                    await apiFetch(
                        `/dados_perfil/${id}`,
                        {
                            method: 'GET'
                        }
                    );

                if (
                    !ativo ||
                    !dados?.usuario
                ) {
                    return;
                }

                // ==================================================
                // USUÁRIO ATUALIZADO
                // ==================================================

                const usuarioAtualizado =
                    dados.usuario;

                console.log(
                    'PERFIL RECEBIDO:',
                    usuarioAtualizado
                );

                // ==================================================
                // ATUALIZAR ESTADOS
                // ==================================================

                setIdUsuario(
                    usuarioAtualizado.id_usuario ??
                    id
                );

                setNome(
                    usuarioAtualizado.nome || ''
                );

                setEmail(
                    usuarioAtualizado.email || ''
                );

                setTelefone(
                    String(
                        usuarioAtualizado.telefone || ''
                    ).replace(/\D/g, '')
                );

                // ==================================================
                // ATUALIZAR FOTO
                // ==================================================

                if (
                    usuarioAtualizado.foto_perfil
                ) {

                    setImagem(
                        obterUrlFoto(
                            usuarioAtualizado.foto_perfil,
                            true
                        )
                    );

                } else {

                    setImagem(null);
                }

                // ==================================================
                // ATUALIZAR LOCALSTORAGE
                // ==================================================

                const usuarioFinal = {

                    ...usuario,

                    ...usuarioAtualizado,

                    id:
                        usuarioAtualizado.id_usuario ??
                        id,

                    id_usuario:
                        usuarioAtualizado.id_usuario ??
                        id
                };

                if (!idDaRota || Number(idDaRota) === Number(usuario.id_usuario ?? usuario.id)) {
                    localStorage.setItem('usuario', JSON.stringify(usuarioFinal));
                }

                console.log(
                    'LOCALSTORAGE ATUALIZADO:',
                    usuarioFinal
                );

            } catch (error) {

                console.error(
                    'ERRO AO BUSCAR PERFIL:',
                    error
                );

                if (
                    error.status === 401
                ) {

                    console.warn(
                        'Cookie/token não foi aceito pelo servidor.'
                    );

                    setMensagem({

                        informacao:
                            'Sua sessão não pôde ser validada pelo servidor. Verifique o cookie de autenticação.',

                        tipo:
                            'erro'

                    });

                    return;
                }

                if (
                    error.status === 403
                ) {

                    setMensagem({

                        informacao:
                            'Você não possui permissão para acessar este perfil.',

                        tipo:
                            'erro'

                    });

                    return;
                }

                if (
                    error.status === 404
                ) {

                    setMensagem({

                        informacao:
                            'O perfil não foi encontrado no servidor.',

                        tipo:
                            'erro'

                    });

                    return;
                }

                setMensagem({

                    informacao:
                        mensagemDaApi(error),

                    tipo:
                        'erro'

                });

            } finally {

                if (ativo) {

                    setVerificandoLogin(
                        false
                    );
                }
            }
        };

        carregarUsuario();

        return () => {

            ativo = false;

        };

    }, [navigate, idDaRota]);

    // ==================================================
    // ALTERAR FOTO
    // ==================================================

    const alterarImagem = (e) => {

        const arquivo =
            e.target.files?.[0];

        if (!arquivo) {
            return;
        }

        const tiposPermitidos = [

            'image/jpeg',
            'image/png',
            'image/webp'

        ];

        if (
            !tiposPermitidos.includes(
                arquivo.type
            )
        ) {

            setMensagem({

                informacao:
                    'Formato inválido. Use JPG, PNG ou WEBP.',

                tipo:
                    'erro'

            });

            e.target.value = '';

            return;
        }

        const tamanhoMaximo =
            5 * 1024 * 1024;

        if (
            arquivo.size >
            tamanhoMaximo
        ) {

            setMensagem({

                informacao:
                    'A imagem deve ter no máximo 5 MB.',

                tipo:
                    'erro'

            });

            e.target.value = '';

            return;
        }

        setArquivoImagem(
            arquivo
        );

        const url =
            URL.createObjectURL(
                arquivo
            );

        setImagem(url);
    };

    // ==================================================
    // EXCLUIR FOTO
    // ==================================================

    const excluirImagem = async () => {

        if (!idUsuario) {

            setMensagem({

                informacao:
                    'Usuário não identificado.',

                tipo:
                    'erro'

            });

            return;
        }

        if (
            !imagem &&
            !arquivoImagem
        ) {

            setMensagem({

                informacao:
                    'Você não possui uma foto de perfil.',

                tipo:
                    'erro'

            });

            return;
        }

        try {

            const dados =
                await apiFetch(
                    `/excluir_foto_perfil/${idUsuario}`,
                    {
                        method: 'DELETE'
                    }
                );

            setArquivoImagem(null);
            setImagem(null);

            // ==================================================
            // ATUALIZAR LOCALSTORAGE
            // ==================================================

            const usuarioAtual =
                JSON.parse(
                    localStorage.getItem(
                        'usuario'
                    )
                ) || {};

            const usuarioAtualizado = {

                ...usuarioAtual,

                foto_perfil:
                    null

            };

            localStorage.setItem(
                'usuario',
                JSON.stringify(
                    usuarioAtualizado
                )
            );

            // ==================================================
            // AVISAR HEADER
            // ==================================================

            window.dispatchEvent(
                new Event(
                    'loginAlterado'
                )
            );

            setMensagem(
                dados?.mensagem || {

                    informacao:
                        'Foto de perfil excluída com sucesso!',

                    tipo:
                        'sucesso'

                }
            );

        } catch (error) {

            console.error(
                'ERRO AO EXCLUIR FOTO:',
                error
            );

            if (
                error.status === 401
            ) {

                setMensagem({

                    informacao:
                        'Sua sessão não pôde ser validada pelo servidor.',

                    tipo:
                        'erro'

                });

                return;
            }

            if (
                error.status === 403
            ) {

                setMensagem({

                    informacao:
                        'Você não possui permissão para excluir esta foto.',

                    tipo:
                        'erro'

                });

                return;
            }

            if (
                error.status === 404
            ) {

                setImagem(null);
                setArquivoImagem(null);

                setMensagem({

                    informacao:
                        'A foto já não existe no servidor.',

                    tipo:
                        'sucesso'

                });

                return;
            }

            setMensagem({

                informacao:
                    mensagemDaApi(error),

                tipo:
                    'erro'

            });
        }
    };

    // ==================================================
    // VOLTAR
    // ==================================================

    const voltar = () => {
        const usuarioLogado = JSON.parse(localStorage.getItem('usuario') || '{}');
        navigate(Number(usuarioLogado.tipo) === 0 && idDaRota ? '/admin/usuarios' : '/');

    };

    // ==================================================
    // SALVAR
    // ==================================================

    const salvar = async (e) => {

        e.preventDefault();

        setMensagem(null);

        if (!idUsuario) {

            setMensagem({

                informacao:
                    'Usuário não identificado.',

                tipo:
                    'erro'

            });

            return;
        }

        if (
            senha.trim() &&
            senha !== confirmarSenha
        ) {

            setMensagem({

                informacao:
                    'As senhas não coincidem.',

                tipo:
                    'erro'

            });

            return;
        }

        if (
            !nome.trim()
        ) {

            setMensagem({

                informacao:
                    'Informe seu nome.',

                tipo:
                    'erro'

            });

            return;
        }

        if (
            !email.trim()
        ) {

            setMensagem({

                informacao:
                    'Informe seu e-mail.',

                tipo:
                    'erro'

            });

            return;
        }

        setCarregando(true);

        try {

            const formData =
                new FormData();

            formData.append(
                'nome',
                nome.trim()
            );

            const telefoneNumeros =
                String(
                    telefone || ''
                ).replace(
                    /\D/g,
                    ''
                );

            formData.append(
                'telefone',
                telefoneNumeros
            );

            formData.append(
                'email',
                email
                    .trim()
                    .replace(
                        /\s/g,
                        ''
                    )
            );

            if (
                senha.trim()
            ) {

                formData.append(
                    'senha',
                    senha
                );
            }

            if (
                arquivoImagem
            ) {

                formData.append(
                    'foto',
                    arquivoImagem
                );
            }

            const dados =
                await apiFetch(
                    `/editar_usuario/${idUsuario}`,
                    {
                        method: 'PUT',
                        body: formData
                    }
                );

            if (
                dados?.usuario
            ) {

                const usuarioAntigo =
                    JSON.parse(
                        localStorage.getItem(
                            'usuario'
                        )
                    ) || {};

                const usuarioAtualizado = {

                    ...usuarioAntigo,

                    ...dados.usuario,

                    id:
                        dados.usuario.id_usuario ??
                        usuarioAntigo.id ??
                        idUsuario,

                    id_usuario:
                        dados.usuario.id_usuario ??
                        usuarioAntigo.id_usuario ??
                        idUsuario,

                    nome:
                        dados.usuario.nome ??
                        '',

                    email:
                        dados.usuario.email ??
                        '',

                    telefone:
                        dados.usuario.telefone ??
                        '',

                    foto_perfil:
                        dados.usuario.foto_perfil ??
                        usuarioAntigo.foto_perfil ??
                        null
                };

                localStorage.setItem(
                    'usuario',
                    JSON.stringify(
                        usuarioAtualizado
                    )
                );

                window.dispatchEvent(
                    new Event(
                        'loginAlterado'
                    )
                );

                setIdUsuario(
                    usuarioAtualizado.id_usuario
                );

                setNome(
                    usuarioAtualizado.nome
                );

                setEmail(
                    usuarioAtualizado.email
                );

                setTelefone(
                    String(
                        usuarioAtualizado.telefone || ''
                    ).replace(
                        /\D/g,
                        ''
                    )
                );

                if (
                    usuarioAtualizado.foto_perfil
                ) {

                    setImagem(
                        obterUrlFoto(
                            usuarioAtualizado.foto_perfil,
                            true
                        )
                    );

                } else {

                    setImagem(null);
                }
            }

            setSenha('');
            setConfirmarSenha('');
            setArquivoImagem(null);

            setMensagem(
                dados?.mensagem || {

                    informacao:
                        'Usuário editado com sucesso!',

                    tipo:
                        'sucesso'

                }
            );

            // Quando o ADM edita outro perfil, volta diretamente à gestão.
            const usuarioLogado = JSON.parse(localStorage.getItem('usuario') || '{}');
            if (Number(usuarioLogado.tipo) === 0 && idDaRota) {
                setTimeout(() => navigate('/admin/usuarios', { replace: true }), 600);
            }

        } catch (error) {

            console.error(
                'ERRO AO EDITAR USUÁRIO:',
                error
            );

            if (
                error.status === 401
            ) {

                setMensagem({

                    informacao:
                        'Sua sessão não pôde ser validada pelo servidor. Os dados locais foram mantidos.',

                    tipo:
                        'erro'

                });

                return;
            }

            if (
                error.status === 403
            ) {

                setMensagem({

                    informacao:
                        'Você não possui permissão para editar este perfil.',

                    tipo:
                        'erro'

                });

                return;
            }

            setMensagem({

                informacao:
                    mensagemDaApi(error),

                tipo:
                    'erro'

            });

        } finally {

            setCarregando(false);
        }
    };

    if (
        verificandoLogin
    ) {

        return null;

    }

    return (

        <main className={styles.container}>

            <MensagemCard
                mensagem={mensagem}
                fechar={() =>
                    setMensagem(null)
                }
            />

            {/* ==================================================
                FOTO
            ================================================== */}

            <section
                className={styles.areaEdicao}
            >

                <div
                    className={styles.areaFoto}
                >

                    <div
                        className={styles.foto}
                    >

                        {imagem ? (

                            <img
                                src={imagem}
                                alt="Foto de perfil"
                            />

                        ) : (

                            <FiImage
                                className={
                                    styles.iconeImagem
                                }
                            />

                        )}

                    </div>

                    <div
                        className={styles.acoesFoto}
                    >

                        <label
                            className={
                                styles.botaoFoto
                            }
                            title="Alterar foto"
                        >

                            <FiEdit2 />

                            <input
                                id="btn-alterar-foto"
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={alterarImagem}
                            />

                        </label>

                        <button
                            id="btn-remover-foto"
                            type="button"
                            className={
                                styles.botaoFoto
                            }
                            onClick={
                                excluirImagem
                            }
                            title="Remover foto"
                        >

                            <FiTrash2 />

                        </button>

                    </div>

                </div>

                {/* ==================================================
                    FORMULÁRIO
                ================================================== */}

                <div
                    className={
                        styles.areaFormulario
                    }
                >

                    <h1>
                        EDITAR SUAS INFORMAÇÕES
                    </h1>

                    <form
                        onSubmit={salvar}
                    >

                        {/* NOME */}

                        <div
                            className={
                                styles.grupoEntrada
                            }
                        >

                            <label htmlFor="nome">
                                Nome
                            </label>

                            <input
                                id="nome"
                                type="text"
                                value={nome}
                                onChange={(e) =>
                                    setNome(
                                        e.target.value
                                    )
                                }
                                required
                            />

                        </div>

                        {/* TELEFONE */}

                        <div
                            className={
                                styles.grupoEntrada
                            }
                        >

                            <label htmlFor="telefone">
                                Telefone
                            </label>

                            <IMaskInput
                                id="telefone"
                                type="tel"
                                mask="(00) 0000[0]-0000"
                                value={telefone}
                                unmask={true}
                                onAccept={(value) =>
                                    setTelefone(value)
                                }
                            />

                        </div>

                        {/* EMAIL */}

                        <div
                            className={
                                styles.grupoEntrada
                            }
                        >

                            <label htmlFor="email">
                                E-mail
                            </label>

                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) =>
                                    setEmail(
                                        e.target.value
                                    )
                                }
                                required
                            />

                        </div>

                        {/* SENHA */}

                        <div
                            className={
                                styles.grupoEntrada
                            }
                        >

                            <label htmlFor="senha">
                                Nova Senha
                            </label>

                            <input
                                id="senha"
                                type="password"
                                value={senha}
                                onChange={(e) =>
                                    setSenha(
                                        e.target.value
                                    )
                                }
                                placeholder="Deixe em branco para não alterar"
                            />

                        </div>

                        {/* CONFIRMAR SENHA */}

                        <div
                            className={
                                styles.grupoEntrada
                            }
                        >

                            <label htmlFor="confirmarSenha">
                                Confirmar Senha
                            </label>

                            <input
                                id="confirmarSenha"
                                type="password"
                                value={confirmarSenha}
                                onChange={(e) =>
                                    setConfirmarSenha(
                                        e.target.value
                                    )
                                }
                                placeholder="Confirme a nova senha"
                            />

                        </div>

                        {/* AÇÕES DO FORMULÁRIO */}

                        <div
                            className={
                                styles.acoesFormulario
                            }
                        >

                            <button
                                id="btn-voltar"
                                type="button"
                                className={
                                    styles.botaoVoltar
                                }
                                onClick={voltar}
                                disabled={carregando}
                            >
                                Voltar
                            </button>

                            <button
                                id="btn-salvar"
                                type="submit"
                                className={
                                    styles.botaoSalvar
                                }
                                disabled={carregando}
                            >
                                {carregando
                                    ? 'Salvando...'
                                    : 'Salvar'}
                            </button>

                        </div>

                    </form>

                </div>

            </section>

        </main>

    );
}
