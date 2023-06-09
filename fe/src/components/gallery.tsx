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

export default function Gallery() {
    Logger.debug('Rendering Gallery')

    const dispatch = useAppDispatch()
    const allimages = useAppSelector((state) => state.images.list)
    const images = useAppSelector((state) => state.images.filteredList)
    const selectedImage = useAppSelector((state) => state.images.selectedImage)
    const modelFilter = useAppSelector((state) => state.images.modelFilter)
    const newestFirst = useAppSelector((state) => state.images.newestFirst)
    // const [ groupByBatch, setGroupByBatch ] = useState<boolean>(false)
    const promptFilter = useAppSelector((state) => state.images.promptFilter)
    const compareImage = useAppSelector((state) => state.images.compareWithImage)
    const [isSlideshow, setIsSlideshow] = useState<boolean>(false)
    const timerHandle = useRef<NodeJS.Timer>()
    const [models, setModels] = useState<Model[]>([])

    useEffect(() => {
        (async () => {
            const allModels = await SdApi.getModels()
            if (!allModels) return
            const modelsWithImages = allModels
                .filter(m => {
                    const count = allimages.filter(i => i.options.model === m.model_name).length
                m.title = m.title + ' (' + count + ')'
                return count !== 0
            })
            .sort((a, b) => a.title.localeCompare(b.title))
            
            setModels(modelsWithImages)
        })()
    }, [allimages])

    useEffect(() => {
        if (isSlideshow) {
            clearInterval(timerHandle.current)
            timerHandle.current = setInterval(() => {
                console.log('Slideshow tick')
                dispatch(selectNext())
            }, 4000)
            return () => clearInterval(timerHandle.current);
        }
        else {
            clearInterval(timerHandle.current)
        }
    }, [dispatch, isSlideshow])

    useEffect(() => {
        if (!selectedImage) setIsSlideshow(false)
    }, [selectedImage])

    useEffect(() => {
        console.log('Rendering Gallery: getting images')
        dispatch(refreshImages())
    }, [dispatch])

    const onImageClicked = useCallback((image: Txt2ImgResult) => {
        Logger.debug('Gallery: Clicked on image', image.name)
        dispatch(setSelectedImage(image))
    }, [dispatch])

    const deleteImageAction = useCallback((image: Txt2ImgResult) => {
        MyApi.deleteImage(image)
        dispatch(deleteImage(image))
    }, [dispatch])

    const modelFilterChanged = useCallback((event: FormEvent<HTMLSelectElement>) => {
        dispatch(setModelFilter(event.currentTarget.value))
    }, [dispatch])

    const newestFirstChanged = useCallback((event: FormEvent<HTMLInputElement>) => {
        dispatch(setNewestFirst(!!event.currentTarget.checked))
    }, [dispatch])

    const promptFilterChanged = useCallback((event: FormEvent<HTMLInputElement>) => {
        dispatch(setPromptFilter(event.currentTarget.value))
    }, [dispatch])

    // const groupByBatchChanged = useCallback((event: FormEvent<HTMLInputElement>) => {
    //     // dispatch(setPromptFilter(event.currentTarget.value))
    //     setGroupByBatch(!!event.currentTarget.checked)
    // }, [setGroupByBatch])

    const slideshow = useCallback(() => {
        Logger.debug('Gallery: Starting slideshow')
        dispatch(setSelectedImage(images[0]))
        setIsSlideshow(true)
    }, [dispatch, images])

    const galleryItems = (images).map((i, idx) => {
        const classes = classNames({
            'gallery-item': true,
            'compare': compareImage && (compareImage.name === i.name)
        })
        
        const parts = i.timestamp.split('_')
        const timestamp = parts[0]
        const batchNumber = +(parts[1])
        return (
            <div key={i.name} className={classes}>
                {/* {groupByBatch && (<div className="batch-tag">{batchNumber}</div>)} */}
                <img loading="lazy" alt={i.name} src={'/myapi/img/' + i.name} onClick={() => onImageClicked(i)} />
                <ClickTwice styleIdle='btn-del' styleHot='btn-del hot' onClickTwice={() => deleteImageAction(i)} >
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
                    <select id="model_select" value={modelFilter} onChange={modelFilterChanged}>
                        <option key="All" value="all">All</option>
                        {models.map(m => <option key={m.filename} value={m.model_name}>{m.title.replace('.safetensors', '')}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="newest_first">Newest first:</label>
                    <input type="checkbox" id="newest_first" checked={newestFirst} onChange={newestFirstChanged}></input>
                </div>
                <div>
                    <label htmlFor="prompt_filter">Filter by prompt:</label>
                    <input type="text" id="prompt_filter" value={promptFilter} onChange={promptFilterChanged}></input>
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