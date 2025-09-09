function getLabelAndColor(value, key) {
  switch (key) {
    case "isVisible":
      switch (value) {
        case true:
          return { label: "Es Visible", color: "green" };
        case false:
          return { label: "No Visible", color: "red" };
        default:
          return { label: "Desconocido", color: "gray" };
      }

    case "status":
      switch (value) {
        case "available":
          return { label: "Disponible", color: "green" };
        case "unavailable":
          return { label: "No Disponible", color: "red" };
        default:
          return { label: "Desconocido", color: "gray" };
      }

    default:
      return { label: "No definido", color: "gray" };
  }
}

module.exports = getLabelAndColor;
