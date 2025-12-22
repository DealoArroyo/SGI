const CardArea = ({ nombre, descripcion }) => {
    return (
        <div className="bg-white border rounded-lg p-4 shadow-sm">
            <h3>{nombre}</h3>
            <p>{descripcion}</p>
        </div>
    );
};

export default CardArea;