import { Spin } from "antd";

const PageLoader = ({ label = "Cargando" }) => {
  return (
    <div className="page-loader" role="status" aria-live="polite">
      <Spin size="large" />
      <span className="page-loader-text">{label}</span>
    </div>
  );
};

export default PageLoader;
