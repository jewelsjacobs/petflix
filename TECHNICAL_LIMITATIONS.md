# Technical Limitations & Solution Research
# Date: April 2, 2026
# Purpose: Document what we tried, what failed, and why — so we don't repeat dead ends

---

## The Core Challenge

Petflix needs to generate dramatic scene images starring a user's specific pet
in different poses, expressions, framings, and environments — at $0 per episode,
on-device, at scale. As of April 2026, no solution fully achieves this.

---

## Approach 1: Apple ImageCreator (On-Device, $0)

**What it is:** Apple's Image Playground framework. Text-to-image generation
running on-device via Apple Intelligence. Animation style.

**What works:**
- Generates recognizable pets from breed-specific text descriptions (5/5 recognition)
- Foundation Models framework produces excellent pet descriptions from photos
- Free, on-device, offline, unlimited generations
- Good at: "a [pet description] in a [dramatic environment]" — medium shots

**What fails:**
- Cannot control camera angles (low angle, high angle, Dutch angle)
- Cannot control framing (extreme close-up, over-the-shoulder)
- Cannot control subject scale or placement ("tiny at the far end")
- Cannot generate silhouettes or specific backlit compositions
- Cannot control pet pose or expression
- Sometimes rejects complex prompts entirely ("Scene generation failed")
- Sometimes ignores style parameter (produces illustration instead of animation)
- Result: 8 scenes come out as nearly identical medium shots with same pose

**Conclusion:** ImageCreator is a consumer toy, not a cinematography tool.
Good for single fun images, not for varied dramatic sequences.

**Current status:** Testing a "v2" approach that works within ImageCreator's
capabilities — describing different environments and characters per scene
instead of different camera angles. Pending validation (throne-e01-v2.md).

---

## Approach 2: Cloud Image APIs (FLUX, SDXL via fal.ai)

**What it is:** Server-side image generation via API. Models like FLUX and
SDXL can follow composition/framing instructions accurately.

**What works:**
- Full control over composition, framing, angles, poses
- Can generate the pet in genuinely different dramatic situations
- Good quality, fast (2-8 seconds per image)

**What fails:**
- Costs $0.02–0.06 per image ($0.16–0.48 per 8-scene episode)
- Concurrency limits on API services — doesn't scale well
- Requires network connectivity
- Per-user cost makes free tier unprofitable at scale
- External service dependency (pricing changes, outages, rate limits)

**Conclusion:** Works technically but business model is fragile. Concurrency
limits are a hard scaling wall discovered firsthand with Shotstack.

---

## Approach 3: LoRA Fine-Tuning (Train Model on User's Pet)

**What it is:** Train a small adapter model on 8-15 photos of a specific pet,
then generate that pet in any pose/expression/setting.

**What works:**
- The trained model can generate the pet in different poses and expressions
- One-time training cost per pet (~$0.50-1.00)
- After training, per-image generation is cheap (~$0.02-0.06)
- Apps like PawToAI, PhotoPet AI prove this works commercially

**What fails:**
- Training requires cloud compute (not feasible on iPhone hardware)
- Same concurrency/scaling concerns as Approach 2
- Apple MLX supports LoRA for text/LLM models, NOT for image diffusion models
- On-device inference of diffusion models is heavy even after training
- 30-45 minute training time per pet creates UX friction

**UX innovation:** "Pet Casting Studio" onboarding — guided camera that makes
taking 8 training photos fun (like actor headshots). Silhouette overlays show
target poses. Turns data collection friction into entertainment.

**Conclusion:** Commercially viable (proven by competitors) but requires cloud
dependency that introduces scaling and cost concerns.

---

## Approach 4: Static Cutout Compositing (On-Device, $0)

**What it is:** Lift the pet from their photo using Vision framework, composite
the cutout onto pre-rendered dramatic background templates.

**What works:**
- Vision subject lifting tested and working (clean cutouts for both Wiley and Rudy)
- Core Image compositing is fast and free
- Pre-rendered backgrounds are a one-time cost (generated during development)
- Scales infinitely — every iPhone processes its own composites

**What fails:**
- The pet cutout is STATIC — same pose, same expression in every scene
- A frozen pet pasted onto different backgrounds is not "acting"
- No amount of Ken Burns or transitions makes a sticker feel like a character
- The result looks like a scrapbook, not a microdrama

**Conclusion:** Technically works but produces unengaging content. The pet
isn't performing — it's being pasted.

---

## Approach 5: Full Video Generation (Kling, Sora, etc.)

**What it is:** AI generates actual video of the pet moving, acting, emoting.

**What fails:**
- $0.90 per 10-second clip (tested via fal.ai pricing, March 2026)
- 2-15 minutes generation time per clip
- No on-device option exists
- Unit economics completely broken at any price tier

**Conclusion:** Not viable until costs drop ~10x (projected 2028+).

---

## Where Things Stand (April 2, 2026)

Currently testing Approach 1 with "v2" prompts that work within ImageCreator's
proven capabilities (different environments/characters per scene, no camera
angle instructions). If this produces engaging content, the $0 on-device
pipeline is viable. If not, the options are:

1. Accept cloud costs and build with LoRA (Approach 3) + subscription model
2. Pause the project until on-device image generation improves
3. Pivot the product concept away from personalized pet content

The "Pet Casting Studio" onboarding concept (from Approach 3) remains strong
regardless of which generation approach is used.

---

## Key Learnings

- Apple's ImageCreator is not a cinematography tool — treat it as a consumer
  image generator and design prompts accordingly
- Cloud APIs that work in testing break at scale due to concurrency limits
- Every competitor charging for personalized pet content uses cloud generation
  with subscriptions — there is no free/on-device precedent
- The market for pet microdramas is massive ($14B projected 2026) but the
  technology to create personalized ones cheaply at scale doesn't exist yet
- LoRA fine-tuning for image models is not available on-device for consumers
  (Apple MLX supports LLM LoRA only, not diffusion model LoRA)
