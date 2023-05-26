'use client';
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { Txt2ImgResult } from "@common/models/myapi.models";
import { MyApi } from "@/services/myapi.service";
import { localstorageLoad, localstorageSave } from './store';

export interface FilterStore {
    modelFilter: string
    newestFirst: boolean
    promptFilter?: string
}
const default_filter: FilterStore = {
    modelFilter: 'all',
    newestFirst: false
}

interface ImageDataStore {
    status: string,
    list: Txt2ImgResult[]
    filteredList: Txt2ImgResult[]
    selectedImage?: Txt2ImgResult
    compareWithImage?: Txt2ImgResult
}

interface ImageStore extends ImageDataStore, FilterStore { }

// Actual Slice
export const default_images: ImageStore = {
    ...default_filter,
    status: 'idle',
    list: [],
    filteredList: [],
    selectedImage: undefined,
}
export const imagesSlice = createSlice({
    name: 'images',
    initialState: default_images,
    reducers: {
        setImages(state, action) {
            const images = action.payload;
            state.list = images
            state.filteredList = createFilteredList(state)
        },
        setSelectedImage(state, action) {
            state.selectedImage = action.payload
        },
        setCompareWithImage(state, action) {
            state.compareWithImage = action.payload
        },
        swapImages(state) {
            const comp = state.compareWithImage
            state.compareWithImage = state.selectedImage
            state.selectedImage = comp
        },
        selectPrevious(state, action) {
            const loop = action.payload || action.payload === undefined
            const img = state.selectedImage
            const list = state.filteredList
            if (!img) return
            let index = list.findIndex(i => i.name === img.name) - 1
            if (!loop && index < 0) return
            if (index < 0) index = list.length - 1
            state.selectedImage = list[index]
        },
        selectNext(state, action) {
            const loop = action.payload || action.payload === undefined
            const img = state.selectedImage;
            const list = state.filteredList;
            if (!img) return
            let index = list.findIndex(i => i.name === img.name) + 1
            if (!loop && index >= list.length) return
            if (index >= list.length) index = 0
            state.selectedImage = list[index]
        },
        deleteImage(state, action) {
            const image = action.payload;
            state.list = state.list.filter(i => i.name !== image.name)
            state.filteredList = state.filteredList.filter(i => i.name !== image.name)
            if (state.selectedImage?.name === image.name) state.selectedImage = undefined
        },

        setModelFilter(state, action) {
            state.modelFilter = action.payload
            state.filteredList = createFilteredList(state)
        },
        setNewestFirst(state, action) {
            state.newestFirst = action.payload
            state.filteredList = createFilteredList(state)
        },
        setPromptFilter(state, action) {
            state.promptFilter = action.payload
            state.filteredList = createFilteredList(state)
        }
    },
    // extraReducers(builder) {
    //     builder
    //         .addCase(refreshImages.pending, (state, action) => {
    //             state.status = 'refreshing'
    //         })
    //         .addCase(refreshImages.fulfilled, (state, action) => {
    //             state.status = 'done'
    //         })
    //         .addCase(refreshImages.rejected, (state, action) => {
    //             state.status = 'error'
    //         })
    // },
});

export const refreshImages = createAsyncThunk('images/refreshImages', async (args, thunkApi) => {
    const images = await MyApi.list()
    thunkApi.dispatch(setImages(images))
})

export const {
    setImages,
    deleteImage,
    setSelectedImage,
    setCompareWithImage,
    swapImages,
    selectPrevious,
    selectNext,
    setModelFilter,
    setNewestFirst,
    setPromptFilter,
} = imagesSlice.actions

export default imagesSlice.reducer;

function imageCompare(i1: Txt2ImgResult, i2: Txt2ImgResult, invert = false): number {
    const parts1 = i1.timestamp.split('_')
    const parts2 = i2.timestamp.split('_')

    const firstCompare = invert ?
        parts2[0].localeCompare(parts1[0]) :
        parts1[0].localeCompare(parts2[0])
    if (firstCompare === 0 && parts1.length === 2 && parts2.length === 2) {
        return parts1[1].localeCompare(parts2[1])
    }
    return firstCompare
}

function createFilteredList(state: ImageStore): Txt2ImgResult[] {
    const hasFilter = !!state.modelFilter && state.modelFilter !== "all"
    const hasPromptFilter = !!state.promptFilter
    return state.list
        .filter(i => hasPromptFilter ? (i.options.prompt.toLowerCase().includes((state.promptFilter ?? '').toLowerCase())) : true)
        .filter(i => hasFilter ? (i.options.model == state.modelFilter) : true)
        .sort((i1, i2) => imageCompare(i1, i2, state.newestFirst))
}

export function saveFilters(state: ImageStore): void {
    const obj: FilterStore = {
        modelFilter: state.modelFilter,
        newestFirst: state.newestFirst
    }
    localstorageSave('filters', obj)
}

export function loadFilters(): FilterStore {
    return localstorageLoad<FilterStore>('filters', default_filter)
}