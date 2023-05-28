'use client';
import { createSlice } from "@reduxjs/toolkit";

import { AppState, localstorageLoad, localstorageSave } from "./store";
import { BaseMyUiOptions, ModelMyUiOptions, MyUiOptions, default_options } from '@common/models/option.models'

// alias, i keep changing the names
type baseoptions = BaseMyUiOptions
type modeloptions = ModelMyUiOptions
type options = MyUiOptions

const root_key = 'options';
const base_key = `${root_key}_base`
function makeKey(model: string) { return root_key + '_' + model }

// copy(JSON.stringify(localStorage));
/*
 const importObj: { [key: string]: string} = 
for(var key of Object.keys(importObj)) {
    const value = importObj[key]
    localStorage.setItem(key, value)
}
*/

export const loadBaseOptions = (): baseoptions => {
    console.log('Loading base options')
    return localstorageLoad<baseoptions>(base_key, default_options)
};

export const loadModelOptions = (model: string): modeloptions => {
    const key = makeKey(model)
    return localstorageLoad<modeloptions>(key, default_options)
};

export const saveBaseOptions = (options: baseoptions) => {
    const baseOptions: baseoptions = {
        ...default_options,
        model: options.model,
        image_height: options.image_height,
        image_width: options.image_width,
        batches: options.batches,
        seed: options.seed,
        ensd: options.ensd,
        restore_faces: options.restore_faces,
    }
    localstorageSave(base_key, baseOptions)
};

export const saveModelOptions = (model: string | undefined, options: modeloptions) => {
    if (!model) { console.log('Not saving because there is no model selected'); return }
    const key = makeKey(model)
    const modelOptions: modeloptions = {
        prompt: options.prompt,
        negative: options.negative,
        cfg_scale: options.cfg_scale,
        upscaler: options.upscaler,
        upscaler_scale: options.upscaler_scale,
        upscaler_steps: options.upscaler_steps,
        upscaler_denoise: options.upscaler_denoise,
        sampler: options.sampler,
        steps: options.steps,
        clip_skip: options.clip_skip
    }
    localstorageSave(key, modelOptions)
};

export interface OptionStore extends MyUiOptions {
    [key: string]: any;
    last_sent?: options
}

// Actual Slice
export const optionsSlice = createSlice({
    name: root_key,
    initialState: default_options as OptionStore,
    reducers: {
        setLastSent(state, action) { state.last_sent = action.payload },
        setModel(state, action) {
            const loadedState = loadModelOptions(action.payload);
            state.model = action.payload
            state.prompt = loadedState.prompt
            state.negative = loadedState.negative
            state.cfg_scale = loadedState.cfg_scale
            state.upscaler = loadedState.upscaler
            state.upscaler_scale = loadedState.upscaler_scale
            state.upscaler_steps = loadedState.upscaler_steps
            state.upscaler_denoise = loadedState.upscaler_denoise
            state.sampler = loadedState.sampler
            state.steps = loadedState.steps
            state.clip_skip = loadedState.clip_skip
            return state
        },
        setPrompt(state, action) { state.prompt = action.payload },
        setNegative(state, action) { state.negative = action.payload },
        setCfgScale(state, action) { state.cfg_scale = action.payload },
        setUpscaler(state, action) { state.upscaler = action.payload },
        setUpscalerScale(state, action) { state.upscaler_scale = action.payload },
        setUpscalerSteps(state, action) { state.upscaler_steps = action.payload },
        setUpscalerDenoise(state, action) { state.upscaler_denoise = action.payload },
        setSampler(state, action) { state.sampler = action.payload },
        setSteps(state, action) { state.steps = action.payload },
        setImageWidth(state, action) { state.image_width = action.payload },
        setImageHeight(state, action) { state.image_height = action.payload },
        setBatches(state, action) { state.batches = action.payload },
        setClipSkip(state, action) { state.clip_skip = action.payload },
        setSeed(state, action) {
            console.log('action.payload', action.payload)
            const seed = action.payload
            const valid = seed !== '' && seed >= 1
            state.seed = valid ? seed : -1
        },
        setEnsd(state, action) { state.ensd = +action.payload },
        setRestoreFaces(state, action) { state.restore_faces = !!action.payload }
    }
});

export const {
    setLastSent,
    setModel,
    setPrompt, setNegative,
    setCfgScale,
    setUpscaler,
    setUpscalerScale,
    setUpscalerSteps,
    setUpscalerDenoise,
    setSampler,
    setSteps,
    setImageWidth, setImageHeight,
    setBatches,
    setClipSkip,
    setSeed, setEnsd,
    setRestoreFaces,
} = optionsSlice.actions

export const selectOptionsState = (state: AppState) => state.options;

export default optionsSlice.reducer;