from diffusers import DiffusionPipeline, StableDiffusionPipeline
import torch
from transformers import CLIPImageProcessor, CLIPModel
from diffusers import DPMSolverMultistepScheduler
from PIL import Image
import torch
import numpy as np

# model_id = "runwayml/stable-diffusion-v1-5"
# pipe = DiffusionPipeline.from_pretrained(model_id, torch_dtype=torch.float16)
# pipe = pipe.to("cuda")

# prompt = "(realistic), girl, sexy, (witch), outside, (night)"
# image = pipe(prompt).images[0]  
    
# image.save("test.png")


def main():
    model_id = "beenyou_r11.safetensors"
    # convert_model("./beenyou_r11.safetensors", "SD 1.5")
    # model = UNet2DModel.from_pretrained("google/ddpm-cat-256").to("cuda")

    feature_extractor = CLIPImageProcessor.from_pretrained("laion/CLIP-ViT-B-32-laion2B-s34B-b79K")
    clip_model = CLIPModel.from_pretrained("laion/CLIP-ViT-B-32-laion2B-s34B-b79K", torch_dtype=torch.float16)
    
    pipe = StableDiffusionPipeline.from_ckpt(model_id, torch_dtype=torch.float16,
                                           custom_pipeline="clip_guided_stable_diffusion",
                                           clip_model=clip_model,
                                           feature_extractor=feature_extractor)
    pipe.enable_attention_slicing()
    pipe = pipe.to("cuda")
    # pipe.scheduler = DPMSolverMultistepScheduler.from_pretrained("google/ddpm-cat-256")
    
    prompt = "(realistic), girl, sexy, (witch), outside, (night)"
    
    
    generator = torch.Generator(device="cuda").manual_seed(0)

    images = []
    for i in range(4):
        image = pipe(
            prompt,
            num_inference_steps=50,
            guidance_scale=7.5,
            #clip_guidance_scale=100,
            #num_cutouts=4,
            #use_cutouts=False,
            generator=generator,
        ).images[0]
        images.append(image)

    for i, img in enumerate(images):
        img.save(f"./test_{i}.png")


    # scheduler.set_timesteps(50)

    # sample_size = 512 # model.config.sample_size
    # # print(model.config)
    # # return
    # noise = torch.randn((1, 3, sample_size, sample_size)).to("cuda")
    # input = noise

    # for t in scheduler.timesteps:
    #     with torch.no_grad():
    #         noisy_residual = model(input, t).sample
    #         prev_noisy_sample = scheduler.step(noisy_residual, t, input).prev_sample
    #         input = prev_noisy_sample

    # image = (input / 2 + 0.5).clamp(0, 1)
    # image = image.cpu().permute(0, 2, 3, 1).numpy()[0]
    # image = Image.fromarray((image * 255).round().astype("uint8"))

def simple():
    model_id = "./beenyou_r11"
    pipe = DiffusionPipeline.from_pretrained(model_id, torch_dtype=torch.float16)
    pipe = pipe.to("cuda")

    prompt = "(realistic), girl, sexy, (witch), outside, (night)"
    image = pipe(prompt).images[0]  
        
    image.save("test.png")

from diffusers.pipelines.stable_diffusion.convert_from_ckpt import download_from_original_stable_diffusion_ckpt
def convert_model(path, baseModel):
    
    image_size = 512
    if baseModel == "SD 1.5": image_size = 512
    # SD 1.x & SD 2 Base = 512
    # SD 2 = 768

    prediction_type = 'epsilon'
    if baseModel == "SD 1.5": prediction_type = 'epsilon'
    # SD 1.x & SD 2 Base = epsilon
    # SD 2 = v_prediction

    upcast_attention = False
    if baseModel == "SD 2.1": upcast_attention = True

    pipe = download_from_original_stable_diffusion_ckpt(
        checkpoint_path=path,
        original_config_file="./v1-inference.yaml",
        image_size=image_size,
        prediction_type=prediction_type,
        model_type=None, # The pipeline type. One of 'FrozenOpenCLIPEmbedder', 'FrozenCLIPEmbedder', 'PaintByExample'. If `None` pipeline will be automatically inferred.
        extract_ema=True,
        scheduler_type="pndm", # Type of scheduler to use. Should be one of ['pndm', 'lms', 'ddim', 'euler', 'euler-ancestral', 'dpm']. default="pndm"
        num_in_channels=None, # The number of input channels. If `None` number of input channels will be automatically inferred.
        upcast_attention=upcast_attention, # Whether the attention computation should always be upcasted. This is necessary when running stable diffusion 2.1.
        from_safetensors=True, # If `--checkpoint_path` is in `safetensors` format, load checkpoint with safetensors instead of PyTorch.
        device=None,
        stable_unclip=None, # Set if this is a stable unCLIP model. One of 'txt2img' or 'img2img'. default=None
        stable_unclip_prior=None, # Set if this is a stable unCLIP txt2img model. Selects which prior to use. If `--stable_unclip` is set to `txt2img`, the karlo prior is selected by default. default=None
        clip_stats_path=None, # Path to the clip stats file. Only required if the stable unclip model's config specifies `model.params.noise_aug_config.params.clip_stats_path`.
        controlnet=False, # Set flag if this is a controlnet checkpoint.
    )

    pipe.save_pretrained("./convert_output/", safe_serialization=True) # True=safetensor format

def download_model(model_id):
    return

main()