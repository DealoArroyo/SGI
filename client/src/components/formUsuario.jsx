// src/components/FormUsuario.jsx
import React from "react";
import { Button, Checkbox, Form, Input } from "antd";

const FormUsuario = ({ onFinish }) => {
  return (
    <Form
      name="loginForm"
      labelCol={{ span: 8 }}
      wrapperCol={{ span: 16 }}
      style={{ maxWidth: 600 }}
      initialValues={{ remember: false }}
      onFinish={onFinish}
      autoComplete="off"
    >
      <Form.Item
        label="Correo"
        name="correo"
        rules={[
          { required: true, message: "Por favor ingresa tu correo" },
          { type: "email", message: "Correo electrónico inválido" },
        ]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        label="Contraseña"
        name="contrasena"
        rules={[{ required: true, message: "Por favor ingresa tu contraseña" }]}
      >
        <Input.Password />
      </Form.Item>

      <Form.Item name="remember" valuePropName="checked" wrapperCol={{ offset: 8, span: 16 }}>
        <Checkbox>Recordar</Checkbox>
      </Form.Item>

      <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
        <Button type="primary" htmlType="submit">
          Iniciar sesión
        </Button>
      </Form.Item>
    </Form>
  );
};

export default FormUsuario;
