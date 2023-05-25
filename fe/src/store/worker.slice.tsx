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
        setWorking(state, action) {
            state.working = !!action.payload
        },
        setProgress(state, action) {
            const backendStatus = { ...action.payload}
            delete backendStatus.image
            state.progress = backendStatus
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
    setWorking,
    setProgress,
    addMessage,
    clearMessages
} = workerSlice.actions

export default workerSlice.reducer;