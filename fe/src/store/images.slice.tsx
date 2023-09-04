'use client';
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { Txt2ImgResult } from "@common/models/myapi.models";
import { MyApi } from "@/services/myapi.service";
import { localstorageLoad, localstorageSave } from './store';

export interface FilterStore {
    modelNameFilter: string
    newestFirst: boolean
    promptFilter?: string
    samplerOptions: string[]
}
const default_filter: FilterStore = {
    modelNameFilter: 'all',
    newestFirst: false,
    samplerOptions: []
}

interface ImageDataStore {
    status: string,
    list: Txt2ImgResult[]
    filteredList: Txt2ImgResult[]
    selectedImage?: Txt2ImgResult
    compareWithImage?: Txt2ImgResult
    tagsToHide: number[]
}

interface ImageStore extends ImageDataStore, FilterStore { }

// Actual Slice
export const default_images: ImageStore = {
    ...default_filter,
    status: 'idle',
    list: [],
    filteredList: [],
    selectedImage: undefined,
    tagsToHide: []
}
export const imagesSlice = createSlice({
    name: 'images',
    initialState: default_images,
    reducers: {
        setImages(state, action) {
            const images = action.payload as Txt2ImgResult[];
            state.list = images
            if (state.selectedImage) {
                state.selectedImage = images.find(i => i.name === state.selectedImage!.name)
            }
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
            state.modelNameFilter = action.payload
            state.filteredList = createFilteredList(state)
        },
        setNewestFirst(state, action) {
            state.newestFirst = action.payload
            state.filteredList = createFilteredList(state)
        },
        setPromptFilter(state, action) {
            state.promptFilter = action.payload
            state.filteredList = createFilteredList(state)
        },
        setTagsToHide(state, action) {
            state.tagsToHide = action.payload
            state.filteredList = createFilteredList(state)
        },
        setSamplerOptions(state, action) {
            state.samplerOptions = action.payload
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
    thunkApi.dispatch(ImageActions.setImages(images))
})

export const ImageActions = imagesSlice.actions

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
    const hasFilter = !!state.modelNameFilter && state.modelNameFilter !== "all"
    const hasPromptFilter = !!state.promptFilter
    const filtered = state.list
        .filter(i => hasPromptFilter ? (i.options.prompt.toLowerCase().includes((state.promptFilter ?? '').toLowerCase())) : true)
        .filter(i => hasFilter ? (i.options.model == state.modelNameFilter) : true)
        //.filter(i => !state.tagsToHide.includes(i.tag))
    return state.newestFirst ? filtered.reverse() : filtered
}

export function saveFilters(state: ImageStore): void {
    const obj: FilterStore = {
        modelNameFilter: state.modelNameFilter,
        newestFirst: state.newestFirst,
        samplerOptions: state.samplerOptions,
    }
    localstorageSave('filters', obj)
}

export function loadFilters(): FilterStore {
    return localstorageLoad<FilterStore>('filters', default_filter)
}