'use client';
import { useCallback, useEffect } from 'react'

import { Txt2ImgResult } from '@common/models/myapi.models'
import { Logger } from '@common/logger';
import { useAppDispatch, useAppSelector } from '../store/store'
import { deleteImage, selectNext, selectPrevious, setCompareWithImage, setSelectedImage, swapImages } from '../store/images.slice'
import { setNegative, setPrompt, setSeed } from '../store/options.slice'
import Pill from './pill'
import moment from 'moment';
import Button from './button';
import { MyApi } from '@/services/myapi.service';

interface OptionMap {
    key: string
    label: string
    skip?: boolean
    getter?: ((i: Txt2ImgResult) => string | number)
    onClick?: ((i: Txt2ImgResult) => void)
}

export default function Spotlight() {
    Logger.debug('Rendering Spotlight')
    const dispatch = useAppDispatch()
    const image = useAppSelector(s => s.images.selectedImage)
    const otherImage = useAppSelector(s => s.images.compareWithImage)
    const prompt = useAppSelector(s => s.options.prompt)
    const negative = useAppSelector(s => s.options.negative)
    const seedOnUi = useAppSelector(s => s.options.seed)

    useEffect(() => {
        Logger.debug('Spotlight selectedImage changed to', image)
        if (image) {
            const optionKeys = Object.keys(image.options)
            const extra = optionKeys.filter(k => !optionsMapper.find(om => om.key === k))
            if (extra.length) Logger.debug('Rendering Spotlight: The following keys are not displayed in the info panel:', extra.join(', '))
        }
    }, [image])

    const onClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
        return
        const target = event.target as HTMLElement;
        if (!target) return
        if (target.tagName === "IMG") {
            dispatch(setSelectedImage(undefined))
            return
        }
        if (['info-line', 'pill'].find((c) => target.classList.contains(c))) return
        const perc = event.clientX / window.innerWidth;
        if (perc < 0.5) return dispatch(selectPrevious())
        if (perc > 0.5) return dispatch(selectNext())
    }, [dispatch])

    const onKeyUp = useCallback((event: KeyboardEvent) => {
        if (!image) return
        if (event.key === 'ArrowRight') {
            Logger.log('Spotlight: onKeyUp captured for image', image)
            event.stopPropagation()
            event.preventDefault()
            dispatch(selectNext())
        }
        if (event.key === 'ArrowLeft') {
            Logger.log('Spotlight: onKeyUp captured for image', image)
            event.stopPropagation()
            event.preventDefault()
            dispatch(selectPrevious())
        }
    }, [dispatch, image])

    const loadPrompt = useCallback((promptStr: string) => {
        if (confirm('This will override you current prompt. Are you sure?')) {
            dispatch(setPrompt(promptStr))
        }
    }, [dispatch])

    const loadNegative = useCallback((promptStr: string) => {
        if (confirm('This will override you current negative prompt. Are you sure?')) {
            dispatch(setNegative(promptStr))
        }
    }, [dispatch])

    const loadSeed = useCallback((seed: number) => {
        if (confirm('This will override you current seed. Are you sure?')) {
            dispatch(setSeed(seed))
        }
    }, [dispatch])

    const onDeleteBtnClick = useCallback(() => {
        if(!image || !confirm('Delete this image?')) return
        MyApi.deleteImage(image)
        dispatch(deleteImage(image))
    }, [dispatch, image] )

    useEffect(() => {
        Logger.debug('Rendering Spotlight: [] effect')
        if (image) {
            document.addEventListener('keyup', onKeyUp)
        }
        else {
            document.removeEventListener('keyup', onKeyUp)
        }
        return () => document.removeEventListener('keyup', onKeyUp)
    }, [image, onKeyUp])

    if (!image) return (<></>)

    const optionsMapper: OptionMap[] = [
        { key: 'name', label: 'Name', getter: i => i.name },
        { key: 'model', label: 'Model' },
        { key: 'prompt', label: 'Prompt', skip: true },
        { key: 'negative', label: 'Negative', skip: true },
        { key: 'size', label: 'Size', getter: imageSizeString },
        { key: 'sampler', label: 'Sampler' },
        { key: 'steps', label: '> Steps' },
        { key: 'upscaler', label: 'Upscaler' },
        { key: 'upscaler_scale', label: '> Upscaler scale' },
        { key: 'upscaler_steps', label: '> Upscaler steps' },
        { key: 'upscaler_denoise', label: '> Upscaler denoise' },
        { key: 'cfg_scale', label: 'CFG Scale' },
        { key: 'clip_skip', label: 'CLIP skip' },
        //{ key: 'timestamp', label: 'Generated', getter: i => i.timestamp },
        { key: 'generated', label: 'Generated', getter: i => moment(i.timestamp, 'YYYYMMDDHHmmss').format('YYYY-MM-DD H:mm:ss') },
        //{ key: 'seed', label: 'Seed', getter: i => i.seed + (i.seed === seed ? ' (Same) ' : ''), onClick: i => loadSeed(i.seed) },
    ]

    const fields = []
    for (const f of optionsMapper.filter(om => !om.skip)) {
        const value = f.getter ? f.getter(image) : image.options[f.key]
        fields.push(
            <div key={f.key} onClick={() => f.onClick && f.onClick(image) } className='info-line'>
                <span className='key'>{f.label}:</span>{value}
            </div>
        )
    }

    const sameSeed = image.seed.toString() === seedOnUi.toString()

    return (
        <div className='spotlight-overlay' onClick={onClick}>
            <div className='info'>
                <div className="prompt-container" onClick={() => loadPrompt(image.options.prompt)}>
                    {parsePrompt(image.options.prompt).map((s) => <Pill key={s}>{s}</Pill>)}
                    {/* <div>{image.options.prompt}</div> */}
                    { image.options.prompt === prompt && <div className="positive">(Same)</div> }
                </div>
                <div className="negative-container" onClick={() => loadNegative(image.options.negative)}>
                    {parsePrompt(image.options.negative).map((s) => <Pill key={s} negative={true}>{s}</Pill>)}
                    {/* <div>{image.options.negative}</div> */}
                    { image.options.negative === negative && <div className="positive">(Same)</div> }
                </div>
                {...fields}
                <div onClick={() => loadSeed(image.seed) } className='info-line'>
                    <span className='key'>Seed:</span>{image.seed}
                    { sameSeed && <span className="positive"> (Same)</span> }
                </div>
                <div className="compare-controls row">
                    <Button onClick={() => onDeleteBtnClick()}>Delete</Button>
                    <Button onClick={() => dispatch(setCompareWithImage(image))}>Stash image as compare image</Button>
                    {otherImage && <Button onClick={() => dispatch(swapImages())}>Swap</Button>}
                </div>
            </div>
            <div className="previous" onClick={() => dispatch(selectPrevious())}></div>
            <img alt={image.name} src={'/myapi/img/' + image.name} onClick={() => dispatch(setSelectedImage(undefined))} />
            <div className="next" onClick={() => dispatch(selectNext())}></div>
        </div>
    )
}

function parsePrompt(prompt: string): string[] {
    const tokens = [];
    let currentToken = '';
    let openParentesis = false
    let inParentesis = 0
    for (const c of prompt) {
        if (c === ',' && !openParentesis && inParentesis === 0) {
            tokens.push(currentToken.trim())
            currentToken = ''
            continue
        }
        if (currentToken === '' && c === ' ') continue
        if (c === '(') inParentesis += 1
        if (c === ')') inParentesis -= 1;
        if (inParentesis < 0) throw new Error('idk, ' + currentToken + c)
        openParentesis = inParentesis > 0
        currentToken += c
    }
    if (currentToken) tokens.push(currentToken)
    Logger.log(prompt, 'equals', tokens)
    return tokens;
}

function imageSizeString(i: Txt2ImgResult): string {
    let str = i.options.image_width + ' x ' + i.options.image_height;
    if (i.options.upscaler && i.options.upscaler !== 'None') {
        const extra = ` (upscaled to ${i.options.image_width * i.options.upscaler_scale} x ${i.options.image_height * i.options.upscaler_scale})`
        str += extra
    }
    return str
}
