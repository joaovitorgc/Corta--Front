import { Routes, Route } from 'react-router-dom';

import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';

import Home from './pages/Home/Home';
import Login from './pages/Login/Login';
import Cadastro from './pages/Cadastro/Cadastro';
import RedefinirSenha from './pages/RedefinacaoSenha/RedefinacaoSenha';
import EditarUsuario from './pages/EditarUsuario/EditarUsuario';
import VerificarCodigo from './pages/VerificarCodigo/VerificarCodigo';
import Estabelecimento from './pages/Estabelecimento/Estabelecimento';
import CadastroBarbearia from './pages/CadastroBarbearia/CadastroBarbearia.jsx';
import BarbeariasDisponiveis from './pages/BarbeariasDisponiveis/BarbeariasDisponiveis';
import Erro from "./pages/Erro/Erro";
import PersonalizacaoBarbearia from "./pages/PersonalizacaoBarbearia/PersonalizacaoBarbearia.jsx";
import EditarBarbearia from "./pages/EditarBarbearia/EditarBarbearia.jsx";
import AdminUsuarios from "./pages/AdminUsuarios/AdminUsuarios.jsx";
import Visagismo from "./pages/Visagismo/Visagismo.jsx";
import Agendamento from "./pages/Agendamento/Agendamento.jsx";
import AdminFinaceiro from "./pages/AdminFinaceiro/AdminFinanceiro.jsx";

export default function App() {
    return (
        <>
            <Header />

            <Routes>
                <Route
                    path="/*"
                    element={<Erro />}
                />
                <Route
                    path="/"
                    element={<Home />}
                />

                <Route
                    path="/login"
                    element={<Login />}
                />

                <Route
                    path="/cadastro"
                    element={<Cadastro />}
                />

                <Route
                    path="/redefinirsenha"
                    element={<RedefinirSenha />}
                />

                <Route
                    path="/editarusuario"
                    element={<EditarUsuario />}
                />

                <Route
                    path="/verificar-codigo"
                    element={<VerificarCodigo />}
                />

                <Route
                    path="/estabelecimento"
                    element={<Estabelecimento />}
                />

                <Route
                    path="/barbearias-disponiveis"
                    element={<BarbeariasDisponiveis />}
                />

                <Route
                    path="/cadastrobarbearia"
                    element={<CadastroBarbearia />}
                />

                <Route
                    path="/personalizacaobarbearia"
                    element={<PersonalizacaoBarbearia />}
                />

                <Route
                    path="/editarbarbearia"
                    element={<EditarBarbearia />}
                />

                <Route path="/visagismo" element={<Visagismo />} />

                <Route path="/agendamento" element={<Agendamento />} />

                <Route path="/financeiro" element={<AdminFinaceiro />} />
                
                <Route path="/admin/usuarios" element={<AdminUsuarios />} />
                <Route path="/editarusuario/:id" element={<EditarUsuario />} />


            </Routes>

            <Footer />
        </>
    );
}
