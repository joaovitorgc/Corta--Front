import { useRef, useState, useEffect } from 'react';
import { FiCamera, FiSun, FiSmile, FiArrowLeft, FiImage } from 'react-icons/fi';
import styles from './EtapaImagem.module.css';

function EtapaImagem({ imagem, setImagem, setArquivo, avancarEtapa, carregando = false, voltarEtapa, pularEtapa }) {
    const inputRef = useRef(null);
    const [arrastando, setArrastando] = useState(false);
    const [erroArquivo, setErroArquivo] = useState('');
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const [cameraAberta, setCameraAberta] = useState(false);

    const pararStream = () => {
        streamRef.current?.getTracks().forEach((faixa) => faixa.stop());
        streamRef.current = null;
    };

    const fecharCamera = () => {
        pararStream();
        setCameraAberta(false);
    };

    const abrirCamera = async () => {
        if (carregando) return;
        setErroArquivo('');
        if (!navigator.mediaDevices?.getUserMedia) {
            setErroArquivo('Seu navegador não permite usar a câmera. Envie uma foto da galeria.');
            return;
        }
        try {
            streamRef.current = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user' },
                audio: false
            });
            setCameraAberta(true);
        } catch {
            setErroArquivo('Não foi possível acessar a câmera. Verifique a permissão ou envie uma foto da galeria.');
        }
    };

    useEffect(() => {
        if (cameraAberta && videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
            videoRef.current.play().catch(() => {});
        }
    }, [cameraAberta]);

    // Garante que a câmera seja desligada ao sair da página
    useEffect(() => () => pararStream(), []);

    const tirarFoto = () => {
        const video = videoRef.current;
        if (!video || !video.videoWidth) return;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        canvas.toBlob((blob) => {
            if (!blob) {
                setErroArquivo('Não foi possível capturar a foto. Tente novamente.');
                return;
            }
            selecionarImagem(new File([blob], 'foto-camera.jpg', { type: 'image/jpeg' }));
            fecharCamera();
        }, 'image/jpeg', 0.92);
    };

    useEffect(() => {
        return () => {
            if (imagem?.startsWith('blob:')) URL.revokeObjectURL(imagem);
        };
    }, [imagem]);

    const selecionarImagem = (arquivo) => {
        if (!arquivo) return;
        setErroArquivo('');
        if (!['image/jpeg', 'image/png'].includes(arquivo.type)) {
            setErroArquivo('Envie uma imagem nos formatos JPG ou PNG.');
            return;
        }
        if (arquivo.size > 10 * 1024 * 1024) {
            setErroArquivo('A imagem deve ter no máximo 10 MB.');
            return;
        }
        if (imagem?.startsWith('blob:')) URL.revokeObjectURL(imagem);
        setArquivo(arquivo);
        setImagem(URL.createObjectURL(arquivo));
    };

    const handleInput = (event) => {
        selecionarImagem(event.target.files?.[0]);
        event.target.value = '';
    };

    const handleDrop = (event) => {
        event.preventDefault();
        setArrastando(false);
        selecionarImagem(event.dataTransfer.files?.[0]);
    };

    const abrirSeletor = () => {
        if (!carregando) inputRef.current?.click();
    };

    return (
        <section className={styles.etapa}>
            <div className={styles.topo}>
                {voltarEtapa ? (
                    <button type="button" className={styles.botaoVoltar} onClick={voltarEtapa}>
                        <FiArrowLeft /> VOLTAR
                    </button>
                ) : <span />}
            </div>

            <div className={styles.areaPrincipal}>
                <div className={styles.tituloArea}>
                    <h1>Coloque uma imagem para<br />ser feito o visagismo.</h1>
                    <p>Envie uma foto para nossa inteligência artificial analisar o formato do seu rosto.</p>
                </div>

                <input
                    ref={inputRef}
                    type="file"
                    accept="image/png,image/jpeg"
                    onChange={handleInput}
                    className={styles.inputArquivo}
                    disabled={carregando}
                />

                <div
                    className={`${styles.areaUpload} ${arrastando ? styles.arrastando : ''} ${imagem ? styles.comImagem : ''}`}
                    onDragOver={(event) => { event.preventDefault(); setArrastando(true); }}
                    onDragLeave={() => setArrastando(false)}
                    onDrop={handleDrop}
                    onClick={abrirSeletor}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            abrirSeletor();
                        }
                    }}
                    aria-label="Selecionar foto para análise"
                >
                    {imagem ? (
                        <div className={styles.preview}>
                            <img src={imagem} alt="Pré-visualização da foto enviada" />
                            <div className={styles.overlayImagem}>
                                <FiImage />
                                <span>Clique para trocar a imagem</span>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className={styles.iconeUpload}><FiCamera /></div>
                            <strong>Arraste e solte a sua foto aqui ou clique para navegar</strong>
                            <span>(Formatos suportados: PNG, JPG — até 10 MB)</span>
                        </>
                    )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', margin: '12px 0' }}>
                    <button type="button" className={styles.botaoAnalise} onClick={abrirCamera} disabled={carregando}>
                        <FiCamera /> Tirar foto agora
                    </button>
                </div>

                {erroArquivo && <p role="alert" style={{ color: '#B91C1C' }}>{erroArquivo}</p>}

                {cameraAberta && (
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-label="Tirar foto com a câmera"
                        style={{
                            position: 'fixed', inset: 0, zIndex: 1000,
                            background: 'rgba(0,0,0,0.85)', display: 'flex',
                            flexDirection: 'column', alignItems: 'center',
                            justifyContent: 'center', gap: '16px', padding: '16px'
                        }}
                    >
                        <video
                            ref={videoRef}
                            playsInline
                            muted
                            style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: '12px', transform: 'scaleX(-1)' }}
                        />
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button type="button" className={styles.botaoAnalise} onClick={tirarFoto}>Capturar</button>
                            <button type="button" className={styles.botaoAnalise} onClick={fecharCamera}>Cancelar</button>
                        </div>
                    </div>
                )}

                <div className={styles.dicas}>
                    <div className={styles.dica}><div className={styles.iconeDica}><FiCamera /></div><strong>Olhe Para Frente</strong></div>
                    <div className={styles.dica}><div className={styles.iconeDica}><FiSun /></div><strong>Boa Iluminação</strong></div>
                    <div className={styles.dica}><div className={styles.iconeDica}><FiSmile /></div><strong>Sem Acessórios</strong></div>
                </div>

                <button
                    type="button"
                    className={styles.botaoAnalise}
                    onClick={avancarEtapa}
                    disabled={!imagem || carregando}
                >
                    {carregando ? 'Analisando foto...' : 'Analisar Meu Rosto com IA'}
                </button>

                {pularEtapa && (
                    <button
                        type="button"
                        onClick={pularEtapa}
                        disabled={carregando}
                        style={{
                            display: 'block', margin: '12px auto 0', background: 'none',
                            border: 'none', textDecoration: 'underline', cursor: 'pointer',
                            color: 'inherit', font: 'inherit'
                        }}
                    >
                        Pular visagismo e escolher horário
                    </button>
                )}
            </div>
        </section>
    );
}

export default EtapaImagem;