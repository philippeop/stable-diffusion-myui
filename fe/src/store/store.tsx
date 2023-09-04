'use client';
import { configureStore, ThunkAction, Action, isAnyOf, createListenerMiddleware, TypedStartListening, addListener, TypedAddListener, createAsyncThunk } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";

import { Logger } from '@/common/logger';
import { optionsSlice, loadOptions, saveOptions, OptionActions } from "./options.slice";
import { default_images, imagesSlice, loadFilters, saveFilters, ImageActions } from "./images.slice";
import { appSlice } from "./app.slice";
import { default_options } from '@/common/models/option.models';
import { MyApi } from '@/services/myapi.service';
import { SdApi } from '@/services/sdapi.service';

export type AppStartListening = TypedStartListening<RootState, RootDispatch>
const listenerMiddleware = createListenerMiddleware()
const listening = listenerMiddleware.startListening as AppStartListening

const makeStore = () =>
    configureStore({
        reducer: {
            [optionsSlice.name]: optionsSlice.reducer,
            [imagesSlice.name]: imagesSlice.reducer,
            [appSlice.name]: appSlice.reducer,
        },
        preloadedState: loadFromStore(),
        middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(listenerMiddleware.middleware),
        devTools: true,
    });
export const store = makeStore()
export type RootStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<typeof store.getState>;
export type RootDispatch = typeof store.dispatch;
export type RootThunk<ReturnType = void> = ThunkAction<
    ReturnType,
    RootState,
    unknown,
    Action
>;

type DispatchFunc = () => RootDispatch
export const useAppDispatch: DispatchFunc = useDispatch
export const useRootSelector: TypedUseSelectorHook<RootState> = useSelector

function loadFromStore() {
    return {
        //app: { batches: 1, samplerOptions: [] },
        options: { ...default_options },
        images: { ...default_images, ...loadFilters() }
    }
    //  as {
    //     options: OptionStore;
    //     images: FilterStore;
    //     tags: TagStore;
    // }
}

listening({
    matcher: isAnyOf(
        ImageActions.setModelFilter, 
        ImageActions.setNewestFirst, 
        ImageActions.setPromptFilter, 
        ImageActions.setSamplerOptions),
    effect: (action, api) => {
        saveFilters(api.getState().images)
    }
})

listening({
    matcher: isAnyOf(
        OptionActions.setModel,
        OptionActions.setImageWidth, OptionActions.setImageHeight,
        OptionActions.setPrompt, OptionActions.setNegative,
        OptionActions.setCfgScale,
        OptionActions.setUpscaler,
        OptionActions.setUpscalerScale,
        OptionActions.setUpscalerSteps,
        OptionActions.setUpscalerDenoise,
        OptionActions.setSampler,
        OptionActions.setSteps,
        OptionActions.setClipSkip,
        OptionActions.setSeed, OptionActions.setEnsd,
        OptionActions.setRestoreFaces),
    effect: (action, api) => {
        const options = api.getState().options
        // saveModelOptions(options.model, options)
        saveOptions('all', options)
        MyApi.saveSettings(options)
    } 
})

export function localstorageLoad<T>(key: string, defaultObj: T): T {
    if (typeof window === 'undefined') return defaultObj
    try {
        console.log('Loading options for', key)
        const json = localStorage.getItem(key);
        const obj = json ? (JSON.parse(json) as T) : {}
        return { ...defaultObj, ...obj }
    } catch (e) {
        Logger.warn('localstorageLoad failed', e)
        return defaultObj;
    }
}

export function localstorageSave(key: string, obj: any) {
    if (typeof window === 'undefined') return
    try {
        if (!obj) { console.log('Not saving because there is no obj passed'); return }
        const json = JSON.stringify(obj)
        localStorage.setItem(key, json)
    } catch (e) {
        Logger.warn('localstorageSave failed', e)
        // ignore write errors
    }
}

export const getSettings = createAsyncThunk('options/getSettings', async (args, thunkApi) => {
    const settings = await MyApi.getSettings()
    if(!settings) return
    const models = await SdApi.getModels()
    if(!models) return
    const model = models.find(m => m.model_name == settings.txt2img_options.model)
    if(model) await SdApi.setModel(model)
    thunkApi.dispatch(OptionActions.setSettings(settings))
})