import { useState } from 'react';
import { FiEdit2, FiTrash2, FiImage } from 'react-icons/fi';
import styles from './EditarUsuario.module.css';

export default function EditarUsuario() {
    const [nome, setNome] = useState('');
    const [telefone, setTelefone] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');
    const [imagem, setImagem] = useState(null);

    const alterarImagem = (e) => {
        const arquivo = e.target.files[0];
        if (arquivo) {
            setImagem(URL.createObjectURL(arquivo));
        }
    };

    const excluirImagem = () => {
        setImagem(null);
    };

    const voltar = () => {
        window.history.back();
    };

    const salvar = (e) => {
        e.preventDefault();

        console.log({
            nome,
            telefone,
            email,
            senha,
            confirmarSenha
        });
    };

    return (
        <main className={styles.container}>
            <section className={styles.areaEdicao}>
                <div className={styles.areaFoto}>
                    <div className={styles.foto}>
                        {imagem ? (
                            <img src={imagem} alt="Foto do usuário" />
                        ) : (
                            <FiImage className={styles.iconeImagem} />
                        )}
                    </div>

                    <div className={styles.acoesFoto}>
                        <label className={styles.botaoFoto}>
                            <FiEdit2 />
                            <input
                                type="file"
                                accept="image/*"
                                onChange={alterarImagem}
                            />
                        </label>

                        <button
                            type="button"
                            className={styles.botaoFoto}
                            onClick={excluirImagem}
                        >
                            <FiTrash2 />
                        </button>
                    </div>
                </div>

                <div className={styles.areaFormulario}>
                    <h1>EDITAR SUAS INFORMAÇÕES</h1>

                    <form onSubmit={salvar}>
                        <div className={styles.grupoEntrada}>
                            <label htmlFor="nome">Nome</label>
                            <input
                                id="nome"
                                type="text"
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                            />
                        </div>

                        <div className={styles.grupoEntrada}>
                            <label htmlFor="telefone">Telefone</label>
                            <input
                                id="telefone"
                                type="text"
                                value={telefone}
                                onChange={(e) => setTelefone(e.target.value)}
                            />
                        </div>

                        <div className={styles.grupoEntrada}>
                            <label htmlFor="email">E-mail</label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div className={styles.grupoEntrada}>
                            <label htmlFor="senha">Senha</label>
                            <input
                                id="senha"
                                type="password"
                                placeholder="Digite sua nova senha"
                                value={senha}
                                onChange={(e) => setSenha(e.target.value)}
                            />
                        </div>

                        <div className={styles.grupoEntrada}>
                            <label htmlFor="confirmarSenha">Confirmar Senha</label>
                            <input
                                id="confirmarSenha"
                                type="password"
                                placeholder="Digite sua nova senha novamente"
                                value={confirmarSenha}
                                onChange={(e) => setConfirmarSenha(e.target.value)}
                            />
                        </div>

                        <div className={styles.botoes}>
                            <button
                                type="button"
                                className={styles.botaoVoltar}
                                onClick={voltar}
                            >
                                Voltar
                            </button>

                            <button
                                type="submit"
                                className={styles.botaoSalvar}
                            >
                                Salvar
                            </button>
                        </div>
                    </form>
                </div>
            </section>
        </main>
    );
}