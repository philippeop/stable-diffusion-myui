'use client';
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { Txt2ImgResult } from "@common/models/myapi.models";
import { MyApi } from "@/services/myapi.service";

interface FilterStore {
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
const defaultState: ImageStore = {
    status: 'idle',
    list: [],
    filteredList: [],
    selectedImage: undefined,
    ...loadFilters()
}
export const imagesSlice = createSlice({
    name: 'images',
    initialState: defaultState,
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
        selectPrevious(state) {
            const img = state.selectedImage
            const list = state.filteredList
            if (!img) return
            let index = list.findIndex(i => i.name === img.name) - 1
            if (index < 0) index = list.length - 1
            state.selectedImage = list[index]
        },
        selectNext(state) {
            const img = state.selectedImage;
            const list = state.filteredList;
            if (!img) return
            let index = list.findIndex(i => i.name === img.name) + 1
            if (index >= list.length) index = 0
            state.selectedImage = list[index]
        },
        deleteImage(state, action) {
            const image = action.payload;
            state.list = state.list.filter(i => i.name !== image.name)
            state.filteredList = state.filteredList.filter(i => i.name !== image.name)
            if(state.selectedImage?.name === image.name) state.selectedImage = undefined
        },

        setModelFilter(state, action) {
            state.modelFilter = action.payload
            state.filteredList = createFilteredList(state)
            saveFilters(state)
        },
        setNewestFirst(state, action) {
            state.newestFirst = action.payload
            state.filteredList = createFilteredList(state)
            saveFilters(state)
        },
        setPromptFilter(state, action) {
            state.promptFilter = action.payload
            state.filteredList = createFilteredList(state)
            saveFilters(state)
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

function saveFilters(state: ImageStore): void {
    if (typeof window === 'undefined') return
    const obj: FilterStore = {
        modelFilter: state.modelFilter,
        newestFirst: state.newestFirst
    }
    const json = JSON.stringify(obj);
    localStorage.setItem('filters', json);
}

function loadFilters(): FilterStore {
    if (typeof window === 'undefined') return default_filter
    try {
        const json = localStorage.getItem('filters');
        return (json ? (JSON.parse(json)) : default_filter) as FilterStore
    } catch (err) {
        console.error(err)
        return default_filter
    }
}