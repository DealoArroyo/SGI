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
  const [userRole, setUserRole] = useState("");

  // ✅ SOLO un param (el correcto)
  const { areaId } = useParams();

  const outletContext = useSafeOutletContext();
  const setBreadcrumbItems = outletContext?.setBreadcrumbItems;

  const [messageApi, contextHolder] = message.useMessage();

  // ======================
  // BREADCRUMB
  // ======================
  useEffect(() => {
    if (!setBreadcrumbItems || !areaId) return;

    const fetchArea = async () => {
      try {
        const { data } = await api.get(`/areas/${areaId}`, {
          withCredentials: true,
        });
        setBreadcrumbItems([
          { title: data.nombre, path: `/inventario/${areaId}` },
        ]);
      } catch (err) {
        console.error("Error al cargar área:", err);
      }
    };

    fetchArea();

    return () => setBreadcrumbItems([]);
  }, [areaId, setBreadcrumbItems]);

  // ======================
  // CATEGORÍAS
  // ======================
  useEffect(() => {
    if (!areaId) return;

    const fetchCategorias = async () => {
      try {
        const [categoriasRes, perfilRes] = await Promise.all([
          api.get(`/categorias/area/${areaId}`, {
            withCredentials: true,
          }),
          api.get("/auth/perfil", {
            withCredentials: true,
          }),
        ]);
        setCategorias(categoriasRes.data || []);
        setUserRole(perfilRes.data?.user?.rol || "");
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

      {categorias.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center bg-slate-50">
          <p className="text-slate-700 font-medium">No hay categorías en esta área</p>
          <p className="text-slate-500 text-sm mt-1">
            Agrega una categoría para organizar productos.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {categorias.map((c) => (
            <CardCategoria
              key={c.id}
              id={c.id}
              areaId={areaId}
              nombre={c.nombre}
              descripcion={c.descripcion}
              color={c.color}
              canDelete={userRole === "Administrador"}
              onDelete={handleDeleteCategoria}
            />
          ))}
        </div>
      )}
    </div>
  );
}
