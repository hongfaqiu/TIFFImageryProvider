import { TIFFImageryProviderRenderOptions } from "src";
export declare type GenerateImageOptions = {
    width: number;
    height: number;
    renderOptions?: TIFFImageryProviderRenderOptions;
    bands: {
        min: number;
        max: number;
    }[];
    noData?: number;
};
export declare function generateImage(data: (string | any[])[], opts: GenerateImageOptions): Promise<ImageData>;
export declare type GenerateImage = typeof generateImage;
