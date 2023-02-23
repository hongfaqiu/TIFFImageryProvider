import { GenerateImageOptions } from "./generateImage";
declare class WorkerFarm {
    worker: Worker;
    constructor();
    scheduleTask(data: (string | any[])[], opts: GenerateImageOptions): Promise<ImageData>;
    destory(): void;
}
export default WorkerFarm;
