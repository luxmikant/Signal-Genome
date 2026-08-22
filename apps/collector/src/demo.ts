import { existsSync, readdirSync, readFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { RAW_DIR, type SourceConfig } from "./registry.js";

const DEMO_DIR = join(RAW_DIR, "_demo");
mkdirSync(DEMO_DIR, { recursive: true });

const DEMO_FIXTURES: Record<string, unknown> = {
  "vllm-docs": [
    { title: "PagedAttention in the vLLM engine", url: "https://docs.vllm.ai/latest/design/paged", date: "2026-08-11", body: "The vLLM engine manages its KV cache with paged attention blocks and a block table, so long context reuse stays cheap and continuous batching stays fair.", tags: ["kv cache", "paged attention"] },
    { title: "Speculative decoding with draft heads", url: "https://docs.vllm.ai/latest/features/spec", date: "2026-08-10", body: "Speculative decoding accepts drafts from a small draft model and verifies them in one parallel pass; serving frameworks ship this natively.", tags: ["speculative decoding"] },
    { title: "Quantization: AWQ and GPTQ weight-only support", url: "https://docs.vllm.ai/latest/features/quant", date: "2026-08-09", body: "Weight-only quantization with awq or gptq reduces VRAM while calibrated group sizes protect quality; fp8 is available on Hopper.", tags: ["quantization"] },
    { title: "Mixture-of-Experts routing for expert layers", url: "https://docs.vllm.ai/latest/design/moe", date: "2026-08-08", body: "MoE models gate tokens through a router into top-k experts per layer; expert-parallel scheduling keeps the memory budget spread.", tags: ["moe"] },
    { title: "FlashAttention kernel backends", url: "https://docs.vllm.ai/latest/backend/flash", date: "2026-08-07", body: "The FlashAttention attention kernel is IO-aware: it materializes no quadratic matrix, which keeps long sequences affordable.", tags: ["flashattention"] },
    { title: "Tensor parallelism across NVIDIA GPUs", url: "https://docs.vllm.ai/latest/features/tp", date: "2026-08-06", body: "Tensor parallelism shards weights across the GPUs with all-reduce, scaling one model beyond a single accelerator.", tags: ["tensor parallelism"] },
    { title: "Prefix caching of shared system prompts", url: "https://docs.vllm.ai/latest/features/prefix", date: "2026-08-05", body: "Automatic prefix caching reuses the KV cache of shared prompt prefixes via a radix tree, cutting agent-loop latency.", tags: ["prefix caching", "kv cache"] },
    { title: "Long-context serving on the engine", url: "https://docs.vllm.ai/latest/features/long", date: "2026-08-04", body: "Long-context serving leverages paged kv, flashattention and prefix caches together to hold 128k token windows.", tags: ["long context"] },
  ],
  "unsloth-blog": [
    { title: "Quantization and GGUF weights for consumer GPUs", url: "https://unsloth.ai/blog/quant", date: "2026-08-03", body: "4-bit quantization with gguf weights makes big models fit consumer GPUs; llama.cpp and awq remain the production default.", author: "Ning", tags: ["quantization"] },
    { title: "Distilling DeepSeek-R1 into 8B students", url: "https://unsloth.ai/blog/distill", date: "2026-08-01", body: "Knowledge distillation trains small student models that keep most of the teacher's reasoning at a fraction of inference cost.", author: "Daniel", tags: ["distillation"] },
    { title: "Fine-tuning MoE models with QLoRA 4-bit", url: "https://unsloth.ai/blog/moe", date: "2026-07-30", body: "QLoRA 4-bit quantization unlocks MoE fine-tuning on limited VRAM, and top-k expert routing keeps gradient flow bounded.", author: "Ning", tags: ["moe", "quantization"] },
    { title: "Understanding the KV cache for fine-tuning", url: "https://unsloth.ai/blog/kv", date: "2026-07-28", body: "Long-context fine-tuning is kv-cache-bound: paged attention plus prefix caching halves the memory cost of repeated prompts.", author: "Daniel", tags: ["kv cache", "paged attention", "prefix caching"] },
    { title: "Speculative decoding without changing generations", url: "https://unsloth.ai/blog/spec", date: "2026-07-25", body: "Draft-and-verify speculative decoding speeds up reasoning runs while keeping target-model output identical; acceptance soars with aligned draft heads.", author: "Ning", tags: ["speculative decoding"] },
    { title: "FlashAttention in vision-language stacks", url: "https://unsloth.ai/blog/flash", date: "2026-07-22", body: "FlashAttention keeps memory flat when prompts embed thousands of image patches, and it composes with tensor parallelism cleanly.", author: "Daniel", tags: ["flashattention", "tensor parallelism"] },
  ],
  "modal-blog": [
    { title: "Triton kernels for MoE gather-scatter", url: "https://modal.com/blog/triton-moe", date: "2026-08-02", body: "A custom Triton kernel replacing top-k router gather-scatter freed 22% of a step; gpu kernels are the new serving lever.", author: "Modal", tags: ["moe", "gpu kernels"] },
    { title: "Serving vLLM with speculative decoding", url: "https://modal.com/blog/vllm-spec", date: "2026-08-01", body: "EAGLE draft heads inside vLLM give 1.8x decode speed-up; continuous batching keeps the GPU busy during verification.", author: "Modal", tags: ["vllm", "speculative decoding", "continuous batching"] },
    { title: "FlashAttention for 128k context on one GPU", url: "https://modal.com/blog/flash-128k", date: "2026-07-29", body: "FlashAttention plus paged kv fits a 128k context on one A100; prefix caching saves repeated prompt cost.", author: "Modal", tags: ["flashattention", "kv cache", "long context"] },
    { title: "Continuous batching under serverless autoscale", url: "https://modal.com/blog/batching", date: "2026-07-27", body: "Iteration-level continuous batching keeps utilization flat when GPU pools resize; short decode batches interleave with prefill chunks.", author: "Modal", tags: ["continuous batching", "serving-frameworks"] },
    { title: "Tensor-parallel shapes for a 70B model", url: "https://modal.com/blog/tp70b", date: "2026-07-24", body: "Splitting a 70B model into tensor-parallel shards across 8 GPUs limits memory per shard; all-reduce dominates at high world sizes.", author: "Modal", tags: ["tensor parallelism"] },
    { title: "fp8 quantization in the inference path", url: "https://modal.com/blog/fp8", date: "2026-07-21", body: "fp8 quantization of weights and activations delivers the best quality-per-token on Hopper; calibration data decides whether outliers survive.", author: "Modal", tags: ["quantization", "gpu kernels"] },
  ],
  "anyscale-blog": [
    { title: "The paged kv cache: memory solved", url: "https://www.anyscale.com/blog/paged-kv", date: "2026-08-01", body: "Paged attention removed kv cache fragmentation and lifted concurrency 4x on the same GPU.", author: "Anyscale", tags: ["kv cache", "paged attention"] },
    { title: "Engine evolution: TGI to vLLM to SGLang", url: "https://www.anyscale.com/blog/engines", date: "2026-07-28", body: "Serving frameworks compete on the scheduler: vLLM paged it, SGLang shared it with radix-tree prefix caching.", author: "Anyscale", tags: ["serving-frameworks", "prefix caching"] },
    { title: "Speculative decoding across engines", url: "https://www.anyscale.com/blog/spec", date: "2026-07-26", body: "Draft-and-verify speed is acceptance-rate-bound; profilers now compute amdahl before ramping the draft model.", author: "Anyscale", tags: ["speculative decoding"] },
    { title: "MoE inference budgets: router and experts", url: "https://www.anyscale.com/blog/moe-budget", date: "2026-07-23", body: "Mixture-of-Experts serving routes each token to the top-2 experts; expert quantization is the cheapest way to fit 8x7B class models.", author: "Anyscale", tags: ["moe", "quantization"] },
    { title: "Long context with YaRN and Ring Attention", url: "https://www.anyscale.com/blog/long-context", date: "2026-07-20", body: "YaRN extrapolates rope for long windows while ring attention shards the sequence; both raise the cache ceiling for long context.", author: "Anyscale", tags: ["long context", "attention"] },
    { title: "Continuous batching and the iteration scheduler", url: "https://www.anyscale.com/blog/itertx", date: "2026-07-18", body: "From Orca to today's iteration level scheduling: continuous batching changes the ruleset for fair LLM serving.", author: "Anyscale", tags: ["continuous batching"] },
  ],
};

export function loadSnapshot(source: SourceConfig): { raw: unknown; kind: "real" | "demo" } | null {
  const dir = join(RAW_DIR, source.id);
  if (existsSync(dir)) {
    const files = readdirSync(dir).filter((f) => f.endsWith(".json")).sort().reverse();
    if (files.length > 0) {
      try {
        const parsed = JSON.parse(readFileSync(join(dir, files[0]!), "utf8"));
        return { raw: parsed, kind: "real" };
      } catch {
        // fall through to demo fixture
      }
    }
  }
  if (DEMO_FIXTURES[source.id]) return { raw: DEMO_FIXTURES[source.id], kind: "demo" };
  return null;
}
