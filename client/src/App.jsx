import { useEffect, useState } from "react";

function App() {
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    fetch("http://localhost:3000/")
      .then((res) => res.text())
      .then((data) => setMensaje(data))
  }, []);

  return (
    <div>
      <h1>Cliente con React</h1>
      <p>{mensaje}</p>
    </div>
  );
}

export default App;