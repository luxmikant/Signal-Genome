export type LandmarkRepo = {
  id: string;
  name: string;
  org: string;
  description: string;
  language: string;
  stars: number;
  growth: number;
  geneId: string;
  archived?: boolean;
  bridge?: boolean;
  avenueSlot?: number;
};

export type RepoRelation = {
  from: string;
  to: string;
  kind: "builds_on" | "fork_of" | "integrates" | "reimplements";
};

// Curated demo landmarks of the LLM-inference ecosystem. Star counts are
// round magnitudes for visual scale, not live API numbers — the collector
// harness replaces them with live evidence.
export const LANDMARK_REPOS: LandmarkRepo[] = [
  {
    id: "gh:vllm-project/vllm",
    name: "vLLM",
    org: "vllm-project",
    description: "High-throughput LLM serving with PagedAttention and continuous batching.",
    language: "Python",
    stars: 52000,
    growth: 0.92,
    geneId: "serving-frameworks",
    avenueSlot: 0,
  },
  {
    id: "gh:sgl-project/sglang",
    name: "SGLang",
    org: "sgl-project",
    description: "Fast serving framework with radix-tree prefix caching; born from the vLLM lineage.",
    language: "Python",
    stars: 17000,
    growth: 0.98,
    geneId: "serving-frameworks",
    bridge: true,
    avenueSlot: 1,
  },
  {
    id: "gh:bitsandbytes-foundation/bitsandbytes",
    name: "bitsandbytes",
    org: "bitsandbytes-foundation",
    description: "The 8-bit and 4-bit quantization layer every serving engine plugs into.",
    language: "Python",
    stars: 8000,
    growth: 0.66,
    geneId: "quantization",
    bridge: true,
    avenueSlot: 2,
  },
  {
    id: "gh:casper-hansen/AutoAWQ",
    name: "AutoAWQ",
    org: "casper-hansen",
    description: "Activation-aware weight quantization used by both datacenter and local inference.",
    language: "Python",
    stars: 4500,
    growth: 0.58,
    geneId: "quantization",
    bridge: true,
    avenueSlot: 3,
  },
  {
    id: "gh:IST-DASLab/gptq",
    name: "GPTQ-for-LLaMA",
    org: "IST-DASLab",
    description: "The Hessian-based 4-bit quantization algorithm that started the weight-precision wave.",
    language: "Python",
    stars: 4000,
    growth: 0.3,
    geneId: "quantization",
    bridge: true,
    avenueSlot: 4,
  },
  {
    id: "gh:ggml-org/llama.cpp",
    name: "llama.cpp",
    org: "ggml-org",
    description: "Portable C++ inference everywhere: laptops to phones, GGUF quantized weights.",
    language: "C++",
    stars: 84000,
    growth: 0.9,
    geneId: "serving-frameworks",
    avenueSlot: 5,
  },
  {
    id: "gh:huggingface/transformers",
    name: "Transformers",
    org: "huggingface",
    description: "The model hub of the ecosystem — every serving stack starts from these checkpoints.",
    language: "Python",
    stars: 150000,
    growth: 0.78,
    geneId: "attention",
  },
  {
    id: "gh:huggingface/text-generation-inference",
    name: "Text Generation Inference",
    org: "huggingface",
    description: "Rust-based serving stack: the first production continuous-batching server.",
    language: "Rust",
    stars: 11000,
    growth: 0.44,
    geneId: "serving-frameworks",
  },
  {
    id: "gh:Dao-AILab/flash-attention",
    name: "FlashAttention",
    org: "Dao-AILab",
    description: "IO-aware attention kernels — the compute substrate under every modern engine.",
    language: "Python",
    stars: 16000,
    growth: 0.7,
    geneId: "flashattention",
  },
  {
    id: "gh:NVIDIA/TensorRT-LLM",
    name: "TensorRT-LLM",
    org: "NVIDIA",
    description: "GPU-tuned serving with fp8, in-flight batching and hand-fused kernels.",
    language: "C++",
    stars: 12000,
    growth: 0.72,
    geneId: "serving-frameworks",
  },
  {
    id: "gh:microsoft/DeepSpeed",
    name: "DeepSpeed",
    org: "microsoft",
    description: "The training-and-inference scale layer: ZeRO sharding, offloading, parallelism.",
    language: "Python",
    stars: 39000,
    growth: 0.42,
    geneId: "tensor-parallelism",
  },
  {
    id: "gh:microsoft/DeepSpeed-MII",
    name: "DeepSpeed-MII",
    org: "microsoft",
    description: "Early latency-focused serving stack — archived as the field consolidated on vLLM.",
    language: "Python",
    stars: 2000,
    growth: 0.04,
    geneId: "serving-frameworks",
    archived: true,
  },
  {
    id: "gh:mlc-ai/mlc-llm",
    name: "MLC LLM",
    org: "mlc-ai",
    description: "TVM-based compilation to any device — WebGPU, mobile, edge deployments.",
    language: "Python",
    stars: 21000,
    growth: 0.55,
    geneId: "quantization",
  },
  {
    id: "gh:exo-explore/exo",
    name: "exo",
    org: "exo-explore",
    description: "Distributed inference across a cluster of ordinary machines — the new frontier.",
    language: "Python",
    stars: 28000,
    growth: 0.99,
    geneId: "tensor-parallelism",
  },
  {
    id: "gh:unslothai/unsloth",
    name: "Unsloth",
    org: "unslothai",
    description: "Faster fine-tuning and 4-bit quantization with fused GPU kernels.",
    language: "Python",
    stars: 48000,
    growth: 0.85,
    geneId: "quantization",
  },
  {
    id: "gh:InternLM/lmdeploy",
    name: "LMDeploy",
    org: "InternLM",
    description: "Serving stack with Turbomind kernels and 4-bit weight compression.",
    language: "Python",
    stars: 9000,
    growth: 0.5,
    geneId: "serving-frameworks",
  },
  {
    id: "gh:NVIDIA/TransformerEngine",
    name: "TransformerEngine",
    org: "NVIDIA",
    description: "fp8 training and inference primitives behind TensorRT-LLM's precision story.",
    language: "Python",
    stars: 3000,
    growth: 0.35,
    geneId: "gpu-kernels",
  },
  {
    id: "gh:huggingface/optimum",
    name: "Optimum",
    org: "huggingface",
    description: "Hardware-specific optimization toolkit: ONNX, OpenVINO, and quantized runtimes.",
    language: "Python",
    stars: 2500,
    growth: 0.32,
    geneId: "quantization",
  },
];

export const REPO_RELATIONS: RepoRelation[] = [
  { from: "gh:sgl-project/sglang", to: "gh:vllm-project/vllm", kind: "fork_of" },
  { from: "gh:huggingface/text-generation-inference", to: "gh:vllm-project/vllm", kind: "reimplements" },
  { from: "gh:NVIDIA/TensorRT-LLM", to: "gh:vllm-project/vllm", kind: "reimplements" },
  { from: "gh:InternLM/lmdeploy", to: "gh:vllm-project/vllm", kind: "reimplements" },
  { from: "gh:vllm-project/vllm", to: "gh:Dao-AILab/flash-attention", kind: "integrates" },
  { from: "gh:vllm-project/vllm", to: "gh:bitsandbytes-foundation/bitsandbytes", kind: "integrates" },
  { from: "gh:vllm-project/vllm", to: "gh:casper-hansen/AutoAWQ", kind: "integrates" },
  { from: "gh:ggml-org/llama.cpp", to: "gh:casper-hansen/AutoAWQ", kind: "integrates" },
  { from: "gh:ggml-org/llama.cpp", to: "gh:IST-DASLab/gptq", kind: "integrates" },
  { from: "gh:microsoft/DeepSpeed-MII", to: "gh:microsoft/DeepSpeed", kind: "builds_on" },
  { from: "gh:huggingface/optimum", to: "gh:huggingface/transformers", kind: "builds_on" },
  { from: "gh:NVIDIA/TensorRT-LLM", to: "gh:NVIDIA/TransformerEngine", kind: "integrates" },
  { from: "gh:unslothai/unsloth", to: "gh:huggingface/transformers", kind: "builds_on" },
  { from: "gh:unslothai/unsloth", to: "gh:ggml-org/llama.cpp", kind: "integrates" },
  { from: "gh:exo-explore/exo", to: "gh:ggml-org/llama.cpp", kind: "integrates" },
  { from: "gh:mlc-ai/mlc-llm", to: "gh:ggml-org/llama.cpp", kind: "reimplements" },
];

export const AVENUE_ENDS = ["gh:vllm-project/vllm", "gh:ggml-org/llama.cpp"] as const;

export const LANDMARK_BY_ID: Record<string, LandmarkRepo> = Object.fromEntries(
  LANDMARK_REPOS.map((r) => [r.id, r]),
);

export function repoImportance(stars: number): number {
  return Math.min(1, Math.max(0.45, 0.5 + (Math.log10(Math.max(100, stars)) - 3) / 3.2));
}
