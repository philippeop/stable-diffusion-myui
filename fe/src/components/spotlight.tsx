'use client';
import { useCallback, useEffect } from 'react'
import moment from 'moment';

import { Txt2ImgResult } from '@common/models/myapi.models'
import { Logger } from '@common/logger';
import { useAppDispatch, useAppSelector } from '../store/store'
import { deleteImage, selectNext, selectPrevious, setCompareWithImage, setSelectedImage, swapImages } from '../store/images.slice'
import { setSeed } from '../store/options.slice'
import Pill from './pill'
import Button from './button';
import { MyApi } from '@/services/myapi.service';
import { ClickTwiceButton } from './clicktwice';

export default function Spotlight() {
    Logger.debug('Rendering Spotlight')
    const dispatch = useAppDispatch()
    const currentOptions = useAppSelector(s => s.options)
    const image = useAppSelector(s => s.images.selectedImage)
    const otherImage = useAppSelector(s => s.images.compareWithImage)
    const prompt = useAppSelector(s => s.options.prompt)
    const negative = useAppSelector(s => s.options.negative)
    const seedOnUi = useAppSelector(s => s.options.seed)

    useEffect(() => {
        Logger.debug('Spotlight selectedImage changed to', image?.name)
        if (image) {
            const optionKeys = Object.keys(image.options)
            const extra = optionKeys.filter(k => !optionsMapper.find(om => om.key === k))
            if (extra.length) Logger.debug('Rendering Spotlight: The following keys are not displayed in the info panel:', extra.join(', '))
        }
    }, [image])

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

    const loadPrompt = useCallback((promptStr: string) => {
        navigator.clipboard.writeText(promptStr)
    }, [dispatch])

    const loadNegative = useCallback((promptStr: string) => {
        navigator.clipboard.writeText(promptStr)
    }, [dispatch])

    const loadSeed = useCallback((seed: number) => {
        if (confirm('This will override you current seed. Are you sure?')) {
            dispatch(setSeed(seed))
        }
    }, [dispatch])

    const onDeleteBtnClick = useCallback(() => {
        if(!image) return
        MyApi.deleteImage(image)
        dispatch(deleteImage(image))
    }, [dispatch, image] )

    if (!image) return (<></>)

    const optionsMapper: OptionMap[] = [
        field('name', 'Name', i => i.name),
        compareField('model', 'Model'),
        field('size', 'Size', imageSizeString),
        compareField('sampler', 'Sampler'),
        compareField('steps', 'Steps'),
        compareField('upscaler', 'Upscaler'),
        compareField('upscaler_scale', '> Upscaler scale'),
        compareField('upscaler_steps', '> Upscaler steps'),
        compareField('upscaler_denoise', '> Upscaler denoise'),
        compareField('cfg_scale', 'CFG Scale'),
        compareField('clip_skip', 'CLIP skip'),
        compareField('restore_faces', 'Restore face'),
        field('generated', 'Generated', i => moment(i.timestamp, 'YYYYMMDDHHmmss').format('YYYY-MM-DD H:mm:ss'))
    ]

    const fields = []
    for (const f of optionsMapper.filter(om => !om.skip)) {
        const value = f.getter ? f.getter(image) : image.options[f.key]
        const same = currentOptions[f.key] === value
        const className = f.compare ? (same ? 'same' : 'diff') : ''
        fields.push(
            <div key={f.key} onClick={() => f.onClick && f.onClick(image) } className='info-line'>
                <span className='key'>{f.label}:</span><span className={className}>{value?.toString()}</span>
            </div>
        )
    }

    const sameSeed = image.seed.toString() === seedOnUi.toString()

    return (
        <div className='spotlight-overlay'>
            <div className='info'>
                <div className="prompt-container" onClick={() => loadPrompt(image.options.prompt)}>
                    {parsePrompt(image.options.prompt).map((s, i) => <Pill key={i}>{s}</Pill>)}
                    {/* <div>{image.options.prompt}</div> */}
                    { image.options.prompt === prompt && <div className="positive">(Same)</div> }
                </div>
                <div className="negative-container" onClick={() => loadNegative(image.options.negative)}>
                    {parsePrompt(image.options.negative).map((s, i) => <Pill key={i} negative={true}>{s}</Pill>)}
                    {/* <div>{image.options.negative}</div> */}
                    { image.options.negative === negative && <div className="positive">(Same)</div> }
                </div>
                {...fields}
                <div onClick={() => loadSeed(image.seed) } className='info-line'>
                    <span className='key'>Seed:</span>{image.seed}
                    { sameSeed && <span className="positive"> (Same)</span> }
                </div>
                <div className="compare-controls row">
                    <ClickTwiceButton styleIdle='positive' styleHot='negative' onClickTwice={() => onDeleteBtnClick()}>
                        Delete
                    </ClickTwiceButton>
                    <Button onClick={() => dispatch(setCompareWithImage(image))}>Stash image as compare image</Button>
                    {otherImage && <Button onClick={() => dispatch(swapImages())}>Swap</Button>}
                </div>
            </div>
            <div className="previous" onClick={() => dispatch(selectPrevious())}>
                <svg viewBox="0 0 500 500" className="triangle">
                    <polygon points="0,250 500,0 500,500" />
                    Sorry, your browser does not support inline SVG.
                </svg>
            </div>
            <img alt={image.name} src={'/myapi/img/' + image.name} onClick={() => dispatch(setSelectedImage(undefined))} />
            <div className="next" onClick={() => dispatch(selectNext())}>
                <svg viewBox="0 0 500 500" className="triangle">
                    <polygon points="0,0 500,250, 0,500" />
                    Sorry, your browser does not support inline SVG.
                </svg>
            </div>
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
        if (inParentesis < 0) { 
            Logger.softError('Check prompt, too many closing parentesis')
            return []
        }
        openParentesis = inParentesis > 0
        currentToken += c
    }
    if (currentToken) tokens.push(currentToken)
    return tokens;
}

function imageSizeString(i: Txt2ImgResult): string {
    let str = i.options.image_width + ' x ' + i.options.image_height;
    if (i.options.upscaler && i.options.upscaler !== 'None') {
        const upscaledWidth = Math.round(i.options.image_width * i.options.upscaler_scale)
        const upscaledHeight = Math.round(i.options.image_height * i.options.upscaler_scale)
        const extra = ` (upscaled to ${upscaledWidth} x ${upscaledHeight})`
        str += extra
    }
    return str
}

function field(key: string, label: string, getter: getterType): OptionMap {
    return ({ key, label, getter, compare: false })
}
function compareField(key: string, label: string): OptionMap {
    return ({ key, label, compare: true })
}

interface OptionMap {
    key: string
    label: string
    skip?: boolean
    compare?: boolean
    getter?: getterType
    onClick?: onClickType
}

type getterType = ((i: Txt2ImgResult) => string | number)
type onClickType = ((i: Txt2ImgResult) => void)