import { resampleData } from "../helpers/resample";

onmessage = function (e) {
  const { data, options, id } = e.data;
  const result = resampleData(data, options);
  postMessage({ data: result, id });
};