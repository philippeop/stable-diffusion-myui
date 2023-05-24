'use client';
import { createSlice } from "@reduxjs/toolkit";
import { AppState } from "./store";
import { HYDRATE } from "next-redux-wrapper";
import { BaseMyUiOptions, ModelMyUiOptions, MyUiOptions, default_options } from '@common/models/option.models'

// alias, i keep changing the names
type baseoptions = BaseMyUiOptions
type modeloptions = ModelMyUiOptions
type options = MyUiOptions

const root_key = 'options';
const base_key = `${root_key}_base`
function makeKey(model: string) { return root_key + '_' + model }

export const loadBaseOptions = (): baseoptions => {
    if (typeof window === 'undefined') return default_options
    try {
        console.log('Loading base options')
        const json = localStorage.getItem(base_key);
        const baseOptions = json ? (JSON.parse(json) as baseoptions) : default_options
        return baseOptions
    } catch (err) {
        return default_options;
    }
};

export const loadModelOptions = (model: string): modeloptions => {
    if (typeof window === 'undefined') return default_options
    try {
        const key = makeKey(model)
        console.log('Loading options for', key)
        const json = localStorage.getItem(key);
        const modelOptions = json ? (JSON.parse(json) as modeloptions) : default_options
        return modelOptions
    } catch (err) {
        return default_options;
    }
};

export const saveBaseOptions = (options: baseoptions) => {
    try {
        const baseOptions: baseoptions = {
            ...default_options,
            model: options.model,
            image_height: options.image_height,
            image_width: options.image_width,
            image_count: options.image_count,
            batches: options.batches,
            seed: options.seed
        }
        const baseJson = JSON.stringify(baseOptions);
        localStorage.setItem(base_key, baseJson);
    } catch {
        // ignore write errors
    }
};

export const saveModelOptions = (model: string | undefined, options: modeloptions) => {
    try {
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
        const modelJson = JSON.stringify(modelOptions)
        localStorage.setItem(key, modelJson)
    } catch {
        // ignore write errors
    }
};

// Actual Slice
const defaultState: options = { 
    ...default_options,
    ...loadBaseOptions()
}
export const optionsSlice = createSlice({
    name: root_key,
    initialState: defaultState,
    reducers: {
        setModel(state, action) {
            const loadedState = loadModelOptions(action.payload);
            return { ...state, model: action.payload, ...loadedState}
            // state.model = action.payload.model_name
            // state.prompt = loadedState.prompt
            // state.negative = loadedState.negative
            // state.cfg_scale = loadedState.cfg_scale
            // state.upscaler = loadedState.upscaler
            // state.upscaler_scale = loadedState.upscaler_scale
            // state.upscaler_steps = loadedState.upscaler_steps
            // state.upscaler_denoise = loadedState.upscaler_denoise
            // state.sampler = loadedState.sampler
            // state.steps = loadedState.steps
            // state.clip_skip = loadedState.clip_skip
            // saveBaseOptions(state)
        },
        setPrompt(state, action) { state.prompt = action.payload; saveModelOptions(state.model, state) },
        setNegative(state, action) { state.negative = action.payload; saveModelOptions(state.model, state) },
        setCfgScale(state, action) { state.cfg_scale = action.payload; saveModelOptions(state.model, state) },
        setUpscaler(state, action) { state.upscaler = action.payload; saveModelOptions(state.model, state) },
        setUpscalerScale(state, action) { state.upscaler_scale = action.payload; saveModelOptions(state.model, state) },
        setUpscalerSteps(state, action) { state.upscaler_steps = action.payload; saveModelOptions(state.model, state) },
        setUpscalerDenoise(state, action) { state.upscaler_denoise = action.payload; saveModelOptions(state.model, state) },
        setSampler(state, action) { state.sampler = action.payload; saveModelOptions(state.model, state) },
        setSteps(state, action) { state.steps = action.payload; saveModelOptions(state.model, state) },
        setImageWidth(state, action) { state.image_width = action.payload; saveBaseOptions(state) },
        setImageHeight(state, action) { state.image_height = action.payload; saveBaseOptions(state) },
        setBatches(state, action) { state.batches = action.payload; saveBaseOptions(state) },
        setImageCount(state, action) { state.image_count = action.payload; saveBaseOptions(state) },
        setClipSkip(state, action) { state.clip_skip = action.payload; saveModelOptions(state.model, state) },
        setSeed(state, action) { 
            console.log('action.payload', action.payload)
            const seed = action.payload
            const valid = seed !== '' && seed >= 1 
            state.seed = valid ? seed : -1; 
            saveBaseOptions(state) 
        }
    },

    // Special reducer for hydrating the state. Special case for next-redux-wrapper
    extraReducers: {
        [HYDRATE]: (state, action) => {
            return {
                ...state,
                ...action.payload.auth,
            };
        },
    },
});

export const {
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
    setBatches, setImageCount,
    setClipSkip,
    setSeed,
} = optionsSlice.actions

export const selectOptionsState = (state: AppState) => state.options;

export default optionsSlice.reducer;