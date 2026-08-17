import { useState } from 'react';
import {
    FiMapPin,
    FiClock,
    FiPhone,
    FiCalendar,
    FiUser
} from 'react-icons/fi';
import CardServico from '../../components/CardServico/CardServico';
import styles from './Estabelecimento.module.css';

export default function Estabelecimento() {
    const [categoria, setCategoria] = useState('Serviços');

    const [servicos] = useState([
        {
            id_servico: 1,
            nome: 'ACABAMENTO',
            tempo: '15 MIN',
            preco: 'R$ 25,00'
        },
        {
            id_servico: 2,
            nome: 'BARBA',
            tempo: '30 MIN',
            preco: 'R$ 48,00'
        },
        {
            id_servico: 3,
            nome: 'COMBO COMPLETO',
            tempo: '1 HORA',
            preco: 'R$ 95,00'
        },
        {
            id_servico: 4,
            nome: 'CORTE EXECUTIVO',
            tempo: '30 MIN',
            preco: 'R$ 58,00'
        }
    ]);

    const profissionais = [
        {
            id: 1,
            nome: 'Carlos',
            especialidade: 'Barbeiro'
        },
        {
            id: 2,
            nome: 'João',
            especialidade: 'Barbeiro'
        },
        {
            id: 3,
            nome: 'Lucas',
            especialidade: 'Barbeiro'
        }
    ];

    return (
        <main className={styles.container}>
            <section className={styles.conteudo}>
                <div className={styles.apresentacao}>
                    <div className={styles.informacoes}>
                        <span className={styles.selo}>
                            PREMIUM EXPERIENCE
                        </span>

                        <h1>Sir Alfred</h1>

                        <p>
                            Desde 2020, elevando a autoestima e proporcionando
                            experiências excepcionais. Um novo conceito em
                            barbearia, focado em detalhes e no bem-estar de
                            nossos clientes.
                        </p>

                        <button className={styles.botaoAgendar}>
                            Agendar Agora
                        </button>
                    </div>

                    <div className={styles.imagemContainer}>
                        <img
                            src="/imagens/barbearia.jpg"
                            alt="Interior da barbearia Sir Alfred"
                        />
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
                                {servicos.map((servico) => (
                                    <CardServico
                                        key={servico.id_servico}
                                        nome={servico.nome}
                                        tempo={servico.tempo}
                                        preco={servico.preco}
                                    />
                                ))}
                            </div>
                        )}

                        {categoria === 'Profissionais' && (
                            <div className={styles.listaProfissionais}>
                                {profissionais.map((profissional) => (
                                    <div
                                        className={styles.profissional}
                                        key={profissional.id}
                                    >
                                        <div className={styles.iconeProfissional}>
                                            <FiUser />
                                        </div>

                                        <div>
                                            <h3>{profissional.nome}</h3>
                                            <span>
                                                {profissional.especialidade}
                                            </span>
                                        </div>
                                    </div>
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
                                    Av. Maringá, 2450 - 86000-971
                                    <br />
                                    Centro - Londrina/PR
                                </p>
                            </div>

                            <div className={styles.bloco}>
                                <div className={styles.tituloCard}>
                                    <FiClock />
                                    <span>
                                        HORÁRIO DE ATENDIMENTO
                                    </span>
                                </div>

                                <div className={styles.horarios}>
                                    <p>
                                        <span>Terça a Sexta</span>
                                        <strong>
                                            08:00 - 12:00 | 14:00 - 20:00
                                        </strong>
                                    </p>

                                    <p>
                                        <span>Sábado</span>
                                        <strong>
                                            08:00 - 12:00 | 14:00 - 20:00
                                        </strong>
                                    </p>

                                    <p>
                                        <span>Domingo e Segunda</span>
                                        <strong className={styles.fechado}>
                                            Fechado
                                        </strong>
                                    </p>
                                </div>
                            </div>

                            <div className={styles.bloco}>
                                <div className={styles.tituloCard}>
                                    <FiPhone />
                                    <span>CONTATO</span>
                                </div>

                                <div className={styles.telefone}>
                                    <FiPhone />
                                    <span>(18) 99789-9070</span>
                                </div>
                            </div>
                        </div>

                        <button className={styles.botaoAgendarGrande}>
                            <FiCalendar />
                            AGENDAR AGORA
                        </button>
                    </aside>
                </div>
            </section>
        </main>
    );
}