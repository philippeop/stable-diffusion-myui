'use client';
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { RootState, localstorageLoad, localstorageSave } from "./store";
import { SavedSettings, Txt2ImgOptions, default_options } from '@common/models/option.models'
import { AppActions } from './app.slice';
import { SdApi } from '@/services/sdapi.service';
import { Logger } from '@/common/logger';
import { Model } from '@/common/models/sdapi.models';

const root_key = 'options';
const base_key = `${root_key}_base`
function makeKey(model: string) { return root_key + '_' + model }

export const loadOptions = (model: string = 'all'): Txt2ImgOptions => {
    const key = makeKey(model)
    return localstorageLoad<Txt2ImgOptions>(key, default_options)
}

export const saveOptions = (model: string | undefined, options: Txt2ImgOptions) => {
    if (!model) { console.log('Not saving because there is no model selected'); return }
    const key = makeKey(model)
    localstorageSave(key, options)
}

// Actual Slice
export const optionsSlice = createSlice({
    name: root_key,
    initialState: default_options as Txt2ImgOptions,
    reducers: {
        setSettings(state, action) {
            const settings = action.payload as SavedSettings
            const options = settings.txt2img_options
            
            state.model = options.model
            state.image_height = options.image_height
            state.image_width = options.image_width
            
            state.prompt = options.prompt
            state.negative = options.negative
            state.cfg_scale = options.cfg_scale
            
            state.sampler = options.sampler
            state.steps = options.steps

            state.clip_skip = options.clip_skip
            state.seed = options.seed
            state.ensd = options.ensd
            
            state.restore_faces = options.restore_faces

            state.upscale = options.upscale
            state.upscaler = options.upscaler
            state.upscaler_scale = options.upscaler_scale
            state.upscaler_steps = options.upscaler_steps
            state.upscaler_denoise = options.upscaler_denoise
        },
        setModel(state, action) {
            state.model = action.payload
        },
        setPrompt(state, action) { state.prompt = action.payload },
        setNegative(state, action) { state.negative = action.payload },
        setCfgScale(state, action) { state.cfg_scale = action.payload },
        setUpscale(state, action) { state.upscale = !!action.payload },
        setUpscaler(state, action) { state.upscaler = action.payload },
        setUpscalerScale(state, action) { state.upscaler_scale = action.payload },
        setUpscalerSteps(state, action) { state.upscaler_steps = action.payload },
        setUpscalerDenoise(state, action) { state.upscaler_denoise = action.payload },
        setSampler(state, action) { state.sampler = action.payload },
        setSteps(state, action) { state.steps = action.payload },
        setImageWidth(state, action) { state.image_width = action.payload },
        setImageHeight(state, action) { state.image_height = action.payload },
        setClipSkip(state, action) { state.clip_skip = action.payload },
        setSeed(state, action) {
            console.log('action.payload', action.payload)
            const seed = action.payload
            const valid = seed !== '' && seed >= 1
            state.seed = valid ? seed : -1
        },
        setEnsd(state, action) { state.ensd = +action.payload },
        setRestoreFaces(state, action) { state.restore_faces = !!action.payload },
    }
});

export const OptionActions = optionsSlice.actions

export const selectOptionsState = (state: RootState) => state.options;

export default optionsSlice.reducer;

export const changeModel = createAsyncThunk<void, Model>('app/changeModel', async (args, thunkApi) => {
    debugger
    const model = args
    if (model) {
        thunkApi.dispatch(AppActions.setOptionsformdisabled(true))
        await SdApi.setModel(model)
        Logger.debug('Changed model to', model.model_name)
        thunkApi.dispatch(OptionActions.setModel(model.model_name))
        thunkApi.dispatch(AppActions.setOptionsformdisabled(false))
    }
})

