'use client';
import { useCallback, useEffect } from 'react'
import moment from 'moment';

import { Txt2ImgResult } from '@common/models/myapi.models'
import { Logger } from '@common/logger';
import { MyApi } from '@/services/myapi.service';
import { useAppDispatch, useAppSelector } from '../store/store'
import { deleteImage, selectNext, selectPrevious, setCompareWithImage, setSelectedImage, swapImages } from '../store/images.slice'
import { OptionStore, setSeed } from '../store/options.slice'
import Pill from './pill'
import Button from './button';
import { ClickTwiceButton } from './clicktwice';

export default function Spotlight() {
    Logger.debug('Rendering Spotlight')
    const dispatch = useAppDispatch()
    const currentOptions = useAppSelector(s => s.options)
    const image = useAppSelector(s => s.images.selectedImage)
    const otherImage = useAppSelector(s => s.images.compareWithImage)
    const prompt = useAppSelector(s => s.options.prompt)
    const negative = useAppSelector(s => s.options.negative)

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
            dispatch(selectNext(true))
        }
        if (event.key === 'ArrowLeft') {
            Logger.log('Spotlight: onKeyUp captured for image', image)
            event.stopPropagation()
            event.preventDefault()
            dispatch(selectPrevious(true))
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
        if (!image) return
        if (image.tag > 0) {
            alert('Can\'t delete highlit image')
            return
        }
        MyApi.deleteImage(image)
        dispatch(selectPrevious(false))
        dispatch(deleteImage(image))
    }, [dispatch, image])

    if (!image) return (<></>)

    const optionsMapper: OptionMap[] = [
        field('name', 'Name', i => i.name),
        compareField('model', 'Model'),
        compareField2('size', 'Size', imageSizeString, (i, o) => o.image_height == i.options.image_height && o.image_width == i.options.image_width),
        compareField('sampler', 'Sampler'),
        compareField('steps', 'Steps'),
        compareField('upscaler', 'Upscaler'),
        compareField('upscaler_scale', '> Upscaler scale'),
        compareField('upscaler_steps', '> Upscaler steps'),
        compareField('upscaler_denoise', '> Upscaler denoise'),
        compareField('cfg_scale', 'CFG Scale'),
        compareField('clip_skip', 'CLIP skip'),
        compareField('restore_faces', 'Restore face'),
        field('generated', 'Generated', i => moment(i.timestamp, 'YYYYMMDDHHmmss').format('YYYY-MM-DD H:mm:ss')),
        compareField('seed', 'Seed', i => i.seed, i => loadSeed(i.seed)),
        compareField('ensd', 'ENSD'),
    ]

    const fields = []
    for (const f of optionsMapper.filter(om => !om.skip)) {
        const value = f.getter ? f.getter(image) : image.options[f.key]
        const same = f.sameFn ? f.sameFn(image, currentOptions) : currentOptions[f.key] === value
        const className = f.compare ? (same ? 'same' : 'diff') : ''
        fields.push(
            <div key={f.key} onClick={() => f.onClick && f.onClick(image)} className='info-line'>
                <span className='key'>{f.label}:</span><span className={className}>{value?.toString()}</span>
            </div>
        )
    }

    const tokenDefToPill = (pd: TokenDef, isNegative: boolean) => {
        // assuming 0.5 is min, weight is 0.5-1.5
        const size = 100 * pd.weight + '%'
        const weight = 400 * pd.weight
        return (<Pill key={pd.token} style={{ fontSize: size, fontWeight: weight }} negative={isNegative} >{pd.token}</Pill>)
    }

    const promptPills = parsePrompt(image.options.prompt).map(pd => tokenDefToPill(pd, false)) // image.options.prompt
    const negativePills = parsePrompt(image.options.negative).map(pd => tokenDefToPill(pd, true)) // image.options.negative

    const sameSeed = image.seed.toString() === currentOptions.seed.toString()
    const sameEnsd = image.options.ensd === currentOptions.ensd

    return (
        <div className='spotlight-overlay'>
            <div className='info'>
                <div className="prompt-container" onClick={() => loadPrompt(image.options.prompt)}>
                    {promptPills}
                    {image.options.prompt === prompt && <div className="positive">(Same)</div>}
                </div>
                <div className="negative-container" onClick={() => loadNegative(image.options.negative)}>
                    {negativePills}
                    {image.options.negative === negative && <div className="positive">(Same)</div>}
                </div>
                {...fields}
                <div className="compare-controls row">
                    <ClickTwiceButton styleIdle='positive' styleHot='negative' onClickTwice={() => onDeleteBtnClick()}>
                        Delete
                    </ClickTwiceButton>
                    <Button onClick={() => dispatch(setCompareWithImage(image))}>Stash image as compare image</Button>
                    {otherImage && <Button onClick={() => dispatch(swapImages())}>Swap</Button>}
                </div>
            </div>
            <div className="previous" onClick={() => dispatch(selectPrevious(true))}>
                <svg viewBox="0 0 500 500" className="triangle">
                    <polygon points="0,250 500,0 500,500" />
                    Sorry, your browser does not support inline SVG.
                </svg>
            </div>
            <img alt={image.name} src={'/myapi/img/' + image.name} onClick={() => dispatch(setSelectedImage(undefined))} />
            <div className="next" onClick={() => dispatch(selectNext(true))}>
                <svg viewBox="0 0 500 500" className="triangle">
                    <polygon points="0,0 500,250, 0,500" />
                    Sorry, your browser does not support inline SVG.
                </svg>
            </div>
        </div>
    )
}

interface TokenDef {
    token: string
    weight: number
}
function parsePrompt(prompt: string): TokenDef[] {
    // Contributed by ChatGPT
    const regex = /\((.*?)\)/g;
    const parenTokens = prompt.match(regex) || [];
    const sanitizedPrompt = prompt.replace(regex, '');

    const processedTokens = parenTokens.map((token) => {
        const weightMatch = token.match(/:(\d+(\.\d+)?)/);
        const weight = weightMatch ? parseFloat(weightMatch[1]) : 1;
        return { token: token.trim(), weight: weight };
    });

    const tokens = sanitizedPrompt.split(',')
        .map((token) => ({ token: token.trim(), weight: 1 }))
        .filter((tokenObj) => tokenObj.token !== '');

    const allTokens = tokens.concat(processedTokens);
    // End contribution (unfortunately)

    // This is not perfect
    // , one carrot with a (red hat:1.5) dancing,  = [ one carrot with a  dancing [index:-1], (red hat:1.5) ]
    const tokensWithIndexes = allTokens.map((t) => {
        const index = prompt.indexOf(t.token)
        return { ...t, index }
    })
    tokensWithIndexes.sort((a, b) => a.index - b.index)
    return tokensWithIndexes
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
function compareField(key: string, label: string, getter?: getterType, onClick?: onClickType): OptionMap {
    return ({ key, label, compare: true, getter, onClick })
}

function compareField2(key: string, label: string, getter: getterType, sameFn: sameFnType): OptionMap {
    return ({ key, label, compare: true, getter, sameFn })
}

interface OptionMap {
    key: string
    label: string
    skip?: boolean
    compare?: boolean
    getter?: getterType
    sameFn?: sameFnType
    onClick?: onClickType
}

type getterType = ((i: Txt2ImgResult) => string | number)
type sameFnType = ((i: Txt2ImgResult, o: OptionStore) => boolean)
type onClickType = ((i: Txt2ImgResult) => void)