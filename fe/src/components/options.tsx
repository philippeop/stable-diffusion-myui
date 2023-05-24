'use client';
import { FormEvent, useCallback, useEffect, useState } from 'react'
import { Logger } from '@common/logger';
import { SdApi } from '../services/sdapi.service'
import { Model, Sampler, Upscaler } from '@common/models/sdapi.models'
import { useAppDispatch, useAppSelector } from '../store/store';
import {
    setModel, setPrompt, setNegative, setCfgScale,
    setUpscaler, setUpscalerScale, setUpscalerSteps, setUpscalerDenoise,
    setSampler, setSteps, setImageWidth, setImageHeight, setBatches, setImageCount, setClipSkip, setSeed, setRestoreFaces
} from '../store/options.slice'
import OptionInput from './optioninput';

const cfg_scale_title = `Classifier Free Guidance Scale - 
    how strongly the image should conform to prompt - 
    lower values produce more creative results`

export default function Options() {
    Logger.debug('Rendering Options')
    const dispatch = useAppDispatch()

    const model = useAppSelector((state) => state.options.model)
    const prompt = useAppSelector((state) => state.options.prompt)
    const negative = useAppSelector((state) => state.options.negative)
    const last_sent = useAppSelector((state) => state.options.last_sent)

    const cfg_scale = useAppSelector((state) => state.options.cfg_scale)
    const batches = useAppSelector((state) => state.options.batches)
    const image_count = useAppSelector((state) => state.options.image_count)
    const image_width = useAppSelector((state) => state.options.image_width)
    const image_height = useAppSelector((state) => state.options.image_height)
    const sampler = useAppSelector((state) => state.options.sampler)
    const steps = useAppSelector((state) => state.options.steps)
    const clip_skip = useAppSelector((state) => state.options.clip_skip)
    const seed = useAppSelector((state) => state.options.seed)
    const restore_faces = useAppSelector((state) => state.options.restore_faces)
    const upscaler = useAppSelector((state) => state.options.upscaler ?? "None")
    const upscaler_scale = useAppSelector((state) => state.options.upscaler_scale)
    const upscaler_denoise = useAppSelector((state) => state.options.upscaler_denoise)
    const upscaler_steps = useAppSelector((state) => state.options.upscaler_steps)

    const [models, setModels] = useState<Model[]>([])
    const [samplers, setSamplers] = useState<Sampler[]>([])
    const [upscalers, setUpscalers] = useState<Upscaler[]>([])
    const [disableModelSelect, setDisableModelSelect] = useState<boolean>(false)
    
    useEffect(() => {
        (async () => {
            const models = await SdApi.getModels()
            const samplers = await SdApi.getSamplers()
            const upscalers = await SdApi.getUpscalers()
            const options = await SdApi.getOptions()
            
            if (models) setModels(models.filter(m => !!m))
            if (samplers) setSamplers(samplers)
            if (upscalers) setUpscalers(upscalers)

            if (options && models) {
                const modelFromOptions = models.find(m => m.title === options.sd_model_checkpoint)
                if(modelFromOptions) {
                    console.log('Model is', modelFromOptions.model_name)
                    dispatch(setModel(modelFromOptions.model_name))
                }
            }

            setDisableModelSelect(!options || !models || !samplers)
        })()
    }, [dispatch])

    const onModelChanged = useCallback((event: FormEvent<HTMLSelectElement>) => {
        const model = models.find(m => m.model_name === event.currentTarget.value)
        if (model) {
            setDisableModelSelect(true)
            SdApi.setModel(model).then(() => {
                console.log('Selected model updated to', model.model_name)
                dispatch(setModel(model.model_name))
                setDisableModelSelect(false)
            })
        }
    }, [dispatch, models])

    const onSamplerChanged = useCallback((event: FormEvent<HTMLSelectElement>) => {
        const sampler = samplers.find(s => s.name === event.currentTarget.value)
        dispatch(setSampler(sampler?.name))
        console.log('Sampler changed', event.currentTarget.value)
    }, [dispatch, samplers])

    const onUpscalerChanged = useCallback((event: FormEvent<HTMLSelectElement>) => {
        const upscaler = upscalers.find(s => s.name === event.currentTarget.value)
        dispatch(setUpscaler(upscaler?.name))
        console.log('Upscaler changed', event.currentTarget.value)
    }, [dispatch, upscalers])

    const prompt_rows = 6

    return (
        <fieldset className="options-container" disabled={disableModelSelect}>
            { !models && !samplers && <h3>Web UI API appears to be unavailable</h3>}
            <div className="row">
            </div>
            <div className="row options">
                <div className="col">
                    <label htmlFor="model_select">Model</label>
                    <select className="form-control" id="model_select" value={model} onChange={onModelChanged}>
                        <option key={-1} value="">None</option>
                        {models.map((m, idx) => <option key={idx} value={m.model_name}>{m.model_name}</option>)}
                    </select>
                    <label htmlFor="batches">Batches</label>
                    <input type="number" id="batches" value={batches} onChange={event => { dispatch(setBatches(+event.target.value)) }} min="1" max="100" />
                    <label htmlFor="image_count">Image Count</label>
                    <input type="number" id="image_count" value={image_count} onChange={event => { dispatch(setImageCount(+event.target.value)) }} min="1" max="100" />
                    <label htmlFor="cfg_scale" title={cfg_scale_title} > CFG Scale</label >
                    <input type="number" id="cfg_scale" className={sameClass(cfg_scale, last_sent?.cfg_scale)} value={cfg_scale} onChange={event => { dispatch(setCfgScale(+event.target.value)) }} min="1" max="100" />
                </div >
                <div className="col">
                    <label htmlFor="image_width">Width:</label>
                    <input type="number" id="image_width" value={image_width} onChange={event => { dispatch(setImageWidth(+event.target.value)) }} min="100" max="10000" step="10" />
                    <label htmlFor="image_height">Height:</label>
                    <input type="number" id="image_height" value={image_height} onChange={event => { dispatch(setImageHeight(+event.target.value)) }} min="100" max="10000" step="10" />
                    <label htmlFor="seed">Seed:</label>
                    <OptionInput id="seed" type="number?" classNameExtra={sameClass(seed, last_sent?.seed)} value={seed} dimOnEmpty={true} onChange={(value) => dispatch(setSeed(value))} />
                    <label htmlFor="restore_faces">Restore faces:</label>
                    <input type="checkbox" id="restore_faces" checked={restore_faces} onChange={event => { dispatch(setRestoreFaces(event.currentTarget.checked)) }} />
                </div>
                <div className="col">
                    <label htmlFor="sample_select">Sampler:</label>
                    <select className={"form-control" + sameClass(sampler, last_sent?.sampler)} id="sample_select" value={sampler} onChange={onSamplerChanged}>
                        {samplers.map((s, idx) => <option key={idx} value={s.name}>{s.name}</option>)}
                    </select>
                    <label htmlFor="steps_input">Sampling Steps</label>
                    <input type="number" id="steps_input" className={sameClass(steps, last_sent?.steps)} value={steps} onChange={event => { dispatch(setSteps(+event.target.value)) }} min="5" max="50" />
                    <label htmlFor="clip_skip_input">CLIP Skip</label>
                    <input type="number" id="clip_skip_input" className={sameClass(clip_skip, last_sent?.clip_skip)} value={clip_skip} onChange={event => { dispatch(setClipSkip(+event.target.value)) }} min="1" max="5" />
                </div >
                <div className="col">
                    <label htmlFor="upscaler_select">Upscaler:</label>
                    <select className={"form-control" + sameClass(upscaler, last_sent?.upscaler)} id="upscaler_select" value={upscaler} onChange={onUpscalerChanged}>
                        {upscalers.map((u, idx) => <option key={idx} value={u.name}>{u.name}</option>)}
                    </select >
                    {/* <ng-container * ngIf="upscaler?.name != 'None'" > */}
                    <label htmlFor="upscaler_scale">Upscaler Scale:</label>
                    <input type="number" id="upscaler_scale" className={sameClass(upscaler_scale, last_sent?.upscaler_scale)} value={upscaler_scale} onChange={event => { dispatch(setUpscalerScale(+event.target.value)) }} min="1.5" max="4" step="0.25" />
                    <label htmlFor="upscaler_steps">Upscaler Steps:</label>
                    <input type="number" id="upscaler_steps" className={sameClass(upscaler_steps, last_sent?.upscaler_steps)} value={upscaler_steps} onChange={event => { dispatch(setUpscalerSteps(+event.target.value)) }} min="1" max="100" />
                    <label htmlFor="upscaler_denoise">Denoise strength:</label>
                    <input type="number" id="upscaler_denoise" className={sameClass(upscaler_denoise, last_sent?.upscaler_denoise)} value={upscaler_denoise} onChange={event => { dispatch(setUpscalerDenoise(+event.target.value)) }} min="0" max="1" step="0.05" />
                </div >
            </div >
            <div className="row prompts">
                <div className="col p100">
                    <textarea value={prompt} className={sameClass(prompt, last_sent?.prompt)} placeholder="Prompt.." onChange={event => dispatch(setPrompt(event.target.value))} rows={prompt_rows} />
                    <textarea value={negative} className={sameClass(negative, last_sent?.negative)} placeholder="Negative prompt.." onChange={event => dispatch(setNegative(event.target.value))} rows={prompt_rows / 2} />
                    <div className="button load-prompt" onClick={() => loadPrompt()}>Load Prompt</div>
                </div>
            </div>
        </fieldset>
    )
}

const sameClass = (a: unknown, b: unknown) => {
    if (a === b) return 'same'
    return 'diff'
}

// Parse prompt
const parsePrompt = (input: string) => {
    try {
        let splitPart = input.split('Negative prompt: ')
        const prompt = splitPart[0]
        const negative = splitPart[1].split('Size: ')[0]
        const cfg = /^.* CFG scale\: ([0-9.[0-0])\,/g.exec(input)?.[0]
        return { success: true, prompt, negative, cfg }
    }
    catch {
        return { success: false } ///
    }
}
// solo, 1girl, Masterpiece, Ultra realistic, porn, 4K, HD, superb quality, great lights and contrast,black multi strap bra and panties, open bowtie panties, crotchless lingerie, black fishnet panties,beautiful dark haired smiling woman wearing Open_Lingerie, sitting down on the bed, spreading her leags, showing her pussy,realistic pussy, front view,modelshoot, visible nipples,  <lora:Open_Lingerie:0.6>, bimbo, glossy, front view, bedroom background
// Negative prompt: ((disfigured)), ((bad art)), ((deformed)),((extra limbs)),((close up)),((b&w)), wierd colors, blurry, (((duplicate))), ((morbid)), ((mutilated)), [out of frame], (((extra fingers, mutated hands))), ((poorly drawn hands)), ((poorly drawn face)), (((mutation))), (((deformed))), ((ugly)), blurry, ((bad anatomy)), (((bad proportions))), ((extra limbs)), cloned face, (((disfigured))), out of frame, ugly, extra limbs, (bad anatomy), gross proportions, (malformed limbs), ((missing arms)), ((missing legs)), (((extra arms))), (((extra legs))), mutated hands, (fused fingers), (too many fingers), (((long neck))), Photoshop, video game, ugly, tiling, poorly drawn hands, poorly drawn feet, poorly drawn face, out of frame, mutation, mutated, extra limbs, extra legs, extra arms, disfigured, (((deformed fingers))), cross-eye, body out of frame, blurry, bad art, bad anatomy, watermark, logo, words, text, ugly, low quality, bad art, jpeg artifact, missing limbs, ugly woman, masculine, bad anatomy, text, sign, hands, uneven nostrils,(((words))),(((letters))),(((artist logo))),
// Size: 512x512, Seed: 1454771240, Model: 0.7(babes_11) + 0.3(uberRealisticPornMerge_urpmv12), Steps: 25, Sampler: Euler a, CFG scale: 7.5, Model hash: 54411ce5d5, Hires upscale: 2, Hires upscaler: SwinIR_4x, Denoising strength: 0.51