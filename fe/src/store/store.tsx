'use client';
import { configureStore, ThunkAction, Action, isAnyOf, createListenerMiddleware, TypedStartListening, addListener, TypedAddListener } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";

import { Logger } from '@/common/logger';
import {
    optionsSlice,
    loadBaseOptions, saveBaseOptions, saveModelOptions, setBatches, setCfgScale, setClipSkip, setEnsd, setImageHeight, setImageWidth, setModel, setNegative, setPrompt,
    setRestoreFaces, setSampler, setSeed, setSteps, setUpscaler, setUpscalerDenoise, setUpscalerScale, setUpscalerSteps
} from "./options.slice";
import { default_images, imagesSlice, loadFilters, saveFilters, setModelFilter, setNewestFirst, setPromptFilter } from "./images.slice";
import { workerSlice } from "./worker.slice";
import { default_options } from '@/common/models/option.models';

export type AppStartListening = TypedStartListening<AppState, AppDispatch>
const listenerMiddleware = createListenerMiddleware()
const listening = listenerMiddleware.startListening as AppStartListening

const makeStore = () =>
    configureStore({
        reducer: {
            [optionsSlice.name]: optionsSlice.reducer,
            [imagesSlice.name]: imagesSlice.reducer,
            [workerSlice.name]: workerSlice.reducer,
        },
        preloadedState: loadFromStore(),
        middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(listenerMiddleware.middleware),
        devTools: true,
    });
export const store = makeStore()
export type AppStore = ReturnType<typeof makeStore>;
export type AppState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppThunk<ReturnType = void> = ThunkAction<
    ReturnType,
    AppState,
    unknown,
    Action
>;

type DispatchFunc = () => AppDispatch
export const useAppDispatch: DispatchFunc = useDispatch
export const useAppSelector: TypedUseSelectorHook<AppState> = useSelector

function loadFromStore() {
    return {
        options: { ...default_options, ...loadBaseOptions() },
        images: { ...default_images, ...loadFilters() }
    }
    //  as {
    //     options: OptionStore;
    //     images: FilterStore;
    //     tags: TagStore;
    // }
}

listening({
    matcher: isAnyOf(setModelFilter, setNewestFirst, setPromptFilter),
    effect: (action, api) => {
        saveFilters(api.getState().images)
    }
})

listening({
    matcher: isAnyOf(
        setPrompt, setNegative,
        setCfgScale,
        setUpscaler,
        setUpscalerScale,
        setUpscalerSteps,
        setUpscalerDenoise,
        setSampler,
        setSteps,
        setClipSkip,),
    effect: (action, api) => {
        const options = api.getState().options
        saveModelOptions(options.model, options)
    }
})

listening({
    matcher: isAnyOf(
        setModel,
        setImageWidth, setImageHeight,
        setBatches,
        setSeed, setEnsd,
        setRestoreFaces),
    effect: (action, api) => {
        saveBaseOptions(api.getState().options)
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