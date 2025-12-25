import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { message } from "antd";
import FormUsuario from "../components/formUsuario";
import { login } from "../services/authService";
import { jwtDecode } from "jwt-decode";

export default function Login() {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();

  const success = () => {
    messageApi.open({
      type: "success",
      content: "Inicio de sesión exitoso",
    });
  };

  const warning = () => {
    messageApi.open({
      type: "error",
      content: "Credenciales incorrectas",
    });
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = jwtDecode(token);
      const now = Date.now() / 1000;
      if (decoded.exp < now) {
        localStorage.removeItem("token");
      } else {
        navigate("/");
      }
    }
  }, [navigate]);

  const handleLogin = async (values) => {
    const { correo, contrasena } = values;
    try {
      const data = await login(correo, contrasena);
      console.log("Respuesta del servidor:", data);
      
      success();
      setTimeout(() => navigate("/"), 1500);
    } catch (error) {
      console.error("Error al conectar:", error);
      warning();
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-200">
      <div className="w-full max-w-md p-6 pt-16 bg-white shadow-lg rounded-xl">
        {contextHolder}
        <FormUsuario onFinish={handleLogin} />
      </div>
    </div>
  );
}
