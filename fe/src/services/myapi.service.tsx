'use client';
import { axiosInstance, tryGet, tryPost } from './common.services'
import { Txt2ImgResult } from "@common/models/myapi.models";
import { MyUiOptions } from "@common/models/option.models";

const list = async () => {
    const result = await tryGet<Txt2ImgResult[]>('/myapi/img')
    return result ? result.sort((i1, i2) => (i1.timestamp || "0").localeCompare(i2.timestamp)) : []
}

const txt2img = (options: MyUiOptions) => {
    return tryPost<void>('/myapi/txt2img', options)
    // return tryGet('/myapi/test')
}

const deleteImage = (image: Txt2ImgResult) => {
    try {
        return axiosInstance.delete('/myapi/img/' + image.name)
    }
    catch (e) {
        console.error('Unable to delete,', e)
    }
}


export const MyApi = {
    list,
    txt2img,
    deleteImage,
}