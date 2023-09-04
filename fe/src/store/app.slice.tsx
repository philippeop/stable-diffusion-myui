'use client';
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import moment from 'moment'

import { BackendStatus } from '@/common/models/myapi.models';
import { Model, Sampler, Upscaler } from '@/common/models/sdapi.models';
import { Txt2ImgOptions, SdApiOptions } from '@/common/models/option.models';
import { SdApi } from '@/services/sdapi.service';
import { OptionActions } from './options.slice';
import { Logger } from '@/common/logger';

export interface AppState {
    modelsamplervisible: boolean
    optionsformdisabled: boolean
    working: boolean
    progress?: BackendStatus
    messages: string[]
    models: Model[]
    samplers: Sampler[]
    upscalers: Upscaler[]
    batches: number
    samplerOptions: string[]
    sdOptions?: SdApiOptions
    last_sent?: Txt2ImgOptions
}
const default_appstate: AppState = {
    modelsamplervisible: false,
    optionsformdisabled: false,
    working: false,
    messages: [],
    models: [],
    samplers: [],
    upscalers: [],
    batches: 1,
    samplerOptions: []
}

export const appSlice = createSlice({
    name: 'app',
    initialState: default_appstate,
    reducers: {
        setProgress(state, action) {
            const backendStatus = { ...action.payload} as BackendStatus
            delete backendStatus.image
            state.progress = backendStatus
            state.working = backendStatus.running
        },
        addMessage(state, action) {
            state.messages = [...state.messages, `${moment().format('H:mm:ss')} - ${action.payload}`]
        },
        clearMessages(state) {
            state.messages = []
        },
        setModels(state, action) {
            state.models = action.payload
            state.optionsformdisabled = !state.sdOptions || !state.models || !state.samplers
        },
        setSamplers(state, action) {
            state.samplers = action.payload
            state.optionsformdisabled = !state.sdOptions || !state.models || !state.samplers
        },
        setUpscalers(state, action) {
            state.upscalers = action.payload
        },
        setSdOptions(state, action) {
           state.sdOptions = action.payload
           state.optionsformdisabled = !state.sdOptions || !state.models || !state.samplers
        },
        setBatches(state, action) {
            state.batches = +action.payload
        },
        setLastSent(state, action) { state.last_sent = action.payload },
        setModelSamplerVisible(state, action) { state.modelsamplervisible = !!action.payload },
        setOptionsformdisabled(state, action) { state.optionsformdisabled = !!action.payload }
    }
});
export const AppActions = appSlice.actions
export default appSlice.reducer;