import { resampleData } from "../helpers/utils";

onmessage = function (e) {
  const { data, options, id } = e.data;
  const result = resampleData(data, options);
  postMessage({ data: result, id });
};