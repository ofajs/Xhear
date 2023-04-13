import Stanz from "./main.mjs";
import { isxdata } from "./public.mjs";

const stanz = (data) => {
  return new Stanz(data);
};

Object.assign(stanz, { is: isxdata });

export default stanz;
