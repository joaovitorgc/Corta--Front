import { Routes, Route } from "react-router-dom";
import Header from "./components/Header/Header";
import Footer from "./components/Footer/footer.jsx";
import Home from "./pages/Home/Home.jsx";
import Login from "./pages/Login/login.jsx";
import Cadastro from "./pages/Cadastro/cadastro.jsx";

function App() {
    return (
        <>
            <Header />

            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/cadastro" element={<Cadastro />} />
            </Routes>

            <Footer />
        </>
    );
}

export default App;