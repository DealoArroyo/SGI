import { useState, useEffect } from "react";
import { message, Divider } from "antd";
import { Col, Form, Input, Row } from "antd";
import Color from "../components/colorPicker";
import api from "../api";
import ButtonDrawerForm from "../components/buttonDrawerForm.jsx";
import CardCategoria from "../components/cardCategoria.jsx";
import {
  useParams,
  useOutletContext
} from "react-router-dom";

export default function Categoria() {
  const [categorias, setCategorias] = useState([]);
  const { id } = useParams();
  const { setBreadcrumbExtra } = useOutletContext();

  const [messageApi, contextHolder] = message.useMessage();

  // ======================
  // NOMBRE DEL ÁREA (Tecnología)
  // ======================
  useEffect(() => {
  const fetchArea = async () => {
    const { data } = await api.get(`/areas/${id}`, {
      withCredentials: true,
    });

    setBreadcrumbExtra(data.nombre); // ← Tecnología
  };

  if (id) fetchArea();
}, [id, setBreadcrumbExtra]);


  // ======================
  // CATEGORÍAS
  // ======================
  useEffect(() => {
    const fetchCategorias = async () => {
      if (!id) return;

      try {
        const { data } = await api.get(`/categorias/area/${id}`, {
          withCredentials: true
        });
        setCategorias(data);
      } catch (error) {
        console.error("Error obteniendo categorías:", error);
        messageApi.error("No se pudieron cargar las categorías");
      }
    };

    fetchCategorias();
  }, [id, messageApi]);

  const handleCategoriaAdded = (newCategoria) => {
    setCategorias(prev => [...prev, newCategoria]);
    messageApi.success("Categoría creada correctamente");
  };

  const handleCategoriaDeleted = (id) => {
    setCategorias(prev =>
      prev.filter(categoria => categoria.id !== id)
    );
  };

  return (
    <div>
      {contextHolder}

      <ButtonDrawerForm
        buttonText="Agregar categoría"
        drawerTitle="Nueva categoría"
        submitText="Crear"
        onSubmit={async (values) => {
          const res = await api.post(
            "/categorias",
            {
              ...values,
              id_area: id,
            },
            { withCredentials: true }
          );

          handleCategoriaAdded(res.data.categoria);
        }}
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



      <Divider />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categorias.map(categoria => (
          <CardCategoria
            key={categoria.id}
            id={categoria.id}
            nombre={categoria.nombre}
            descripcion={categoria.descripcion}
            color={categoria.color}
            onDelete={handleCategoriaDeleted}
          />
        ))}
      </div>
    </div>
  );
}
