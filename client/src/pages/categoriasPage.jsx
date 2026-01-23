import { useState, useEffect } from "react";
import { message, Divider, Row, Col, Form, Input } from "antd";
import { useParams, useOutletContext } from "react-router-dom";
import api from "../api";
import Color from "../components/colorPicker.jsx";
import ButtonDrawerForm from "../components/buttonDrawerForm.jsx";
import CardCategoria from "../components/cardCategoria.jsx";

/* ✅ Hook seguro */
function useSafeOutletContext() {
  try {
    return useOutletContext();
  } catch {
    return null;
  }
}

export default function Categoria() {
  const [categorias, setCategorias] = useState([]);

  // ✅ SOLO un param (el correcto)
  const { areaId } = useParams();

  const outletContext = useSafeOutletContext();
  const setBreadcrumbExtra = outletContext?.setBreadcrumbExtra;

  const [messageApi, contextHolder] = message.useMessage();

  // ======================
  // BREADCRUMB
  // ======================
  useEffect(() => {
    if (!setBreadcrumbExtra || !areaId) return;

    const fetchArea = async () => {
      try {
        const { data } = await api.get(`/areas/${areaId}`, {
          withCredentials: true,
        });
        setBreadcrumbExtra(data.nombre);
      } catch (err) {
        console.error("Error al cargar área:", err);
      }
    };

    fetchArea();

    return () => setBreadcrumbExtra(null);
  }, [areaId, setBreadcrumbExtra]);

  // ======================
  // CATEGORÍAS
  // ======================
  useEffect(() => {
    if (!areaId) return;

    const fetchCategorias = async () => {
      try {
        const { data } = await api.get(`/categorias/area/${areaId}`, {
          withCredentials: true,
        });
        setCategorias(data);
      } catch (err) {
        console.error(err);
        messageApi.error("No se pudieron cargar las categorías");
      }
    };

    fetchCategorias();
  }, [areaId, messageApi]);

  const handleCategoriaAdded = (newCategoria) => {
    setCategorias((prev) => [...prev, newCategoria]);
    messageApi.success("Categoría creada correctamente");
  };

  const handleDeleteCategoria = (id) => {
    setCategorias(prev => prev.filter(c => c.id !== id));
  };

  return (
    <div>
      {contextHolder}

      <ButtonDrawerForm
        buttonText="Agregar categoría"
        drawerTitle="Nueva categoría"
        submitText="Crear"
        onSubmit={async (values) => {
          try {
            const res = await api.post(
              "/categorias",
              {
                ...values,
                id_area: areaId, // ✅ CORRECTO
              },
              { withCredentials: true }
            );

            handleCategoriaAdded(res.data.categoria);
          } catch (err) {
            if (err.response?.status === 409) {
              messageApi.error("Ya existe una categoría con este nombre");
            } else {
              messageApi.error("Error al crear la categoría");
            }
          }
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

          <Col span={12}>
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
          <Col span={24}>
            <Form.Item
              name="descripcion"
              label="Descripción"
              rules={[
                { required: true, message: "Inserta una descripción" },
              ]}
            >
              <Input />
            </Form.Item>
          </Col>
        </Row>
      </ButtonDrawerForm>

      <Divider />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categorias.map((c) => (
          <CardCategoria
            key={c.id}
            id={c.id}
            areaId={areaId}
            nombre={c.nombre}
            descripcion={c.descripcion}
            color={c.color}
            onDelete={handleDeleteCategoria}
          />
        ))}
      </div>
    </div>
  );
}
