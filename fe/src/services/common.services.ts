import { Logger } from "@/common/logger";
import axios from "axios";
import { AxiosError } from "axios";

export const axiosInstance = axios.create({
    baseURL: "/",
    headers: {
        "Content-type": "application/json"
    }
});

export async function tryGet<T>(url: string): Promise<T | undefined> {
    try {
        const response = await axiosInstance.get<T>(url)
        return response.data
    }
    catch (e) {
        const err = e as (Error | AxiosError)
        if(axios.isAxiosError(err) && err.response) {
            Logger.warn(err.response.status)
        }
        else {
            Logger.warn(err)
        }
        return undefined
    }
}

export async function tryPost<T>(url: string, payload?: unknown): Promise<T | undefined> {
    try {
        const response = await axiosInstance.post<T>(url, payload)
        return response.data
    }
    catch (e) {
        const err = e as (Error | AxiosError)
        if(axios.isAxiosError(err) && err.response) {
            Logger.warn(err.response.status)
        }
        else {
            Logger.warn(err)
        }
        return undefined
    }
}