'use client';
import { createSlice } from "@reduxjs/toolkit";
import moment from 'moment'

import { BackendStatus } from '@/common/models/myapi.models';

interface WorkerStore {
    working: boolean
    progress?: BackendStatus
    messages: string[]
}
const default_worker: WorkerStore = {
    working: false,
    messages: []
}

export const workerSlice = createSlice({
    name: 'worker',
    initialState: default_worker,
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
        }
    }
});

export const {
    setProgress,
    addMessage,
    clearMessages
} = workerSlice.actions

export default workerSlice.reducer;