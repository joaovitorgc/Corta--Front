import { FiArrowLeft, FiCheck, FiUser, FiScissors } from 'react-icons/fi';
import styles from './EtapaResultado.module.css';

function EtapaResultado({
                            imagem,
                            analise,
                            corteSelecionado,
                            selecionarCorte,
                            voltarEtapa,
                            confirmarSelecao,
                            cores = [],
                            corSelecionada,
                            selecionarCor,
                            resultadoUrl,
                            urlImagem,
                            carregando = false,
                            permitirColoracao = false,
                            continuarAgendamento
                        }) {
    const recomendacoes = Array.isArray(analise?.recomendacoes) ? analise.recomendacoes : [];
    const apenasCor = Boolean(analise?.apenas_cor || analise?.modo === 'cor');
    const caracteristicas = analise?.caracteristicas || {};
    const formatoRosto = caracteristicas?.formato_rosto || caracteristicas?.formato || analise?.formato_rosto || 'Análise concluída';

    const imagemCorte = (corte) => {
        const caminho = corte?.imagem_url || corte?.imagem || corte?.url_imagem || corte?.imagem_rota;
        return caminho ? urlImagem(caminho) : '';
    };

    const nomeCor = (cor) => typeof cor === 'string' ? cor : (cor?.nome || cor?.cor || cor?.hex || '');

    return (
        <section className={styles.etapa}>
            <div className={styles.topo}>
                <button type="button" className={styles.botaoVoltar} onClick={voltarEtapa} disabled={carregando}>
                    <FiArrowLeft /> VOLTAR
                </button>
            </div>

            <div className={styles.cabecalho}>
                <h1>{resultadoUrl ? 'Sua simulação de visagismo' : 'Nossa Análise de Visagismo Recomendada'}</h1>
                <p>{resultadoUrl ? 'Veja o resultado gerado pela inteligência artificial.' : 'Confira a recomendação gerada a partir da sua foto.'}</p>
            </div>

            <div className={styles.resultado}>
                <div className={styles.rostoOriginal}>
                    {resultadoUrl ? (
                        <img src={resultadoUrl} alt="Resultado da simulação" />
                    ) : imagem ? (
                        <img src={imagem} alt="Rosto analisado" />
                    ) : (
                        <div className={styles.semImagem}><FiUser /></div>
                    )}
                    <span>{resultadoUrl ? 'Resultado' : 'Formato do rosto'}<br />{resultadoUrl ? 'Simulação' : formatoRosto}</span>
                </div>

                <div className={styles.cortes}>
                    {!apenasCor && recomendacoes.map((corte) => {
                        const idCorte = corte.id_corte ?? corte.id;
                        const selecionado = (corteSelecionado?.id_corte ?? corteSelecionado?.id) === idCorte;
                        const src = imagemCorte(corte);
                        return (
                            <button
                                type="button"
                                key={idCorte}
                                className={`${styles.cardCorte} ${selecionado ? styles.selecionado : ''}`}
                                onClick={() => selecionarCorte(corte)}
                                disabled={carregando || Boolean(resultadoUrl)}
                            >
                                <div className={styles.imagemCorte}>
                                    {src ? <img src={src} alt={corte.nome || 'Corte recomendado'} /> : <div className={styles.semImagem}><FiScissors /></div>}
                                    {selecionado && <div className={styles.check}><FiCheck /></div>}
                                </div>
                                <div className={styles.infoCorte}>
                                    <h2>{corte.nome || 'Corte recomendado'}</h2>
                                    <p>{corte.descricao || corte.justificativa || 'Recomendação compatível com a análise do seu rosto.'}</p>
                                </div>
                            </button>
                        );
                    })}

                    {apenasCor && (
                        <div className={styles.infoCorte}>
                            <h2>Escolha uma cor</h2>
                            <p>Este serviço permite realizar a simulação de coloração sem alterar o corte.</p>
                        </div>
                    )}

                    {!apenasCor && recomendacoes.length === 0 && (
                        <p>O servidor não retornou uma recomendação de corte para esta análise.</p>
                    )}

                    {(apenasCor || permitirColoracao) && cores.length > 0 && (
                        <div className={styles.infoCorte} style={{ marginTop: '18px' }}>
                            <h2>Cor do cabelo (opcional)</h2>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '12px' }}>
                                {cores.map((item, indice) => {
                                    const nome = nomeCor(item);
                                    const valor = typeof item === 'string' ? item : (item?.hex || item?.cor || item?.nome || '');
                                    return (
                                        <button
                                            type="button"
                                            key={`${valor}-${indice}`}
                                            onClick={() => selecionarCor(corSelecionada === valor ? '' : valor)}
                                            disabled={carregando || Boolean(resultadoUrl)}
                                            aria-pressed={corSelecionada === valor}
                                            style={{
                                                padding: '9px 12px',
                                                borderRadius: '8px',
                                                border: corSelecionada === valor ? '2px solid #FF9C08' : '1px solid #d8d8d8',
                                                background: corSelecionada === valor ? '#fff4e5' : '#fff',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {nome}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {resultadoUrl && (
                <div style={{ textAlign: 'center', margin: '20px 0' }}>
                    <a href={resultadoUrl} target="_blank" rel="noreferrer">Abrir imagem da simulação</a>
                </div>
            )}

            <div className={styles.acoes}>
                <button type="button" className={styles.botaoVoltarAnalise} onClick={voltarEtapa} disabled={carregando}>
                    Voltar para Foto
                </button>
                {resultadoUrl && continuarAgendamento && (
                    <button type="button" className={styles.botaoConfirmar} onClick={continuarAgendamento}>
                        Continuar para o Agendamento
                    </button>
                )}
                <button
                    type="button"
                    className={styles.botaoConfirmar}
                    style={resultadoUrl ? { display: 'none' } : undefined}
                    disabled={carregando || Boolean(resultadoUrl) || (!corteSelecionado && !corSelecionada)}
                    onClick={confirmarSelecao}
                >
                    {carregando ? 'Gerando simulação...' : 'Gerar Simulação'}
                </button>
            </div>
        </section>
    );
}

export default EtapaResultado;