'use client';
import { useEffect, useState, useRef, useCallback, FormEvent } from 'react'
import classNames from 'classnames'

import { Logger } from '@common/logger'
import { MyApi } from '../services/myapi.service'
import { Txt2ImgResult } from '@common/models/myapi.models'
import Spotlight from './spotlight'
import { useAppDispatch, useAppSelector } from '../store/store'
import { deleteImage, setSelectedImage, setModelFilter, setNewestFirst, selectNext, setPromptFilter, refreshImages } from '../store/images.slice'
import { SdApi } from '@/services/sdapi.service';
import { Model } from '@/common/models/sdapi.models';
import { ClickTwice } from './clicktwice';
import { setLastSent  } from '@/store/options.slice';

export default function Gallery() {
    Logger.debug('Rendering Gallery')

    const dispatch = useAppDispatch()
    const allimages = useAppSelector((state) => state.images.list)
    const images = useAppSelector((state) => state.images.filteredList)
    const selectedImage = useAppSelector((state) => state.images.selectedImage)
    const modelFilter = useAppSelector((state) => state.images.modelFilter)
    const newestFirst = useAppSelector((state) => state.images.newestFirst)
    const promptFilter = useAppSelector((state) => state.images.promptFilter)
    const compareImage = useAppSelector((state) => state.images.compareWithImage)
    const last_sent = useAppSelector((state) => state.options.last_sent)
    const [isSlideshow, setIsSlideshow] = useState<boolean>(false)
    const timerHandle = useRef<NodeJS.Timer>()
    const [models, setModels] = useState<Model[]>([])

    // Get list of models from images
    useEffect(() => {
        (async () => {
            const allModels = await SdApi.getModels()
            if (!allModels) return
            const modelsWithImages = allModels
                .map(m => {
                    const count = allimages.filter(i => i.options.model === m.model_name).length
                    m.title = m.title + ' (' + count + ')'
                    return m
                })
                .sort((a, b) => a.title.localeCompare(b.title))

            setModels(modelsWithImages)
        })()
    }, [allimages])

    // Set last_sent to first visible image is there is no last sent (usually the case on a F5)
    useEffect(() => {
        if(last_sent === undefined && images.length) {
            dispatch(setLastSent(images[0].options))
        }
    }, [images])

    // Slideshow feature
    useEffect(() => {
        if (isSlideshow) {
            clearInterval(timerHandle.current)
            timerHandle.current = setInterval(() => {
                console.log('Slideshow tick')
                dispatch(selectNext(true))
            }, 4000)
            return () => clearInterval(timerHandle.current);
        }
        else {
            clearInterval(timerHandle.current)
        }
    }, [dispatch, isSlideshow])
    // Slideshow stop on unselect image
    useEffect(() => {
        if (!selectedImage) setIsSlideshow(false)
    }, [selectedImage])

    // Get images on load
    useEffect(() => {
        console.log('Rendering Gallery: getting images')
        dispatch(refreshImages())
    }, [dispatch])

    const onImageClicked = useCallback((image: Txt2ImgResult) => {
        Logger.debug('Gallery: Clicked on image', image.name)
        dispatch(setSelectedImage(image))
    }, [dispatch])

    const deleteImageAction = useCallback((image: Txt2ImgResult) => {
        if (image.tag > 0) {
            alert('Can\'t delete highlight image')
            return
        }
        MyApi.deleteImage(image)
        dispatch(deleteImage(image))
    }, [dispatch])

    const slideshow = useCallback(() => {
        Logger.debug('Gallery: Starting slideshow')
        dispatch(setSelectedImage(images[0]))
        setIsSlideshow(true)
    }, [dispatch, images])

    const tagImage = useCallback((image: Txt2ImgResult) => {
        (async () => {
            if (!image) return
            let type = -1
            switch (image.tag) {
                case undefined:
                case 0: type = 1; break
                case 1: type = 2; break
                default: case 2: type = 0; break
            }
            const result = await MyApi.tagImage(image, type)
            if (result === true) {
                dispatch(refreshImages())
            }
        })()
    }, [dispatch])

    const galleryItems = (images).map((i, idx) => {
        const classes = classNames({
            'gallery-item': true,
            'compare': compareImage && (compareImage.name === i.name),
            'highlight1': i.tag === 1,
            'highlight2': i.tag === 2
        })

        const isUpscaled = i.options.upscaler && i.options.upscaler !== 'None'
        const upscaledTagClass = classNames({
            'tag': true,
            'nonscaled': !isUpscaled,
            'upscaled': isUpscaled,
        })

        return (
            <div key={i.name} className={classes}>
                <ClickTwice style={'tag type t-' + i.tag } onClickTwice={() => tagImage(i)} >
                    <div title={`Change highlight.\nPress twice.`}></div>
                </ClickTwice>
                <div className={upscaledTagClass}>{ isUpscaled ? 'US' : 'NS' }</div>
                <img loading="lazy" alt={i.name} src={'/myapi/img/' + i.name} onClick={() => onImageClicked(i)} />
                <ClickTwice style='tag delete' onClickTwice={() => deleteImageAction(i)} >
                    <div title={`Delete image.\nPress twice.`}></div>
                </ClickTwice>
            </div >
        )
    })

    return (
        <div className="gallery-container">
            <div className="gallery-filters">
                <div>
                    <label htmlFor="model_select">Filter by model:</label>
                    <select id="model_select" value={modelFilter} onChange={e => dispatch(setModelFilter(e.currentTarget.value))}>
                        <option key="All" value="all">All</option>
                        {models.map(m => <option key={m.filename} value={m.model_name}>{m.title.replace('.safetensors', '')}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="newest_first">Newest first:</label>
                    <input type="checkbox" id="newest_first" checked={newestFirst} onChange={e => dispatch(setNewestFirst(!!e.currentTarget.checked))}></input>
                </div>
                <div>
                    <label htmlFor="prompt_filter">Filter by prompt:</label>
                    <input type="text" id="prompt_filter" value={promptFilter} onChange={e => dispatch(setPromptFilter(e.currentTarget.value))}></input>
                </div>
                {/* <div>
                    <label htmlFor="groupby_batch">Group by batch:</label>
                    <input type="checkbox" id="groupby_batch" checked={groupByBatch} onChange={groupByBatchChanged}></input>
                </div> */}
                <div className="button btn-slideshow" onClick={slideshow} title="Slideshow. Click on image to stop.">▶</div>
            </div>
            <div className="gallery-items">
                {...galleryItems}
            </div>
            <Spotlight />
        </div>
    )
}