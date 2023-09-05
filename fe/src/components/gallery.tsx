'use client';
import { useEffect, useState, useRef, useCallback, Fragment } from 'react'
import classNames from 'classnames'

import { Logger } from '@common/logger'
import { MyApi } from '../services/myapi.service'
import { Txt2ImgResult } from '@common/models/myapi.models'
import { useAppDispatch, useRootSelector } from '../store/store'
import { ImageActions, refreshImages } from '../store/images.slice'
import { ClickTwice } from './clicktwice';
import { AppActions } from '@/store/app.slice';
import Tag from './tag';

interface FilterModel {
    model_name: string
    count: number
}

export default function Gallery() {
    Logger.debug('Rendering Gallery')

    const dispatch = useAppDispatch()
    const models = useRootSelector(s => s.app.models)
    const allimages = useRootSelector((state) => state.images.list)
    const images = useRootSelector((state) => state.images.filteredList)
    const selectedImage = useRootSelector((state) => state.images.selectedImage)
    const modelFilter = useRootSelector((state) => state.images.modelNameFilter)
    const newestFirst = useRootSelector((state) => state.images.newestFirst)
    const promptFilter = useRootSelector((state) => state.images.promptFilter)
    const compareImage = useRootSelector((state) => state.images.compareWithImage)
    const tagsToHide = useRootSelector((state) => state.images.tagsToHide)
    const last_sent = useRootSelector((state) => state.app.last_sent)
    const [isSlideshow, setIsSlideshow] = useState<boolean>(false)
    const timerHandle = useRef<NodeJS.Timer>()
    const [modelsForFilter, setModelsForFilter] = useState<FilterModel[]>([])
    const imagesPerRow = useRootSelector(s => s.images.imagesPerRow)

    // Get list of models from images + known models 
    useEffect(() => {
        (async () => {
            if (!models) return
            const imageModels = allimages.map(i => i.options.model) // model_name
            const loadedModels = models.map(m => m.model_name)
            const allKnownModels = Array.from(new Set(loadedModels.concat(imageModels)))
            const result = allKnownModels
                .map(m => {
                    const count = allimages.filter(i => i.options.model === m).length
                    return { model_name: m, count }
                })
                .sort((a, b) => a.model_name.localeCompare(b.model_name))
            setModelsForFilter(result)
        })()
    }, [models, allimages])

    // Set last_sent to first visible image is there is no last sent (usually the case on a F5)
    useEffect(() => {
        if (last_sent === undefined && images.length) {
            dispatch(AppActions.setLastSent(images[0].options))
        }
    }, [images])

    // Slideshow feature
    useEffect(() => {
        if (isSlideshow) {
            clearInterval(timerHandle.current)
            timerHandle.current = setInterval(() => {
                console.log('Slideshow tick')
                dispatch(ImageActions.selectNext(true))
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
        dispatch(ImageActions.setSelectedImage(image))
    }, [dispatch])

    const deleteImageAction = useCallback((image: Txt2ImgResult) => {
        if (image.tag > 0) {
            alert('Can\'t delete highlight image')
            return
        }
        MyApi.deleteImage(image)
        dispatch(ImageActions.deleteImage(image))
    }, [dispatch])

    const slideshow = useCallback(() => {
        Logger.debug('Gallery: Starting slideshow')
        dispatch(ImageActions.setSelectedImage(images[0]))
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

    const moveImage = useCallback((idx: number, nextIdx: number) => {
        if (idx < 0 || nextIdx < 0 || idx >= images.length || nextIdx >= images.length) return
        const from = images[idx]
        const to = images[nextIdx]
        MyApi.moveImage(from.name, to.name).then(() => dispatch(refreshImages()))
    }, [images])

    const dragStartHandler = (event: React.DragEvent<HTMLDivElement>, source: string) => {
        Logger.debug('Dragging', source)
        event.dataTransfer.setData("source", source);
    };

    const dropHandler = (event: React.DragEvent<HTMLDivElement>, target: string) => {
        event.preventDefault();
        const source = event.dataTransfer.getData("source");
        Logger.debug('Dropped', source, 'onto', target)
        MyApi.moveImage(source, target).then(() => dispatch(refreshImages()))
    };

    const toggleTag = useCallback((tag: number) => {
        if (tagsToHide.includes(tag)) dispatch(ImageActions.setTagsToHide(tagsToHide.filter(t => t !== tag)))
        else dispatch(ImageActions.setTagsToHide([tag, ...tagsToHide]))
    }, [dispatch, tagsToHide])

    const galleryItemWidth = `${100 / imagesPerRow}%`
    const galleryItems = (images).map((i, idx) => {
        const url = '/myapi/img/' + i.name
        const classes = classNames({
            'gallery-item': true,
            'compare': compareImage && (compareImage.name === i.name),
            'hidden-tag': tagsToHide.includes(i.tag),
        })

        const isUpscaled = i.options.upscaler && i.options.upscaler !== 'None'
        const upscaledTagClass = classNames({
            'tag': true,
            'nonscaled': !isUpscaled,
            'upscaled': isUpscaled,
        })
        const title = `Model: ${i.options.model}, upscaler: ${i.options.upscaler}`

        return (
            <div key={i.name} className={classes} style={{width: galleryItemWidth}} title={title} draggable={true} onDragStart={(e) => dragStartHandler(e, i.name)} onDragOver={e => e.preventDefault()} onDrop={(e) => dropHandler(e, i.name)}>

                <Tag type={'t-' + i.tag} title={`Change highlight.\nPress twice.`}>
                    <ClickTwice onClickTwice={() => tagImage(i)} ></ClickTwice>
                </Tag>
                <div className={upscaledTagClass}>{isUpscaled ? 'US' : 'NS'}</div>
                <img loading="lazy" alt={i.name} src={url} onClick={() => onImageClicked(i)} />

                {i.tag == 0 && 
                <Tag type={'delete'} title={`Delete image.\nPress twice.`}>
                    <ClickTwice onClickTwice={() => deleteImageAction(i)} ></ClickTwice>
                </Tag>
                }
                <Tag type={'move left'} title={`Move image left.\nPress twice.`}>
                    <ClickTwice onClickTwice={() => moveImage(idx, idx - 1)} >{"<"}</ClickTwice>
                </Tag>
                <Tag type={'move right'} title={`Move image right.\nPress twice.`}>
                    <ClickTwice onClickTwice={() => moveImage(idx, idx + 1)} >{">"}</ClickTwice>
                </Tag>
            </div >
        )
    })

    return (
        <Fragment>
            <div className="gallery-filters">
                <div>
                    <label htmlFor="model_select">Filter by model:</label>
                    <select id="model_select" value={modelFilter} onChange={e => dispatch(ImageActions.setModelFilter(e.currentTarget.value))}>
                        <option key="All" value="all">All</option>
                        {modelsForFilter.map((m) => <option key={m.model_name} value={m.model_name}>{m.model_name} ({m.count})</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="newest_first">Newest first:</label>
                    <input type="checkbox" id="newest_first" checked={newestFirst} onChange={e => dispatch(ImageActions.setNewestFirst(!!e.currentTarget.checked))}></input>
                </div>
                <div>
                    <label htmlFor="prompt_filter">Filter by prompt:</label>
                    <input type="text" id="prompt_filter" value={promptFilter} onChange={e => dispatch(ImageActions.setPromptFilter(e.currentTarget.value))}></input>
                </div>
                <div>
                    <label>Filter by tag:</label>
                    <div id="tagfilters">
                        {[0, 1, 2].map(n =>
                            <Tag key={n} type={'t-' + n} dimmed={tagsToHide.includes(n)} onClick={() => toggleTag(n)}></Tag>
                        )}
                    </div>
                </div>
                <input type="number" name="imagesPerRow" value={imagesPerRow} onChange={e => dispatch(ImageActions.setImagesPerRow(+e.currentTarget.value))}></input>
                <div className="button btn-slideshow" onClick={slideshow} title="Slideshow. Click on image to stop.">▶</div>
            </div>
            <div className="gallery-container">
                <div className="gallery-items">
                    {...galleryItems}
                </div>
            </div>
        </Fragment>
    )
}