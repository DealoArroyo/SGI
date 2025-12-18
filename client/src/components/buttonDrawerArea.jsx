import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { PlusOutlined } from '@ant-design/icons';
import { Button, Col, Drawer, Form, Input, Row, Select, Space, message } from 'antd';

const ButtonDrawerArea = ({ onAreaAdded }) => {
  const [open, setOpen] = useState(false);

  const [form] = Form.useForm();

  // --- Abrir/Cerrar Drawer ---
  const showDrawer = () => setOpen(true);
  const onClose = () => {
    setOpen(false);
    form.resetFields(); // ← Limpia el form
  };

  // --- Enviar formulario ---
  const onFinish = async (values) => {
    try {
      const res = await axios.post("http://localhost:3000/api/areas", values, {
        withCredentials: true
      });

      const newArea = res.data.area;

      onAreaAdded(newArea);

      onClose(); // ← cierra el drawer y limpia
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <Button type="primary" onClick={showDrawer} icon={<PlusOutlined />}>
        Agregar área
      </Button>

      <Drawer
        title="Crear nueva área"
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
                <Input placeholder="Ingresa el nombre del área" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="descripcion"
                label="Descripcion"
                rules={[{ required: true, message: 'Por favor, inserta una descripción' }]}
              >
                <Input placeholder="Ingresa la descripción del área" />
              </Form.Item>
            </Col>

          </Row>

          <Row gutter={16}>

          </Row>
        </Form>
      </Drawer>
    </>
  );
};

export default ButtonDrawerArea;
