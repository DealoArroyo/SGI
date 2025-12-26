import React from "react";
import { ColorPicker, Space, theme } from "antd";
import { cyan, generate, green, presetPalettes, red } from "@ant-design/colors";

function genPresets(presets = presetPalettes) {
  return Object.entries(presets).map(([label, colors]) => ({
    label,
    colors,
    key: label,
  }));
}

const Color = ({ value, onChange }) => {
  const { token } = theme.useToken();

  const presets = genPresets({
    primary: generate(token.colorPrimary),
    red,
    green,
    cyan,
  });

  return (
    <Space>
      <ColorPicker
        value={value}
        presets={presets}
        showText
        styles={{ popupOverlayInner: { width: 480 } }}
        onChange={(color) => {
          const hex = color.toHexString(); // 🔑 FORZADO A HEX
          onChange(hex);
        }}
      />
    </Space>
  );
};

export default Color;
