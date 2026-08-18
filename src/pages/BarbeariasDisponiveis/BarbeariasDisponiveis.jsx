import React from 'react';
import { LuSearch, LuMapPin, LuClock } from 'react-icons/lu';
import styles from './BarbeariasDisponiveis.module.css';
const barbeariasData = [
    {
        id: 1,
        nome: 'MV BarberShop',
        endereco: 'Rua Aurora, Nº 308',
        horario: '8:00 - 20:00',
        dias: 'SEG - SAB',
        imagem: '/barber1.jpg',
    },
    {
        id: 2,
        nome: 'Gordolas Barber',
        endereco: 'Av. Euclides Miragaia, Nº 62B',
        horario: '9:00 - 19:30',
        dias: 'SEG - SEX',
        imagem: '/barber2.jpg',
    },
    {
        id: 3,
        nome: 'Sir Alfred',
        endereco: 'Av. Nove de Julho, Nº 628',
        horario: '8:00 - 20:00',
        dias: 'SEG - SAB',
        imagem: '/barber3.jpg',
    },
    {
        id: 4,
        nome: 'El Brabo',
        endereco: 'Rua Mantura Antônio, Nº 895',
        horario: '8:30 - 20:00',
        dias: 'SEG - SAB',
        imagem: '/barber4.jpg',
    },
];

export default function Barbearias() {
    return (
        <div className={styles.container}>
            {/* SEÇÃO PRINCIPAL */}
            <main className={styles.main}>
                {/* CABEÇALHO DA BUSCA */}
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
                        <input
                            type="text"
                            placeholder="Ex: Gordolas Barber"
                            className={styles.inputBusca}
                        />
                    </div>
                </div>

                {/* GRID DE CARDS */}
                <div className={styles.grid}>
                    {barbeariasData.map((barbearia) => (
                        <div
                            key={barbearia.id}
                            className={styles.card}
                            style={{ backgroundImage: `url(${barbearia.imagem})` }}
                        >
                            <div className={styles.cardOverlay}>
                                <span className={styles.badgeDias}>{barbearia.dias}</span>

                                <div className={styles.cardConteudo}>
                                    <h3 className={styles.cardNome}>{barbearia.nome}</h3>

                                    <div className={styles.infoLinha}>
                                        <LuMapPin className={styles.infoIcone} size={14} />
                                        <span>{barbearia.endereco}</span>
                                    </div>

                                    <div className={styles.infoLinha}>
                                        <LuClock className={styles.infoIcone} size={14} />
                                        <span>Horário de Atendimento: {barbearia.horario}</span>
                                    </div>

                                    <button className={styles.btnAgendar}>Agendar Horário</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}