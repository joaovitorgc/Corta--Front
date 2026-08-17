import { Routes, Route } from "react-router-dom";
import Header from "./components/Header/Header";
import Footer from "./components/Footer/footer.jsx";
import Home from "./pages/Home/Home.jsx";
import Login from "./pages/Login/login.jsx";
import Cadastro from "./pages/Cadastro/cadastro.jsx";
import RedefinicaoSenha from "./pages/RedefinacaoSenha/RedefinacaoSenha.jsx";
import BarbeariasDisponiveis from "./pages/BarbeariasDisponiveis/BarbeariasDisponiveis.jsx";
import EditarUsuario from "./pages/EditarUsuario/EditarUsuario.jsx";
import Estabelecimento from "./pages/Estabelecimento/Estabelecimento.jsx";

function App() {
    return (
        <>

            <Header />

            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/cadastro" element={<Cadastro />} />
                <Route path="/redefinirsenha" element={<RedefinicaoSenha />} />
                <Route path="/BarbeariasDisponiveis" element={<BarbeariasDisponiveis />} />
                <Route path="/editarusuario" element={<EditarUsuario />} />
                <Route path="/estabelecimento" element={<Estabelecimento />} />
            </Routes>

            <Footer />
        </>
    );
}

export default App;