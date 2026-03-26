import { Col, Form, Input, Row } from "antd";
import Color from "./colorPicker";
import ButtonDrawerForm from "./buttonDrawerForm.jsx";
import api from "../api";

const ButtonDrawerArea = ({ onAreaAdded }) => {
  const handleSubmit = async (values) => {
    const res = await api.post("/areas", values);

    onAreaAdded(res.data.area);
  };

  return (
    <ButtonDrawerForm
      buttonText="Agregar área"
      drawerTitle="Crear nueva área"
      submitText="Agregar"
      onSubmit={handleSubmit}
    >
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="nombre"
            label="Nombre"
            rules={[{ required: true, message: "Inserta un nombre" }]}
          >
            <Input />
          </Form.Item>
        </Col>

        <Col>
          <Form.Item
            name="color"
            label="Color"
            rules={[{ required: true, message: "Selecciona un color" }]}
          >
            <Color showText />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="descripcion"
            label="Descripción"
            rules={[{ required: true, message: "Inserta una descripción" }]}
          >
            <Input />
          </Form.Item>
        </Col>
      </Row>
    </ButtonDrawerForm>
  );
};

export default ButtonDrawerArea;
