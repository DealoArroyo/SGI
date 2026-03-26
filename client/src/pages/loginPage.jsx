import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  Space,
  Typography,
  message,
} from "antd";
import {
  LockOutlined,
  MailOutlined,
  SafetyCertificateOutlined,
  ShopOutlined,
} from "@ant-design/icons";
import api from "../api";
import { login } from "../services/authService";

export default function Login() {
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();

  const [loading, setLoading] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFactorToken, setTwoFactorToken] = useState("");
  const [baseCreds, setBaseCreds] = useState({ correo: "", contrasena: "" });

  useEffect(() => {
    api
      .get("/auth/perfil", { withCredentials: true })
      .then(() => navigate("/", { replace: true }))
      .catch(() => null);
  }, [navigate]);

  const handlePrimaryLogin = async (values) => {
    setLoading(true);
    try {
      const data = await login({
        correo: values.correo,
        contrasena: values.contrasena,
      });

      if (data?.requires_2fa) {
        setBaseCreds({ correo: values.correo, contrasena: values.contrasena });
        setTwoFactorToken(data.two_factor_token || "");
        setRequires2FA(true);
        messageApi.info("Ingresa tu código de autenticación");
        return;
      }

      messageApi.success("Inicio de sesión exitoso");
      setTimeout(() => navigate("/", { replace: true }), 500);
    } catch (error) {
      const msg = error?.response?.data?.error || "Credenciales incorrectas";
      messageApi.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handle2FALogin = async (values) => {
    setLoading(true);
    try {
      await login({
        correo: baseCreds.correo,
        contrasena: baseCreds.contrasena,
        otp_code: values.otp_code,
        two_factor_token: twoFactorToken,
      });

      messageApi.success("Inicio de sesión exitoso");
      setTimeout(() => navigate("/", { replace: true }), 500);
    } catch (error) {
      const msg = error?.response?.data?.error || "Código inválido";
      messageApi.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-shell">
      {contextHolder}

      <Card className="login-frame" bordered={false}>
        <div className="login-brand-panel">
          <div className="login-brand-badge">
            <ShopOutlined />
          </div>

          <Typography.Title level={2} style={{ color: "#f8fafc", margin: 0 }}>
            Supply Gestor
          </Typography.Title>

          <Typography.Paragraph style={{ color: "#dbeafe", marginBottom: 0 }}>
            Gestión segura de inventario, pedidos y clientes para tu operación diaria.
          </Typography.Paragraph>

          <div className="login-kpis">
            <div>
              <span className="login-kpi-value">+ Seguridad</span>
              <span className="login-kpi-label">Control de acceso</span>
            </div>
            <div>
              <span className="login-kpi-value">+ Visibilidad</span>
              <span className="login-kpi-label">Dashboard conectado en tiempo real</span>
            </div>
          </div>
        </div>

        <div className="login-form-panel">
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <div>
              <Typography.Title level={3} style={{ marginBottom: 6 }}>
                {requires2FA ? "Verificación 2FA" : "Iniciar sesión"}
              </Typography.Title>
              <Typography.Text type="secondary">
                {requires2FA
                  ? "Escribe el código temporal de tu app autenticadora"
                  : "Accede con tus credenciales de empresa"}
              </Typography.Text>
            </div>

            {!requires2FA ? (
              <Form layout="vertical" onFinish={handlePrimaryLogin} autoComplete="off">
                <Form.Item
                  name="correo"
                  label="Correo"
                  rules={[
                    { required: true, message: "Ingresa tu correo" },
                    { type: "email", message: "Correo inválido" },
                  ]}
                >
                  <Input prefix={<MailOutlined />} placeholder="admin@empresa.com" />
                </Form.Item>

                <Form.Item
                  name="contrasena"
                  label="Contraseña"
                  rules={[{ required: true, message: "Ingresa tu contraseña" }]}
                >
                  <Input.Password prefix={<LockOutlined />} placeholder="••••••••" />
                </Form.Item>

                <Button type="primary" htmlType="submit" block loading={loading}>
                  Entrar
                </Button>
              </Form>
            ) : (
              <Space direction="vertical" style={{ width: "100%" }}>
                <Alert
                  type="info"
                  showIcon
                  icon={<SafetyCertificateOutlined />}
                  message="Autenticación de dos factores"
                  description="Abre tu app (Authenticator/Authy/1Password) y captura el código de 6 dígitos."
                />

                <Form layout="vertical" onFinish={handle2FALogin} autoComplete="off">
                  <Form.Item
                    name="otp_code"
                    label="Código"
                    rules={[
                      { required: true, message: "Ingresa el código" },
                      { pattern: /^\d{6}$/, message: "Debe tener 6 dígitos" },
                    ]}
                  >
                    <Input placeholder="123456" maxLength={6} />
                  </Form.Item>

                  <Space direction="vertical" style={{ width: "100%" }}>
                    <Button type="primary" htmlType="submit" block loading={loading}>
                      Verificar
                    </Button>
                    <Button
                      block
                      onClick={() => {
                        setRequires2FA(false);
                        setTwoFactorToken("");
                      }}
                    >
                      Volver
                    </Button>
                  </Space>
                </Form>
              </Space>
            )}
          </Space>
        </div>
      </Card>
    </div>
  );
}
