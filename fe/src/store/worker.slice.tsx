'use client';
import { createSlice } from "@reduxjs/toolkit";
import moment from 'moment'

import { Progress } from "./../common/models/sdapi.models";

interface WorkerStore {
    working: boolean
    progress?: Progress
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
        addMessage(state, action) {
            if(state.messages.length >= 15) {
                state.messages.shift()
            }
            state.messages.push(`${moment().format('H:mm:ss')} - ${action.payload}`)
        }
    }
});

export const {
    setWorking,
    addMessage
} = workerSlice.actions

export default workerSlice.reducer;