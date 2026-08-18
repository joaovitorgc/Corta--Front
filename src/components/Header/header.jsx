import estilo from "./Header.module.css";
import {Link} from "react-router-dom";

export default function Header() {
    return (
        <header className={estilo.header}>
            <div className={estilo.container}>

                <Link to="/" className={estilo.logo}>
                    <img src={"/logopreta.png"} alt="Cortaê" />
                </Link>

                <nav className={estilo.menu}>
                    <Link to="/cadastro" className={estilo.cadastro}>
                        CADASTRAR
                    </Link>

                    <Link to="/login" className={estilo.login}>
                        LOGIN
                    </Link>
                </nav>

            </div>
        </header>
    );
}