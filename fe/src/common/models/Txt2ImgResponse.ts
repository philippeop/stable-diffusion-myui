/* eslint-disable @typescript-eslint/no-explicit-any */
export default interface Txt2ImgResponse {
    images: string[]
    parameters: Txt2ImgParameters
    info: string
    realinfo: Txt2ImgInfo // info json.parsed
}

export interface Txt2ImgParameters {
    enable_hr: boolean
    denoising_strength: number
    firstphase_width: number
    firstphase_height: number
    hr_scale: number
    hr_upscaler: string
    hr_second_pass_steps: number
    hr_resize_x: number
    hr_resize_y: number
    prompt: string
    styles: any[]
    seed: number
    subseed: number
    subseed_strength: number
    seed_resize_from_h: number
    seed_resize_from_w: number
    sampler_name: string
    batch_size: number
    n_iter: number
    steps: number
    cfg_scale: number
    width: number
    height: number
    restore_faces: boolean
    tiling: boolean
    do_not_save_samples: boolean
    do_not_save_grid: boolean
    negative_prompt: string
    eta: any
    s_min_uncond: number
    s_churn: number
    s_tmax: any
    s_tmin: number
    s_noise: number
    override_settings: OverrideSettings
    override_settings_restore_afterwards: boolean
    script_args: any[]
    sampler_index: string
    script_name: any
    send_images: boolean
    save_images: boolean
    alwayson_scripts: AlwaysonScripts
}

export interface OverrideSettings {
    CLIP_stop_at_last_layers: number
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface AlwaysonScripts { }

export interface Txt2ImgInfo {
    seed: number
    subseed: number
    subseed_strength: number
    width: number
    height: number
    sampler_name: string
    cfg_scale: number
    steps: number
    batch_size: number
    restore_faces: boolean
    face_restoration_model: any
    sd_model_hash: string
    seed_resize_from_w: number
    seed_resize_from_h: number
    denoising_strength: number
    extra_generation_params: ExtraGenerationParams
    index_of_first_image: number
    styles: any[]
    job_timestamp: string
    clip_skip: number
    is_using_inpainting_conditioning: boolean
}

export interface ExtraGenerationParams {
    "Hires resize": string
    "Hires steps": number
    "Hires upscaler": string
}
