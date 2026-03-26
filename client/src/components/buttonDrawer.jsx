import React, { useEffect, useState } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { Button, Col, Drawer, Form, Input, Row, Select, Space, message } from 'antd';
import api from "../api";

const ButtonDrawer = ({ onUserAdded }) => {
  const [open, setOpen] = useState(false);
  const [roles, setRoles] = useState([]);

  const [form] = Form.useForm();

  // --- Abrir/Cerrar Drawer ---
  const showDrawer = () => setOpen(true);
  const onClose = () => {
    setOpen(false);
    form.resetFields(); // ← Limpia el form
  };

  // --- Cargar roles desde API ---
  useEffect(() => {
    const cargarRoles = async () => {
      try {
        const res = await api.get("/roles");

        const rolesFormateados = res.data.map(r => ({
          label: r.nombre,
          value: r.id,
        }));
        setRoles(rolesFormateados);

      } catch (error) {
        console.error("Error cargando roles", error);
        message.error("No se pudieron cargar los roles");
      }
    };

    cargarRoles();
  }, []);

  // --- Enviar formulario ---
  const onFinish = async (values) => {
    try {
      const res = await api.post("/usuarios", values);

      const newUser = res.data.usuario;

      onUserAdded(newUser);

      onClose(); // ← cierra el drawer y limpia
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <Button type="primary" onClick={showDrawer} icon={<PlusOutlined />}>
        Agregar usuario
      </Button>

      <Drawer
        title="Crea un nuevo usuario"
        size="large"
        onClose={onClose}
        open={open}
        styles={{ body: { paddingBottom: 80 } }}
        extra={
          <Space>
            <Button onClick={onClose}>Cancelar</Button>

            {/* Botón que envia el form */}
            <Button type="primary" onClick={() => form.submit()}>
              Agregar
            </Button>
          </Space>
        }
      >
        <Form
          layout="vertical"
          requiredMark={false}
          form={form}
          onFinish={onFinish} 
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="nombre"
                label="Nombre"
                rules={[{ required: true, message: 'Por favor, inserta un nombre' }]}
              >
                <Input placeholder="Ingresa el nombre del usuario" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="correo"
                label="Correo"
                rules={[
                  { required: true, message: 'Por favor, inserta un correo' },
                  { type: 'email', message: 'Ingresa un correo válido' }
                ]}
              >
                <Input placeholder="Ingresa el correo del usuario" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="id_rol"
                label="Rol"
                rules={[{ required: true, message: 'Por favor, selecciona el rol del usuario' }]}
              >
                <Select
                  placeholder="Selecciona el rol del usuario"
                  options={roles}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="contrasena"
                label="Contraseña"
                rules={[{ required: true, message: 'Por favor, inserta una contraseña' }]}
              >
                <Input.Password placeholder="Contraseña del usuario" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Drawer>
    </>
  );
};

export default ButtonDrawer;
