function reverseArray(options: {
  array: number[]; width: number; height: number;
}) {
  const { array, width, height } = options;
  const reversedArray = [];

  for (let row = height - 1; row >= 0; row--) {
    const startIndex = row * width;
    const endIndex = startIndex + width;
    const rowArray = array.slice(startIndex, endIndex);
    reversedArray.push(...rowArray);
  }

  return reversedArray;
}

import { onMessage } from "./worker-util"

const work = (self as unknown) as Worker

work.onmessage = onMessage(work, reverseArray)