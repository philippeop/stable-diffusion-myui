'use client';
import { FormEvent, Fragment, useCallback } from 'react'
import { Logger } from '@common/logger';
import { SdApi } from '../services/sdapi.service'
import { useAppDispatch, useRootSelector } from '../store/store';
import { OptionActions, changeModel } from '../store/options.slice'
import OptionInput from './optioninput';
import Button from './button';
import { AppActions } from '@/store/app.slice';

const cfg_scale_title = `Classifier Free Guidance Scale - 
    how strongly the image should conform to prompt - 
    lower values produce more creative results`

export default function Options() {
    Logger.debug('Rendering Options')
    const dispatch = useAppDispatch()
    const last_sent = useRootSelector((state) => state.app.last_sent)

    const models = useRootSelector(s => s.app.models)
    const samplers = useRootSelector(s => s.app.samplers)
    const upscalers = useRootSelector(s => s.app.upscalers)
    const sdoptions = useRootSelector(s => s.app.sdOptions)
    const disabled = useRootSelector(s => s.app.optionsformdisabled)

    const model = useRootSelector((state) => state.options.model)
    const prompt = useRootSelector((state) => state.options.prompt)
    const negative = useRootSelector((state) => state.options.negative)

    const cfg_scale = useRootSelector((state) => state.options.cfg_scale)
    const batches = useRootSelector((state) => state.app.batches)
    const image_width = useRootSelector((state) => state.options.image_width)
    const image_height = useRootSelector((state) => state.options.image_height)
    const sampler = useRootSelector((state) => state.options.sampler)
    const steps = useRootSelector((state) => state.options.steps)
    const clip_skip = useRootSelector((state) => state.options.clip_skip)
    const seed = useRootSelector((state) => state.options.seed)
    const ensd = useRootSelector((state) => state.options.ensd)
    const restore_faces = useRootSelector((state) => state.options.restore_faces)
    const upscale = useRootSelector((state) => state.options.upscale)
    const upscaler = useRootSelector((state) => state.options.upscaler ?? "None")
    const upscaler_scale = useRootSelector((state) => state.options.upscaler_scale)
    const upscaler_denoise = useRootSelector((state) => state.options.upscaler_denoise)
    const upscaler_steps = useRootSelector((state) => state.options.upscaler_steps)

    // const [disableModelSelect, setDisableModelSelect] = useState<boolean>(false)

    // useEffect(() => {
    //     setDisableModelSelect(!sdoptions || !models || !samplers)
    // }, [sdoptions, models, samplers])

    const onModelChanged = useCallback((event: FormEvent<HTMLSelectElement>) => {
        const model = models.find(m => m.model_name === event.currentTarget.value)
        if (model) {
            dispatch(changeModel(model))
        }
    }, [dispatch, models])

    const onSamplerChanged = useCallback((event: FormEvent<HTMLSelectElement>) => {
        const sampler = samplers.find(s => s.name === event.currentTarget.value)
        dispatch(OptionActions.setSampler(sampler?.name))
        console.log('Sampler changed', event.currentTarget.value)
    }, [dispatch, samplers])

    const onUpscalerChanged = useCallback((event: FormEvent<HTMLSelectElement>) => {
        const upscaler = upscalers.find(s => s.name === event.currentTarget.value)
        dispatch(OptionActions.setUpscaler(upscaler?.name))
        console.log('Upscaler changed', event.currentTarget.value)
    }, [dispatch, upscalers])

    const loadPrompt = useCallback(async () => {
        const clipb = await navigator.clipboard.readText()
        const { success, prompt, negative, seed, cfg, width, height } = parsePrompt(clipb)
        if (!success) return
        dispatch(OptionActions.setPrompt(prompt))
        dispatch(OptionActions.setNegative(negative))
        if (seed) dispatch(OptionActions.setSeed(+seed))
        dispatch(OptionActions.setCfgScale(cfg))
        dispatch(OptionActions.setImageWidth(width))
        dispatch(OptionActions.setImageHeight(height))
    }, [dispatch])

    const loadBaseline = useCallback(async () => {
        dispatch(OptionActions.setPrompt('(masterpiece, best quality, realistic, photorealistic, sharp focus:1.5)'))
        dispatch(OptionActions.setNegative('(low quality, worst quality:1.5), low resolution, ugly, blurry, bad anatomy'))
    }, [dispatch])

    const refreshModels = useCallback(async () => {
        await SdApi.refreshModels()
        await SdApi.refreshLoras()
        window.location.reload()
    }, [dispatch])

    const showModelSampler = useCallback(() => {
        dispatch(AppActions.setModelSamplerVisible(true))
    }, [dispatch])

    const prompt_rows = 9

    return (
        <fieldset className="options-container" disabled={disabled}>
            {!models && !samplers && <h3>Web UI API appears to be unavailable</h3>}
            <div className="row">
            </div>
            <div className="row options">
                <div className="col">
                    <label htmlFor="model_select">Model</label>
                    <select className="form-control" id="model_select" value={model} onChange={onModelChanged}>
                        <option key={-1} value="">None</option>
                        {models.map((m, idx) => <option key={idx} value={m.model_name}>{m.model_name}</option>)}
                    </select>
                    <label htmlFor="batches">Batches: {batches}</label>
                    <input type="range" id="batches" value={batches} onChange={event => { dispatch(AppActions.setBatches(+event.target.value)) }} min="1" max="10" />
                    <label htmlFor="cfg_scale" title={cfg_scale_title}>CFG Scale: {cfg_scale}</label >
                    <input type="range" id="cfg_scale" className={sameClass(cfg_scale, last_sent?.cfg_scale)} value={cfg_scale} onChange={event => { dispatch(OptionActions.setCfgScale(+event.target.value)) }} min="1" max="10" />
                </div >
                <div className="col">
                    <label htmlFor="image_width">Width:</label>
                    <OptionInput id="image_width" type="number" classNameExtra={sameClass(image_width, last_sent?.image_width)} value={image_width} onChange={(value) => dispatch(OptionActions.setImageWidth(+value))} />
                    <label htmlFor="image_height">Height:</label>
                    <OptionInput id="image_height" type="number" classNameExtra={sameClass(image_height, last_sent?.image_height)} value={image_height} onChange={(value) => dispatch(OptionActions.setImageHeight(+value))} />
                    <label htmlFor="seed">Seed:</label>
                    <OptionInput id="seed" type="number?" classNameExtra={sameClass(seed, last_sent?.seed)} value={seed} emptyValue={-1} dimOnEmpty={true} onChange={(value) => dispatch(OptionActions.setSeed(+value))} />
                    <OptionInput id="ensd" type="number?" classNameExtra={sameClass(ensd, last_sent?.ensd)} value={ensd} emptyValue={0} dimOnEmpty={true} onChange={(value) => dispatch(OptionActions.setEnsd(value))} />
                </div>
                <div className="col">
                    <label htmlFor="sample_select">Sampler:</label>
                    <select className={"form-control " + sameClass(sampler, last_sent?.sampler)} id="sample_select" value={sampler} onChange={onSamplerChanged}>
                        {samplers.map((s, idx) => <option key={idx} value={s.name}>{s.name}</option>)}
                    </select>
                    <label htmlFor="steps_input">Sampling Steps</label>
                    <OptionInput id="steps_input" type="number" classNameExtra={sameClass(steps, last_sent?.steps)} value={steps} emptyValue={20} dimOnEmpty={true} hideEmpty={false} onChange={v => { dispatch(OptionActions.setSteps(+v)) }} />
                    <label htmlFor="clip_skip_input">CLIP Skip: {clip_skip}</label>
                    <input type="range" id="clip_skip_input" className={sameClass(clip_skip, last_sent?.clip_skip)} value={clip_skip} onChange={event => { dispatch(OptionActions.setClipSkip(+event.target.value)) }} min="1" max="5" />
                    <div>
                        <label htmlFor="restore_faces">Restore faces:</label>
                        <input type="checkbox" id="restore_faces" className={"inline-checkbox " + sameClass(restore_faces, last_sent?.restore_faces)} checked={restore_faces} onChange={event => { dispatch(OptionActions.setRestoreFaces(event.currentTarget.checked)) }} />
                    </div>
                </div >
                <div className="col">
                    <div>
                        <span>Upscaler:</span>
                        <input type="checkbox" id="upscale" className="inline-checkbox" checked={upscale} title="Enable/disable upscaler" onChange={event => { dispatch(OptionActions.setUpscale(event.currentTarget.checked)) }}></input>
                    </div>
                    <select className={"form-control " + sameClass(upscaler, last_sent?.upscaler)} id="upscaler_select" value={upscaler} onChange={onUpscalerChanged} disabled={!upscale}>
                        {upscalers.map((u, idx) => <option key={idx} value={u.name}>{u.name}</option>)}
                    </select >
                    {upscaler !== 'None' && (<Fragment>
                        <label htmlFor="upscaler_scale">Upscaler Scale:</label>
                        <input type="number" id="upscaler_scale" className={sameClass(upscaler_scale, last_sent?.upscaler_scale)} value={upscaler_scale} onChange={event => { dispatch(OptionActions.setUpscalerScale(+event.target.value)) }} min="1.5" max="4" step="0.25" disabled={!upscale} />
                        <label htmlFor="upscaler_steps">Upscaler Steps:</label>
                        <input type="number" id="upscaler_steps" className={sameClass(upscaler_steps, last_sent?.upscaler_steps)} value={upscaler_steps} onChange={event => { dispatch(OptionActions.setUpscalerSteps(+event.target.value)) }} min="1" max="100" disabled={!upscale} />
                        <label htmlFor="upscaler_denoise">Denoise strength: {upscaler_denoise}</label>
                        <input type="range" id="upscaler_denoise" className={sameClass(upscaler_denoise, last_sent?.upscaler_denoise)} value={upscaler_denoise} onChange={event => { dispatch(OptionActions.setUpscalerDenoise(+event.target.value)) }} min="0" max="1" step="0.05" disabled={!upscale} />
                    </Fragment>)}
                </div >
            </div >
            <div className="row prompts">
                <div className="col p100">
                    <textarea value={prompt} className={sameClass(prompt, last_sent?.prompt)} placeholder="Prompt.." onChange={event => dispatch(OptionActions.setPrompt(event.target.value))} rows={prompt_rows} />
                    <textarea value={negative} className={sameClass(negative, last_sent?.negative)} placeholder="Negative prompt.." onChange={event => dispatch(OptionActions.setNegative(event.target.value))} rows={2} />
                    <div className="row">
                        <Button className="load-prompt" onClick={() => loadPrompt()}>Load Prompt</Button>
                        <Button className="load-prompt" onClick={() => loadBaseline()}>Load Baseline</Button>
                        <Button className="load-prompt" onClick={() => refreshModels()}>Refresh</Button>
                        <Button className="load-prompt" onClick={() => showModelSampler()}>Model Sampler</Button>
                    </div>
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
        const negative = splitPart[1].split('\n')[0]
        const seed = /^.* Seed\: ([0-9]+),/gm.exec(input)?.[1]
        const cfg = /^.* CFG scale\: ([0-9].?[0-9]?),/gm.exec(input)?.[1]
        const sizeRes = /^.* Size\: ([0-9]+)x([0-9]+),/gm.exec(input)
        const width = sizeRes?.[1]
        const height = sizeRes?.[2]
        return { success: true, prompt, negative, seed, cfg, width, height }
    }
    catch {
        return { success: false } ///
    }
}
// solo, 1girl, Masterpiece, Ultra realistic, porn, 4K, HD, superb quality, great lights and contrast,black multi strap bra and panties, open bowtie panties, crotchless lingerie, black fishnet panties,beautiful dark haired smiling woman wearing Open_Lingerie, sitting down on the bed, spreading her leags, showing her pussy,realistic pussy, front view,modelshoot, visible nipples,  <lora:Open_Lingerie:0.6>, bimbo, glossy, front view, bedroom background
// Negative prompt: ((disfigured)), ((bad art)), ((deformed)),((extra limbs)),((close up)),((b&w)), wierd colors, blurry, (((duplicate))), ((morbid)), ((mutilated)), [out of frame], (((extra fingers, mutated hands))), ((poorly drawn hands)), ((poorly drawn face)), (((mutation))), (((deformed))), ((ugly)), blurry, ((bad anatomy)), (((bad proportions))), ((extra limbs)), cloned face, (((disfigured))), out of frame, ugly, extra limbs, (bad anatomy), gross proportions, (malformed limbs), ((missing arms)), ((missing legs)), (((extra arms))), (((extra legs))), mutated hands, (fused fingers), (too many fingers), (((long neck))), Photoshop, video game, ugly, tiling, poorly drawn hands, poorly drawn feet, poorly drawn face, out of frame, mutation, mutated, extra limbs, extra legs, extra arms, disfigured, (((deformed fingers))), cross-eye, body out of frame, blurry, bad art, bad anatomy, watermark, logo, words, text, ugly, low quality, bad art, jpeg artifact, missing limbs, ugly woman, masculine, bad anatomy, text, sign, hands, uneven nostrils,(((words))),(((letters))),(((artist logo))),
// Size: 512x512, Seed: 1454771240, Model: 0.7(babes_11) + 0.3(uberRealisticPornMerge_urpmv12), Steps: 25, Sampler: Euler a, CFG scale: 7.5, Model hash: 54411ce5d5, Hires upscale: 2, Hires upscaler: SwinIR_4x, Denoising strength: 0.51