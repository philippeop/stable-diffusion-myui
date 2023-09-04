'use client';
import { useCallback, useEffect } from 'react'
import moment from 'moment';

import { Txt2ImgResult } from '@common/models/myapi.models'
import { Logger } from '@common/logger';
import { MyApi } from '@/services/myapi.service';
import { useAppDispatch, useRootSelector } from '../store/store'
import { ImageActions, refreshImages } from '../store/images.slice'
import { OptionStore, OptionActions } from '../store/options.slice'
import Pill from './pill'
import Button from './button';
import { ClickTwiceButton } from './clicktwice';
import { SdApi } from '@/services/sdapi.service';
import { DictionaryInterface, Txt2ImgOptions } from '@/common/models/option.models';
import Tag from './tag';

export default function Spotlight() {
    Logger.debug('Rendering Spotlight')
    const dispatch = useAppDispatch()
    const models = useRootSelector(s => s.app.models)
    const currentOptions = useRootSelector(s => s.options)
    const image = useRootSelector(s => s.images.selectedImage)
    const otherImage = useRootSelector(s => s.images.compareWithImage)
    const prompt = useRootSelector(s => s.options.prompt)
    const negative = useRootSelector(s => s.options.negative)
    const url = image ? '/myapi/img/' + image.name : undefined

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
            dispatch(ImageActions.selectNext(true))
        }
        if (event.key === 'ArrowLeft') {
            Logger.log('Spotlight: onKeyUp captured for image', image)
            event.stopPropagation()
            event.preventDefault()
            dispatch(ImageActions.selectPrevious(true))
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
            dispatch(OptionActions.setSeed(seed))
        }
    }, [dispatch])

    const setTag = useCallback((tag: number) => {
        (async () => {
            if (!image) return
            const result = await MyApi.tagImage(image, tag)
            if (result === true) {
                dispatch(refreshImages())
            }
        })()
    }, [image, dispatch])

    const onInterrogateClick = useCallback(() => {
        if (!image || !url) return
        SdApi.interrogate(url);
    }, [image])

    const onDeleteBtnClick = useCallback(() => {
        if (!image) return
        if (image.tag > 0) {
            alert('Can\'t delete highlit image')
            return
        }
        MyApi.deleteImage(image)
        dispatch(ImageActions.selectPrevious(false))
        dispatch(ImageActions.deleteImage(image))
    }, [dispatch, image])

    const onUpscaleClick = () => {
        if (!image) return
        if (!currentOptions.upscaler || currentOptions.upscaler === 'None') {
            alert('Configure an upscaler first')
            return
        }
        const currentmodel = models.find(m => m.model_name === currentOptions.model)
        const model = models.find(m => m.model_name === image.options.model)
        if (!currentmodel) {
            Logger.error(`Couldn't find current model`, currentOptions.model)
            return
        }
        if (!model) {
            Logger.error(`Couldn't find image model`, image.options.model)
            return
        }
        const options = {
            ...image.options,
            model: model.model_name,
            seed: image.seed,
            upscale: true,
            upscaler: currentOptions.upscaler,
            upscaler_scale: currentOptions.upscaler_scale,
            upscaler_steps: currentOptions.upscaler_steps,
            upscaler_denoise: currentOptions.upscaler_denoise
        } as Txt2ImgOptions
        MyApi.upscale(options, model, currentmodel).then()
    }

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
        const value = f.getter ? f.getter(image) : (image.options as unknown as DictionaryInterface)[f.key]
        const same = f.sameFn ? f.sameFn(image, currentOptions) : (currentOptions as unknown as DictionaryInterface)[f.key] === value
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
                    <Button onClick={() => onUpscaleClick()}>Upscale</Button>
                    <Button onClick={() => onInterrogateClick()}>Interrogate</Button>
                    <ClickTwiceButton style='positive' onClickTwice={() => onDeleteBtnClick()}>
                        Delete
                    </ClickTwiceButton>
                    <Button onClick={() => dispatch(ImageActions.setCompareWithImage(image))}>Stash image as compare image</Button>
                    {otherImage && <Button onClick={() => dispatch(ImageActions.swapImages())}>Swap</Button>}
                </div>
                <div className="row">
                    {[0, 1, 2].map(n =>
                        <Tag type={'t-' + n} dimmed={image.tag !== n} onClick={() => setTag(n)}></Tag>
                    )}
                </div>
            </div>
            <div className="previous" onClick={() => dispatch(ImageActions.selectPrevious(true))}>
                <svg viewBox="0 0 500 500" className="triangle">
                    <polygon points="0,250 500,0 500,500" />
                    Sorry, your browser does not support inline SVG.
                </svg>
            </div>
            <img alt={image.name} src={url} onClick={() => dispatch(ImageActions.setSelectedImage(undefined))} />
            <div className="next" onClick={() => dispatch(ImageActions.selectNext(true))}>
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
/*
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
*/

function parsePrompt(prompt: string): TokenDef[] {
    const ignore = () => { }
    const result = []
    let loraDef = false
    let currentToken = ''
    let parenthesis = 0
    let isWeightDef = false
    let currentWeightDef = ''
    for (const c of prompt) {
        if (c === '<') {
            loraDef = true;
            currentToken += c;
            continue
        }
        if (c === '>') {
            loraDef = false;
            currentToken += c;
            result.push(currentToken)
            currentToken = '';
            continue
        }
        if (loraDef) continue
        if (c === '(') parenthesis += 1
        if (c === ')') parenthesis -= 1
        if (c === ')' && isWeightDef) isWeightDef = false
        if (c === ',' && !parenthesis) {
            result.push(currentToken)
            currentToken = ''
            continue
        }
        if (c === ':' && !parenthesis) ignore() // throw new Error('Unexpected colon after ' + currentToken + '\n' + prompt)
        if (c === ':' && isWeightDef) throw new Error('Double colon after ' + currentToken + '\nCurrent prompt:\n' + prompt)
        if (c === ':' && parenthesis) {
            isWeightDef = true;
            continue
        }
        if ((c === '0' || c === '1') && isWeightDef) { currentWeightDef += c }
        if (c === '.' && isWeightDef) { currentWeightDef += c }
        if (['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(c)) { currentWeightDef += c }
        currentToken += c
    }

    if (currentToken && currentToken !== ' ' && currentToken !== ',') result.push(currentToken)

    return result.map(r => ({ token: r, weight: 1 }))
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