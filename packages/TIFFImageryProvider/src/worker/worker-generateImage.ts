import { generateImage } from "../helpers/generateImage"
import { onMessage } from "./worker-util"

const work = (self as unknown) as Worker

work.onmessage = onMessage(work, generateImage)