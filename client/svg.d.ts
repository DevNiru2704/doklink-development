// svg.d.ts
declare module "*.svg" {
  import React from "react";
  import { SvgProps } from "react-native-svg";
  const content: React.FC<SvgProps>;
  export default content;
}

// PNG module declaration
declare module "*.png" {
  const value: any;
  export default value;
}
