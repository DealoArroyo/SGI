import { useState, useEffect, useRef } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import { SearchOutlined } from "@ant-design/icons";
import api from "../api";
import {
  Table,
  Input,
  Space,
  Button,
} from "antd";
import Highlighter from "react-highlight-words";

export default function PaginaDetalle() {
  const { areaId, categoriaId } = useParams();
  const [productos, setProductos] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const outletContext = useOutletContext();
  const setBreadcrumbItems = outletContext?.setBreadcrumbItems;
  const searchInput = useRef(null);

  // ======================
  // BREADCRUMB
  // ======================
  useEffect(() => {
    const fetchBreadcrumb = async () => {
      try {
        const [areaRes, categoriaRes] = await Promise.all([
          api.get(`/areas/${areaId}`, { withCredentials: true }),
          api.get(`/categorias/${categoriaId}`, { withCredentials: true })
        ]);

        setBreadcrumbItems?.([
          { title: areaRes.data.nombre, path: `/inventario/${areaId}` },
          { title: categoriaRes.data.nombre, path: `/inventario/${areaId}/${categoriaId}` },
        ]);
      } catch (err) {
        console.error(err);
      }
    };

    if (areaId && categoriaId) fetchBreadcrumb();
    return () => setBreadcrumbItems?.([]);
  }, [areaId, categoriaId, setBreadcrumbItems]);

  /* ====================
      FETCHS
  ==================== */

  useEffect(() => {
    const fetchProductos = async () => {
      const res = await api.get(
        `/productos/categoria/${categoriaId}`,
        { withCredentials: true }
      );
      setProductos(res.data);
    };

    if (categoriaId) {
      fetchProductos();
    }
  }, [categoriaId]);

  /* ====================
      BUSCADOR
  ==================== */
  const handleSearch = (seletedKeys, confirm, dataIndex) => {
    confirm();
    setSearchText(seletedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, close }) => (
      <div style={{ padding: 8 }}>
        <Input
          ref={searchInput}
          placeholder={`Buscar ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() =>
            handleSearch(selectedKeys, confirm, dataIndex)
          }
          style={{ marginBottom: 8 }}
        />
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<SearchOutlined />}
            onClick={() =>
              handleSearch(selectedKeys, confirm, dataIndex)
            }
          >
            Buscar
          </Button>
          <Button size="small" onClick={close}>
            Cancelar
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => (
      <SearchOutlined
        style={{ color: filtered ? "#1677ff" : undefined }}
      />
    ),
    onFilter: (value, record) =>
      record[dataIndex]
        ?.toString()
        .toLowerCase()
        .includes(value.toLowerCase()),
    render: (text) =>
      searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{ backgroundColor: "#ffc069", padding: 0 }}
          searchWords={[searchText]}
          autoEscape
          textToHighlight={text?.toString() || ""}
        />
      ) : (
        text
      )
  });

  const columns = [
    {
      title: "Nombre",
      dataIndex: "nombre",
      ...getColumnSearchProps("nombre")
    },
    {
      title: "Detalles",
      dataIndex: "detalles"
    },
    {
      title: "Cantidad",
      dataIndex: "cantidad"
    },
    {
      title: "Unidad de Medida",
      dataIndex: "unidad_medida"
    },
  ]



  return (
    <div>
      <Table
        columns={columns}
        dataSource={productos}
        rowKey="id"
      />
    </div>
  );
}
